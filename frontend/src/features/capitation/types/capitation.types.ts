import type { CursorPaginationMeta } from '@/api'

export interface CapitationTier {
  minEnrollees: number
  maxEnrollees: number | null
  amount: number
}

export interface CapitationRecord {
  id: string
  healthFacilityId: string
  facilityName: string
  lga: string
  month: number
  year: number
  period: string
  beneficiaryCount: number
  amount: number
  tierMin: number | null
  tierMax: number | null
  tierAmount: number | null
  tierLabel: string | null
  rate: number | null
}

export interface CapitationSummary {
  runId: string
  month: number
  year: number
  tiers: CapitationTier[] | null
  rate: number | null
  generatedAt: string
  totalFacilities: number
  totalBeneficiaries: number
  totalCapitation: number
}

export interface CapitationFilteredSummary {
  totalFacilities: number
  totalBeneficiaries: number
  totalCapitation: number
}

export interface CapitationListParams {
  month: number
  year: number
  cursor?: string
  limit: number
  lga?: string
  healthFacilityId?: string
  search?: string
}

export interface CapitationListResult {
  items: CapitationRecord[]
  meta: CursorPaginationMeta
  summary: CapitationSummary | null | undefined
  filteredSummary: CapitationFilteredSummary | null | undefined
}

export interface CapitationPreviewRecord {
  healthFacilityId: string
  facilityName: string
  lga: string
  beneficiaryCount: number
  amount: number
  tierMin: number | null
  tierMax: number | null
  tierAmount: number | null
  tierLabel: string | null
  rate: number | null
}

export interface CapitationPreview {
  month: number
  year: number
  tiers: CapitationTier[]
  totalFacilities: number
  totalBeneficiaries: number
  totalCapitation: number
  records: CapitationPreviewRecord[]
}

export interface GenerateCapitationPayload {
  month: number
  year: number
  tiers: CapitationTier[]
}

export interface GenerateCapitationResult extends CapitationSummary {
  recordCount: number
}

export interface CapitationPeriod {
  month: number
  year: number
}
