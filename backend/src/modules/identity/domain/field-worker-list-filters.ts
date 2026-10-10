import type { UserStatus } from './user';

export type FieldWorkerListFilterInput = {
  search?: string;
  status?: UserStatus;
  beneficiariesEnrolledMin?: number;
  beneficiariesEnrolledMax?: number;
  lastEnrollmentFrom?: Date;
  lastEnrollmentTo?: Date;
  lastSyncedFrom?: Date;
  lastSyncedTo?: Date;
};

export type ResolvedFieldWorkerListFilters = FieldWorkerListFilterInput & {
  enrollmentStatUserIds?: string[] | null;
};
