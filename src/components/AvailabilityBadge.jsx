import { getAvailability } from '../lib/products.js'

const tones = {
  'in-stock': 'bg-sage text-sage-dark',
  low: 'bg-[#f6e3bf] text-[#7a4b00]',
  'sold-out': 'bg-[#fbe4e0] text-danger',
}

export default function AvailabilityBadge({ stock, unit = 'piece', className = '' }) {
  const { status, label } = getAvailability(stock, unit)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status]} ${className}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}
