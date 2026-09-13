import { Eye, EyeOff, WifiOff } from 'lucide-react'
import { type FormEvent, useRef, useState } from 'react'

import { getApiErrorMessage } from '@/api'
import { useNetworkStatus } from '@/hooks/use-network-status'

import { useChangeFieldWorkerPassword } from '../hooks/useChangeFieldWorkerPassword'

const MIN_PASSWORD_LENGTH = 8

export interface ChangePasswordFormProps {
  formId: string
  submitLabel?: string
  onSuccess?: () => void
}

export function ChangePasswordForm({
  formId,
  submitLabel = 'Update password',
  onSuccess,
}: ChangePasswordFormProps) {
  const changePasswordMutation = useChangeFieldWorkerPassword()
  const isOnline = useNetworkStatus()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const currentPasswordRef = useRef<HTMLInputElement>(null)
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const confirmPasswordRef = useRef<HTMLInputElement>(null)

  const currentPasswordId = `${formId}-current-password`
  const newPasswordId = `${formId}-new-password`
  const confirmPasswordId = `${formId}-confirm-password`

  const requestError = changePasswordMutation.isError
    ? getApiErrorMessage(changePasswordMutation.error, 'Unable to update your password. Try again.')
    : ''
  const error = validationError || requestError

  function clearError() {
    setValidationError('')
    changePasswordMutation.reset()
  }

  function resetForm() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setValidationError('')
    changePasswordMutation.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setValidationError('')

    if (!isOnline) {
      setValidationError('Connect to the internet to update your password.')
      return
    }
    if (!currentPassword) {
      setValidationError('Enter your current password.')
      currentPasswordRef.current?.focus()
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setValidationError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      newPasswordRef.current?.focus()
      return
    }
    if (newPassword === currentPassword) {
      setValidationError('New password must be different from your current password.')
      newPasswordRef.current?.focus()
      return
    }
    if (newPassword !== confirmPassword) {
      setValidationError('New password and confirmation do not match.')
      confirmPasswordRef.current?.focus()
      return
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          resetForm()
          onSuccess?.()
        },
      },
    )
  }

  return (
    <>
      {!isOnline ? (
        <div className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          <WifiOff aria-hidden="true" size={16} />
          <span>Connect to the internet to update your password.</span>
        </div>
      ) : null}

      {error ? (
        <div
          aria-live="polite"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <label className="text-sm font-bold" htmlFor={currentPasswordId}>Current password</label>
        <span className="relative -mt-2">
          <input
            ref={currentPasswordRef}
            autoComplete="current-password"
            className="field pr-12"
            id={currentPasswordId}
            onChange={(event) => {
              setCurrentPassword(event.target.value)
              clearError()
            }}
            placeholder="Enter your current password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
          />
          <button
            aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            className="absolute right-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 p-2 text-neutral-500"
            onClick={() => setShowCurrentPassword((value) => !value)}
            type="button"
          >
            {showCurrentPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
          </button>
        </span>

        <label className="text-sm font-bold" htmlFor={newPasswordId}>New password</label>
        <span className="relative -mt-2">
          <input
            ref={newPasswordRef}
            autoComplete="new-password"
            className="field pr-12"
            id={newPasswordId}
            onChange={(event) => {
              setNewPassword(event.target.value)
              clearError()
            }}
            placeholder="At least 8 characters"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
          />
          <button
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            className="absolute right-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 p-2 text-neutral-500"
            onClick={() => setShowNewPassword((value) => !value)}
            type="button"
          >
            {showNewPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
          </button>
        </span>

        <label className="text-sm font-bold" htmlFor={confirmPasswordId}>Confirm new password</label>
        <input
          ref={confirmPasswordRef}
          autoComplete="new-password"
          className="field -mt-2"
          id={confirmPasswordId}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            clearError()
          }}
          placeholder="Re-enter your new password"
          type={showNewPassword ? 'text' : 'password'}
          value={confirmPassword}
        />

        <button
          className="primary-button mt-1 flex items-center justify-center gap-2"
          disabled={!isOnline || changePasswordMutation.isPending}
          type="submit"
        >
          {changePasswordMutation.isPending ? 'Updating password…' : submitLabel}
        </button>
      </form>
    </>
  )
}
