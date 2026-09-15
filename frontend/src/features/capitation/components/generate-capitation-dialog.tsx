import { LoaderCircle, RefreshCw, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { type FormEvent, useMemo, useState } from 'react'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useCapitationPreview, useCapitations, useGenerateCapitation } from '../hooks'
import type { CapitationPeriod, CapitationTier, GenerateCapitationResult } from '../types'
import {
  CAPITATION_MONTHS,
  cloneDefaultTiers,
  currentLagosPeriod,
  formatLagosDate,
  formatNaira,
  formatRecordBand,
  formatTierLabel,
  formRowsToTiers,
  tiersToFormRows,
  validateCapitationTiers,
  type CapitationTierFormRow,
} from '../utils'
import { CapitationBandsSummary } from './capitation-bands-summary'
import { CapitationTierEditor } from './capitation-tier-editor'

type Stage = 'select' | 'preview' | 'confirm' | 'success'

interface GenerateCapitationDialogProps {
  onGenerated: (result: GenerateCapitationResult) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function GenerateCapitationDialog({
  onGenerated,
  onOpenChange,
  open,
}: GenerateCapitationDialogProps) {
  const currentPeriod = currentLagosPeriod()
  const { month, year } = currentPeriod
  const [tierRows, setTierRows] = useState<CapitationTierFormRow[]>(() =>
    tiersToFormRows(cloneDefaultTiers()),
  )
  const [previewPeriod, setPreviewPeriod] = useState<CapitationPeriod | null>(null)
  const [previewTiers, setPreviewTiers] = useState<CapitationTier[] | null>(null)
  const [stage, setStage] = useState<Stage>('select')

  const tierValidationError = useMemo(() => validateCapitationTiers(tierRows), [tierRows])
  const activePeriod = previewPeriod ?? { month, year }
  const activeTiers = previewTiers ?? formRowsToTiers(tierRows)
  const previewQuery = useCapitationPreview(
    activePeriod.month,
    activePeriod.year,
    activeTiers,
    previewPeriod !== null && previewTiers !== null,
  )
  const existingRunQuery = useCapitations(
    { ...activePeriod, limit: 1 },
    previewPeriod !== null,
  )
  const mutation = useGenerateCapitation()
  const preview = previewQuery.data
  const hasExistingRun = Boolean(
    existingRunQuery.data?.summary || existingRunQuery.data?.items.length,
  )

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    onOpenChange(nextOpen)
  }

