import { LoaderCircle } from 'lucide-react'

import { getApiErrorMessage } from '@/api'
import { btnSecondary } from '@/components/admin/styles'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

import { useDeleteFileJob } from '../hooks'
import type { FileJob } from '../types'

interface DeleteFileJobDialogProps {
  open: boolean
  job: FileJob | null
  onDeleted: () => void
  onOpenChange: (open: boolean) => void
}

export function DeleteFileJobDialog({
  open,
  job,
  onDeleted,
  onOpenChange,
}: DeleteFileJobDialogProps) {
  const mutation = useDeleteFileJob()

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) return
    if (nextOpen) mutation.reset()
    onOpenChange(nextOpen)
  }

  if (!job) return null

  const isIdCard = job.kind === 'id_card'

  return (
    <AlertDialog onOpenChange={changeOpen} open={open}>
      <AlertDialogContent>
        <AlertDialogTitle className="text-lg font-semibold">
          Delete {job.title}?
        </AlertDialogTitle>
        <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
          This permanently removes the file job and deletes the generated file
          from storage.
          {isIdCard
            ? ' Enrollees will remain marked as printed; this does not undo printing.'
            : null}
        </AlertDialogDescription>
        {mutation.isError && (
          <p
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {getApiErrorMessage(mutation.error, 'Unable to delete the file job.')}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <AlertDialogCancel asChild>
            <Button
              className={btnSecondary}
              disabled={mutation.isPending}
              variant="outline"
            >
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              disabled={mutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                mutation.mutate(job.id, { onSuccess: onDeleted })
              }}
              variant="destructive"
            >
              {mutation.isPending ? (
                <>
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete file'
              )}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
