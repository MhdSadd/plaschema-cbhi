/**
 * Format a public enrollment ID: PL/CBHI/<YEAR>/<SEQ padded to ≥3 digits>.
 */
export function formatEnrollmentId(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error('year must be a 4-digit calendar year');
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('sequence must be a positive integer');
  }
  return `PL/CBHI/${year}/${String(sequence).padStart(3, '0')}`;
}

/**
 * Head enrollment ID is the client-allocated household code (e.g. BAR-TAF-001).
 */
export function headEnrollmentIdFromHouseholdCode(householdCode: string): string {
  const normalized = householdCode.trim();
  if (normalized.length < 2) {
    throw new Error('householdCode must be at least 2 characters');
  }
  return normalized;
}

/** Household member suffix on the head enrollment ID, e.g. BAR-TAF-001-01 */
export function formatHouseholdMemberEnrollmentId(
  baseEnrollmentId: string,
  memberSequence: number,
): string {
  if (!Number.isInteger(memberSequence) || memberSequence < 1) {
    throw new Error('memberSequence must be a positive integer');
  }
  return `${baseEnrollmentId}-${String(memberSequence).padStart(2, '0')}`;
}

export function enrollmentBeneficiaryName(input: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}): string {
  return [input.firstName, input.middleName, input.lastName]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ');
}
