import { DEFAULT_CAPITATION_TIERS } from '../domain/capitation';
import type { AppConfigService } from '../../../platform/config/app-config.service';
import type { CapitationRepository } from './capitation.repository';
import { PreviewCapitationUseCase } from './preview-capitation.use-case';

describe('PreviewCapitationUseCase', () => {
  let capitation: jest.Mocked<CapitationRepository>;
  let config: Pick<AppConfigService, 'defaultCapitationTiers'>;
  let useCase: PreviewCapitationUseCase;

  beforeEach(() => {
    capitation = {
      preview: jest.fn(),
    } as unknown as jest.Mocked<CapitationRepository>;

    config = { defaultCapitationTiers: DEFAULT_CAPITATION_TIERS };
    useCase = new PreviewCapitationUseCase(
      capitation,
      config as AppConfigService,
    );
  });

  it('previews capitation using the configured default tiers', async () => {
    capitation.preview.mockResolvedValue({
      month: 8,
      year: 2026,
      tiers: DEFAULT_CAPITATION_TIERS,
      totalFacilities: 1,
      totalBeneficiaries: 2,
      totalCapitation: 650_000,
      records: [],
    });

    await useCase.execute({ month: 8, year: 2026 });

    expect(capitation.preview).toHaveBeenCalledWith(
      8,
      2026,
      DEFAULT_CAPITATION_TIERS,
    );
  });

  it('allows overriding tiers per request', async () => {
    const customTiers = [
      { minEnrollees: 1, maxEnrollees: null, amount: 500_000 },
    ];

    capitation.preview.mockResolvedValue({
      month: 8,
      year: 2026,
      tiers: customTiers,
      totalFacilities: 0,
      totalBeneficiaries: 0,
      totalCapitation: 0,
      records: [],
    });

    await useCase.execute({ month: 8, year: 2026, tiers: customTiers });

    expect(capitation.preview).toHaveBeenCalledWith(8, 2026, customTiers);
  });
});
