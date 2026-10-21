import { Store } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Logo({ className = '' }) {
  return (
    <Link
      to="/"
      className={`group inline-flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic focus-visible:ring-offset-4 focus-visible:ring-offset-vanilla ${className}`}
      aria-label="Bayanihan Market home"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-nordic text-vanilla shadow-neu transition group-hover:-translate-y-0.5">
        <Store className="size-5" aria-hidden="true" />
      </span>
      <span className="leading-none">
        <span className="block text-lg font-extrabold tracking-tight text-nordic">Bayanihan</span>
        <span className="block text-[0.7rem] font-semibold tracking-[0.25em] text-muted uppercase">Market</span>
      </span>
    </Link>
  )
}
