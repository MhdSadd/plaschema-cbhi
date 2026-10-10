import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getApiErrorMessage } from '@/api'

import {
  createHealthFacility,
  deleteHealthFacility,
  updateHealthFacility,
  uploadHealthFacilitiesBatch,
} from '../services'
import type { HealthFacilityStatus } from '../types'
import { wardKeys } from '@/features/wards/hooks/ward.keys'
import { facilityKeys } from './facility.keys'

export function useCreateHealthFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createHealthFacility,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      toast.success('Facility created successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to create the facility.')),
  })
}

export function useUploadHealthFacilitiesBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadHealthFacilitiesBatch,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      const skippedNote =
        result.skipped > 0
          ? ` ${result.skipped} already existed and were skipped.`
          : ''
      if (result.failed > 0) {
        toast.warning(
          `${result.created} facilities imported; ${result.failed} rows failed.${skippedNote}`,
        )
      } else if (result.created === 0 && result.skipped > 0) {
        toast.success(`No new facilities; ${result.skipped} already existed.`)
      } else {
        toast.success(
          `${result.created} facilities imported successfully.${skippedNote}`,
        )
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to upload the facilities file.')),
  })
}

export function useUpdateHealthFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateHealthFacility,
    onSuccess: (facility) => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: facilityKeys.detail(facility.id) })
      toast.success('Facility updated successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to update the facility.')),
  })
}

/** One PATCH per ward so linked ward/facility sync matches single-facility updates. */
export function useBulkUpdateHealthFacilityStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      facilityIds,
      status,
    }: {
      facilityIds: string[]
      status: HealthFacilityStatus
    }) => {
      let succeeded = 0
      let failed = 0
      for (const id of facilityIds) {
        try {
          await updateHealthFacility({ id, payload: { status } })
          succeeded += 1
        } catch {
          failed += 1
        }
      }
      return { succeeded, failed }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: wardKeys.lists() })
      if (result.failed > 0) {
        toast.warning(
          `${result.succeeded} linked ward update${result.succeeded === 1 ? '' : 's'} succeeded; ${result.failed} failed.`,
        )
        return
      }
      toast.success(
        `${result.succeeded} linked ward${result.succeeded === 1 ? '' : 's'} and ${result.succeeded === 1 ? 'its' : 'their'} facilities updated successfully.`,
      )
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Unable to update facility status.')),
  })
}

export function useDeleteHealthFacility() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteHealthFacility,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: facilityKeys.lists() })
      queryClient.removeQueries({ queryKey: facilityKeys.detail(result.id) })
      toast.success('Facility deleted successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Unable to delete the facility.')),
  })
}
