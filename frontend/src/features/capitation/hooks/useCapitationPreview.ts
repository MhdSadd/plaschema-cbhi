import { useQuery } from '@tanstack/react-query'

import { fetchCapitationPreview } from '../services'
import type { CapitationTier } from '../types'
import { capitationKeys } from './capitation.keys'

export function useCapitationPreview(
  month: number,
  year: number,
  tiers: CapitationTier[],
  enabled: boolean,
) {
  return useQuery({
    queryKey: capitationKeys.preview(month, year, tiers),
    queryFn: () => fetchCapitationPreview(month, year, tiers),
    enabled,
    staleTime: 30_000,
  })
}
