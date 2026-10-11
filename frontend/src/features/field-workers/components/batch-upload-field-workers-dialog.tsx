import { CircleCheck, Download, LoaderCircle, Upload, X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'
import { btnPrimary, btnSecondary } from '@/components/admin/styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { useUploadFieldWorkersBatch } from '../hooks'
import {
  downloadEnrollmentOfficerUploadTemplate,
  ENROLLMENT_OFFICER_UPLOAD_COLUMNS,
} from '../utils/batch-upload-template'

const MAX_FILE_SIZE = 2 * 1024 * 1024
const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']

interface BatchUploadFieldWorkersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (result: { created: number; password: string }) => void
}

function validateFile(file: File): string | null {
  const filename = file.name.toLowerCase()
  if (!SUPPORTED_EXTENSIONS.some((extension) => filename.endsWith(extension))) {
    return 'Choose a CSV or Excel (.xlsx/.xls) file.'
  }
  if (file.size > MAX_FILE_SIZE) return 'The file must be 2 MB or smaller.'
  if (file.size === 0) return 'The selected file is empty.'
  return null
}

export function BatchUploadFieldWorkersDialog({
  open,
  onOpenChange,
  onImported,
}: BatchUploadFieldWorkersDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const uploadMutation = useUploadFieldWorkersBatch()
  const result = uploadMutation.data
  const passwordValid = password.trim().length >= 8

  function resetDialog() {
    setFile(null)
    setFileError(null)
    setPassword('')
    setDragActive(false)
    uploadMutation.reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDialogChange(nextOpen: boolean) {
    if (!nextOpen && uploadMutation.isPending) return
    if (!nextOpen) resetDialog()
    onOpenChange(nextOpen)
  }

  function selectFile(nextFile: File | null) {
    uploadMutation.reset()
    if (!nextFile) {
      setFile(null)
      setFileError(null)
      return
    }
    const validationError = validateFile(nextFile)
    if (validationError) {
      setFile(null)
      setFileError(validationError)
      toast.error(validationError)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setFile(nextFile)
    setFileError(null)
  }

  function handleUpload() {
    if (!file || !passwordValid) return
    uploadMutation.mutate(
      { file, password: password.trim() },
      {
        onSuccess: (batchResult) => {
          if (batchResult.created > 0) {
            onImported({ created: batchResult.created, password: password.trim() })
          }
        },
      },
    )
  }

  const requestError = uploadMutation.isError
    ? getApiErrorMessage(uploadMutation.error, 'Unable to upload the file.')
    : null

  return (
    <Dialog.Root onOpenChange={handleDialogChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/20" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card shadow-2xl outline-none"
          onEscapeKeyDown={(event) => {
            if (uploadMutation.isPending) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            if (uploadMutation.isPending) event.preventDefault()
          }}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold">Bulk upload enrollment officers</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Import officers from CSV or Excel. One shared initial password is applied to every new account.
              </Dialog.Description>
            </div>
            <Button aria-label="Close bulk upload dialog" disabled={uploadMutation.isPending} onClick={() => handleDialogChange(false)} size="icon" type="button" variant="ghost">
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {!result && !uploadMutation.isPending && (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Columns</p>
                  <p className="mt-1">{ENROLLMENT_OFFICER_UPLOAD_COLUMNS}</p>
                </div>

                <Button className="self-start px-0 text-sm" onClick={downloadEnrollmentOfficerUploadTemplate} type="button" variant="link">
                  <Download aria-hidden="true" className="size-4" /> Download CSV template
                </Button>

                <label className="grid gap-1.5 text-sm font-semibold" htmlFor="batch-officer-password">
                  Initial password (all new officers)
                  <Input
                    autoComplete="new-password"
                    id="batch-officer-password"
                    minLength={8}
                    onChange={(event) => {
                      uploadMutation.reset()
                      setPassword(event.target.value)
                    }}
                    type="password"
                    value={password}
                  />
                </label>
                <p className="-mt-2 text-xs text-muted-foreground">Minimum 8 characters. Officers must change this on first login.</p>

                <label
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition-colors',
                    dragActive && 'border-primary bg-muted/50',
                    fileError && 'border-destructive/50',
                  )}
                  htmlFor="batch-officer-file"
                  onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }}
                  onDragLeave={(event) => { event.preventDefault(); setDragActive(false) }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event: DragEvent<HTMLLabelElement>) => {
                    event.preventDefault()
                    setDragActive(false)
                    selectFile(event.dataTransfer.files[0] ?? null)
                  }}
                >
                  <Upload aria-hidden="true" className="size-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Drop CSV or Excel here, or browse</span>
                  <span className="text-xs text-muted-foreground">Max 2 MB</span>
                  <input accept=".csv,.xlsx,.xls" className="sr-only" id="batch-officer-file" onChange={(event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0] ?? null)} ref={fileInputRef} type="file" />
                </label>

                {file && (
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <Button aria-label="Remove file" onClick={() => selectFile(null)} size="icon-sm" type="button" variant="ghost"><X aria-hidden="true" /></Button>
                  </div>
                )}
                {fileError && <p className="text-sm text-destructive" role="alert">{fileError}</p>}
                {requestError && <p className="text-sm text-destructive" role="alert">{requestError}</p>}
              </div>
            )}

            {uploadMutation.isPending && (
              <div aria-live="polite" className="flex flex-col items-center gap-4 py-8 text-center">
                <LoaderCircle aria-hidden="true" className="size-10 animate-spin text-muted-foreground" />
                <p className="text-sm font-semibold">Importing enrollment officers…</p>
              </div>
            )}

            {result && (
              <div aria-live="polite" className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-success-foreground">
                  <CircleCheck aria-hidden="true" className="size-5" />
                  <span className="font-semibold">Import complete</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Created', result.created], ['Skipped', result.skipped], ['Failed', result.failed]].map(([label, value]) => (
                    <div className="rounded-lg border border-border bg-muted/40 p-3" key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-2xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                {result.errors.length > 0 && (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <p className="text-sm text-destructive" key={`${error.row}-${index}`}>Row {error.row}: {error.message}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-border px-6 py-4">
            <Button className={cn(btnSecondary, 'flex-1')} disabled={uploadMutation.isPending} onClick={() => handleDialogChange(false)} type="button" variant="outline">
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button className={cn(btnPrimary, 'flex-1')} disabled={!file || !passwordValid || uploadMutation.isPending} onClick={handleUpload} type="button">
                {uploadMutation.isPending ? 'Importing…' : 'Import officers'}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
