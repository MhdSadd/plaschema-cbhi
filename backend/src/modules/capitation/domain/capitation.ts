export type CapitationListSortRow = {
  id: string;
  facilityName: string;
  beneficiaryCount: number;
};

/** Highest beneficiary count first; zero-beneficiary facilities last. */
export function sortCapitationListRecords<T extends CapitationListSortRow>(
  records: T[],
): T[] {
  return [...records].sort((a, b) => {
    if (b.beneficiaryCount !== a.beneficiaryCount) {
      return b.beneficiaryCount - a.beneficiaryCount;
    }
    const byName = a.facilityName.localeCompare(b.facilityName);
    if (byName !== 0) {
      return byName;
    }
    return a.id.localeCompare(b.id);
  });
}

export type CapitationTier = {
  minEnrollees: number;
  maxEnrollees: number | null;
  amount: number;
};

export const DEFAULT_CAPITATION_TIERS: CapitationTier[] = [
  { minEnrollees: 1, maxEnrollees: 4999, amount: 650_000 },
  { minEnrollees: 5000, maxEnrollees: 10_000, amount: 830_000 },
  { minEnrollees: 10_001, maxEnrollees: null, amount: 1_000_000 },
];

export function formatCapitationTierLabel(tier: CapitationTier): string {
  const min = tier.minEnrollees.toLocaleString('en-NG');
  if (tier.maxEnrollees === null) {
    return `${min}+`;
  }
  return `${min} – ${tier.maxEnrollees.toLocaleString('en-NG')}`;
}

export function resolveCapitationTier(
  count: number,
  tiers: CapitationTier[],
): CapitationTier | null {
  if (count <= 0) {
    return null;
  }

  return (
    tiers.find(
      (tier) =>
        count >= tier.minEnrollees &&
        (tier.maxEnrollees === null || count <= tier.maxEnrollees),
    ) ?? null
  );
}

export function resolveCapitationAmount(
  count: number,
  tiers: CapitationTier[],
): number {
  if (count === 0) {
    return 0;
  }

  const tier = resolveCapitationTier(count, tiers);
  return tier?.amount ?? 0;
}

export class CapitationTierValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CapitationTierValidationError';
  }
}

export function validateCapitationTiers(tiers: CapitationTier[]): CapitationTier[] {
  if (tiers.length === 0) {
    throw new CapitationTierValidationError('At least one capitation tier is required');
  }

  const sorted = [...tiers].sort((a, b) => a.minEnrollees - b.minEnrollees);

  for (let index = 0; index < sorted.length; index += 1) {
    const tier = sorted[index];
    const isLast = index === sorted.length - 1;

    if (!Number.isInteger(tier.minEnrollees) || tier.minEnrollees < 1) {
      throw new CapitationTierValidationError(
        'Each tier minEnrollees must be an integer >= 1',
      );
    }

    if (!Number.isInteger(tier.amount) || tier.amount < 1) {
      throw new CapitationTierValidationError(
        'Each tier amount must be a positive integer',
      );
    }

    if (tier.maxEnrollees !== null) {
      if (!Number.isInteger(tier.maxEnrollees) || tier.maxEnrollees < tier.minEnrollees) {
        throw new CapitationTierValidationError(
          'Each tier maxEnrollees must be an integer >= minEnrollees',
        );
      }
    }

    if (!isLast && tier.maxEnrollees === null) {
      throw new CapitationTierValidationError(
        'Only the last tier may have an open-ended maxEnrollees',
      );
    }

    if (isLast && tier.maxEnrollees !== null) {
      throw new CapitationTierValidationError(
        'The last tier must have an open-ended maxEnrollees',
      );
    }

    if (index > 0) {
      const previous = sorted[index - 1];
      if (previous.maxEnrollees === null) {
        throw new CapitationTierValidationError('Tiers must not overlap');
      }
      if (tier.minEnrollees !== previous.maxEnrollees + 1) {
        throw new CapitationTierValidationError(
          'Tiers must be contiguous without gaps or overlaps',
        );
      }
    }
  }

  return sorted;
}

export type CapitationRecordDraft = {
  healthFacilityId: string;
  facilityName: string;
  lga: string;
  beneficiaryCount: number;
  amount: number;
  tierMin: number | null;
  tierMax: number | null;
  tierAmount: number | null;
  tierLabel: string | null;
  rate: number | null;
};

export type CapitationRunSummary = {
  runId: string;
  month: number;
  year: number;
  tiers: CapitationTier[] | null;
  rate: number | null;
  generatedAt: Date;
  totalFacilities: number;
  totalBeneficiaries: number;
  totalCapitation: number;
};

export type CapitationPreviewResult = {
  month: number;
  year: number;
  tiers: CapitationTier[];
  totalFacilities: number;
  totalBeneficiaries: number;
  totalCapitation: number;
  records: CapitationRecordDraft[];
};

export type CapitationGenerateResult = CapitationRunSummary & {
  recordCount: number;
};

export type CapitationRecordListItem = {
  id: string;
  healthFacilityId: string;
  facilityName: string;
  lga: string;
  month: number;
  year: number;
  period: string;
  beneficiaryCount: number;
  amount: number;
  tierMin: number | null;
  tierMax: number | null;
  tierAmount: number | null;
  tierLabel: string | null;
  rate: number | null;
};

export type CapitationListSummary = Omit<
  CapitationRunSummary,
  'runId'
> & {
  runId: string | null;
};

export type CapitationHistoryItem = {
  month: number;
  year: number;
  period: string;
  beneficiaryCount: number;
  amount: number;
  tierMin: number | null;
  tierMax: number | null;
  tierAmount: number | null;
  tierLabel: string | null;
  rate: number | null;
  generatedAt: Date;
};

export type HealthFacilityCapitationDetail = {
  implemented: true;
  currentAmount: number | null;
  currency: 'NGN';
  records: CapitationHistoryItem[];
};
