export function describedBy(id, error, hint) {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

export const controlClasses = 'h-12 w-full min-w-0 bg-transparent text-ink placeholder:text-muted/70 outline-none'