  function loadPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (tierValidationError) return
    const tiers = formRowsToTiers(tierRows)
    setPreviewPeriod({ month, year })
    setPreviewTiers(tiers)
    setStage('preview')
  }

  function submitGeneration() {
    if (!previewPeriod || !previewTiers) return
    mutation.mutate(
      { ...previewPeriod, tiers: previewTiers },
      {
        onSuccess: (result) => {
          onGenerated(result)
          setStage('success')
        },
      },
    )
  }

  function closeAndReset() {
    if (mutation.isPending) return
    mutation.reset()
    setTierRows(tiersToFormRows(cloneDefaultTiers()))
    setPreviewPeriod(null)
    setPreviewTiers(null)
    setStage('select')
    onOpenChange(false)
  }

  return (
    <Dialog.Root onOpenChange={changeOpen} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none',
            stage === 'preview' || stage === 'success' ? 'max-w-6xl' : 'max-w-4xl',
          )}
          onEscapeKeyDown={(event) => mutation.isPending && event.preventDefault()}
          onInteractOutside={(event) => mutation.isPending && event.preventDefault()}
        >
          <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {stage === 'success' ? 'Capitation generated' : 'Generate capitation'}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {stage === 'select' &&
                  'Capitation is generated for the current month. Adjust the bands below before previewing.'}
                {stage === 'preview' &&
                  'Review the server calculation before generating the run.'}
                {stage === 'confirm' && 'Confirm this financial calculation.'}
                {stage === 'success' &&
                  'The newest run is now available on the capitation page.'}
              </Dialog.Description>
            </div>
            <Button
              aria-label="Close capitation dialog"
              disabled={mutation.isPending}
              onClick={closeAndReset}
              size="icon"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {stage === 'select' && (
              <form className="space-y-5" id="capitation-period-form" onSubmit={loadPreview}>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Period</p>
                  <p className="mt-1 text-sm font-semibold">
                    {CAPITATION_MONTHS[month - 1]} {year}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Capitation can only be generated for the current month.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Capitation bands</p>
                  <CapitationTierEditor
                    error={tierValidationError}
                    onChange={setTierRows}
                    rows={tierRows}
                  />
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Facilities with zero active enrollees receive N0. All other active
                  facilities receive the flat monthly amount for their enrollee band.
                </div>
              </form>
            )}

            {stage === 'preview' && (
              <div>
                {(previewQuery.isPending || existingRunQuery.isPending) && (
                  <div className="flex min-h-56 items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                    <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                    Calculating preview…
                  </div>
                )}
                {previewQuery.isError && (
                  <div
                    className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"
                    role="alert"
                  >
                    <p className="font-semibold">Unable to calculate this preview.</p>
                    <p className="text-sm text-muted-foreground">
                      {getApiErrorMessage(
                        previewQuery.error,
                        'Check your connection and try again.',
                      )}
                    </p>
                    <Button onClick={() => void previewQuery.refetch()} variant="outline">
                      <RefreshCw aria-hidden="true" /> Retry
                    </Button>
                  </div>
                )}
                {preview && !existingRunQuery.isPending && (
                  <div className="space-y-5">
                    {hasExistingRun && (
                      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                        <strong>A run already exists for this period.</strong> Generating again
                        creates a new run, and the newest run becomes the one displayed.
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        {[
                          ['Facilities', preview.totalFacilities.toLocaleString()],
                          ['Beneficiaries', preview.totalBeneficiaries.toLocaleString()],
                          ['Total capitation', formatNaira(preview.totalCapitation)],
                        ].map(([label, value]) => (
                          <div className="rounded-xl bg-muted p-5" key={label}>
                            <p className="text-xs font-medium text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl font-semibold">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl bg-muted p-5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Capitation bands
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {preview.tiers.map((tier) => (
                            <div
                              className="flex items-center justify-between gap-3 text-sm"
                              key={`${tier.minEnrollees}-${tier.maxEnrollees ?? 'open'}`}
                            >
                              <span className="text-muted-foreground">{formatTierLabel(tier)}</span>
                              <span className="font-semibold">{formatNaira(tier.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              {['Facility', 'LGA', 'Beneficiaries', 'Band', 'Amount'].map(
                                (heading) => (
                                  <th className={thCell} key={heading}>
                                    {heading}
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.records.slice(0, 5).map((record) => (
                              <tr key={record.healthFacilityId}>
                                <td className={`${tdCell} font-semibold`}>
                                  {record.facilityName}
                                </td>
                                <td className={`${tdCell} text-muted-foreground`}>{record.lga}</td>
                                <td className={tdCell}>
                                  {record.beneficiaryCount.toLocaleString()}
                                </td>
                                <td className={tdCell}>{formatRecordBand(record)}</td>
                                <td className={`${tdCell} font-semibold`}>
                                  {formatNaira(record.amount)}
                                </td>
                              </tr>
                            ))}
                            {preview.records.length === 0 && (
                              <tr>
                                <td
                                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                                  colSpan={5}
                                >
                                  No active facilities are available for this preview.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {preview.records.length > 5 && (
                        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                          Showing 5 of {preview.records.length.toLocaleString()} facilities in
                          this preview.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {stage === 'confirm' && preview && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
                  <p className="font-semibold">
                    {hasExistingRun ? 'Generate a newer run?' : 'Generate this capitation run?'}
                  </p>
                  <p className="mt-1 text-sm">
                    This will calculate {formatNaira(preview.totalCapitation)} for{' '}
                    {preview.totalBeneficiaries.toLocaleString()} beneficiaries across{' '}
                    {preview.totalFacilities.toLocaleString()} facilities for{' '}
                    {CAPITATION_MONTHS[preview.month - 1]} {preview.year}.
                  </p>
                </div>
                {mutation.isError && (
                  <p
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {getApiErrorMessage(mutation.error, 'Unable to generate capitation.')}
                  </p>
                )}
              </div>
            )}

            {stage === 'success' && mutation.data && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800">
                  ✓
                </div>
                <div>
                  <p className="text-lg font-semibold">Capitation generated successfully</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generated {formatLagosDate(mutation.data.generatedAt)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-left lg:grid-cols-3">
                  {[
                    ['Facilities', mutation.data.totalFacilities.toLocaleString()],
                    ['Beneficiaries', mutation.data.totalBeneficiaries.toLocaleString()],
                    ['Total capitation', formatNaira(mutation.data.totalCapitation)],
                  ].map(([label, value]) => (
                    <div className="rounded-xl bg-muted p-4" key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-muted p-4 text-left">
                  <p className="text-xs text-muted-foreground">Capitation bands</p>
                  <div className="mt-2">
                    <CapitationBandsSummary compact tiers={mutation.data.tiers} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-border px-6 py-4">
            {stage === 'select' && (
              <>
                <Button
                  className={btnSecondary}
                  onClick={closeAndReset}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className={btnPrimary}
                  disabled={Boolean(tierValidationError)}
                  form="capitation-period-form"
                  type="submit"
                >
                  Preview
                </Button>
              </>
            )}
            {stage === 'preview' && (
              <>
                <Button
                  className={btnSecondary}
                  onClick={() => {
                    setPreviewPeriod(null)
                    setPreviewTiers(null)
                    setStage('select')
                  }}
                  type="button"
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  className={btnPrimary}
                  disabled={!preview || previewQuery.isError || existingRunQuery.isPending}
                  onClick={() => setStage('confirm')}
                  type="button"
                >
                  {hasExistingRun ? 'Review regeneration' : 'Continue'}
                </Button>
              </>
            )}
            {stage === 'confirm' && (
              <>
                <Button
                  className={btnSecondary}
                  disabled={mutation.isPending}
                  onClick={() => {
                    mutation.reset()
                    setStage('preview')
                  }}
                  type="button"
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  className={btnPrimary}
                  disabled={mutation.isPending}
                  onClick={submitGeneration}
                  type="button"
                >
                  {mutation.isPending ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="animate-spin" /> Generating…
                    </>
                  ) : hasExistingRun ? (
                    'Regenerate capitation'
                  ) : (
                    'Generate capitation'
                  )}
                </Button>
              </>
            )}
            {stage === 'success' && (
              <Button className={btnPrimary} onClick={closeAndReset} type="button">
                View capitation
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
