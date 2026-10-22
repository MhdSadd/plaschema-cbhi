import type { AuthUserApi, FieldWorkerUser } from '../types'

export class FieldWorkerAccessError extends Error {
  constructor(message = 'An enrollment officer account is required to use this app.') {
    super(message)
    this.name = 'FieldWorkerAccessError'
  }
}

export function mapFieldWorkerUser(user: AuthUserApi): FieldWorkerUser {
  if (user.role !== 'field_worker') throw new FieldWorkerAccessError()
  if (user.status === 'inactive') {
    throw new FieldWorkerAccessError('This enrollment officer account is inactive. Contact an administrator.')
  }
  return {
    ...user,
    role: 'field_worker',
    status: 'active',
    assignedWards: Array.isArray(user.assignedWards) ? user.assignedWards : [],
    phone: user.phone ?? null,
    lastSyncedAt: user.lastSyncedAt ?? null,
    isPasswordChangeRequired: user.isPasswordChangeRequired ?? false,
  }
}

const EXPIRES_IN_PATTERN = /^(\d+(?:\.\d+)?)(s|m|h|d)$/

function readJwtExpSeconds(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - normalized.length % 4) % 4)
    const payload = JSON.parse(atob(normalized + padding)) as { exp?: unknown }
    if (typeof payload.exp === 'number' && Number.isFinite(payload.exp)) return payload.exp
    if (typeof payload.exp === 'string' && payload.exp.trim()) {
      const parsed = Number(payload.exp)
      return Number.isFinite(parsed) ? parsed : null
    }
    return null
  } catch {
    return null
  }
}

export function getTokenExpiresAt(token: string): number | null {
  const expSeconds = readJwtExpSeconds(token)
  return expSeconds === null ? null : expSeconds * 1000
}

/** Prefer JWT `exp`; fall back to login `expiresIn` (e.g. `30d`, `8h`) when the payload is missing or unparsable. */
export function resolveAccessTokenExpiry(
  accessToken: string,
  expiresIn?: string | number | null,
  now = Date.now(),
): number | null {
  const jwtExpiresAt = getTokenExpiresAt(accessToken)
  if (jwtExpiresAt !== null && jwtExpiresAt > now) return jwtExpiresAt

  if (typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0) {
    return now + expiresIn * 1000
  }

  if (typeof expiresIn === 'string') {
    const match = expiresIn.trim().match(EXPIRES_IN_PATTERN)
    if (match) {
      const amount = Number(match[1])
      const unit = match[2]
      const unitMs = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as 's' | 'm' | 'h' | 'd']
      if (Number.isFinite(amount) && amount > 0) return now + amount * unitMs
    }
  }

  return jwtExpiresAt
}

export function isFieldWorkerUser(value: unknown): value is FieldWorkerUser {
  if (typeof value !== 'object' || value === null) return false
  const user = value as Partial<FieldWorkerUser>
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    user.role === 'field_worker' &&
    user.status === 'active' &&
    Array.isArray(user.assignedWards) &&
    (user.isPasswordChangeRequired === undefined || typeof user.isPasswordChangeRequired === 'boolean')
  )
}

export function normalizeFieldWorkerUser(user: FieldWorkerUser): FieldWorkerUser {
  return {
    ...user,
    assignedWards: Array.isArray(user.assignedWards) ? user.assignedWards : [],
    isPasswordChangeRequired: user.isPasswordChangeRequired ?? false,
  }
}
