import type { CapitationTier } from '../types'
import { formatNaira, formatTierLabel } from '../utils'

interface CapitationBandsSummaryProps {
  tiers: CapitationTier[] | null | undefined
  compact?: boolean
}

export function CapitationBandsSummary({ tiers, compact = false }: CapitationBandsSummaryProps) {
  if (!tiers?.length) {
    return <span className="text-muted-foreground">—</span>
  }

  if (compact) {
    return (
      <ul className="space-y-1 text-sm">
        {tiers.map((tier) => (
          <li key={`${tier.minEnrollees}-${tier.maxEnrollees ?? 'open'}`}>
            <span className="font-medium">{formatTierLabel(tier)}</span>
            <span className="text-muted-foreground"> · {formatNaira(tier.amount)}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-2">
      {tiers.map((tier) => (
        <div
          className="flex items-center justify-between gap-3 text-sm"
          key={`${tier.minEnrollees}-${tier.maxEnrollees ?? 'open'}`}
        >
          <span className="text-muted-foreground">{formatTierLabel(tier)} enrollees</span>
          <span className="font-semibold">{formatNaira(tier.amount)}</span>
        </div>
      ))}
    </div>
  )
}
