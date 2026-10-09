import { Inject, Injectable } from '@nestjs/common';
import type { UserRole, UserStatus } from '../domain/user';
import { ResolveFieldWorkerListFiltersUseCase } from './resolve-field-worker-list-filters';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly resolveFieldWorkerFilters: ResolveFieldWorkerListFiltersUseCase,
  ) {}

  async execute(query: {
    cursor?: string;
    limit: number;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
    beneficiariesEnrolledMin?: number;
    beneficiariesEnrolledMax?: number;
    lastEnrollmentFrom?: string;
    lastEnrollmentTo?: string;
    lastSyncedFrom?: string;
    lastSyncedTo?: string;
  }) {
    const fieldWorkerFilters =
      query.role === 'field_worker'
        ? this.resolveFieldWorkerFilters.execute(query)
        : undefined;

    return this.users.list({
      cursor: query.cursor,
      limit: query.limit,
      role: query.role,
      status: query.status,
      search: query.search,
      fieldWorkerFilters,
    });
  }
}
