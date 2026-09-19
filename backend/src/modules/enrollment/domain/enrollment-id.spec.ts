import {
  formatEnrollmentId,
  formatHouseholdMemberEnrollmentId,
  headEnrollmentIdFromHouseholdCode,
} from './enrollment-id';

describe('formatEnrollmentId', () => {
  it('pads sequence to at least 3 digits', () => {
    expect(formatEnrollmentId(2026, 1)).toBe('PL/CBHI/2026/001');
    expect(formatEnrollmentId(2026, 12)).toBe('PL/CBHI/2026/012');
    expect(formatEnrollmentId(2026, 1000)).toBe('PL/CBHI/2026/1000');
  });
});

describe('headEnrollmentIdFromHouseholdCode', () => {
  it('uses the trimmed household code as the head enrollment ID', () => {
    expect(headEnrollmentIdFromHouseholdCode('  BAR-TAF-001  ')).toBe(
      'BAR-TAF-001',
    );
  });
});

describe('formatHouseholdMemberEnrollmentId', () => {
  it('appends a two-digit member suffix to the head enrollment ID', () => {
    expect(
      formatHouseholdMemberEnrollmentId('BAR-TAF-001', 1),
    ).toBe('BAR-TAF-001-01');
    expect(
      formatHouseholdMemberEnrollmentId('BAR-TAF-001', 12),
    ).toBe('BAR-TAF-001-12');
  });
});
