import { ChevronDown, KeyRound } from 'lucide-react'
import { useState } from 'react'

import { ChangePasswordForm } from '@/features/auth/components/change-password-form'

export function ProfileChangePasswordCard() {
  const [expanded, setExpanded] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  return (
    <section className="card p-4">
      <button
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => {
          setExpanded((value) => !value)
          setSuccessMessage('')
        }}
        type="button"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
            <KeyRound aria-hidden="true" size={18} />
          </span>
          <span>
            <span className="block text-sm font-bold">Change password</span>
            <span className="mt-0.5 block text-xs text-neutral-500">Update your sign-in password at any time</span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`shrink-0 text-neutral-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          size={18}
        />
      </button>

      {expanded ? (
        <div className="mt-4 border-t border-neutral-100 pt-4">
          {successMessage ? (
            <div
              aria-live="polite"
              className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}
          <ChangePasswordForm
            formId="profile-password"
            onSuccess={() => setSuccessMessage('Your password was updated successfully.')}
            submitLabel="Update password"
          />
        </div>
      ) : null}
    </section>
  )
}
