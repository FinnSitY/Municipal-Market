import { MUNICIPALITY } from './config.js'
import { hasPoint, inServiceArea } from './geo.js'
import { compactErrors, required, validatePhone } from './validation.js'

const tones = {
  pending: 'bg-[#f6e3bf] text-[#7a4b00]',
  confirmed: 'bg-[#dfe1f0] text-nordic',
  ready: 'bg-[#d6e6ea] text-[#1f5560]',
  completed: 'bg-sage text-sage-dark',
  cancelled: 'bg-[#fbe4e0] text-danger',
}

export function statusLabel(order) {
  switch (order.status) {
    case 'pending':
      return 'Waiting for seller'
    case 'confirmed':
      return 'Confirmed'
    case 'ready':
      return order.fulfillment === 'delivery' ? 'Out for delivery' : 'Ready for pickup'
    case 'completed':
      return 'Completed'
    default:
      return 'Cancelled'
  }
}

export function statusTone(status) {
  return tones[status] ?? tones.pending
}

/** The seller's next step for an order, or null when there is none. */
export function nextSellerAction(order) {
  switch (order.status) {
    case 'pending':
      return { status: 'confirmed', label: 'Confirm order' }
    case 'confirmed':
      return { status: 'ready', label: order.fulfillment === 'delivery' ? 'Mark out for delivery' : 'Mark ready for pickup' }
    case 'ready':
      return { status: 'completed', label: 'Mark completed' }
    default:
      return null
  }
}

export function canCancel(order, role) {
  if (role === 'seller') return ['pending', 'confirmed', 'ready'].includes(order.status)
  return order.status === 'pending'
}

export const ACTIVE_STATUSES = ['pending', 'confirmed', 'ready']

export const EMPTY_CHECKOUT = {
  fulfillment: 'pickup',
  contactPhone: '',
  deliveryBarangay: '',
  deliveryAddress: '',
  deliveryPin: null,
  note: '',
}

// Mirrors the checks in the place_order() database function.
export function validateCheckout(form) {
  const delivery = form.fulfillment === 'delivery'
  return compactErrors({
    contactPhone: validatePhone(form.contactPhone, { required: true }),
    deliveryBarangay: delivery ? required(form.deliveryBarangay, `Choose your barangay in ${MUNICIPALITY.name}.`) : null,
    deliveryAddress: delivery
      ? required(form.deliveryAddress, 'Enter your street, purok or landmark.') ??
        (form.deliveryAddress.trim().length > 200 ? 'Keep the address under 200 characters.' : null)
      : null,
    deliveryPin: delivery
      ? !hasPoint(form.deliveryPin)
        ? 'Pin your delivery location on the map so the seller can find you.'
        : !inServiceArea(form.deliveryPin)
          ? `That pin is outside ${MUNICIPALITY.name}.`
          : null
      : null,
    note: form.note.trim().length > 300 ? 'Keep the note under 300 characters.' : null,
  })
}

export function formatOrderDate(iso) {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
