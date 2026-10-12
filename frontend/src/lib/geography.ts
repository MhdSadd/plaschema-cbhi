export const PLATEAU_LGAS = ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', "Qua'an Pan", 'Riyom', 'Shendam', 'Wase'] as const

const DASH_LIKE = /[-–—_]/g

/** Normalize LGA labels for comparison (case, whitespace, dashes, apostrophe variants). */
export function normalizeLgaLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019\u201B\u0060]/g, "'")
    .replace(DASH_LIKE, ' ')
    .replace(/\s+/g, ' ')
}

export function lgaLabelsMatch(a: string, b: string): boolean {
  return normalizeLgaLabel(a) === normalizeLgaLabel(b)
}
