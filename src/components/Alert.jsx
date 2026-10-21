import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

const tones = {
  success: { icon: CircleCheck, classes: 'bg-sage text-sage-dark' },
  error: { icon: CircleAlert, classes: 'bg-[#fbe4e0] text-danger' },
  info: { icon: Info, classes: 'bg-white/80 text-nordic' },
}

export default function Alert({ type = 'info', children, onDismiss, className = '' }) {
  const { icon: Icon, classes } = tones[type] ?? tones.info

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-neu-sm ${classes} ${className}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 leading-relaxed">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-1 rounded-lg p-1 opacity-70 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Dismiss message"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
