import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppConfigService } from '../../../platform/config/app-config.service';
import { AppError } from '../../../platform/http/app-error';
import { currentMonthYearInLagos } from '../../ward/domain/ward-date';
import type { CapitationGenerateResult, CapitationTier } from '../domain/capitation';
import {
  CAPITATION_REPOSITORY,
  type CapitationRepository,
} from './capitation.repository';
import { resolveCapitationTiers } from './resolve-capitation-tiers';

@Injectable()
export class GenerateCapitationUseCase {
  constructor(
    @Inject(CAPITATION_REPOSITORY)
    private readonly capitation: CapitationRepository,
    private readonly config: AppConfigService,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    input: { month: number; year: number; tiers?: CapitationTier[] },
  ): Promise<CapitationGenerateResult> {
    const currentPeriod = currentMonthYearInLagos();
    if (
      input.month !== currentPeriod.month ||
      input.year !== currentPeriod.year
    ) {
      throw new AppError(
        'CAPITATION_PERIOD_LOCKED',
        'Capitation can only be generated for the current month',
        400,
      );
    }

    const tiers = resolveCapitationTiers(this.config, input.tiers);
    const records = await this.capitation.computeRecords(tiers);

    return this.capitation.createRun({
      month: input.month,
      year: input.year,
      tiers,
      createdByUserId: actor.id,
      records,
    });
  }
}
