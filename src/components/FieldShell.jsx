import { CircleAlert } from 'lucide-react'

/** Shared label, inset well, hint and error message used by every form control. */
export default function FieldShell({ id, label, error, hint, icon: Icon, trailing, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div
        className={`relative flex items-center gap-3 rounded-2xl bg-vanilla px-4 shadow-neu-inset ring-1 transition focus-within:ring-2 ${
          error ? 'ring-danger/60 focus-within:ring-danger' : 'ring-transparent focus-within:ring-nordic/70'
        }`}
      >
        {Icon && <Icon className="size-5 shrink-0 text-muted" aria-hidden="true" />}
        {children}
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
