import type { WardListParams } from '../types'

export const wardKeys = {
  all: ['wards'] as const,
  lists: () => [...wardKeys.all, 'list'] as const,
  list: (params: WardListParams) => [...wardKeys.lists(), params] as const,
  options: (search: string, lga?: string) =>
    [...wardKeys.all, 'options', { search, lga: lga ?? '' }] as const,
  details: () => [...wardKeys.all, 'detail'] as const,
  detail: (id: string) => [...wardKeys.details(), id] as const,
}
