import { CloudOff, LoaderCircle } from 'lucide-react'
import Button from './Button.jsx'
import EmptyState from './EmptyState.jsx'

/** Shared loading / error display for data pages. Returns null once data is ready. */
export default function LoadState({ status, error, onRetry, label = 'Loading products…' }) {
  if (status === 'loading') {
    return (
      <div role="status" className="flex items-center justify-center gap-3 rounded-[2rem] px-6 py-16 text-muted shadow-neu-inset">
        <LoaderCircle className="size-6 animate-spin text-nordic" aria-hidden="true" />
        {label}
      </div>
    )
  }
  if (status === 'error') {
    return (
      <EmptyState icon={CloudOff} title="We couldn’t load this page" action={onRetry && <Button onClick={onRetry}>Try again</Button>}>
        {error}
      </EmptyState>
    )
  }
  return null
}
