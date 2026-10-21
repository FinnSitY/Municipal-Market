import { ChevronDown } from 'lucide-react'
import FieldShell from './FieldShell.jsx'
import { controlClasses, describedBy } from './fieldUtils.js'

/**
 * `options` may be strings or { value, label } objects. The placeholder is a disabled
 * prompt by default; pass `placeholderSelectable` to use it as an "All …" choice.
 */
export default function SelectField({
  id,
  label,
  error,
  hint,
  icon,
  options,
  placeholder,
  placeholderSelectable = false,
  className,
  ...selectProps
}) {
  const muted = !selectProps.value && !placeholderSelectable

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      icon={icon}
      className={className}
      trailing={<ChevronDown className="pointer-events-none size-5 shrink-0 text-muted" aria-hidden="true" />}
    >
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${controlClasses} cursor-pointer appearance-none ${muted ? 'text-muted' : ''}`}
        {...selectProps}
      >
        {placeholder && (
          <option value="" disabled={!placeholderSelectable}>
            {placeholder}
          </option>
        )}
        {options.map((option) => {
          const { value, label: text } = typeof option === 'string' ? { value: option, label: option } : option
          return (
            <option key={value} value={value} className="text-ink">
              {text}
            </option>
          )
        })}
      </select>
    </FieldShell>
  )
}
