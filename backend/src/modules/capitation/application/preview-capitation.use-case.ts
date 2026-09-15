import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../platform/config/app-config.service';
import type { CapitationPreviewResult, CapitationTier } from '../domain/capitation';
import {
  CAPITATION_REPOSITORY,
  type CapitationRepository,
} from './capitation.repository';
import { resolveCapitationTiers } from './resolve-capitation-tiers';

@Injectable()
export class PreviewCapitationUseCase {
  constructor(
    @Inject(CAPITATION_REPOSITORY)
    private readonly capitation: CapitationRepository,
    private readonly config: AppConfigService,
  ) {}

  execute(input: {
    month: number;
    year: number;
    tiers?: CapitationTier[];
  }): Promise<CapitationPreviewResult> {
    const tiers = resolveCapitationTiers(this.config, input.tiers);
    return this.capitation.preview(input.month, input.year, tiers);
  }
}
