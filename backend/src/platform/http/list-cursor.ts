export function encodeJsonCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeJsonCursor<T extends Record<string, unknown>>(
  cursor: string,
): T | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as T;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export type CreatedAtDescCursor = {
  createdAt: string;
  id: string;
};

export function encodeCreatedAtDescCursor(input: {
  createdAt: Date;
  id: string;
}): string {
  return encodeJsonCursor({
    ca: input.createdAt.toISOString(),
    id: input.id,
  });
}

export function decodeCreatedAtDescCursor(
  cursor: string,
): CreatedAtDescCursor | null {
  const parsed = decodeJsonCursor<{ ca?: string; id?: string }>(cursor);
  if (typeof parsed?.ca !== 'string' || typeof parsed.id !== 'string') {
    return null;
  }
  const createdAt = new Date(parsed.ca);
  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }
  return { createdAt: parsed.ca, id: parsed.id };
}

export function createdAtDescCursorWhere(
  cursor: CreatedAtDescCursor,
): Record<string, unknown> {
  const createdAt = new Date(cursor.createdAt);
  return {
    OR: [
      { createdAt: { lt: createdAt } },
      {
        AND: [{ createdAt }, { id: { lt: cursor.id } }],
      },
    ],
  };
}

export type LgaNameAscCursor = {
  lga: string;
  name: string;
  id: string;
};

export function encodeLgaNameAscCursor(input: LgaNameAscCursor): string {
  return encodeJsonCursor(input);
}

export function decodeLgaNameAscCursor(cursor: string): LgaNameAscCursor | null {
  const parsed = decodeJsonCursor<Partial<LgaNameAscCursor>>(cursor);
  if (
    typeof parsed?.lga !== 'string' ||
    typeof parsed?.name !== 'string' ||
    typeof parsed?.id !== 'string'
  ) {
    return null;
  }
  return { lga: parsed.lga, name: parsed.name, id: parsed.id };
}

export function lgaNameAscCursorWhere(
  cursor: LgaNameAscCursor,
): Record<string, unknown> {
  return {
    OR: [
      { lga: { gt: cursor.lga, mode: 'insensitive' as const } },
      {
        AND: [
          { lga: { equals: cursor.lga, mode: 'insensitive' as const } },
          { name: { gt: cursor.name, mode: 'insensitive' as const } },
        ],
      },
      {
        AND: [
          { lga: { equals: cursor.lga, mode: 'insensitive' as const } },
          { name: { equals: cursor.name, mode: 'insensitive' as const } },
          { id: { gt: cursor.id } },
        ],
      },
    ],
  };
}

/** Keyset filter for lists ordered by related ward LGA, then facility name. */
export function healthFacilityLgaNameAscCursorWhere(
  cursor: LgaNameAscCursor,
): Record<string, unknown> {
  const lgaEquals = {
    equals: cursor.lga,
    mode: 'insensitive' as const,
  };
  return {
    OR: [
      { ward: { lga: { gt: cursor.lga, mode: 'insensitive' as const } } },
      {
        AND: [
          { ward: { lga: lgaEquals } },
          { name: { gt: cursor.name, mode: 'insensitive' as const } },
        ],
      },
      {
        AND: [
          { ward: { lga: lgaEquals } },
          { name: { equals: cursor.name, mode: 'insensitive' as const } },
          { id: { gt: cursor.id } },
        ],
      },
    ],
  };
}
