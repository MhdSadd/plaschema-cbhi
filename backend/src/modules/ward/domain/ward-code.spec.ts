import {
  allocateUniqueWardCode,
  deriveWardCodeBase,
  deriveWardCodeBaseFromLgaPrefix,
  extractLgaPrefixFromWardCode,
  extractWardCodePrefix,
  normalizeWardCode,
} from './ward-code';

describe('ward code derivation', () => {
  it('extracts three-letter uppercase prefixes from place names', () => {
    expect(extractWardCodePrefix('Jos South')).toBe('JOS');
    expect(extractWardCodePrefix('  vom central ')).toBe('VOM');
    expect(extractWardCodePrefix('Barkin-Ladi')).toBe('BAR');
  });

  it('derives `<LGA_3>-<NAME_3>` codes', () => {
    expect(deriveWardCodeBase('Jos South', 'Vom Central')).toBe('JOS-VOM');
    expect(deriveWardCodeBase('Barkin Ladi', 'Gashish')).toBe('BAR-GAS');
  });

  it('derives codes from a known LGA prefix', () => {
    expect(deriveWardCodeBaseFromLgaPrefix('JOS', 'Vom Central')).toBe('JOS-VOM');
  });

  it('extracts the LGA prefix from an existing ward code', () => {
    expect(extractLgaPrefixFromWardCode('JOS-VOM')).toBe('JOS');
    expect(extractLgaPrefixFromWardCode('JOS-VOM-2')).toBe('JOS');
  });

  it('normalizes uploaded ward codes', () => {
    expect(normalizeWardCode(' jos-vom ')).toBe('JOS-VOM');
  });

  it('allocates numeric suffixes when the base code is taken', () => {
    const taken = new Set(['JOS-VOM']);

    expect(allocateUniqueWardCode('JOS-VOM', taken)).toBe('JOS-VOM-2');
    expect(
      allocateUniqueWardCode('JOS-VOM', new Set(['JOS-VOM', 'JOS-VOM-2'])),
    ).toBe('JOS-VOM-3');
  });
});
