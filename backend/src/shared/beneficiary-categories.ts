export const BENEFICIARY_CATEGORIES = [
  'Elderly 65 and above',
  'Indigent (very poor) / others',
  'IDP',
  'Orphan',
  'People Living with Disability',
  'Pregnant Woman',
  'Under 5 YEAR',
] as const;

export type BeneficiaryCategory = (typeof BENEFICIARY_CATEGORIES)[number];

export const LEGACY_BENEFICIARY_CATEGORY_ALIASES: Record<
  string,
  BeneficiaryCategory
> = {
  IDPs: 'IDP',
  'Internal displaced persons': 'IDP',
  'Elderly 65+': 'Elderly 65 and above',
  'Indigents / Very Poor / Others': 'Indigent (very poor) / others',
};

export function normalizeBeneficiaryCategory(category: string): string {
  const trimmed = category.trim();
  if ((BENEFICIARY_CATEGORIES as readonly string[]).includes(trimmed)) {
    return trimmed;
  }
  return LEGACY_BENEFICIARY_CATEGORY_ALIASES[trimmed] ?? trimmed;
}

export function isKnownBeneficiaryCategory(
  category: string,
): category is BeneficiaryCategory {
  return (BENEFICIARY_CATEGORIES as readonly string[]).includes(category);
}
