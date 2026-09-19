import { LoaderCircle } from 'lucide-react'

import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { linkedWardFacilityStatusDescription, type LinkedStatusScope } from '@/components/admin/linked-ward-facility-status-copy'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface LinkedWardFacilityStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending?: boolean
  nextStatus: 'active' | 'inactive'
  scope: LinkedStatusScope
  wardName?: string
  linkedFacilityCount?: number
}

export function LinkedWardFacilityStatusDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  nextStatus,
  scope,
  wardName,
  linkedFacilityCount,
}: LinkedWardFacilityStatusDialogProps) {
  const verb = nextStatus === 'active' ? 'Activate' : 'Deactivate'

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogTitle className="text-lg font-semibold">
          {verb} linked ward and facilities?
        </AlertDialogTitle>
        <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
          {linkedWardFacilityStatusDescription(scope, nextStatus, {
            wardName,
            linkedFacilityCount,
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
