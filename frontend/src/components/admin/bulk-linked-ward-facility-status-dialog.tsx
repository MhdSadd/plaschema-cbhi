import { LoaderCircle } from 'lucide-react'

import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import {
  bulkLinkedWardFacilityStatusDescription,
  type LinkedStatusScope,
} from '@/components/admin/linked-ward-facility-status-copy'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface BulkLinkedWardFacilityStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
  nextStatus: 'active' | 'inactive'
  scope: LinkedStatusScope
  selectionCount: number
  uniqueWardCount?: number
}

export function BulkLinkedWardFacilityStatusDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  nextStatus,
  scope,
  selectionCount,
  uniqueWardCount,
}: BulkLinkedWardFacilityStatusDialogProps) {
  const verb = nextStatus === 'active' ? 'Activate' : 'Deactivate'
  const label =
    scope === 'ward'
      ? selectionCount === 1
        ? 'ward'
        : 'wards'
      : selectionCount === 1
        ? 'facility'
        : 'facilities'

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogTitle className="text-lg font-semibold">
          {verb} {selectionCount} linked {label}?
        </AlertDialogTitle>
        <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
          {bulkLinkedWardFacilityStatusDescription(scope, nextStatus, {
            selectionCount,
            uniqueWardCount,
          })}
        </AlertDialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialogCancel asChild>
            <Button className={btnSecondary} disabled={isPending} variant="outline">
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button
            className={btnPrimary}
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
            variant={nextStatus === 'inactive' ? 'destructive' : 'default'}
          >
            {isPending ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" /> Updating…
              </>
            ) : (
              `${verb} all`
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
