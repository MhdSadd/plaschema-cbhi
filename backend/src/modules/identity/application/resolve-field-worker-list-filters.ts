import { Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import type {
  FieldWorkerListFilterInput,
  ResolvedFieldWorkerListFilters,
} from '../domain/field-worker-list-filters';
import type { UserStatus } from '../domain/user';

function startOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function endOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

export type FieldWorkerListFilterQuery = {
  search?: string;
  status?: UserStatus;
  beneficiariesEnrolledMin?: number;
  beneficiariesEnrolledMax?: number;
  lastEnrollmentFrom?: string;
  lastEnrollmentTo?: string;
  lastSyncedFrom?: string;
  lastSyncedTo?: string;
};

@Injectable()
export class ResolveFieldWorkerListFiltersUseCase {
  execute(query: FieldWorkerListFilterQuery): ResolvedFieldWorkerListFilters {
    if (
      query.beneficiariesEnrolledMin != null &&
      query.beneficiariesEnrolledMax != null &&
      query.beneficiariesEnrolledMin > query.beneficiariesEnrolledMax
    ) {
      throw new AppError(
        'VALIDATION_ERROR',
        'beneficiariesEnrolledMin cannot be greater than beneficiariesEnrolledMax',
        400,
      );
    }

    if (
      query.lastEnrollmentFrom &&
      query.lastEnrollmentTo &&
      query.lastEnrollmentFrom > query.lastEnrollmentTo
    ) {
      throw new AppError(
        'VALIDATION_ERROR',
        'lastEnrollmentFrom cannot be after lastEnrollmentTo',
        400,
      );
    }

    if (
      query.lastSyncedFrom &&
      query.lastSyncedTo &&
      query.lastSyncedFrom > query.lastSyncedTo
    ) {
      throw new AppError(
        'VALIDATION_ERROR',
        'lastSyncedFrom cannot be after lastSyncedTo',
        400,
      );
    }

    const hasEnrollmentStatFilter =
      query.beneficiariesEnrolledMin != null ||
      query.beneficiariesEnrolledMax != null ||
      Boolean(query.lastEnrollmentFrom) ||
      Boolean(query.lastEnrollmentTo);

    const filters: FieldWorkerListFilterInput = {
      search: query.search,
      status: query.status,
      beneficiariesEnrolledMin: query.beneficiariesEnrolledMin,
      beneficiariesEnrolledMax: query.beneficiariesEnrolledMax,
      lastEnrollmentFrom: query.lastEnrollmentFrom
        ? startOfUtcDay(query.lastEnrollmentFrom)
        : undefined,
      lastEnrollmentTo: query.lastEnrollmentTo
        ? endOfUtcDay(query.lastEnrollmentTo)
        : undefined,
      lastSyncedFrom: query.lastSyncedFrom
        ? startOfUtcDay(query.lastSyncedFrom)
        : undefined,
      lastSyncedTo: query.lastSyncedTo
        ? endOfUtcDay(query.lastSyncedTo)
        : undefined,
    };

    return {
      ...filters,
      enrollmentStatUserIds: hasEnrollmentStatFilter ? undefined : null,
    };
  }
}
