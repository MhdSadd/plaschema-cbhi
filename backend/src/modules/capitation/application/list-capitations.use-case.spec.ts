import { AppError } from '../../../platform/http/app-error';
import type { HealthFacilityRepository } from '../../health-facility/application/health-facility.repository';
import type { CapitationRepository } from './capitation.repository';
import { ListCapitationsUseCase } from './list-capitations.use-case';

jest.mock('../../ward/domain/ward-date', () => ({
  currentMonthYearInLagos: () => ({ month: 8, year: 2026 }),
}));

describe('ListCapitationsUseCase', () => {
  let capitation: jest.Mocked<CapitationRepository>;
  let facilities: jest.Mocked<HealthFacilityRepository>;
  let useCase: ListCapitationsUseCase;

  beforeEach(() => {
    capitation = {
      list: jest.fn(),
    } as unknown as jest.Mocked<CapitationRepository>;

    facilities = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<HealthFacilityRepository>;

    useCase = new ListCapitationsUseCase(capitation, facilities);
  });

  it('defaults to the current Lagos month and year', async () => {
    capitation.list.mockResolvedValue({
      items: [],
      summary: null,
      filteredSummary: null,
      nextCursor: null,
      hasMore: false,
      limit: 50,
      total: 0,
    });

    await useCase.execute({ limit: 50 });

    expect(capitation.list).toHaveBeenCalledWith(
      expect.objectContaining({ month: 8, year: 2026 }),
    );
  });

  it('returns 404 when filtering by an unknown health facility', async () => {
    facilities.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        limit: 50,
        healthFacilityId: '01900000-0000-7000-8000-000000000099',
      }),
    ).rejects.toMatchObject({
      code: 'HEALTH_FACILITY_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('returns paginated data with summary from the repository', async () => {
    capitation.list.mockResolvedValue({
      items: [
        {
          id: 'rec-1',
          healthFacilityId: 'fac-1',
          facilityName: 'Tudun Wada PHC',
          lga: 'Jos North',
          month: 8,
          year: 2026,
          period: 'August 2026',
          beneficiaryCount: 2,
          amount: 650_000,
          tierMin: 1,
          tierMax: 4999,
          tierAmount: 650_000,
          tierLabel: '1 – 4,999',
          rate: null,
        },
      ],
      summary: {
        runId: 'run-1',
        month: 8,
        year: 2026,
        tiers: [
          { minEnrollees: 1, maxEnrollees: 4999, amount: 650_000 },
          { minEnrollees: 5000, maxEnrollees: 10_000, amount: 830_000 },
          { minEnrollees: 10_001, maxEnrollees: null, amount: 1_000_000 },
        ],
        rate: null,
        generatedAt: new Date('2026-08-30T00:00:00.000Z'),
        totalFacilities: 1,
        totalBeneficiaries: 2,
        totalCapitation: 650_000,
      },
      filteredSummary: {
        totalFacilities: 1,
        totalBeneficiaries: 2,
        totalCapitation: 650_000,
      },
      nextCursor: null,
      hasMore: false,
      limit: 50,
      total: 1,
    });

    const result = await useCase.execute({
      limit: 50,
      month: 8,
      year: 2026,
      lga: 'Jos North',
    });

    expect(result.data).toHaveLength(1);
    expect(result.summary?.totalCapitation).toBe(650_000);
    expect(result.filteredSummary?.totalCapitation).toBe(650_000);
    expect(result.meta.hasMore).toBe(false);
    expect(result.meta.total).toBe(1);
  });
});
