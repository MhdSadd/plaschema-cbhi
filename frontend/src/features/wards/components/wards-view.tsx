import { ChevronLeft, ChevronRight, CircleCheck, Eye, LoaderCircle, Plus, RefreshCw, Upload, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { StatusBadge } from '@/components/admin/status-badge'
import { btnPrimary, btnSecondary, cardShadow, searchBar, tabGroup, tdCell, thCell } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PLATEAU_LGAS } from '@/lib/geography'

import { useWards } from '../hooks'
import type { WardStatus } from '../types'
import { BatchUploadWardsDialog } from './batch-upload-wards-dialog'
import { CreateWardDialog } from './create-ward-dialog'

type ModalType = 'add' | 'upload' | null
type StatusFilter = 'all' | WardStatus

function statusLabel(status: WardStatus) {
  return status === 'active' ? 'Active' : 'Inactive'
}

export function WardsView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [lga, setLga] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const [modal, setModal] = useState<ModalType>(searchParams.get('action') === 'add' ? 'add' : null)
  const [created, setCreated] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setCursors([undefined])
      setPageIndex(0)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const wardsQuery = useWards({
    cursor: cursors[pageIndex],
    limit: 50,
    search: debouncedSearch || undefined,
    lga: lga || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  })
  const wards = wardsQuery.data?.items ?? []
  const meta = wardsQuery.data?.meta
  const totalCount = meta?.total ?? wards.length
  const activeCount =
    wardsQuery.data?.summary?.active
    ?? wards.filter((ward) => ward.status === 'active').length
  const beneficiaryCount =
    wardsQuery.data?.summary?.totalBeneficiaries
    ?? wards.reduce((total, ward) => total + ward.beneficiaries, 0)

  function resetPage() {
    setCursors([undefined])
    setPageIndex(0)
  }

  function changeStatus(nextStatus: StatusFilter) {
    setStatusFilter(nextStatus)
    resetPage()
  }

  function goNext() {
    const nextCursor = meta?.nextCursor
    if (!meta?.hasMore || !nextCursor) return
    setCursors((current) => {
      const next = current.slice(0, pageIndex + 1)
      next[pageIndex + 1] = nextCursor
      return next
    })
    setPageIndex((current) => current + 1)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.48px] text-foreground">Wards</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage programme wards and local coverage.</p>
        </div>
        <div className="flex gap-2">
          <button className={btnSecondary} onClick={() => setModal('upload')} type="button">
            <Upload aria-hidden="true" className="size-4" /> Upload File
          </button>
          <button className={btnPrimary} onClick={() => setModal('add')} type="button">
            <Plus aria-hidden="true" className="size-4" /> Add Ward
          </button>
        </div>
      </div>

      {created && (
        <div aria-live="polite" className="flex items-center gap-3 rounded-lg border border-success-foreground/20 bg-success px-4 py-3" role="status">
          <CircleCheck aria-hidden="true" className="size-4 text-success-foreground" />
          <p className="text-sm font-semibold text-success-foreground">“{created}” ward created successfully.</p>
          <button aria-label="Dismiss success message" className="ml-auto rounded-md p-1 text-success-foreground hover:bg-success-foreground/10" onClick={() => setCreated(null)} type="button">
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Wards', value: totalCount.toLocaleString() },
          { label: 'Active', value: activeCount.toLocaleString() },
          { label: 'Beneficiaries', value: beneficiaryCount.toLocaleString() },
        ].map((item) => (
          <div className={`flex flex-col gap-1 rounded-xl bg-card p-5 ${cardShadow}`} key={item.label}>
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            {wardsQuery.isPending ? (
              <Skeleton className="mt-1 h-8 w-24" />
            ) : (
              <p className="text-[28px] font-semibold tracking-[-0.56px]">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className={searchBar} style={{ flex: '1 1 0', maxWidth: '280px' }}>
          <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
          <input aria-label="Search wards" className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground" maxLength={120} onChange={(event) => setSearch(event.target.value)} placeholder="Search wards..." value={search} />
          {wardsQuery.isFetching && <LoaderCircle aria-label="Updating wards" className="size-4 animate-spin text-muted-foreground" />}
        </div>
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">
          LGA
          <select
            aria-label="Filter wards by LGA"
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-normal text-foreground"
            onChange={(event) => {
              setLga(event.target.value)
              resetPage()
            }}
            value={lga}
          >
            <option value="">All LGAs</option>
            {PLATEAU_LGAS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className={tabGroup}>
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button aria-pressed={statusFilter === status} className={`h-10 rounded-full px-4 text-xs font-semibold capitalize tracking-[0.24px] transition-colors ${statusFilter === status ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`} key={status} onClick={() => changeStatus(status)} type="button">
              {status}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm font-medium text-muted-foreground">
          {wardsQuery.isPending ? 'Loading wards…' : `Showing ${wards.length} of ${totalCount.toLocaleString()} wards`}
        </div>
      </div>

      <div className={`overflow-hidden rounded-xl bg-card ${cardShadow}`}>
        {wardsQuery.isError && !wardsQuery.data ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
            <p className="font-semibold text-foreground">Unable to load wards.</p>
            <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button onClick={() => void wardsQuery.refetch()} variant="outline"><RefreshCw aria-hidden="true" /> Retry</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Ward Name', 'State', 'LGA', 'Enrollment Officers', 'Beneficiaries', 'Status', 'View'].map((heading) => <th className={thCell} key={heading}>{heading}</th>)}
                </tr>
              </thead>
              <tbody>
                {wardsQuery.isPending
                  ? Array.from({ length: 6 }, (_, index) => (
                      <tr key={index}>
                        {Array.from({ length: 7 }, (__, cellIndex) => <td className={tdCell} key={cellIndex}><Skeleton className="h-5 w-full" /></td>)}
                      </tr>
                    ))
                  : wards.map((ward) => (
                      <tr className="transition-colors hover:bg-muted/40" key={ward.id}>
                        <td className={`${tdCell} font-semibold`}><button className="text-left hover:text-primary-foreground" onClick={() => navigate(`/admin/wards/${ward.id}`)} type="button">{ward.name}</button></td>
                        <td className={`${tdCell} text-muted-foreground`}>{ward.state}</td>
                        <td className={`${tdCell} text-muted-foreground`}>{ward.lga}</td>
                        <td className={tdCell}>{ward.fieldWorkers}</td>
                        <td className={`${tdCell} font-semibold`}>{ward.beneficiaries.toLocaleString()}</td>
                        <td className={tdCell}><StatusBadge status={statusLabel(ward.status)} /></td>
                        <td className={tdCell}><button aria-label={`View ${ward.name}`} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => navigate(`/admin/wards/${ward.id}`)} type="button"><Eye aria-hidden="true" className="size-4" /></button></td>
                      </tr>
                    ))}
                {!wardsQuery.isPending && wards.length === 0 && <tr><td className="px-6 py-14 text-center text-sm text-muted-foreground" colSpan={7}>No wards match your search and filter.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {!wardsQuery.isError && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">Page {pageIndex + 1}</p>
            <div className="flex gap-2">
              <Button disabled={pageIndex === 0 || wardsQuery.isFetching} onClick={() => setPageIndex((current) => Math.max(0, current - 1))} variant="outline"><ChevronLeft aria-hidden="true" /> Previous</Button>
              <Button disabled={!meta?.hasMore || !meta.nextCursor || wardsQuery.isFetching} onClick={goNext} variant="outline">Next <ChevronRight aria-hidden="true" /></Button>
            </div>
          </div>
        )}
      </div>

      <CreateWardDialog onCreated={setCreated} onOpenChange={(open) => setModal(open ? 'add' : null)} open={modal === 'add'} />
      <BatchUploadWardsDialog onOpenChange={(open) => setModal(open ? 'upload' : null)} open={modal === 'upload'} />
    </div>
  )
}
