import { Bike, Map as MapIcon, MapPin, MessageSquareText, Phone, Store, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatOrderDate, statusLabel, statusTone } from '../lib/orders.js'
import { formatPeso } from '../lib/products.js'
import { formatQuantity } from '../lib/units.js'

export function OrderStatusBadge({ order }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {statusLabel(order)}
    </span>
  )
}

/** One order, as seen by the buyer or the seller. Buttons are passed in as `actions`. */
export default function OrderCard({ order, viewer, actions, showDetailsLink = true }) {
  const delivery = order.fulfillment === 'delivery'

  return (
    <article className="rounded-3xl bg-vanilla p-5 shadow-neu sm:p-6" aria-labelledby={`order-${order.id}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`order-${order.id}`} className="text-lg font-extrabold text-ink">
            Order #{order.orderNo}
          </h2>
          <p className="text-sm text-muted">{formatOrderDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge order={order} />
      </header>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {viewer === 'buyer' ? (
          <p className="flex items-start gap-2 text-ink">
            <Store className="mt-0.5 size-4 shrink-0 text-nordic" aria-hidden="true" />
            <span>
              <strong>{order.shopName}</strong>
              {order.shopBarangay && <span className="block text-muted">Brgy. {order.shopBarangay}, {order.shopMunicipality}</span>}
            </span>
          </p>
        ) : (
          <p className="flex items-start gap-2 text-ink">
            <User className="mt-0.5 size-4 shrink-0 text-nordic" aria-hidden="true" />
            <span>
              <strong>{order.buyerName}</strong>
              <a href={`tel:${order.contactPhone}`} className="flex items-center gap-1 font-semibold text-nordic hover:underline">
                <Phone className="size-3.5" aria-hidden="true" />
                {order.contactPhone}
              </a>
            </span>
          </p>
        )}
        <p className="flex items-start gap-2 text-ink">
          {delivery ? (
            <Bike className="mt-0.5 size-4 shrink-0 text-nordic" aria-hidden="true" />
          ) : (
            <MapPin className="mt-0.5 size-4 shrink-0 text-nordic" aria-hidden="true" />
          )}
          <span>
            <strong>{delivery ? 'Delivery' : 'Pickup at the shop'}</strong>
            <span className="block text-muted">
              {delivery ? `${order.deliveryAddress}, Brgy. ${order.deliveryBarangay}` : 'Pay in cash when you pick up'}
            </span>
          </span>
        </p>
      </div>

      <ul className="mt-4 divide-y divide-[#e8e1cf] rounded-2xl px-4 shadow-neu-inset">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{item.productName}</span>
              <span className="text-muted">
                {formatQuantity(item.quantity, item.unit)} × {formatPeso(item.unitPrice)}
                {item.unit === 'kg' ? '/kg' : ''}
              </span>
            </span>
            <span className="shrink-0 font-semibold text-ink">{formatPeso(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted">Total (cash {delivery ? 'on delivery' : 'on pickup'})</span>
        <span className="text-xl font-extrabold text-nordic">{formatPeso(order.total)}</span>
      </div>

      {order.note && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-white/60 px-4 py-2 text-sm text-muted">
          <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          “{order.note}”
        </p>
      )}
      {order.status === 'cancelled' && (
        <p className="mt-3 text-sm text-danger">
          Cancelled by {order.cancelledBy === viewer ? 'you' : order.cancelledBy === 'seller' ? 'the seller' : 'the buyer'}
          {order.cancelReason ? `: “${order.cancelReason}”` : '.'}
        </p>
      )}

      {(actions || showDetailsLink) && (
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          {showDetailsLink && (
            <Link
              to={`/orders/${order.id}`}
              className="mr-auto inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-nordic hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic"
            >
              <MapIcon className="size-4" aria-hidden="true" />
              {delivery ? 'View map & distance' : 'View details & map'}
            </Link>
          )}
          {actions}
        </div>
      )}
    </article>
  )
}
