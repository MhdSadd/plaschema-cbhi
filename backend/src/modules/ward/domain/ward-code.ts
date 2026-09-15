/** First three alphabetic characters, uppercased (e.g. "Jos South" → "JOS"). */
export function extractWardCodePrefix(value: string): string {
  return value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
}

/** LGA segment from an existing ward code (first three letters, e.g. "JOS-VOM" → "JOS"). */
export function extractLgaPrefixFromWardCode(code: string): string {
  return extractWardCodePrefix(code);
}

export function normalizeWardCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

/** `<LGA_3>-<NAME_3>` from normalized place names. */
export function deriveWardCodeBase(lga: string, name: string): string {
  const lgaPrefix = extractWardCodePrefix(lga);
  return deriveWardCodeBaseFromLgaPrefix(lgaPrefix, name);
}

/** `<LGA_3>-<NAME_3>` when the LGA prefix is already known (e.g. from an existing ward). */
export function deriveWardCodeBaseFromLgaPrefix(
  lgaPrefix: string,
  name: string,
): string {
  const namePrefix = extractWardCodePrefix(name);

  if (!lgaPrefix || !namePrefix) {
    throw new Error('Ward LGA and name must each contain at least one letter');
  }

  return `${lgaPrefix}-${namePrefix}`;
}

/** Pick a unique code from `base`, then `base-2`, `base-3`, … against `taken`. */
export function allocateUniqueWardCode(
  base: string,
  taken: ReadonlySet<string>,
): string {
  const normalizedTaken = new Set(
    [...taken].map((code) => code.toLowerCase()),
  );

  if (!normalizedTaken.has(base.toLowerCase())) {
    return base;
  }

  for (let suffix = 2; ; suffix++) {
    const candidate = `${base}-${suffix}`;
    if (!normalizedTaken.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
}

export async function resolveUniqueWardCodeFromBase(
  base: string,
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let suffix = 0; ; suffix++) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }
}

export async function resolveUniqueWardCode(
  lga: string,
  name: string,
  isTaken: (code: string) => Promise<boolean>,
  options?: { lgaPrefix?: string },
): Promise<string> {
  const base = options?.lgaPrefix
    ? deriveWardCodeBaseFromLgaPrefix(options.lgaPrefix, name)
    : deriveWardCodeBase(lga, name);

  return resolveUniqueWardCodeFromBase(base, isTaken);
}
