import { describe, expect, it } from 'vitest'

import type { AuthUserApi } from '../types'
import { FieldWorkerAccessError, getTokenExpiresAt, mapFieldWorkerUser, resolveAccessTokenExpiry } from './session'

function tokenWithExpiry(exp: number) {
  const payload = btoa(JSON.stringify({ exp })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `header.${payload}.signature`
}

const baseUser: AuthUserApi = {
  id: '01900000-0000-7000-8000-000000000001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'field_worker',
  status: 'active',
  assignedWards: [],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
}

describe('auth session utilities', () => {
  it('reads the JWT expiry timestamp', () => {
    expect(getTokenExpiresAt(tokenWithExpiry(2_000_000_000))).toBe(2_000_000_000_000)
  })

  it('rejects an administrator account', () => {
    expect(() => mapFieldWorkerUser({ ...baseUser, role: 'admin' })).toThrow(FieldWorkerAccessError)
  })

  it('normalizes optional profile fields', () => {
    expect(mapFieldWorkerUser(baseUser)).toMatchObject({
      phone: null,
      lastSyncedAt: null,
      isPasswordChangeRequired: false,
    })
  })

  it('preserves isPasswordChangeRequired from the login payload', () => {
    expect(mapFieldWorkerUser({ ...baseUser, isPasswordChangeRequired: true }).isPasswordChangeRequired).toBe(true)
  })

  it('does not treat a missing status field as inactive', () => {
    const { status: _status, ...withoutStatus } = baseUser
    expect(mapFieldWorkerUser(withoutStatus as AuthUserApi).status).toBe('active')
  })

  it('defaults missing assigned wards to an empty list', () => {
    const { assignedWards: _assignedWards, ...withoutWards } = baseUser
    expect(mapFieldWorkerUser(withoutWards as AuthUserApi).assignedWards).toEqual([])
  })

  it('falls back to login expiresIn when the JWT has no exp claim', () => {
    const payload = btoa(JSON.stringify({ sub: 'user' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const token = `header.${payload}.signature`
    const now = 1_700_000_000_000
    expect(resolveAccessTokenExpiry(token, '30d', now)).toBe(now + 30 * 86_400_000)
  })
})
