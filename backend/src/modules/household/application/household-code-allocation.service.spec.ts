import type { RedisService } from '../../../platform/cache/redis.service';
import type { HouseholdRepository } from './household.repository';
import { HouseholdCodeAllocationService } from './household-code-allocation.service';

describe('HouseholdCodeAllocationService', () => {
  const evalMock = jest.fn();
  const incrMock = jest.fn();
  const redisClient = {
    status: 'ready',
    eval: evalMock,
    incr: incrMock,
  };

  let households: jest.Mocked<Pick<HouseholdRepository, 'getHighestCodeSuffixByWardIds'>>;
  let service: HouseholdCodeAllocationService;

  beforeEach(() => {
    evalMock.mockReset();
    incrMock.mockReset();
    incrMock.mockResolvedValue(2);
    evalMock.mockResolvedValue(1);

    households = {
      getHighestCodeSuffixByWardIds: jest.fn(),
    };

    service = new HouseholdCodeAllocationService(
      { getClient: () => redisClient } as unknown as RedisService,
      households as unknown as HouseholdRepository,
    );
  });

  it('keeps the requested code when it is available', async () => {
    households.getHighestCodeSuffixByWardIds.mockResolvedValue(new Map());

    const result = await service.resolveHeadHouseholdCode({
      wardId: 'ward-1',
      wardCode: 'JOS-VOM',
      requestedCode: 'JOS-VOM-001',
      householdLocalId: 'local-1',
      isHouseholdCodeAvailable: async () => true,
      isEnrollmentIdAvailable: async () => true,
    });

    expect(result).toEqual({ householdCode: 'JOS-VOM-001', remapped: false });
    expect(evalMock).toHaveBeenCalled();
  });

  it('allocates the next suffix when the requested code is taken', async () => {
    households.getHighestCodeSuffixByWardIds.mockResolvedValue(new Map([['ward-1', 1]]));

    const result = await service.resolveHeadHouseholdCode({
      wardId: 'ward-1',
      wardCode: 'JOS-VOM',
      requestedCode: 'JOS-VOM-001',
      householdLocalId: 'local-2',
      isHouseholdCodeAvailable: async (code) => code !== 'JOS-VOM-001',
      isEnrollmentIdAvailable: async () => true,
    });

    expect(incrMock).toHaveBeenCalledWith('household:code-seq:ward-1');
    expect(result).toEqual({ householdCode: 'JOS-VOM-002', remapped: true });
  });
});
