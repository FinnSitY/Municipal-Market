import FieldShell from './FieldShell.jsx'
import { controlClasses, describedBy } from './fieldUtils.js'

export default function TextField({ id, label, error, hint, icon, trailing, className, ...inputProps }) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} icon={icon} trailing={trailing} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={controlClasses}
        {...inputProps}
      />
    </FieldShell>
  )
}
