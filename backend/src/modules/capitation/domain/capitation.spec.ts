import {
  DEFAULT_CAPITATION_TIERS,
  CapitationTierValidationError,
  resolveCapitationAmount,
  resolveCapitationTier,
  sortCapitationListRecords,
  validateCapitationTiers,
} from './capitation';

describe('capitation tiers', () => {
  it('returns zero amount for zero enrollees', () => {
    expect(resolveCapitationAmount(0, DEFAULT_CAPITATION_TIERS)).toBe(0);
    expect(resolveCapitationTier(0, DEFAULT_CAPITATION_TIERS)).toBeNull();
  });

  it('resolves default tier boundaries', () => {
    expect(resolveCapitationAmount(1, DEFAULT_CAPITATION_TIERS)).toBe(650_000);
    expect(resolveCapitationAmount(4999, DEFAULT_CAPITATION_TIERS)).toBe(650_000);
    expect(resolveCapitationAmount(5000, DEFAULT_CAPITATION_TIERS)).toBe(830_000);
    expect(resolveCapitationAmount(10_000, DEFAULT_CAPITATION_TIERS)).toBe(830_000);
    expect(resolveCapitationAmount(10_001, DEFAULT_CAPITATION_TIERS)).toBe(1_000_000);
  });

  it('validates contiguous open-ended tiers', () => {
    expect(validateCapitationTiers(DEFAULT_CAPITATION_TIERS)).toEqual(
      DEFAULT_CAPITATION_TIERS,
    );
  });

  it('rejects overlapping or gapped tiers', () => {
    expect(() =>
      validateCapitationTiers([
        { minEnrollees: 1, maxEnrollees: 5000, amount: 650_000 },
        { minEnrollees: 5000, maxEnrollees: null, amount: 830_000 },
      ]),
    ).toThrow(CapitationTierValidationError);

    expect(() =>
      validateCapitationTiers([
        { minEnrollees: 1, maxEnrollees: 4998, amount: 650_000 },
        { minEnrollees: 5000, maxEnrollees: null, amount: 830_000 },
      ]),
    ).toThrow(CapitationTierValidationError);
  });
});

describe('sortCapitationListRecords', () => {
  it('sorts by beneficiary count descending with zero-beneficiary facilities last', () => {
    const sorted = sortCapitationListRecords([
      { id: 'c', facilityName: 'Zero B', beneficiaryCount: 0 },
      { id: 'a', facilityName: 'Top', beneficiaryCount: 100 },
      { id: 'b', facilityName: 'Mid', beneficiaryCount: 50 },
      { id: 'd', facilityName: 'Zero A', beneficiaryCount: 0 },
    ]);

    expect(sorted.map((row) => row.id)).toEqual(['a', 'b', 'd', 'c']);
  });

  it('breaks ties by facility name then id', () => {
    const sorted = sortCapitationListRecords([
      { id: '2', facilityName: 'Beta Clinic', beneficiaryCount: 10 },
      { id: '1', facilityName: 'Alpha Clinic', beneficiaryCount: 10 },
    ]);

    expect(sorted.map((row) => row.id)).toEqual(['1', '2']);
  });
});
