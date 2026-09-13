import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PasswordChangeRequiredView } from '@/features/auth/components/password-change-required-view'
import { useAuthStore } from '@/features/auth/stores/auth.store'

export function ProtectedLayout() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const from = `${location.pathname}${location.search}${location.hash}`

  if (status !== 'authenticated') {
    return <Navigate replace state={{ from }} to="/login" />
  }

  if (user?.isPasswordChangeRequired) {
    return <PasswordChangeRequiredView />
  }

  return <Outlet />
}
