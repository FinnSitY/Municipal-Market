import { Eye, PackagePlus, PackageSearch, Pencil, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../components/Alert.jsx'
import AvailabilityBadge from '../../components/AvailabilityBadge.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import LoadState from '../../components/LoadState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProductImage from '../../components/ProductImage.jsx'
import SellerStatusNotice from '../../components/SellerStatusNotice.jsx'
import TextField from '../../components/TextField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useMarket } from '../../hooks/useMarket.js'
import { formatPrice } from '../../lib/products.js'
import { formatQuantity } from '../../lib/units.js'

export default function MyProducts() {
  const { user } = useAuth()
  const { products, status, error, reload, deleteProduct } = useMarket()
  const [query, setQuery] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [notice, setNotice] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const mine = products
    .filter((p) => p.sellerId === user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const visible = mine.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))

  async function confirmDelete() {
    setDeleting(true)
    try {
      const removed = await deleteProduct(pendingDelete.id)
      setNotice({ type: 'success', message: `“${removed.name}” was deleted from your shop.` })
    } catch (err) {
      setNotice({ type: 'error', message: err.message })
    }
    setDeleting(false)
    setPendingDelete(null)
  }

  return (
    <>
      <PageHeader
        eyebrow="Seller dashboard"
        title="My Products"
        description={`${mine.length} ${mine.length === 1 ? 'listing' : 'listings'} in your shop.`}
        actions={
          <Button to="/seller/products/add">
            <PackagePlus className="size-5" aria-hidden="true" />
            Add Product
          </Button>
        }
      />

      <SellerStatusNotice className="mb-6" />

      {notice && (
        <Alert type={notice.type} onDismiss={() => setNotice(null)} className="mb-6">
          {notice.message}
        </Alert>
      )}

      {status !== 'ready' ? (
        <LoadState status={status} error={error} onRetry={reload} />
      ) : mine.length === 0 ? (
        <EmptyState icon={PackagePlus} title="No products yet" action={<Button to="/seller/products/add">Add your first product</Button>}>
          Add a product and it will appear in the marketplace right away.
        </EmptyState>
      ) : (
        <>
          <TextField
            id="my-products-search"
            label="Search your products"
            type="search"
            icon={Search}
            placeholder="Search by product name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-6 max-w-md"
          />

          {visible.length === 0 ? (
            <EmptyState icon={PackageSearch} title="No matching products" action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>}>
              Nothing in your shop matches “{query}”.
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {visible.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-vanilla p-4 shadow-neu sm:flex-nowrap">
                  <ProductImage imageUrl={p.imageUrl} name={p.name} category={p.category} iconClassName="size-7" className="size-20 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${p.id}`} className="block truncate font-bold text-ink hover:text-nordic">
                      {p.name}
                    </Link>
                    <p className="truncate text-sm text-muted">
                      {p.category} · Brgy. {p.barangay}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="font-extrabold text-nordic">{formatPrice(p)}</span>
                      <AvailabilityBadge stock={p.stock} unit={p.unit} />
                      {!p.isActive && (
                        <span className="rounded-full bg-[#ebe5d6] px-2.5 py-1 text-xs font-semibold text-muted">Hidden</span>
                      )}
                      <span className="text-xs text-muted">Stock: {formatQuantity(p.stock, p.unit)}</span>
                    </div>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button to={`/products/${p.id}`} variant="ghost" size="sm" aria-label={`View ${p.name}`} className="flex-1 sm:flex-none">
                      <Eye className="size-4" aria-hidden="true" />
                      <span className="sm:sr-only">View</span>
                    </Button>
                    <Button to={`/seller/products/edit/${p.id}`} variant="secondary" size="sm" className="flex-1 sm:flex-none">
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPendingDelete(p)}
                      className="flex-1 text-danger! sm:flex-none"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this product?"
        confirmLabel={deleting ? 'Deleting…' : 'Delete product'}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        <strong className="text-ink">{pendingDelete?.name}</strong> will be removed from the marketplace and from buyers’
        wishlists. This can’t be undone.
      </ConfirmDialog>
    </>
  )
}
