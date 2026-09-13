import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/stores/auth.store'
import type { FieldWorkerUser } from '@/features/auth/types'

import { ProfileChangePasswordCard } from './profile-change-password-card'

const user: FieldWorkerUser = {
  id: '01900000-0000-7000-8000-000000000001',
  name: 'Amina Yusuf',
  email: 'amina@example.com',
  role: 'field_worker',
  status: 'active',
  phone: null,
  lastSyncedAt: null,
  isPasswordChangeRequired: false,
  assignedWards: [],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
}

vi.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => true,
}))

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileChangePasswordCard />
    </QueryClientProvider>,
  )
}

describe('ProfileChangePasswordCard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token',
      expiresAt: Date.now() + 60_000,
      user,
      status: 'authenticated',
      validation: 'verified',
      notice: null,
    })
  })

  it('reveals the password form when expanded', async () => {
    renderCard()
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /change password/i }))
    expect(screen.getByLabelText('Current password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update password' })).toBeInTheDocument()
  })
})
