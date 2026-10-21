import { FlaskConical, ShieldCheck } from 'lucide-react'
import { backendMode } from '../services/index.js'

export default function DemoNotice({ className = '' }) {
  if (backendMode === 'mock') {
    return (
      <p className={`flex items-start gap-2 rounded-2xl bg-sage/70 px-4 py-3 text-xs leading-relaxed text-sage-dark ${className}`}>
        <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Mock data mode (development).</strong> Accounts are saved only in this browser’s
          localStorage. This is not secure authentication, so please don’t use a real password.
        </span>
      </p>
    )
  }

  return (
    <p className={`flex items-start gap-2 rounded-2xl bg-sage/70 px-4 py-3 text-xs leading-relaxed text-sage-dark ${className}`}>
      <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>Sign-in is handled by Supabase Auth. Your password is never stored by this website.</span>
    </p>
  )
}
