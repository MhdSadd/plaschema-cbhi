import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useMemo, useState } from 'react'
import { type FieldErrors, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { getApiErrorMessage } from '@/api'
import { SearchableFilterSelect } from '@/components/admin/searchable-filter-select'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PLATEAU_LGAS } from '@/lib/geography'
import { useWardOptions } from '@/features/wards/hooks'
import type { WardListItem } from '@/features/wards/types'

import { useCreateHealthFacility } from '../hooks'
import type { HealthFacilityLevel, HealthFacilityStatus } from '../types'

interface CreateFacilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CreateFacilityFormValues {
  name: string
  wardId: string
  type: string
  level: HealthFacilityLevel
  status: HealthFacilityStatus
}

const schema = z.object({
  name: z.string().trim().min(2, 'Facility name must be at least 2 characters.').max(160, 'Facility name must be 160 characters or fewer.'),
  wardId: z.string().min(1, 'Select a ward.'),
  type: z.string().trim().min(1, 'Enter a facility type.').max(120, 'Facility type must be 120 characters or fewer.'),
  level: z.enum(['primary', 'secondary', 'tertiary']),
  status: z.enum(['active', 'inactive']),
})

export function CreateFacilityDialog({ open, onOpenChange }: CreateFacilityDialogProps) {
  const [wardSearch, setWardSearch] = useState('')
  const [lga, setLga] = useState('')
  const [selectedWard, setSelectedWard] = useState<WardListItem | null>(null)
  const wardsQuery = useWardOptions(wardSearch.trim(), lga || undefined, Boolean(lga))
  const mutation = useCreateHealthFacility()
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateFacilityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      wardId: '',
      type: 'Primary Health Care',
      level: 'primary',
      status: 'active',
    },
  })

  const selectedWardId = useWatch({ control, name: 'wardId' })
  const wards = useMemo(() => {
    const byId = new Map<string, WardListItem>()
    if (selectedWard) byId.set(selectedWard.id, selectedWard)
    for (const ward of wardsQuery.data?.pages.flatMap((page) => page.items) ?? []) {
      byId.set(ward.id, ward)
    }
    return [...byId.values()]
  }, [selectedWard, wardsQuery.data])

  const activeWard = wards.find((ward) => ward.id === selectedWardId) ?? selectedWard

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    if (!nextOpen) {
      reset()
      setWardSearch('')
      setLga('')
      setSelectedWard(null)
      mutation.reset()
    }
    onOpenChange(nextOpen)
  }

  function changeLga(nextLga: string) {
    mutation.reset()
    setLga(nextLga)
    if (selectedWard && nextLga && selectedWard.lga !== nextLga) {
      setSelectedWard(null)
      setValue('wardId', '', { shouldValidate: true })
    }
  }

  function selectWard(option: { id: string; label: string; description?: string } | null) {
    mutation.reset()
    if (!option) {
      setSelectedWard(null)
      setValue('wardId', '', { shouldValidate: true })
      return
    }
    const ward = wards.find((item) => item.id === option.id) ?? null
    setSelectedWard(ward)
    if (ward) setLga(ward.lga)
    setValue('wardId', option.id, { shouldValidate: true })
  }

  function submit(values: CreateFacilityFormValues) {
    mutation.mutate(
      {
        name: values.name,
        wardId: values.wardId,
        type: values.type,
        level: values.level,
        status: values.status,
      },
      {
        onSuccess: () => {
          reset()
          setWardSearch('')
          setLga('')
          setSelectedWard(null)
          onOpenChange(false)
        },
      },
    )
  }

  function invalid(formErrors: FieldErrors<CreateFacilityFormValues>) {
    toast.error(
      formErrors.name?.message
        ?? formErrors.wardId?.message
        ?? formErrors.type?.message
        ?? 'Check the facility details and try again.',
    )
  }

  const wardSelectValue = activeWard
    ? { id: activeWard.id, label: activeWard.name, description: activeWard.lga }
    : null

  const wardOptions = lga
    ? wards.filter((ward) => ward.lga === lga)
    : wards

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card shadow-2xl outline-none" onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()} onInteractOutside={(event) => mutation.isPending && event.preventDefault()}>
          <div className="flex items-start justify-between border-b border-border px-6 py-5">
            <div><Dialog.Title className="text-lg font-semibold">Add Facility</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Add a health facility to a registered ward.</Dialog.Description></div>
            <Button aria-label="Close add facility dialog" disabled={mutation.isPending} onClick={() => changeOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button>
          </div>
          <form onSubmit={handleSubmit(submit, invalid)}>
            <div className="flex flex-col gap-4 px-6 py-5">
              {mutation.isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{getApiErrorMessage(mutation.error, 'Unable to create the facility.')}</div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <label className="text-sm font-semibold" htmlFor="facility-name">Facility Name</label>
                  <Input {...register('name', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.name)} autoFocus id="facility-name" placeholder="e.g. Tudun Wada PHC" />
                  {errors.name?.message && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="min-w-0">
                  <SearchableFilterSelect
                    allLabel="Select a ward"
                    emptyText={lga ? `No wards found in ${lga}.` : 'No wards found.'}
                    hasMore={Boolean(wardsQuery.hasNextPage)}
                    label="Ward"
                    labelClassName="text-sm font-semibold text-foreground"
                    loading={wardsQuery.isFetching && !wardsQuery.isFetchingNextPage}
                    loadingMore={wardsQuery.isFetchingNextPage}
                    onLoadMore={() => void wardsQuery.fetchNextPage()}
                    onSearchChange={setWardSearch}
                    onSelect={selectWard}
                    options={wardOptions.map((ward) => ({ id: ward.id, label: ward.name, description: ward.lga }))}
                    search={wardSearch}
                    searchPlaceholder="Search wards…"
                    triggerAriaLabel="Select ward for new facility"
                    value={wardSelectValue}
                  />
                  {errors.wardId?.message && <p className="mt-1.5 text-xs text-destructive">{errors.wardId.message}</p>}
                  {wardsQuery.isError && (
                    <p className="mt-1.5 text-sm text-destructive" role="alert">
                      Unable to load wards.{' '}
                      <button className="underline" onClick={() => void wardsQuery.refetch()} type="button">Retry</button>
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold" htmlFor="facility-state">State</label><Input id="facility-state" readOnly value="Plateau" /></div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold" htmlFor="facility-lga">LGA</label>
                  <select
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    id="facility-lga"
                    onChange={(event) => changeLga(event.target.value)}
                    value={lga}
                  >
                    <option value="">All LGAs</option>
                    {PLATEAU_LGAS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold" htmlFor="facility-type">Facility Type</label><Input {...register('type', { onChange: () => mutation.reset() })} aria-invalid={Boolean(errors.type)} id="facility-type" />{errors.type?.message && <p className="text-xs text-destructive">{errors.type.message}</p>}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold" htmlFor="facility-level">Level</label><select {...register('level')} className="h-9 rounded-lg border border-input bg-background px-3 text-sm" id="facility-level"><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="tertiary">Tertiary</option></select></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-semibold" htmlFor="facility-status">Status</label><select {...register('status')} className="h-9 rounded-lg border border-input bg-background px-3 text-sm" id="facility-status"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6"><Button className={`${btnSecondary} flex-1`} disabled={mutation.isPending} onClick={() => changeOpen(false)} type="button" variant="outline">Cancel</Button><Button className={`${btnPrimary} flex-1`} disabled={mutation.isPending || wardsQuery.isError} type="submit">{mutation.isPending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Creating…</> : 'Add Facility'}</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
