import { Injectable } from '@nestjs/common';
import { buildCursorPage } from '../../../platform/http/cursor-pagination';
import {
  createdAtDescCursorWhere,
  decodeCreatedAtDescCursor,
  encodeCreatedAtDescCursor,
} from '../../../platform/http/list-cursor';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type {
  FieldWorkerDetailAggregates,
  FieldWorkerListItem,
  PublicUser,
  User,
  UserStatus,
} from '../domain/user';
import { toPublicUser } from '../domain/user';
import { WARD_STATE } from '../../ward/domain/ward';
import { startOfMonthInLagos, startOfTodayInLagos } from '../../ward/domain/ward-date';
import type { ResolvedFieldWorkerListFilters } from '../domain/field-worker-list-filters';
import type {
  CreateUserInput,
  ListUsersQuery,
  PaginatedUsers,
  UpdateUserInput,
  UserRepository,
} from '../application/user.repository';
import { Prisma } from '../../../generated/prisma/client';

type UserWithWards = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'field_worker';
  status: 'active' | 'inactive';
  phone: string | null;
  lastSyncedAt: Date | null;
  isPasswordChangeRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignedWards: Array<{
    ward: { id: string; name: string; lga: string };
  }>;
};

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(user: UserWithWards): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
      phone: user.phone,
      lastSyncedAt: user.lastSyncedAt,
      isPasswordChangeRequired: user.isPasswordChangeRequired,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      assignedWards: user.assignedWards.map((assignment) => assignment.ward),
    };
  }

  private include = {
    assignedWards: {
      include: {
        ward: {
          select: { id: true, name: true, lga: true },
        },
      },
    },
  } as const;

  async create(input: CreateUserInput): Promise<PublicUser> {
    const user = await this.prisma.user.create({
      data: {
        id: input.id,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        status: input.status,
        phone: input.phone,
        isPasswordChangeRequired: input.isPasswordChangeRequired,
        assignedWards: {
          create: input.assignedWardIds.map((wardId) => ({ wardId })),
        },
      },
      include: this.include,
    });

    return toPublicUser(this.map(user));
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.include,
    });
    return user ? this.map(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: this.include,
    });
    return user ? this.map(user) : null;
  }

  async findExistingEmails(emails: string[]): Promise<Set<string>> {
    if (emails.length === 0) {
      return new Set();
    }
    const rows = await this.prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    });
    return new Set(rows.map((row) => row.email));
  }

  async list(query: ListUsersQuery): Promise<PaginatedUsers> {
    const limit = toQueryInt(query.limit, 50, { min: 1, max: 100 });
    const filterWhere = await this.buildUserFilterWhere(
      query.role,
      query.status,
      query.search,
      query.fieldWorkerFilters,
    );

    if (
      query.role === 'field_worker' &&
      filterWhere.id &&
      typeof filterWhere.id === 'object' &&
      'in' in filterWhere.id &&
      Array.isArray(filterWhere.id.in) &&
      filterWhere.id.in.length === 0
    ) {
      return {
        items: [],
        nextCursor: null,
        hasMore: false,
        limit,
        total: 0,
        summary: { active: 0, totalBeneficiariesEnrolled: 0 },
      };
    }

    const decodedCursor = query.cursor
      ? decodeCreatedAtDescCursor(query.cursor)
      : null;
    const where = {
      ...filterWhere,
      ...(decodedCursor ? createdAtDescCursorWhere(decodedCursor) : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where: filterWhere }),
      this.prisma.user.findMany({
        where,
        take: limit + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: this.include,
      }),
    ]);

    if (query.role === 'field_worker') {
      const summary = await this.buildFieldWorkerListSummary(
        filterWhere,
        query.status,
        total,
      );
      return {
        ...(await this.mapFieldWorkerPage(rows, limit, total)),
        summary,
      };
    }

    const page = buildCursorPage(
      rows.map((row) => toPublicUser(this.map(row))),
      limit,
      total,
    );
    const lastRow = (rows.length > limit ? rows.slice(0, limit) : rows).at(-1);
    return {
      ...page,
      nextCursor:
        page.hasMore && lastRow
          ? encodeCreatedAtDescCursor({
              createdAt: lastRow.createdAt,
              id: lastRow.id,
            })
          : null,
    };
  }

  private async buildUserFilterWhere(
    role: ListUsersQuery['role'],
    status: UserStatus | undefined,
    search: string | undefined,
    fieldWorkerFilters?: ResolvedFieldWorkerListFilters,
  ): Promise<Prisma.UserWhereInput> {
    const filterWhere: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (role !== 'field_worker' || !fieldWorkerFilters) {
      return filterWhere;
    }

    if (fieldWorkerFilters.lastSyncedFrom || fieldWorkerFilters.lastSyncedTo) {
      filterWhere.lastSyncedAt = {
        ...(fieldWorkerFilters.lastSyncedFrom
          ? { gte: fieldWorkerFilters.lastSyncedFrom }
          : {}),
        ...(fieldWorkerFilters.lastSyncedTo
          ? { lte: fieldWorkerFilters.lastSyncedTo }
          : {}),
      };
    }

    const enrollmentStatUserIds =
      fieldWorkerFilters.enrollmentStatUserIds === undefined
        ? await this.findFieldWorkerIdsForEnrollmentStats(fieldWorkerFilters)
        : fieldWorkerFilters.enrollmentStatUserIds;

    if (enrollmentStatUserIds !== null) {
      filterWhere.id = { in: enrollmentStatUserIds };
    }

    return filterWhere;
  }

  private async findFieldWorkerIdsForEnrollmentStats(
    filters: ResolvedFieldWorkerListFilters,
  ): Promise<string[]> {
    const min = filters.beneficiariesEnrolledMin ?? 0;
    const max = filters.beneficiariesEnrolledMax;

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT u.id
      FROM "User" u
      LEFT JOIN (
        SELECT "enrolledByUserId", COUNT(*)::int AS enrolled_count, MAX("createdAt") AS last_enrollment
        FROM "Enrollment"
        GROUP BY "enrolledByUserId"
      ) stats ON stats."enrolledByUserId" = u.id
      WHERE u.role = 'field_worker'::"UserRole"
        AND COALESCE(stats.enrolled_count, 0) >= ${min}
        ${max != null ? Prisma.sql`AND COALESCE(stats.enrolled_count, 0) <= ${max}` : Prisma.empty}
        ${
          filters.lastEnrollmentFrom
            ? Prisma.sql`AND stats.last_enrollment IS NOT NULL AND stats.last_enrollment >= ${filters.lastEnrollmentFrom}`
            : Prisma.empty
        }
        ${
          filters.lastEnrollmentTo
            ? Prisma.sql`AND stats.last_enrollment IS NOT NULL AND stats.last_enrollment <= ${filters.lastEnrollmentTo}`
            : Prisma.empty
        }
    `;

    return rows.map((row) => row.id);
  }

  async *iterateFieldWorkersForExport(
    filters: ResolvedFieldWorkerListFilters,
  ): AsyncIterable<FieldWorkerListItem> {
    const resolved: ResolvedFieldWorkerListFilters = {
      ...filters,
      enrollmentStatUserIds:
        filters.enrollmentStatUserIds === null
          ? null
          : filters.enrollmentStatUserIds === undefined
            ? await this.findFieldWorkerIdsForEnrollmentStats(filters)
            : filters.enrollmentStatUserIds,
    };

    if (
      resolved.enrollmentStatUserIds != null &&
      resolved.enrollmentStatUserIds.length === 0
    ) {
      return;
    }

    const filterWhere = await this.buildUserFilterWhere(
      'field_worker',
      filters.status,
      filters.search,
      resolved,
    );

    const batchSize = 100;
    let cursor: ReturnType<typeof decodeCreatedAtDescCursor> = null;

    for (;;) {
      const where: Prisma.UserWhereInput = {
        ...filterWhere,
        ...(cursor ? createdAtDescCursorWhere(cursor) : {}),
      };

      const rows = await this.prisma.user.findMany({
        where,
        take: batchSize + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: this.include,
      });

      if (rows.length === 0) {
        return;
      }

      const page = await this.mapFieldWorkerPage(
        rows,
        batchSize,
        rows.length,
      );
      for (const item of page.items) {
        if ('beneficiariesEnrolled' in item) {
          yield item;
        }
      }

      if (!page.hasMore) {
        return;
      }

      const lastRow = rows[Math.min(batchSize, rows.length) - 1];
      cursor = decodeCreatedAtDescCursor(
        encodeCreatedAtDescCursor({
          createdAt: lastRow.createdAt,
          id: lastRow.id,
        }),
      );
    }
  }

  private async buildFieldWorkerListSummary(
    filterWhere: Prisma.UserWhereInput,
    statusFilter: UserStatus | undefined,
    total: number,
  ) {
    const activePromise =
      statusFilter === 'inactive'
        ? Promise.resolve(0)
        : statusFilter === 'active'
          ? Promise.resolve(total)
          : this.prisma.user.count({
              where: { ...filterWhere, status: 'active' },
            });

    const matchingUsers = await this.prisma.user.findMany({
      where: filterWhere,
      select: { id: true },
    });
    const userIds = matchingUsers.map((row) => row.id);

    const [active, totalBeneficiariesEnrolled] = await Promise.all([
      activePromise,
      userIds.length === 0
        ? Promise.resolve(0)
        : this.prisma.enrollment.count({
            where: { enrolledByUserId: { in: userIds } },
          }),
    ]);

    return { active, totalBeneficiariesEnrolled };
  }

  private async mapFieldWorkerPage(
    rows: UserWithWards[],
    limit: number,
    total: number,
  ): Promise<PaginatedUsers> {
    const pageRows = rows.length > limit ? rows.slice(0, limit) : rows;
    const userIds = pageRows.map((row) => row.id);

    const enrollmentStats =
      userIds.length === 0
        ? []
        : await this.prisma.enrollment.groupBy({
            by: ['enrolledByUserId'],
            where: { enrolledByUserId: { in: userIds } },
            _count: { _all: true },
            _max: { createdAt: true },
          });

    const statsByUser = new Map(
      enrollmentStats.map((stat) => [
        stat.enrolledByUserId,
        {
          beneficiariesEnrolled: stat._count._all,
          lastEnrollmentAt: stat._max.createdAt,
        },
      ]),
    );

    const items: FieldWorkerListItem[] = pageRows.map((row) => {
      const mapped = this.map(row);
      const stats = statsByUser.get(row.id);
      return {
        id: mapped.id,
        name: mapped.name,
        phone: mapped.phone,
        email: mapped.email,
        wards: mapped.assignedWards,
        beneficiariesEnrolled: stats?.beneficiariesEnrolled ?? 0,
        lastEnrollmentAt: stats?.lastEnrollmentAt ?? null,
        lastSyncedAt: mapped.lastSyncedAt,
        status: mapped.status,
      };
    });

    const hasMore = rows.length > limit;
    const lastRow = pageRows.at(-1);

    return {
      items,
      nextCursor:
        hasMore && lastRow
          ? encodeCreatedAtDescCursor({
              createdAt: lastRow.createdAt,
              id: lastRow.id,
            })
          : null,
      hasMore,
      limit,
      total,
    };
  }

  async update(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const user = await this.prisma.$transaction(async (tx) => {
      if (input.assignedWardIds !== undefined) {
        await tx.userWardAssignment.deleteMany({ where: { userId: id } });
        if (input.assignedWardIds.length > 0) {
          await tx.userWardAssignment.createMany({
            data: input.assignedWardIds.map((wardId) => ({
              userId: id,
              wardId,
            })),
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: {
          name: input.name,
          phone: input.phone,
          status: input.status,
          passwordHash: input.passwordHash,
          lastSyncedAt: input.lastSyncedAt,
          isPasswordChangeRequired: input.isPasswordChangeRequired,
        },
        include: this.include,
      });
    });

    return toPublicUser(this.map(user));
  }

  async wardIdsExist(wardIds: string[]): Promise<boolean> {
    if (wardIds.length === 0) {
      return true;
    }
    const unique = [...new Set(wardIds)];
    const count = await this.prisma.ward.count({
      where: { id: { in: unique } },
    });
    return count === unique.length;
  }

  async findLgasForWardIds(wardIds: string[]): Promise<string[]> {
    if (wardIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.ward.findMany({
      where: { id: { in: [...new Set(wardIds)] } },
      select: { lga: true },
    });
    return rows.map((row) => row.lga);
  }

  async findFieldWorkersByIds(
    ids: string[],
  ): Promise<Array<{ id: string; name: string }>> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.user.findMany({
      where: { id: { in: ids }, role: 'field_worker' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return rows;
  }

  async findFieldWorkerDetailAggregates(
    userId: string,
  ): Promise<FieldWorkerDetailAggregates | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, role: 'field_worker' },
      include: this.include,
    });

    if (!user) {
      return null;
    }

    const monthStart = startOfMonthInLagos();
    const todayStart = startOfTodayInLagos();

    const [totalEnrolled, enrollmentsToday, enrollmentsThisMonth, lastEnrollment] =
      await Promise.all([
        this.prisma.enrollment.count({
          where: { enrolledByUserId: userId },
        }),
        this.prisma.enrollment.count({
          where: {
            enrolledByUserId: userId,
            createdAt: { gte: todayStart },
          },
        }),
        this.prisma.enrollment.count({
          where: {
            enrolledByUserId: userId,
            createdAt: { gte: monthStart },
          },
        }),
        this.prisma.enrollment.findFirst({
          where: { enrolledByUserId: userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

    return {
      stats: {
        totalEnrolled,
        enrollmentsToday,
        enrollmentsThisMonth,
        lastEnrollmentAt: lastEnrollment?.createdAt ?? null,
        lastSyncedAt: user.lastSyncedAt,
      },
      wards: user.assignedWards.map((assignment) => ({
        ...assignment.ward,
        state: WARD_STATE,
      })),
    };
  }
}
