import { KeyRound, LogOut } from 'lucide-react'

import { useFieldWorkerLogout } from '../hooks/useFieldWorkerLogout'
import { useAuthStore } from '../stores/auth.store'
import { ChangePasswordForm } from './change-password-form'

export function PasswordChangeRequiredView() {
  const user = useAuthStore((state) => state.user)
  const logout = useFieldWorkerLogout()

  return (
    <main className="app-frame flex min-h-dvh items-center justify-center bg-neutral-950/55 px-4 py-8">
      <section
        aria-labelledby="password-change-title"
        aria-modal="true"
        className="card w-full max-w-md p-6 shadow-xl"
        role="dialog"
      >
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            <KeyRound aria-hidden="true" size={22} />
          </span>
          <div>
            <h1 className="text-lg font-bold" id="password-change-title">Set a new password</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {user?.name ? `${user.name}, you` : 'You'} must choose a new password before opening your enrollment workspace.
            </p>
          </div>
        </div>

        <ChangePasswordForm formId="forced-password" submitLabel="Save and continue" />

        <button
          className="secondary-button mt-4 flex w-full items-center justify-center gap-2"
          onClick={logout}
          type="button"
        >
          <LogOut aria-hidden="true" size={17} />
          Sign out
        </button>
      </section>
    </main>
  )
}
