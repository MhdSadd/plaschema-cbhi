import { isEnrollmentNin } from './enrollment-nin';

describe('isEnrollmentNin', () => {
  it('accepts exactly 11 digits', () => {
    expect(isEnrollmentNin('12345678901')).toBe(true);
  });

  it('rejects shorter or longer values', () => {
    expect(isEnrollmentNin('1234567890')).toBe(false);
    expect(isEnrollmentNin('123456789012')).toBe(false);
    expect(isEnrollmentNin('')).toBe(false);
  });
});
