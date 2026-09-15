import type { CapitationListParams, CapitationTier } from '../types'

export const capitationKeys = {
  all: ['capitations'] as const,
  lists: () => [...capitationKeys.all, 'list'] as const,
  list: (params: CapitationListParams) =>
    [...capitationKeys.lists(), params] as const,
  previews: () => [...capitationKeys.all, 'preview'] as const,
  preview: (month: number, year: number, tiers: CapitationTier[]) =>
    [...capitationKeys.previews(), { month, year, tiers }] as const,
}
