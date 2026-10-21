import { BellRing, CircleCheck, Package, PackagePlus, PackageX, Pencil, Store, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import Alert from '../../components/Alert.jsx'
import AvailabilityBadge from '../../components/AvailabilityBadge.jsx'
import Button from '../../components/Button.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import LoadState from '../../components/LoadState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProductImage from '../../components/ProductImage.jsx'
import SellerStatusNotice from '../../components/SellerStatusNotice.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useMarket } from '../../hooks/useMarket.js'
import { useOrders } from '../../hooks/useOrders.js'
import { formatPrice, getAvailability } from '../../lib/products.js'
import { formatQuantity } from '../../lib/units.js'

function StatCard({ icon: Icon, label, value, tone = 'text-nordic' }) {
  return (
    <div className="rounded-3xl bg-vanilla p-5 shadow-neu">
      <span className={`grid size-11 place-items-center rounded-2xl shadow-neu-inset ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-2xl font-extrabold break-words text-ink sm:text-3xl">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}

export default function SellerDashboard() {
  const { user } = useAuth()
  const { products, status, error, reload } = useMarket()
  const { orders, status: ordersStatus } = useOrders('shop')
  const newOrders = orders.filter((o) => o.status === 'pending').length
  const mine = products.filter((p) => p.sellerId === user.id)
  const active = mine.filter((p) => p.isActive && p.stock > 0)
  const lowStock = mine.filter((p) => getAvailability(p.stock, p.unit).status === 'low')
  const soldOut = mine.filter((p) => p.stock <= 0)
  const recent = [...mine].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
  const needsAttention = [...soldOut, ...lowStock]

  return (
    <>
      <PageHeader
        eyebrow="Seller dashboard"
        title={`Magandang araw, ${user.fullName.split(' ')[0]}!`}
        description="Here’s how your shop is doing today."
        actions={
          <Button to="/seller/products/add">
            <PackagePlus className="size-5" aria-hidden="true" />
            Add Product
          </Button>
        }
      />

      <SellerStatusNotice className="mb-8" />

      {user.shop && user.shop.lat == null && (
        <Alert type="info" className="mb-8">
          Pin your shop on the map so buyers can see how far you are from them.{' '}
          <Link to="/seller/profile" className="font-semibold underline">
            Set shop location
          </Link>
        </Alert>
      )}

      {status !== 'ready' ? (
        <LoadState status={status} error={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
            <StatCard icon={Package} label="Total products" value={mine.length} />
            <StatCard icon={CircleCheck} label="Active listings" value={active.length} tone="text-sage-dark" />
            <StatCard icon={PackageX} label="Sold out" value={soldOut.length} tone="text-danger" />
            <Link to="/seller/orders" className="rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic">
              <StatCard icon={BellRing} label="New orders" value={ordersStatus === 'ready' ? newOrders : '…'} tone={newOrders ? 'text-[#7a4b00]' : 'text-nordic'} />
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted">
            Active listings are visible to buyers and have at least 1 item in stock.
          </p>

          {mine.length === 0 ? (
            <EmptyState
              icon={Store}
              title="Your shop is ready for its first product"
              className="mt-10"
              action={<Button to="/seller/products/add">Add your first product</Button>}
            >
              Listings you add appear in the marketplace right away for buyers in this browser.
            </EmptyState>
          ) : (
            <div className="mt-10 grid gap-8 xl:grid-cols-[1.4fr_1fr]">
              <section className="rounded-[2rem] bg-vanilla p-6 shadow-neu" aria-labelledby="recent-title">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 id="recent-title" className="text-lg font-bold text-ink">
                    Recently updated
                  </h2>
                  <Link to="/seller/products" className="text-sm font-semibold text-nordic hover:underline">
                    View all
                  </Link>
                </div>
                <ul className="divide-y divide-[#e8e1cf]">
                  {recent.map((p) => (
                    <li key={p.id} className="flex items-center gap-4 py-3">
                      <ProductImage
                        imageUrl={p.imageUrl}
                        name={p.name}
                        category={p.category}
                        iconClassName="size-6"
                        className="size-14 shrink-0 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/products/${p.id}`}
                          className="block truncate font-semibold text-ink hover:text-nordic"
                        >
                          {p.name}
                        </Link>
                        <p className="text-sm text-muted">{formatPrice(p)}</p>
                      </div>
                      <AvailabilityBadge stock={p.stock} unit={p.unit} className="hidden sm:inline-flex" />
                      <Button
                        to={`/seller/products/edit/${p.id}`}
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-[2rem] bg-vanilla p-6 shadow-neu" aria-labelledby="attention-title">
                <h2 id="attention-title" className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
                  <TriangleAlert className="size-5 text-[#7a4b00]" aria-hidden="true" />
                  Needs restocking
                </h2>
                {needsAttention.length ? (
                  <ul className="space-y-3">
                    {needsAttention.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-2xl p-3 shadow-neu-inset"
                      >
                        <span className="min-w-0 truncate text-sm font-semibold text-ink">{p.name}</span>
                        <Link
                          to={`/seller/products/edit/${p.id}`}
                          className="shrink-0 rounded-lg text-sm font-semibold text-nordic hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic"
                        >
                          {p.stock <= 0 ? 'Restock' : `${formatQuantity(p.stock, p.unit)} left · Update`}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">All your products are well stocked. 🎉</p>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button to="/seller/profile" variant="secondary" size="sm">
                    Edit shop profile
                  </Button>
                  <Button to={`/marketplace?seller=${encodeURIComponent(user.id)}`} variant="ghost" size="sm">
                    View my shop
                  </Button>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </>
  )
}
