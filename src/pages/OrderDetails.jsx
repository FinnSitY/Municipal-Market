import { ArrowLeft, PackageX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadState from '../components/LoadState.jsx'
import OrderCard from '../components/OrderCard.jsx'
import OrderMap from '../components/OrderMap.jsx'
import PageHeader from '../components/PageHeader.jsx'
import TextLink from '../components/TextLink.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { backend } from '../services/index.js'

/** One order with its delivery map. Open to the order's buyer and seller only (RLS). */
export default function OrderDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const [state, setState] = useState({ key: null, status: 'loading', order: null, error: '' })
  const [attempt, setAttempt] = useState(0)
  const key = `${id}:${attempt}`

  useEffect(() => {
    let active = true
    backend.orders.get(id, { user }).then(
      (order) => active && setState({ key, status: 'ready', order, error: '' }),
      (err) => active && setState({ key, status: 'error', order: null, error: err.message }),
    )
    let timer
    const unsubscribe = backend.orders.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(() => setAttempt((n) => n + 1), 400)
    })
    return () => {
      active = false
      clearTimeout(timer)
      unsubscribe()
    }
  }, [id, key, user])

  // Keep showing the previous order while a refresh loads.
  const status = state.key === key || state.order ? state.status : 'loading'
  const { order } = state
  const viewer = order && order.sellerId === user.id ? 'seller' : 'buyer'
  const backTo = viewer === 'seller' ? '/seller/orders' : '/orders'

  return (
    <>
      <TextLink to={backTo} className="inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {viewer === 'seller' ? 'Back to shop orders' : 'Back to my orders'}
      </TextLink>

      {status !== 'ready' && !order ? (
        <div className="mt-6">
          <LoadState status={status} error={state.error} onRetry={() => setAttempt((n) => n + 1)} label="Loading order…" />
        </div>
      ) : !order ? (
        <EmptyState icon={PackageX} title="Order not found" className="mt-6" action={<Button to={backTo}>Back to orders</Button>}>
          It may belong to another account, or the link is incorrect.
        </EmptyState>
      ) : (
        <>
          <div className="mt-6">
            <PageHeader
              eyebrow={order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup'}
              title={`Order #${order.orderNo}`}
              description={
                order.fulfillment === 'delivery'
                  ? viewer === 'seller'
                    ? `Deliver to ${order.buyerName} in Brgy. ${order.deliveryBarangay}.`
                    : `From ${order.shopName} to your pinned location.`
                  : viewer === 'seller'
                    ? `${order.buyerName} will pick this up at your shop.`
                    : `Pick up at ${order.shopName}.`
              }
            />
          </div>
          <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_1fr]">
            <OrderMap order={order} viewer={viewer} />
            <OrderCard order={order} viewer={viewer} showDetailsLink={false} />
          </div>
        </>
      )}
    </>
  )
}
