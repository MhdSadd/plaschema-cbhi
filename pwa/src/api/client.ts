import axios from 'axios'

import { getApiErrorCode } from './errors'
import { useAuthStore } from '@/features/auth/stores/auth.store'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const requestUrl = error.config?.url ?? ''
      if (error.response?.status === 401 && !requestUrl.includes('/auth/login')) {
        useAuthStore.getState().clearSession('expired')
      }
      if (getApiErrorCode(error) === 'PASSWORD_CHANGE_REQUIRED') {
        const user = useAuthStore.getState().user
        if (user && !user.isPasswordChangeRequired) {
          useAuthStore.getState().updateUser({ ...user, isPasswordChangeRequired: true })
        }
      }
    }
    return Promise.reject(error)
  },
)
