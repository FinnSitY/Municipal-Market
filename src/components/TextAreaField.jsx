import FieldShell from './FieldShell.jsx'
import { describedBy } from './fieldUtils.js'

export default function TextAreaField({ id, label, error, hint, className, rows = 4, ...textareaProps }) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="w-full min-w-0 resize-y bg-transparent py-3 leading-relaxed text-ink outline-none placeholder:text-muted/70"
        {...textareaProps}
      />
    </FieldShell>
  )
}
