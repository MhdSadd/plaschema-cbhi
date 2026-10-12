const DASH_LIKE = /[-–—_]/g

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
