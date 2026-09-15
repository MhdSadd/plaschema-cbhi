import type { CapitationTier } from '../types'

export const DEFAULT_CAPITATION_TIERS: CapitationTier[] = [
  { minEnrollees: 1, maxEnrollees: 4999, amount: 650_000 },
  { minEnrollees: 5000, maxEnrollees: 10_000, amount: 830_000 },
  { minEnrollees: 10_001, maxEnrollees: null, amount: 1_000_000 },
]

export function formatTierLabel(tier: CapitationTier): string {
  const min = tier.minEnrollees.toLocaleString('en-NG')
  if (tier.maxEnrollees === null) {
    return `${min}+`
  }
  return `${min} – ${tier.maxEnrollees.toLocaleString('en-NG')}`
}

export function cloneDefaultTiers(): CapitationTier[] {
  return DEFAULT_CAPITATION_TIERS.map((tier) => ({ ...tier }))
}

export type CapitationTierFormRow = {
  minEnrollees: string
  maxEnrollees: string
  amount: string
}

export function tiersToFormRows(tiers: CapitationTier[]): CapitationTierFormRow[] {
  return tiers.map((tier) => ({
    minEnrollees: String(tier.minEnrollees),
    maxEnrollees: tier.maxEnrollees === null ? '' : String(tier.maxEnrollees),
    amount: String(tier.amount),
  }))
}

export function formRowsToTiers(rows: CapitationTierFormRow[]): CapitationTier[] {
  return rows.map((row) => ({
    minEnrollees: Number(row.minEnrollees),
    maxEnrollees: row.maxEnrollees.trim() === '' ? null : Number(row.maxEnrollees),
    amount: Number(row.amount),
  }))
}

export function validateCapitationTiers(rows: CapitationTierFormRow[]): string | null {
  if (rows.length === 0) {
    return 'Add at least one capitation band.'
  }

  const parsed: CapitationTier[] = []

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const min = Number(row.minEnrollees)
    const max = row.maxEnrollees.trim() === '' ? null : Number(row.maxEnrollees)
    const amount = Number(row.amount)
    const isLast = index === rows.length - 1

    if (!Number.isInteger(min) || min < 1) {
      return `Band ${index + 1}: min enrollees must be an integer of at least 1.`
    }

    if (!Number.isInteger(amount) || amount < 1) {
      return `Band ${index + 1}: monthly amount must be a positive integer.`
    }

    if (max !== null) {
      if (!Number.isInteger(max) || max < min) {
        return `Band ${index + 1}: max enrollees must be an integer greater than or equal to min.`
      }
    }

    if (!isLast && max === null) {
      return 'Only the last band may have no maximum enrollees.'
    }

    if (isLast && max !== null) {
      return 'The last band must have no maximum enrollees.'
    }

    parsed.push({ minEnrollees: min, maxEnrollees: max, amount })
  }

  const sorted = [...parsed].sort((a, b) => a.minEnrollees - b.minEnrollees)

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]
    const current = sorted[index]
    if (previous.maxEnrollees === null) {
      return 'Capitation bands must not overlap.'
    }
    if (current.minEnrollees !== previous.maxEnrollees + 1) {
      return 'Capitation bands must be contiguous without gaps or overlaps.'
    }
  }

  return null
}

export function formatRecordBand(record: {
  tierLabel: string | null
  rate: number | null
}): string {
  if (record.tierLabel) {
    return record.tierLabel
  }
  if (record.rate !== null) {
    return `Legacy rate (${record.rate.toLocaleString('en-NG')}/enrollee)`
  }
  return '—'
}
