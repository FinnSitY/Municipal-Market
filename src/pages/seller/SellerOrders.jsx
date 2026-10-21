import { LoaderCircle, ReceiptText } from 'lucide-react'
import { useState } from 'react'
import Alert from '../../components/Alert.jsx'
import Button from '../../components/Button.jsx'
import CancelOrderDialog from '../../components/CancelOrderDialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import LoadState from '../../components/LoadState.jsx'
import OrderCard from '../../components/OrderCard.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useMarket } from '../../hooks/useMarket.js'
import { useOrders } from '../../hooks/useOrders.js'
import { ACTIVE_STATUSES, canCancel, nextSellerAction } from '../../lib/orders.js'

const FILTERS = [
  { value: 'active', label: 'To do', match: (o) => ACTIVE_STATUSES.includes(o.status) },
  { value: 'completed', label: 'Completed', match: (o) => o.status === 'completed' },
  { value: 'cancelled', label: 'Cancelled', match: (o) => o.status === 'cancelled' },
  { value: 'all', label: 'All', match: () => true },
]

const chipClasses = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic ${
    active ? 'bg-nordic text-white shadow-neu-pressed' : 'bg-vanilla text-muted shadow-neu-sm hover:text-nordic'
  }`

export default function SellerOrders() {
  const { orders, status, error, reload, updateStatus } = useOrders('shop')
  const { reload: reloadProducts } = useMarket()
  const [filter, setFilter] = useState('active')
  const [busyId, setBusyId] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [notice, setNotice] = useState(null)

  async function advance(order, next) {
    setBusyId(order.id)
    try {
      await updateStatus(order.id, next.status)
      setNotice({ type: 'success', message: `Order #${order.orderNo} updated.` })
    } catch (err) {
      setNotice({ type: 'error', message: err.message })
    }
    setBusyId(null)
  }

  async function confirmCancel(reason) {
    setBusyId(cancelling.id)
    try {
      await updateStatus(cancelling.id, 'cancelled', reason)
      setNotice({ type: 'success', message: `Order #${cancelling.orderNo} was cancelled and the items are back in stock.` })
      reloadProducts()
    } catch (err) {
      setNotice({ type: 'error', message: err.message })
    }
    setBusyId(null)
    setCancelling(null)
  }

  const { match } = FILTERS.find((f) => f.value === filter)
  const visible = orders.filter(match)

  return (
    <>
      <PageHeader eyebrow="Seller dashboard" title="Orders" description="Confirm new orders, prepare them, and mark them done." />

      {notice && (
        <Alert type={notice.type} onDismiss={() => setNotice(null)} className="mb-6">
          {notice.message}
        </Alert>
      )}

      <div role="group" aria-label="Filter orders" className="mb-6 flex flex-wrap gap-3">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)} className={chipClasses(filter === f.value)}>
            {f.label}
            {status === 'ready' && <span className="ml-1.5 opacity-80">{orders.filter(f.match).length}</span>}
          </button>
        ))}
      </div>

      {status !== 'ready' ? (
        <LoadState status={status} error={error} onRetry={reload} label="Loading orders…" />
      ) : visible.length === 0 ? (
        <EmptyState icon={ReceiptText} title={filter === 'active' ? 'No orders to handle right now' : 'No orders here'}>
          New orders appear here automatically when buyers check out.
        </EmptyState>
      ) : (
        <div className="grid gap-6 2xl:grid-cols-2">
          {visible.map((order) => {
            const next = nextSellerAction(order)
            const busy = busyId === order.id
            return (
              <OrderCard
                key={order.id}
                order={order}
                viewer="seller"
                actions={
                  (next || canCancel(order, 'seller')) && (
                    <>
                      {canCancel(order, 'seller') && (
                        <Button variant="ghost" size="sm" className="text-danger!" onClick={() => setCancelling(order)} disabled={busy}>
                          Cancel
                        </Button>
                      )}
                      {next && (
                        <Button size="sm" onClick={() => advance(order, next)} disabled={busy}>
                          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                          {next.label}
                        </Button>
                      )}
                    </>
                  )
                }
              />
            )
          })}
        </div>
      )}

      <CancelOrderDialog key={cancelling?.id} order={cancelling} busy={Boolean(cancelling) && busyId === cancelling.id} onConfirm={confirmCancel} onCancel={() => setCancelling(null)} />
    </>
  )
}
