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

function matchKnownCategory(category: string): BeneficiaryCategory | null {
  for (const item of BENEFICIARY_CATEGORIES) {
    if (item === category) {
      return item;
    }
  }
  const lowered = category.toLowerCase();
  for (const item of BENEFICIARY_CATEGORIES) {
    if (item.toLowerCase() === lowered) {
      return item;
    }
  }
  return null;
}

export function normalizeBeneficiaryCategory(category: string): string {
  const trimmed = category.trim();
  if (!trimmed) {
    return trimmed;
  }
  const known = matchKnownCategory(trimmed);
  if (known) {
    return known;
  }
  const alias = LEGACY_BENEFICIARY_CATEGORY_ALIASES[trimmed];
  if (alias) {
    return alias;
  }
  const aliasInsensitive = Object.entries(
    LEGACY_BENEFICIARY_CATEGORY_ALIASES,
  ).find(([key]) => key.toLowerCase() === trimmed.toLowerCase())?.[1];
  return aliasInsensitive ?? trimmed;
}

export function isKnownBeneficiaryCategory(
  category: string,
): category is BeneficiaryCategory {
  return (BENEFICIARY_CATEGORIES as readonly string[]).includes(category);
}
