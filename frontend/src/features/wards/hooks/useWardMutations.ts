import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import {
  assignWardFieldWorkers,
  createWard,
  deleteWard,
  updateWard,
  uploadWardsBatch,
} from '../services'
import type { WardStatus } from '../types'
import { facilityKeys } from '@/features/facilities/hooks/facility.keys'
import { wardKeys } from './ward.keys'

export function useCreateWard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWard,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to create the ward.'))
    },
  })
}

export function useUploadWardsBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadWardsBatch,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })

      const createdLabel = result.created === 1 ? 'ward' : 'wards'
      const failedLabel = result.failed === 1 ? 'row' : 'rows'

      const skippedNote =
        result.skipped > 0
          ? ` ${result.skipped} already existed and were skipped.`
          : ''

      if (result.failed > 0) {
        toast.warning(
          `${result.created} ${createdLabel} imported; ${result.failed} ${failedLabel} failed.${skippedNote}`,
        )
        return
      }

      if (result.created === 0 && result.skipped > 0) {
        toast.success(`No new wards; ${result.skipped} already existed.`)
        return
      }

      toast.success(
        `${result.created} ${createdLabel} imported successfully.${skippedNote}`,
      )
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to upload the wards file.'))
    },
  })
}

export function useUpdateWard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWard,
    onSuccess: (ward) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: wardKeys.detail(ward.id) })
      toast.success('Ward updated successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to update the ward.'))
    },
  })
}

export function useBulkUpdateWardStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[]
      status: WardStatus
    }) => {
      let succeeded = 0
      let failed = 0
      for (const id of ids) {
        try {
          await updateWard({ id, payload: { status } })
          succeeded += 1
        } catch {
          failed += 1
        }
      }
      return { succeeded, failed }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: facilityKeys.all })
      if (result.failed > 0) {
        toast.warning(
          `${result.succeeded} ward${result.succeeded === 1 ? '' : 's'} updated; ${result.failed} failed.`,
        )
        return
      }
      toast.success(
        `${result.succeeded} ward${result.succeeded === 1 ? '' : 's'} updated successfully.`,
      )
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to update ward status.'))
    },
  })
}

export function useAssignWardFieldWorkers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: assignWardFieldWorkers,
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: wardKeys.detail(variables.id),
      })
      void queryClient.invalidateQueries({ queryKey: ['field-workers'] })
      toast.success(result.message)
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'Unable to assign the enrollment officers.'),
      )
    },
  })
}

export function useDeleteWard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWard,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
      queryClient.removeQueries({ queryKey: wardKeys.detail(result.id) })
      toast.success('Ward deleted successfully.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to delete the ward.'))
    },
  })
}
