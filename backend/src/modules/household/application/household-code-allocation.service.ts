import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { RedisService } from '../../../platform/cache/redis.service';
import { headEnrollmentIdFromHouseholdCode } from '../../enrollment/domain/enrollment-id';
import {
  formatHouseholdCode,
  parseHouseholdCodeSuffix,
} from '../domain/household-code';
import {
  HOUSEHOLD_REPOSITORY,
  type HouseholdRepository,
} from './household.repository';

const REDIS_KEY_PREFIX = 'household:code-seq:';
const MAX_ALLOCATION_ATTEMPTS = 20;

@Injectable()
export class HouseholdCodeAllocationService {
  constructor(
    private readonly redis: RedisService,
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
  ) {}

  async resolveHeadHouseholdCode(input: {
    wardId: string;
    wardCode: string;
    requestedCode: string;
    householdLocalId: string;
    isHouseholdCodeAvailable: (code: string) => Promise<boolean>;
    isEnrollmentIdAvailable: (enrollmentId: string) => Promise<boolean>;
  }): Promise<{ householdCode: string; remapped: boolean }> {
    const requested = input.requestedCode.trim();
    const requestedSuffix = parseHouseholdCodeSuffix(requested);
    if (
      requestedSuffix !== null
      && (await this.canUseHeadCode(input, requested))
    ) {
      await this.noteAllocatedSuffix(input.wardId, requestedSuffix);
      return { householdCode: requested, remapped: false };
    }

    for (let attempt = 0; attempt < MAX_ALLOCATION_ATTEMPTS; attempt += 1) {
      const suffix = await this.nextSuffix(input.wardId);
      const candidate = formatHouseholdCode(input.wardCode, suffix);
      if (await this.canUseHeadCode(input, candidate)) {
        return {
          householdCode: candidate,
          remapped: candidate !== requested,
        };
      }
    }

    throw new AppError(
      'HOUSEHOLD_CODE_EXHAUSTED',
      'Unable to allocate a unique household code for this ward. Try again.',
      503,
    );
  }

  private async canUseHeadCode(
    input: {
      isHouseholdCodeAvailable: (code: string) => Promise<boolean>;
      isEnrollmentIdAvailable: (enrollmentId: string) => Promise<boolean>;
    },
    code: string,
  ): Promise<boolean> {
    if (!(await input.isHouseholdCodeAvailable(code))) {
      return false;
    }

    let enrollmentId: string;
    try {
      enrollmentId = headEnrollmentIdFromHouseholdCode(code);
    } catch {
      return false;
    }

    return input.isEnrollmentIdAvailable(enrollmentId);
  }

  private redisKey(wardId: string): string {
    return `${REDIS_KEY_PREFIX}${wardId}`;
  }

  private async client() {
    const connection = this.redis.getClient();
    if (connection.status === 'wait') {
      await connection.connect();
    }
    return connection;
  }

  private async dbMaxSuffix(wardId: string): Promise<number> {
    const map = await this.households.getHighestCodeSuffixByWardIds([wardId]);
    return map.get(wardId) ?? 0;
  }

  /** Ensures Redis sequence is at least the Postgres high-water mark. */
  async ensureBaseline(wardId: string): Promise<void> {
    const floor = await this.dbMaxSuffix(wardId);
    await this.raiseSequenceFloor(wardId, floor);
  }

  async noteAllocatedSuffix(wardId: string, suffix: number): Promise<void> {
    if (!Number.isInteger(suffix) || suffix < 1) {
      return;
    }
    await this.raiseSequenceFloor(wardId, suffix);
  }

  async nextSuffix(wardId: string): Promise<number> {
    await this.ensureBaseline(wardId);
    const connection = await this.client();
    return connection.incr(this.redisKey(wardId));
  }

  private async raiseSequenceFloor(wardId: string, floor: number): Promise<void> {
    if (!Number.isInteger(floor) || floor < 0) {
      return;
    }

    const connection = await this.client();
    const key = this.redisKey(wardId);
    const script = `
      local current = redis.call('GET', KEYS[1])
      if not current then
        redis.call('SET', KEYS[1], ARGV[1])
        return tonumber(ARGV[1])
      end
      local num = tonumber(current)
      local floor = tonumber(ARGV[1])
      if num < floor then
        redis.call('SET', KEYS[1], ARGV[1])
        return floor
      end
      return num
    `;
    await connection.eval(script, 1, key, String(floor));
  }
}
