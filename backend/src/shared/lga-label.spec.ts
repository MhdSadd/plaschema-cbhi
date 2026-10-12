import {
  expandLgaFilterVariants,
  lgaLabelsMatch,
  normalizeLgaLabel,
} from './lga-label';

describe('lga-label', () => {
  it('treats hyphen and space forms as the same LGA', () => {
    expect(lgaLabelsMatch("Qua'an Pan", "Qua'An-Pan")).toBe(true);
    expect(lgaLabelsMatch("Qua'An Pan", "Qua'An-Pan")).toBe(true);
    expect(normalizeLgaLabel("Qua'An-Pan")).toBe("qua'an pan");
  });

  it('expands filter variants for hyphen and space spellings', () => {
    const variants = expandLgaFilterVariants("Qua'an Pan");
    expect(variants).toEqual(
      expect.arrayContaining(["Qua'an Pan", "Qua'an-Pan"]),
    );
  });
});
