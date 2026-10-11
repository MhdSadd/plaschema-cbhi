import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import {
  createFieldWorker,
  resetFieldWorkerPassword,
  updateFieldWorker,
  uploadFieldWorkersBatch,
} from '../services'

export function useCreateFieldWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createFieldWorker,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['field-workers'] })
      toast.success('Enrollment officer created successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to create the enrollment officer.'))
    },
  })
}

export function useUpdateFieldWorker() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateFieldWorker,
    onSuccess: (worker) => {
      void queryClient.invalidateQueries({ queryKey: ['field-workers'] })
      void queryClient.invalidateQueries({
        queryKey: ['field-workers', 'detail', worker.id],
      })
      void queryClient.invalidateQueries({ queryKey: ['wards'] })
      toast.success('Enrollment officer updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to update the enrollment officer.'))
    },
  })
}

export function useUploadFieldWorkersBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadFieldWorkersBatch,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['field-workers'] })
      if (result.failed > 0) {
        toast.warning(
          `${result.created} created; ${result.skipped} skipped; ${result.failed} failed.`,
        )
        return
      }
      if (result.created === 0 && result.skipped > 0) {
        toast.success(`No new officers; ${result.skipped} already existed.`)
        return
      }
      toast.success(`${result.created} enrollment officers imported successfully.`)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to upload the enrollment officers file.'))
    },
  })
}

export function useResetFieldWorkerPassword() {
  return useMutation({
    mutationFn: resetFieldWorkerPassword,
    onSuccess: () => {
      toast.success('Password reset successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to reset the password.'))
    },
  })
}
