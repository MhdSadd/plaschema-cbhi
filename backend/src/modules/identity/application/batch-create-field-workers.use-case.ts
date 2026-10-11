import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AppError } from '../../../platform/http/app-error';
import {
  normalizeCsvRow,
  parseTabularBuffer,
  requireCsvColumns,
  type BatchUploadResult,
} from '../../../platform/http/csv';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { normalizePlaceName, toTitleCase } from '../../../shared/text';
import {
  WARD_REPOSITORY,
  type WardRepository,
} from '../../ward/application/ward.repository';
import {
  assertAssignedWardsSingleLga,
  assertFieldWorkerPhone,
  type UserStatus,
} from '../domain/user';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

type PendingFieldWorker = {
  row: number;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  lga: string;
  wardNames: string[];
  assignedWardIds: string[];
  valid: boolean;
};

function splitWardNames(raw: string): string[] {
  return raw
    .split(/[|;]/)
    .map((part) => normalizePlaceName(part.trim()))
    .filter(Boolean);
}

function parseStatus(raw: string | undefined): UserStatus | null {
  const value = (raw ?? 'active').trim().toLowerCase();
  if (value === 'active' || value === 'inactive') {
    return value;
  }
  return null;
}

@Injectable()
export class BatchCreateFieldWorkersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(
    fileBuffer: Buffer,
    password: string,
    filename?: string,
  ): Promise<BatchUploadResult> {
    const trimmedPassword = password.trim();
    if (trimmedPassword.length < 8 || trimmedPassword.length > 128) {
      throw new AppError(
        'VALIDATION_ERROR',
        'password must be between 8 and 128 characters',
        400,
      );
    }

    const rawRows = parseTabularBuffer(fileBuffer, { filename });
    requireCsvColumns(rawRows, ['name', 'email', 'phone']);

    const errors: BatchUploadResult['errors'] = [];
    const pendingByEmail = new Map<string, PendingFieldWorker>();

    rawRows.forEach((raw, index) => {
      const rowNumber = index + 2;
      const row = normalizeCsvRow(raw);
      const name = toTitleCase((row.name ?? '').trim());
      const email = (row.email ?? '').trim().toLowerCase();
      const phone = (row.phone ?? '').replace(/\D/g, '').slice(0, 11);
      const lga = normalizePlaceName((row.lga ?? '').trim());
      const wardNames = splitWardNames(row.wards ?? '');
      const status = parseStatus(row.status);

      if (!name || name.length < 2) {
        errors.push({ row: rowNumber, message: 'name is required (min 2 characters)' });
        return;
      }
      if (!email || !email.includes('@')) {
        errors.push({ row: rowNumber, message: 'A valid email is required' });
        return;
      }
      try {
        assertFieldWorkerPhone(phone);
      } catch {
        errors.push({
          row: rowNumber,
          message: 'phone must be an 11-digit number',
        });
        return;
      }
      if (!status) {
        errors.push({
          row: rowNumber,
          message: 'status must be active or inactive',
        });
        return;
      }
      if (wardNames.length > 0 && !lga) {
        errors.push({
          row: rowNumber,
          message: 'lga is required when wards are listed',
        });
        return;
      }

      if (pendingByEmail.has(email)) {
        errors.push({
          row: rowNumber,
          message: `Duplicate email in file: ${email}`,
        });
        return;
      }

      pendingByEmail.set(email, {
        row: rowNumber,
        name,
        email,
        phone,
        status,
        lga,
        wardNames,
        assignedWardIds: [],
        valid: true,
      });
    });

    for (const candidate of pendingByEmail.values()) {
      if (!candidate.valid || candidate.wardNames.length === 0) {
        continue;
      }

      const wardsInLga = await this.wards.findByLgaAndNames(
        candidate.lga,
        candidate.wardNames,
      );
      const wardByName = new Map(
        wardsInLga.map((ward) => [ward.name.toLowerCase(), ward]),
      );
      const wardIds: string[] = [];

      for (const wardName of candidate.wardNames) {
        const ward = wardByName.get(wardName.toLowerCase());
        if (!ward) {
          errors.push({
            row: candidate.row,
            message: `Ward not found in ${candidate.lga}: ${wardName}`,
          });
          candidate.valid = false;
          wardIds.length = 0;
          break;
        }
        wardIds.push(ward.id);
      }

      if (!candidate.valid) {
        continue;
      }

      try {
        assertAssignedWardsSingleLga(wardsInLga.map((ward) => ward.lga));
      } catch {
        errors.push({
          row: candidate.row,
          message: 'Assigned wards must belong to a single LGA',
        });
        candidate.valid = false;
        continue;
      }

      candidate.assignedWardIds = wardIds;
    }

    const ready = [...pendingByEmail.values()].filter(
      (candidate) => candidate.valid,
    );
    const existingEmails = await this.users.findExistingEmails(
      ready.map((candidate) => candidate.email),
    );

    const passwordHash = await hash(trimmedPassword, 12);
    let created = 0;
    let skipped = 0;

    for (const candidate of ready) {
      if (existingEmails.has(candidate.email)) {
        skipped += 1;
        continue;
      }

      if (candidate.assignedWardIds.length > 0) {
        const ok = await this.users.wardIdsExist(candidate.assignedWardIds);
        if (!ok) {
          errors.push({
            row: candidate.row,
            message: 'One or more assigned wards do not exist',
          });
          continue;
        }
      }

      try {
        await this.users.create({
          id: createUuidV7(),
          name: candidate.name,
          email: candidate.email,
          passwordHash,
          role: 'field_worker',
          status: candidate.status,
          phone: candidate.phone,
          assignedWardIds: candidate.assignedWardIds,
          isPasswordChangeRequired: true,
        });
        created += 1;
        existingEmails.add(candidate.email);
      } catch {
        errors.push({
          row: candidate.row,
          message: 'Unable to create this enrollment officer',
        });
      }
    }

    return { created, skipped, failed: errors.length, errors };
  }
}
