export const ENROLLMENT_NIN_DIGIT_COUNT = 11;

const ENROLLMENT_NIN_PATTERN = /^\d{11}$/;

export function isEnrollmentNin(value: string): boolean {
  return ENROLLMENT_NIN_PATTERN.test(value);
}

export function assertEnrollmentNin(
  nin: string | null | undefined,
): void {
  if (nin == null || nin === '') {
    return;
  }
  if (!isEnrollmentNin(nin)) {
    throw new Error(
      `NIN must contain exactly ${ENROLLMENT_NIN_DIGIT_COUNT} digits`,
    );
  }
}
