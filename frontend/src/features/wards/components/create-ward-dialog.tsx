import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { type FieldErrors, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PLATEAU_LGAS } from '@/lib/geography'

import { useCreateWard } from '../hooks/useWardMutations'
import type { WardStatus } from '../types'

interface CreateWardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (wardName: string) => void
}

interface CreateWardFormValues {
  name: string
  lga: (typeof PLATEAU_LGAS)[number]
  status: WardStatus
}

const plateauLgaEnum = PLATEAU_LGAS as unknown as [string, ...string[]]

const createWardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Ward name must be at least 2 characters.')
    .max(120, 'Ward name must be 120 characters or fewer.'),
  lga: z.enum(plateauLgaEnum, { message: 'Select an LGA.' }),
  status: z.enum(['active', 'inactive']),
})

export function CreateWardDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateWardDialogProps) {
  const createMutation = useCreateWard()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWardFormValues>({
    resolver: zodResolver(createWardSchema),
    defaultValues: { name: '', lga: '' as CreateWardFormValues['lga'], status: 'active' },
  })

  function handleDialogChange(nextOpen: boolean) {
    if (!nextOpen && createMutation.isPending) return

    if (!nextOpen) {
      reset()
      createMutation.reset()
    }
    onOpenChange(nextOpen)
  }

  function handleCreate(values: CreateWardFormValues) {
    createMutation.mutate(values, {
      onSuccess: (ward) => {
        reset()
        createMutation.reset()
        onCreated(ward.name)
        onOpenChange(false)
      },
    })
  }

  function handleInvalid(formErrors: FieldErrors<CreateWardFormValues>) {
    const message =
      formErrors.name?.message ??
      formErrors.lga?.message ??
      formErrors.status?.message ??
      'Check the ward details and try again.'
    toast.error(message)
  }

  const requestError = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Unable to create the ward.')
    : null

  return (
    <Dialog.Root onOpenChange={handleDialogChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card shadow-2xl outline-none"
          onEscapeKeyDown={(event) => {
            if (createMutation.isPending) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (createMutation.isPending) event.preventDefault()
          }}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Add Ward
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Create a ward in Plateau State.
            </Dialog.Description>
            <Button
              aria-label="Close add ward dialog"
              disabled={createMutation.isPending}
              onClick={() => handleDialogChange(false)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(handleCreate, handleInvalid)}>
            <div className="flex flex-col gap-4 px-6 py-5">
              {requestError && (
                <div
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {requestError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-semibold text-foreground"
                  htmlFor="ward-name"
                >
                  Ward Name <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register('name', {
                    onChange: () => createMutation.reset(),
                  })}
                  aria-describedby={errors.name ? 'ward-name-error' : undefined}
                  aria-invalid={Boolean(errors.name)}
                  autoFocus
                  className="h-auto rounded-lg px-3 py-2.5"
                  id="ward-name"
                  placeholder="e.g. Vom Central"
                />
                {errors.name?.message && (
                  <p className="text-xs text-destructive" id="ward-name-error">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-semibold text-foreground"
                  htmlFor="ward-state"
                >
                  State
                </label>
                <Input
                  className="h-auto rounded-lg bg-muted/50 px-3 py-2.5"
                  id="ward-state"
                  readOnly
                  value="Plateau"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-semibold text-foreground"
                  htmlFor="ward-lga"
                >
                  LGA <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('lga', {
                    onChange: () => createMutation.reset(),
                  })}
                  aria-describedby={errors.lga ? 'ward-lga-error' : undefined}
                  aria-invalid={Boolean(errors.lga)}
                  className="h-auto rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="ward-lga"
                >
                  <option disabled value="">
                    Select an LGA
                  </option>
                  {PLATEAU_LGAS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {errors.lga?.message && (
                  <p className="text-xs text-destructive" id="ward-lga-error">
                    {errors.lga.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-semibold text-foreground"
                  htmlFor="ward-status"
                >
                  Status
                </label>
                <select
                  {...register('status', {
                    onChange: () => createMutation.reset(),
                  })}
                  className="h-auto rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  id="ward-status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 px-6 pb-6">
              <Button
                className={`${btnSecondary} flex-1 justify-center`}
                disabled={createMutation.isPending}
                onClick={() => handleDialogChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className={`${btnPrimary} flex-1 justify-center`}
                disabled={createMutation.isPending}
                type="submit"
              >
                {createMutation.isPending ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  'Create Ward'
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
