import { DEFAULT_CAPITATION_TIERS } from '../domain/capitation';
import type { AppConfigService } from '../../../platform/config/app-config.service';
import type { CapitationRepository } from './capitation.repository';
import { GenerateCapitationUseCase } from './generate-capitation.use-case';

jest.mock('../../ward/domain/ward-date', () => ({
  currentMonthYearInLagos: () => ({ month: 8, year: 2026 }),
}));

describe('GenerateCapitationUseCase', () => {
  const actor = {
    id: '01900000-0000-7000-8000-000000000001',
    email: 'admin@cbhi.local',
    name: 'Root Admin',
    role: 'admin' as const,
    status: 'active' as const,
    isPasswordChangeRequired: false,
  };

  let capitation: jest.Mocked<CapitationRepository>;
  let config: Pick<AppConfigService, 'defaultCapitationTiers'>;
  let useCase: GenerateCapitationUseCase;

  beforeEach(() => {
    capitation = {
      computeRecords: jest.fn(),
      createRun: jest.fn(),
    } as unknown as jest.Mocked<CapitationRepository>;

    config = { defaultCapitationTiers: DEFAULT_CAPITATION_TIERS };
    useCase = new GenerateCapitationUseCase(
      capitation,
      config as AppConfigService,
    );
  });

  it('generates capitation for all active facilities using the default tiers', async () => {
    const records = [
      {
        healthFacilityId: 'fac-1',
        facilityName: 'Tudun Wada PHC',
        lga: 'Jos North',
        beneficiaryCount: 2,
        amount: 650_000,
        tierMin: 1,
        tierMax: 5000,
        tierAmount: 650_000,
        tierLabel: '1 – 4,999',
        rate: null,
      },
    ];

    capitation.computeRecords.mockResolvedValue(records);
    capitation.createRun.mockResolvedValue({
      runId: 'run-1',
      month: 8,
      year: 2026,
      tiers: DEFAULT_CAPITATION_TIERS,
      rate: null,
      generatedAt: new Date('2026-08-30T00:00:00.000Z'),
      totalFacilities: 1,
      totalBeneficiaries: 2,
      totalCapitation: 650_000,
      recordCount: 1,
    });

    const result = await useCase.execute(actor, { month: 8, year: 2026 });

    expect(capitation.computeRecords).toHaveBeenCalledWith(
      DEFAULT_CAPITATION_TIERS,
    );
    expect(capitation.createRun).toHaveBeenCalledWith({
      month: 8,
      year: 2026,
      tiers: DEFAULT_CAPITATION_TIERS,
      createdByUserId: actor.id,
      records,
    });
    expect(result.totalCapitation).toBe(650_000);
  });

  it('allows overriding tiers per request', async () => {
    const customTiers = [
      { minEnrollees: 1, maxEnrollees: null, amount: 500_000 },
    ];

    capitation.computeRecords.mockResolvedValue([]);
    capitation.createRun.mockResolvedValue({
      runId: 'run-1',
      month: 8,
      year: 2026,
      tiers: customTiers,
      rate: null,
      generatedAt: new Date('2026-08-30T00:00:00.000Z'),
      totalFacilities: 0,
      totalBeneficiaries: 0,
      totalCapitation: 0,
      recordCount: 0,
    });

    await useCase.execute(actor, { month: 8, year: 2026, tiers: customTiers });

    expect(capitation.computeRecords).toHaveBeenCalledWith(customTiers);
    expect(capitation.createRun).toHaveBeenCalledWith(
      expect.objectContaining({ tiers: customTiers }),
    );
  });
});
