import { Inject, Injectable } from '@nestjs/common';
import {
  normalizeCsvRow,
  parseTabularBuffer,
  requireCsvColumns,
  type BatchUploadResult,
} from '../../../platform/http/csv';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { normalizePlaceName } from '../../../shared/text';
import {
  allocateUniqueWardCode,
  deriveWardCodeBase,
  deriveWardCodeBaseFromLgaPrefix,
  extractLgaPrefixFromWardCode,
  extractWardCodePrefix,
  normalizeWardCode,
} from '../domain/ward-code';
import {
  WARD_REPOSITORY,
  type CreateWardInput,
  type WardRepository,
} from './ward.repository';

type PendingWard = Omit<CreateWardInput, 'code'> & {
  row: number;
  explicitCode?: string;
};

@Injectable()
export class BatchCreateWardsUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(
    fileBuffer: Buffer,
    filename?: string,
  ): Promise<BatchUploadResult> {
    const rawRows = parseTabularBuffer(fileBuffer, { filename });
    requireCsvColumns(rawRows, ['name', 'lga']);

    const headers = Object.keys(rawRows[0] ?? {}).map((header) =>
      header.trim().toLowerCase(),
    );
    const hasCodeColumn = headers.includes('code');

    const errors: BatchUploadResult['errors'] = [];
    const pendingByName = new Map<string, PendingWard>();
    const pendingByCode = new Map<string, number>();

    rawRows.forEach((raw, index) => {
      const rowNumber = index + 2;
      const row = normalizeCsvRow(raw);
      const name = normalizePlaceName(row.name ?? '');
      const lga = normalizePlaceName(row.lga ?? '');
      const rawCode = hasCodeColumn ? (row.code ?? '').trim() : '';

      if (!name || !lga) {
        errors.push({ row: rowNumber, message: 'name and lga are required' });
        return;
      }

      if (name.length < 2 || lga.length < 2) {
        errors.push({
          row: rowNumber,
          message: 'name and lga must be at least 2 characters',
        });
        return;
      }

      let explicitCode: string | undefined;
      if (rawCode) {
        explicitCode = normalizeWardCode(rawCode);
        if (!extractWardCodePrefix(explicitCode)) {
          errors.push({
            row: rowNumber,
            message: 'code must contain at least one letter',
          });
          return;
        }

        const codeKey = explicitCode.toLowerCase();
        if (pendingByCode.has(codeKey)) {
          errors.push({
            row: rowNumber,
            message: `Duplicate ward code in file: ${explicitCode}`,
          });
          return;
        }
        pendingByCode.set(codeKey, rowNumber);
      } else {
        try {
          deriveWardCodeBase(lga, name);
        } catch {
          errors.push({
            row: rowNumber,
            message: 'name and lga must each contain at least one letter',
          });
          return;
        }
      }

      const nameKey = name.toLowerCase();
      if (pendingByName.has(nameKey)) {
        errors.push({
          row: rowNumber,
          message: `Duplicate ward name in file: ${name}`,
        });
        return;
      }

      pendingByName.set(nameKey, {
        id: createUuidV7(),
        name,
        lga,
        status: 'active',
        row: rowNumber,
        explicitCode,
      });
    });

    const candidates = [...pendingByName.values()];
    const uniqueLgas = [...new Set(candidates.map((ward) => ward.lga))];
    const [existingByName, takenCodes, existingInLgas] = await Promise.all([
      this.wards.findByNames(candidates.map((ward) => ward.name)),
      this.wards.listCodes(),
      Promise.all(
        uniqueLgas.map(async (lga) => ({
          lga,
          ward: await this.wards.findOneByLga(lga),
        })),
      ),
    ]);
    const existingNames = new Set(
      existingByName.map((ward) => ward.name.toLowerCase()),
    );
    const reservedCodes = new Set(
      takenCodes.map((code) => code.toLowerCase()),
    );
    const lgaPrefixByLga = new Map<string, string>();
    for (const { lga, ward } of existingInLgas) {
      if (ward) {
        lgaPrefixByLga.set(
          lga.toLowerCase(),
          extractLgaPrefixFromWardCode(ward.code),
        );
      }
    }

    const toCreate: CreateWardInput[] = [];
    for (const candidate of candidates) {
      if (existingNames.has(candidate.name.toLowerCase())) {
        errors.push({
          row: candidate.row,
          message: `Ward already exists: ${candidate.name}`,
        });
        continue;
      }

      let code: string;
      if (candidate.explicitCode) {
        const codeKey = candidate.explicitCode.toLowerCase();
        if (reservedCodes.has(codeKey)) {
          errors.push({
            row: candidate.row,
            message: `Ward code already exists: ${candidate.explicitCode}`,
          });
          continue;
        }
        code = candidate.explicitCode;
      } else {
        const lgaKey = candidate.lga.toLowerCase();
        const knownLgaPrefix = lgaPrefixByLga.get(lgaKey);
        const base = knownLgaPrefix
          ? deriveWardCodeBaseFromLgaPrefix(knownLgaPrefix, candidate.name)
          : deriveWardCodeBase(candidate.lga, candidate.name);
        code = allocateUniqueWardCode(base, reservedCodes);
      }

      reservedCodes.add(code.toLowerCase());
      lgaPrefixByLga.set(
        candidate.lga.toLowerCase(),
        extractLgaPrefixFromWardCode(code),
      );

      toCreate.push({
        id: candidate.id,
        code,
        name: candidate.name,
        lga: candidate.lga,
        status: candidate.status,
      });
    }

    const created = await this.wards.createMany(toCreate);

    return {
      created,
      failed: errors.length,
      errors,
    };
  }
}
