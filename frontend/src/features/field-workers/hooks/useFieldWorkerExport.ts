import { useMutation, useQueryClient } from '@tanstack/react-query'

import { exportFieldWorkers } from '../services'
import type { ExportFieldWorkerPayload } from '../types'

export function useExportFieldWorkers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExportFieldWorkerPayload) => exportFieldWorkers(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['file-jobs'] }),
  })
}
