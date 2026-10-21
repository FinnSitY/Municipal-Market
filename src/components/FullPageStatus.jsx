import { CircleAlert, LoaderCircle, Store } from 'lucide-react'

/** Full-screen loading or error card shown before the router is ready (no links available). */
export default function FullPageStatus({ loading = false, title, children, action }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-lg rounded-[2rem] bg-vanilla p-8 text-center shadow-neu-lg sm:p-10" role={loading ? 'status' : 'alert'}>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-nordic text-vanilla shadow-neu">
          {loading ? (
            <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
          ) : action ? (
            <CircleAlert className="size-6" aria-hidden="true" />
          ) : (
            <Store className="size-6" aria-hidden="true" />
          )}
        </span>
        <h1 className="mt-6 text-xl font-bold text-ink">{title}</h1>
        {children && <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-nordic px-6 font-semibold text-white shadow-neu transition hover:-translate-y-0.5 hover:bg-nordic-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic focus-visible:ring-offset-2 focus-visible:ring-offset-vanilla"
          >
            {action.label}
          </button>
        )}
      </div>
    </main>
  )
}
