import { ReceiptText } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import CancelOrderDialog from '../components/CancelOrderDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadState from '../components/LoadState.jsx'
import OrderCard from '../components/OrderCard.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useMarket } from '../hooks/useMarket.js'
import { useOrders } from '../hooks/useOrders.js'
import { canCancel } from '../lib/orders.js'

export default function MyOrders() {
  const { orders, status, error, reload, updateStatus } = useOrders('mine')
  const { reload: reloadProducts } = useMarket()
  const [cancelling, setCancelling] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  async function confirmCancel(reason) {
    setBusy(true)
    try {
      await updateStatus(cancelling.id, 'cancelled', reason)
      setNotice({ type: 'success', message: `Order #${cancelling.orderNo} was cancelled.` })
      reloadProducts()
    } catch (err) {
      setNotice({ type: 'error', message: err.message })
    }
    setBusy(false)
    setCancelling(null)
  }

  return (
    <>
      <PageHeader eyebrow="Shopping" title="My Orders" description="Track your orders from local sellers." />

      {notice && (
        <Alert type={notice.type} onDismiss={() => setNotice(null)} className="mb-6">
          {notice.message}
        </Alert>
      )}

      {status !== 'ready' ? (
        <LoadState status={status} error={error} onRetry={reload} label="Loading your orders…" />
      ) : orders.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No orders yet" action={<Button to="/marketplace">Start shopping</Button>}>
          Orders you place will appear here so you can follow their status.
        </EmptyState>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              viewer="buyer"
              actions={
                canCancel(order, 'buyer') && (
                  <Button variant="secondary" size="sm" className="text-danger!" onClick={() => setCancelling(order)}>
                    Cancel order
                  </Button>
                )
              }
            />
          ))}
        </div>
      )}

      <CancelOrderDialog key={cancelling?.id} order={cancelling} busy={busy} onConfirm={confirmCancel} onCancel={() => setCancelling(null)} />
    </>
  )
}
