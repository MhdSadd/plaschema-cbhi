import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PasswordChangeRequiredView } from '@/features/auth/components/password-change-required-view'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import type { FieldWorkerUser } from '@/features/auth/types'

const user: FieldWorkerUser = {
  id: '01900000-0000-7000-8000-000000000001',
  name: 'Amina Yusuf',
  email: 'amina@example.com',
  role: 'field_worker',
  status: 'active',
  phone: null,
  lastSyncedAt: null,
  isPasswordChangeRequired: true,
  assignedWards: [],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
}

vi.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => true,
}))

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <PasswordChangeRequiredView />
    </QueryClientProvider>,
  )
}

describe('PasswordChangeRequiredView', () => {
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

  it('requires matching new passwords', async () => {
    renderView()
    await userEvent.type(screen.getByLabelText('Current password'), 'ChangeMe123!')
    await userEvent.type(screen.getByLabelText('New password'), 'NewPassword123!')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'Different123!')
    await userEvent.click(screen.getByRole('button', { name: 'Save and continue' }))
    expect(screen.getByRole('alert')).toHaveTextContent('New password and confirmation do not match.')
  })
})
