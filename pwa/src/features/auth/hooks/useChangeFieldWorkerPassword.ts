import { useMutation } from '@tanstack/react-query'

import { changeFieldWorkerPassword } from '../services'
import { useAuthStore } from '../stores/auth.store'
import type { ChangePasswordPayload } from '../types'

export function useChangeFieldWorkerPassword() {
  const updateUser = useAuthStore((state) => state.updateUser)
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changeFieldWorkerPassword(payload),
    onSuccess: (user) => updateUser(user),
  })
}
