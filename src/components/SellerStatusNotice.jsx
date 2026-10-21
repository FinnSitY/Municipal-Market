import { Clock, Store, XCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'
import { MUNICIPALITY_LABEL } from '../lib/config.js'
import { sellerReadiness } from '../lib/sellerStatus.js'
import Button from './Button.jsx'

const content = {
  'no-shop': {
    icon: Store,
    tone: 'bg-white/80 text-nordic',
    title: 'Set up your shop',
    body: 'Add your shop name, category and barangay before listing products.',
    action: { to: '/seller/profile', label: 'Set up shop' },
  },
  pending: {
    icon: Clock,
    tone: 'bg-[#f6e3bf] text-[#7a4b00]',
    title: 'Your seller account is awaiting approval',
    body: `The marketplace administrator checks that each seller is based in ${MUNICIPALITY_LABEL}. You can prepare your shop profile now; publishing products unlocks once you’re approved.`,
  },
  rejected: {
    icon: XCircle,
    tone: 'bg-[#fbe4e0] text-danger',
    title: 'Your seller application wasn’t approved',
    body: 'Please contact the marketplace administrator if you think this is a mistake.',
  },
}

/** Banner explaining why a seller can't list products yet. Renders nothing for ready sellers. */
export default function SellerStatusNotice({ className = '' }) {
  const { user } = useAuth()
  const info = content[sellerReadiness(user)]
  if (!info) return null
  const Icon = info.icon

  return (
    <div role="status" className={`flex flex-col gap-4 rounded-3xl p-5 shadow-neu-sm sm:flex-row sm:items-center ${info.tone} ${className}`}>
      <Icon className="size-6 shrink-0" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-bold">{info.title}</p>
        <p className="mt-1 text-sm opacity-90">{info.body}</p>
      </div>
      {info.action && (
        <Button to={info.action.to} variant="secondary" size="sm">
          {info.action.label}
        </Button>
      )}
    </div>
  )
}
