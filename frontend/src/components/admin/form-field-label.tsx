import type { ReactNode } from 'react'

export function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {' '}
      *
    </span>
  )
}

interface FormFieldLabelProps {
  htmlFor?: string
  required?: boolean
  optional?: boolean
  children: ReactNode
  className?: string
}

export function FormFieldLabel({
  htmlFor,
  required = false,
  optional = false,
  children,
  className = 'text-sm font-semibold text-foreground',
}: FormFieldLabelProps) {
  return (
    <label className={className} htmlFor={htmlFor}>
      {children}
      {required ? <RequiredMark /> : null}
      {optional ? (
        <span className="font-normal text-muted-foreground"> (optional)</span>
      ) : null}
    </label>
  )
}
