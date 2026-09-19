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
  it('prefixes the trimmed household code with PL-CBHI-', () => {
    expect(headEnrollmentIdFromHouseholdCode('  BSA-BAK-0001  ')).toBe(
      'PL-CBHI-BSA-BAK-0001',
    );
  });

  it('does not double-prefix when the client already sent PL-CBHI-', () => {
    expect(headEnrollmentIdFromHouseholdCode('PL-CBHI-BSA-BAK-0001')).toBe(
      'PL-CBHI-BSA-BAK-0001',
    );
  });
});

describe('formatHouseholdMemberEnrollmentId', () => {
  it('appends a two-digit member suffix to the head enrollment ID', () => {
    expect(
      formatHouseholdMemberEnrollmentId('PL-CBHI-BSA-BAK-0001', 1),
    ).toBe('PL-CBHI-BSA-BAK-0001-01');
    expect(
      formatHouseholdMemberEnrollmentId('PL-CBHI-BSA-BAK-0001', 12),
    ).toBe('PL-CBHI-BSA-BAK-0001-12');
  });
});
