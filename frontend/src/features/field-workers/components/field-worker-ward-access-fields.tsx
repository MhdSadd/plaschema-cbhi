import { ChevronsUpDown, LoaderCircle, Search } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { PLATEAU_LGAS } from '@/lib/geography'
import type { WardListItem } from '@/features/wards/types'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { WardListResult } from '@/features/wards/types'

type WardOptionsInfiniteQuery = Pick<
  UseInfiniteQueryResult<InfiniteData<WardListResult, unknown>, Error>,
  | 'isPending'
  | 'isFetching'
  | 'isFetchingNextPage'
  | 'hasNextPage'
  | 'fetchNextPage'
  | 'isError'
  | 'refetch'
>

interface FieldWorkerWardAccessFieldsProps {
  lga: string
  onLgaChange: (lga: string) => void
  wardSearch: string
  onWardSearchChange: (value: string) => void
  selectedWardIds: string[]
  onToggleWard: (wardId: string, checked: boolean) => void
  wards: WardListItem[]
  wardsQuery: WardOptionsInfiniteQuery
  disabled?: boolean
  emptySelectionNote: string
}

export function FieldWorkerWardAccessFields({
  lga,
  onLgaChange,
  wardSearch,
  onWardSearchChange,
  selectedWardIds,
  onToggleWard,
  wards,
  wardsQuery,
  disabled = false,
  emptySelectionNote,
}: FieldWorkerWardAccessFieldsProps) {
  const [wardPickerOpen, setWardPickerOpen] = useState(false)

  const wardPickerLabel = selectedWardIds.length === 0
    ? 'Select wards'
    : `${selectedWardIds.length} ward${selectedWardIds.length === 1 ? '' : 's'} selected`

  function changeLga(nextLga: string) {
    onLgaChange(nextLga)
    setWardPickerOpen(false)
    onWardSearchChange('')
  }

  return (
    <fieldset className="space-y-3">
      <div>
        <legend className="text-sm font-semibold">
          Ward access <span className="font-normal text-muted-foreground">(optional)</span>
        </legend>
        <p className="mt-1 text-xs text-muted-foreground">
          Select one LGA, then choose wards in that LGA only. Changing LGA clears ward selections. {emptySelectionNote}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="field-worker-lga">
            LGA
          </label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
            id="field-worker-lga"
            onChange={(event) => changeLga(event.target.value)}
            value={lga}
          >
            <option value="">Select an LGA</option>
            {PLATEAU_LGAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <span className="mb-1.5 block text-sm font-semibold">Wards</span>
          <Popover.Root
            modal={false}
            onOpenChange={(nextOpen) => {
              if (lga && !disabled) setWardPickerOpen(nextOpen)
              if (!nextOpen) onWardSearchChange('')
            }}
            open={wardPickerOpen && Boolean(lga) && !disabled}
          >
            <Popover.Trigger asChild>
              <button
                aria-expanded={wardPickerOpen}
                aria-haspopup="listbox"
                aria-label="Select wards for enrollment officer access"
                className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!lga || disabled}
                type="button"
              >
                <span className={`truncate ${selectedWardIds.length === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {!lga ? 'Select an LGA first' : wardPickerLabel}
                </span>
                <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                className="z-[100] flex max-h-[min(320px,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] min-w-64 flex-col overflow-hidden rounded-xl border border-border bg-card p-2 shadow-xl"
                collisionPadding={16}
                sideOffset={5}
                onWheel={(event) => event.stopPropagation()}
              >
                <div className="relative shrink-0">
                  <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    aria-label="Search wards in selected LGA"
                    autoFocus
                    className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
                    onChange={(event) => onWardSearchChange(event.target.value)}
                    placeholder="Search wards…"
                    value={wardSearch}
                  />
                  {wardsQuery.isFetching && !wardsQuery.isFetchingNextPage && (
                    <LoaderCircle aria-label="Loading wards" className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <div
                  className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-lg border border-border"
                  role="listbox"
                  onWheel={(event) => event.stopPropagation()}
                >
                  {wardsQuery.isPending ? (
                    <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                      <LoaderCircle className="animate-spin" aria-hidden="true" /> Loading wards…
                    </div>
                  ) : wards.map((ward) => {
                    const selected = selectedWardIds.includes(ward.id)
                    const checkboxId = `field-worker-ward-${ward.id}`
                    return (
                      <label className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 hover:bg-muted/40" htmlFor={checkboxId} key={ward.id}>
                        <Checkbox checked={selected} id={checkboxId} onCheckedChange={(checked) => onToggleWard(ward.id, checked === true)} />
                        <span className="text-sm font-medium">{ward.name}</span>
                      </label>
                    )
                  })}
                  {!wardsQuery.isPending && wards.length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground">No wards found in {lga}.</p>
                  )}
                  {wardsQuery.hasNextPage && (
                    <button
                      className="w-full border-t border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                      disabled={wardsQuery.isFetchingNextPage}
                      onClick={() => void wardsQuery.fetchNextPage()}
                      type="button"
                    >
                      {wardsQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </div>
                {wardsQuery.isError && (
                  <p className="mt-2 shrink-0 text-sm text-destructive" role="alert">
                    Unable to load wards.{' '}
                    <button className="underline" onClick={() => void wardsQuery.refetch()} type="button">Retry</button>
                  </p>
                )}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>
    </fieldset>
  )
}
