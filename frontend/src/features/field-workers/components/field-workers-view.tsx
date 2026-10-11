import { ChevronLeft, ChevronRight, Download, Eye, LoaderCircle, Plus, RefreshCw, SlidersHorizontal, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'
import { StatusBadge } from '@/components/admin/status-badge'
import { btnPrimary, btnSecondary, cardShadow, searchBar, tabGroup, tdCell, thCell } from '@/components/admin/styles'
import { JobProgressPanel } from '@/features/enrollments/components/job-progress-panel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { useExportFieldWorkers, useFieldWorkers } from '../hooks'
import type { ExportFieldWorkerPayload, FieldWorkerStatus } from '../types'
import { BatchUploadFieldWorkersDialog } from './batch-upload-field-workers-dialog'
import { CreateFieldWorkerDialog } from './create-field-worker-dialog'
import { CredentialResultDialog, type CredentialResult } from './credential-result-dialog'

type StatusFilter = 'all' | FieldWorkerStatus

function statusLabel(status: FieldWorkerStatus) {
  return status === 'active' ? 'Active' : 'Inactive'
}

function formatDate(value: string | null) {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function wardAccess(wards: Array<{ name: string }>) {
  if (wards.length === 0) return 'All wards'
  if (wards.length <= 2) return wards.map((ward) => ward.name).join(', ')
  return `${wards[0].name}, ${wards[1].name} +${wards.length - 2}`
}

export function FieldWorkersView() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [enrolledMin, setEnrolledMin] = useState('')
  const [enrolledMax, setEnrolledMax] = useState('')
  const [lastEnrollmentFrom, setLastEnrollmentFrom] = useState('')
  const [lastEnrollmentTo, setLastEnrollmentTo] = useState('')
  const [lastSyncedFrom, setLastSyncedFrom] = useState('')
  const [lastSyncedTo, setLastSyncedTo] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [credentials, setCredentials] = useState<CredentialResult | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setCursors([undefined])
      setPageIndex(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const enrolledMinNumber = enrolledMin === '' ? undefined : Number(enrolledMin)
  const enrolledMaxNumber = enrolledMax === '' ? undefined : Number(enrolledMax)
  const filtersValid =
    (enrolledMinNumber === undefined || enrolledMaxNumber === undefined || enrolledMinNumber <= enrolledMaxNumber)
    && (!lastEnrollmentFrom || !lastEnrollmentTo || lastEnrollmentFrom <= lastEnrollmentTo)
    && (!lastSyncedFrom || !lastSyncedTo || lastSyncedFrom <= lastSyncedTo)

  const listParams = {
    cursor: cursors[pageIndex],
    limit: 50,
    search: debouncedSearch || undefined,
    status: status === 'all' ? undefined : status,
    beneficiariesEnrolledMin: filtersValid ? enrolledMinNumber : undefined,
    beneficiariesEnrolledMax: filtersValid ? enrolledMaxNumber : undefined,
    lastEnrollmentFrom: lastEnrollmentFrom || undefined,
    lastEnrollmentTo: lastEnrollmentTo || undefined,
    lastSyncedFrom: lastSyncedFrom || undefined,
    lastSyncedTo: lastSyncedTo || undefined,
  } as const

  const query = useFieldWorkers(listParams)
  const exportMutation = useExportFieldWorkers()
  const workers = query.data?.items ?? []
  const meta = query.data?.meta
  const totalCount = meta?.total ?? workers.length
  const activeCount = query.data?.summary?.active
    ?? workers.filter((worker) => worker.status === 'active').length
  const enrolledCount = query.data?.summary?.totalBeneficiariesEnrolled
    ?? workers.reduce((total, worker) => total + worker.beneficiariesEnrolled, 0)

  const exportFilterSummary = useMemo(() => [
    status !== 'all' ? { label: 'Status', value: statusLabel(status) } : null,
    enrolledMinNumber !== undefined ? { label: 'Min beneficiaries enrolled', value: String(enrolledMinNumber) } : null,
    enrolledMaxNumber !== undefined ? { label: 'Max beneficiaries enrolled', value: String(enrolledMaxNumber) } : null,
    lastEnrollmentFrom ? { label: 'Last enrollment from', value: lastEnrollmentFrom } : null,
    lastEnrollmentTo ? { label: 'Last enrollment to', value: lastEnrollmentTo } : null,
    lastSyncedFrom ? { label: 'Last sync from', value: lastSyncedFrom } : null,
    lastSyncedTo ? { label: 'Last sync to', value: lastSyncedTo } : null,
  ].filter((item): item is { label: string; value: string } => item !== null), [
    enrolledMaxNumber,
    enrolledMinNumber,
    lastEnrollmentFrom,
    lastEnrollmentTo,
    lastSyncedFrom,
    lastSyncedTo,
    status,
  ])

  function resetPage() { setCursors([undefined]); setPageIndex(0) }
  function nextPage() {
    const nextCursor = meta?.nextCursor
    if (!meta?.hasMore || !nextCursor) return
    setCursors((current) => { const next = current.slice(0, pageIndex + 1); next[pageIndex + 1] = nextCursor; return next })
    setPageIndex((current) => current + 1)
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setStatus('all')
    setEnrolledMin('')
    setEnrolledMax('')
    setLastEnrollmentFrom('')
    setLastEnrollmentTo('')
    setLastSyncedFrom('')
    setLastSyncedTo('')
    resetPage()
  }

  function exportPayload(): ExportFieldWorkerPayload {
    return {
      format: 'xlsx',
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
      beneficiariesEnrolledMin: filtersValid ? enrolledMinNumber : undefined,
      beneficiariesEnrolledMax: filtersValid ? enrolledMaxNumber : undefined,
      lastEnrollmentFrom: lastEnrollmentFrom || undefined,
      lastEnrollmentTo: lastEnrollmentTo || undefined,
      lastSyncedFrom: lastSyncedFrom || undefined,
      lastSyncedTo: lastSyncedTo || undefined,
    }
  }

  async function handleExport() {
    try {
      const result = await exportMutation.mutateAsync(exportPayload())
      setExportOpen(false)
      setActiveJobId(result.jobId)
      toast.success('Excel report has been queued.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to export enrollment officers.'))
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-[-0.48px]">Enrollment Officers</h1><p className="mt-0.5 text-sm text-muted-foreground">Manage enrollment officer accounts, ward access and enrollment activity.</p></div><div className="flex flex-wrap gap-2"><button className={btnSecondary} onClick={() => navigate('/admin/files')} type="button"><Download aria-hidden="true" className="size-4" /> Files</button><button className={btnSecondary} disabled={!filtersValid} onClick={() => setExportOpen(true)} type="button"><Download aria-hidden="true" className="size-4" /> Export Excel</button><button className={btnSecondary} onClick={() => setUploadOpen(true)} type="button"><Upload aria-hidden="true" className="size-4" /> Bulk Upload</button><button className={btnPrimary} onClick={() => setCreateOpen(true)} type="button"><Plus aria-hidden="true" className="size-4" /> Add Enrollment Officer</button></div></div>

      {activeJobId && <JobProgressPanel jobId={activeJobId} onClose={() => setActiveJobId(null)} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[{ label: 'Enrollment officers', value: totalCount.toLocaleString() }, { label: 'Active', value: activeCount.toLocaleString() }, { label: 'Beneficiaries enrolled', value: enrolledCount.toLocaleString() }].map((item) => <div className={`flex flex-col gap-1 rounded-xl bg-card p-5 ${cardShadow}`} key={item.label}><p className="text-xs font-medium text-muted-foreground">{item.label}</p>{query.isPending ? <Skeleton className="mt-1 h-8 w-24" /> : <p className="text-[28px] font-semibold tracking-[-0.56px]">{item.value}</p>}</div>)}</div>

      <div className={`rounded-xl bg-card p-4 ${cardShadow}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={searchBar} style={{ flex: '1 1 0', maxWidth: '340px' }}><svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" /><path d="M10.5 10.5L13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg><input aria-label="Search enrollment officers" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" maxLength={160} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email or phone..." value={search} />{query.isFetching && <LoaderCircle aria-label="Updating enrollment officers" className="size-4 animate-spin" />}</div>
          <div className={tabGroup}>{(['all', 'active', 'inactive'] as const).map((item) => <button aria-pressed={status === item} className={`h-10 rounded-full px-4 text-xs font-semibold capitalize ${status === item ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`} key={item} onClick={() => { setStatus(item); resetPage() }} type="button">{item}</button>)}</div>
          <Button onClick={() => setAdvancedOpen((open) => !open)} variant="outline"><SlidersHorizontal aria-hidden="true" /> {advancedOpen ? 'Hide filters' : 'More filters'}</Button>
          <button className="text-sm font-medium text-muted-foreground hover:text-foreground" onClick={clearFilters} type="button">Clear</button>
          <span className="ml-auto text-sm text-muted-foreground">{query.isPending ? 'Loading enrollment officers…' : `Showing ${workers.length} of ${totalCount.toLocaleString()} enrollment officers`}</span>
        </div>

        {advancedOpen && <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Min beneficiaries enrolled<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" min="0" onChange={(event) => { setEnrolledMin(event.target.value); resetPage() }} type="number" value={enrolledMin} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Max beneficiaries enrolled<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" min="0" onChange={(event) => { setEnrolledMax(event.target.value); resetPage() }} type="number" value={enrolledMax} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Last enrollment from<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setLastEnrollmentFrom(event.target.value); resetPage() }} type="date" value={lastEnrollmentFrom} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Last enrollment to<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setLastEnrollmentTo(event.target.value); resetPage() }} type="date" value={lastEnrollmentTo} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Last sync from<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setLastSyncedFrom(event.target.value); resetPage() }} type="date" value={lastSyncedFrom} /></label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">Last sync to<input className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground" onChange={(event) => { setLastSyncedTo(event.target.value); resetPage() }} type="date" value={lastSyncedTo} /></label>
          {!filtersValid && <p className="text-sm text-destructive sm:col-span-2 xl:col-span-4">Check that minimum values are not greater than maximum values and date ranges are valid.</p>}
        </div>}
      </div>

      <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
        {query.isError && !query.data ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center" role="alert"><p className="font-semibold">Unable to load enrollment officers.</p><p className="text-sm text-muted-foreground">Check your connection and try again.</p><Button onClick={() => void query.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button></div> : <div className="overflow-x-auto"><table className="w-full"><thead><tr>{['Enrollment Officer', 'Phone / Email', 'Ward Access', 'Beneficiaries Enrolled', 'Last Enrollment', 'Last Sync', 'Status', 'View'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}</tr></thead><tbody>{query.isPending ? Array.from({ length: 6 }, (_, row) => <tr key={row}>{Array.from({ length: 8 }, (__, cell) => <td className={tdCell} key={cell}><Skeleton className="h-5 w-full" /></td>)}</tr>) : workers.map((worker) => <tr className="cursor-pointer hover:bg-muted/40" key={worker.id} onClick={() => navigate(`/admin/field-workers/${worker.id}`)}><td className={tdCell}><div className="flex items-center gap-2"><div aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary-foreground">{worker.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><span className="font-semibold">{worker.name}</span></div></td><td className={tdCell}><p>{worker.phone ?? 'Not provided'}</p><p className="text-xs text-muted-foreground">{worker.email}</p></td><td className={`${tdCell} max-w-64 text-muted-foreground`}>{wardAccess(worker.wards)}</td><td className={`${tdCell} font-semibold`}>{worker.beneficiariesEnrolled.toLocaleString()}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatDate(worker.lastEnrollmentAt)}</td><td className={`${tdCell} whitespace-nowrap text-muted-foreground`}>{formatDate(worker.lastSyncedAt)}</td><td className={tdCell}><StatusBadge status={statusLabel(worker.status)} /></td><td className={tdCell}><button aria-label={`View ${worker.name}`} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={(event) => { event.stopPropagation(); navigate(`/admin/field-workers/${worker.id}`) }} type="button"><Eye aria-hidden="true" className="size-4" /></button></td></tr>)}{!query.isPending && workers.length === 0 && <tr><td className="px-6 py-14 text-center text-sm text-muted-foreground" colSpan={8}>No enrollment officers match your search and filters.</td></tr>}</tbody></table></div>}
        {!query.isError && <div className="flex items-center justify-between border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground">Page {pageIndex + 1}</p><div className="flex gap-2"><Button disabled={pageIndex === 0 || query.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button><Button disabled={!meta?.hasMore || !meta.nextCursor || query.isFetching} onClick={nextPage} variant="outline">Next <ChevronRight aria-hidden="true" /></Button></div></div>}
      </div>

      {exportOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="export-field-workers-title"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold" id="export-field-workers-title">Export enrollment officers</h2><p className="mt-1 text-sm text-muted-foreground">The Excel report will be prepared in the background and appear under Files.</p></div><button aria-label="Close export dialog" onClick={() => setExportOpen(false)} type="button"><X className="size-5" /></button></div>{exportFilterSummary.length > 0 ? <div className="mt-4 rounded-xl border border-border p-4"><p className="text-sm font-semibold">Filters included in this export</p><dl className="mt-3 grid gap-2">{exportFilterSummary.map((item) => <div className="flex justify-between gap-4 text-sm" key={item.label}><dt className="text-muted-foreground">{item.label}</dt><dd className="text-right font-medium">{item.value}</dd></div>)}</dl></div> : <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">This will export all enrollment officers.</p><p className="mt-1">No report filter is selected. Confirm only if you want the complete enrollment officer list.</p></div>}{debouncedSearch && <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-semibold">Search will be included in this export.</p><p className="mt-1">The current search text is sent to the export API so the spreadsheet matches your filtered list.</p></div>}<div className="mt-6 flex justify-end gap-2"><button className={btnSecondary} onClick={() => setExportOpen(false)} type="button">Cancel</button><button className={btnPrimary} disabled={exportMutation.isPending || !filtersValid} onClick={() => void handleExport()} type="button">{exportMutation.isPending ? 'Queueing…' : exportFilterSummary.length === 0 ? 'Export all enrollment officers' : 'Create filtered Excel file'}</button></div></div></div>}

      {createOpen && <CreateFieldWorkerDialog onCreated={setCredentials} onOpenChange={setCreateOpen} open />}
      {uploadOpen && (
        <BatchUploadFieldWorkersDialog
          onImported={({ created, password }) => {
            setUploadOpen(false)
            setCredentials({
              name: `${created} officers`,
              email: 'See upload file',
              password,
              bulkCount: created,
            })
          }}
          onOpenChange={setUploadOpen}
          open
        />
      )}
      {credentials && <CredentialResultDialog onOpenChange={(nextOpen) => { if (!nextOpen) setCredentials(null) }} open result={credentials} title="Enrollment officer created" />}
    </div>
  )
}
