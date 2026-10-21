import { CircleAlert, Check } from 'lucide-react'

export default function Checkbox({ id, checked, onChange, error, children, className = '' }) {
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-lg bg-vanilla shadow-neu-inset transition checked:bg-nordic checked:shadow-neu-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic focus-visible:ring-offset-2 focus-visible:ring-offset-vanilla"
          />
          <Check className="pointer-events-none relative size-4 text-white opacity-0 transition peer-checked:opacity-100" strokeWidth={3} aria-hidden="true" />
        </span>
        <label htmlFor={id} className="cursor-pointer text-sm leading-6 text-ink select-none">
          {children}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
