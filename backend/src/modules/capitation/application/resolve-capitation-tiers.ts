import type { AppConfigService } from '../../../platform/config/app-config.service';
import { AppError } from '../../../platform/http/app-error';
import {
  CapitationTierValidationError,
  type CapitationTier,
  validateCapitationTiers,
} from '../domain/capitation';

export function resolveCapitationTiers(
  config: AppConfigService,
  tiers?: CapitationTier[],
): CapitationTier[] {
  try {
    return tiers?.length
      ? validateCapitationTiers(tiers)
      : config.defaultCapitationTiers;
  } catch (error) {
    const message =
      error instanceof CapitationTierValidationError
        ? error.message
        : 'Invalid capitation tiers';
    throw new AppError('INVALID_CAPITATION_TIERS', message, 400);
  }
}
