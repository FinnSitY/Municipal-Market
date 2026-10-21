import { Link } from 'react-router-dom'

export default function TextLink({ to, children, className = '' }) {
  return (
    <Link
      to={to}
      className={`rounded font-semibold text-nordic underline-offset-4 transition hover:text-nordic-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic focus-visible:ring-offset-2 focus-visible:ring-offset-vanilla ${className}`}
    >
      {children}
    </Link>
  )
}
