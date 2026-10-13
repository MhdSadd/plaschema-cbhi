import type { Prisma } from '../generated/prisma/client';

const DASH_LIKE = /[-–—_]/g;
const CURLY_APOSTROPHE = /[\u2018\u2019\u201B`]/g;

/** Canonical key for comparing LGA strings from UI, CSV, and DB. */
export function normalizeLgaLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(CURLY_APOSTROPHE, "'")
    .replace(DASH_LIKE, ' ')
    .replace(/\s+/g, ' ');
}

/** Lowercase canonical form stored on ward, facility, and enrollment LGA fields. */
export function normalizeLgaForStorage(value: string): string {
  return normalizeLgaLabel(value);
}

export function lgaLabelsMatch(a: string, b: string): boolean {
  return normalizeLgaLabel(a) === normalizeLgaLabel(b);
}

/** Values to try with case-insensitive `equals` (hyphen vs space, apostrophe variants). */
export function expandLgaFilterVariants(lga: string): string[] {
  const trimmed = lga.trim();
  if (!trimmed) {
    return [];
  }

  const apostropheAscii = trimmed.replace(CURLY_APOSTROPHE, "'");
  const spaced = apostropheAscii.replace(DASH_LIKE, ' ').replace(/\s+/g, ' ').trim();
  const hyphenated = spaced.replace(/ /g, '-');

  return [...new Set([trimmed, apostropheAscii, spaced, hyphenated])].filter(Boolean);
}

export function wardLgaFilterWhere(lga: string): Prisma.WardWhereInput {
  const variants = expandLgaFilterVariants(lga);
  if (variants.length <= 1) {
    return {
      lga: { equals: variants[0] ?? lga.trim(), mode: 'insensitive' },
    };
  }

  return {
    OR: variants.map((value) => ({
      lga: { equals: value, mode: 'insensitive' as const },
    })),
  };
}
