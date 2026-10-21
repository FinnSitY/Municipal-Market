import { ArrowLeft, CalendarDays, EyeOff, Info, MapPin, PackageX, Pencil, ShoppingCart, Store, Tag } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import AvailabilityBadge from '../components/AvailabilityBadge.jsx'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadState from '../components/LoadState.jsx'
import ProductCard from '../components/ProductCard.jsx'
import ProductImage from '../components/ProductImage.jsx'
import QuantityPicker from '../components/QuantityPicker.jsx'
import TextLink from '../components/TextLink.jsx'
import WishlistButton from '../components/WishlistButton.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useCart } from '../hooks/useCart.js'
import { useMarket } from '../hooks/useMarket.js'
import { formatPeso } from '../lib/products.js'
import { formatQuantity, maxOrderable } from '../lib/units.js'

export default function ProductDetails() {
  const { id } = useParams()
  const { products, status, error, reload } = useMarket()
  const { user } = useAuth()
  const { add: addToCart } = useCart()
  // Chosen amount per product id; defaults to the smallest orderable amount.
  const [chosen, setChosen] = useState({})
  const [added, setAdded] = useState(null)

  if (status !== 'ready') return <LoadState status={status} error={error} onRetry={reload} label="Loading product…" />

  const found = products.find((p) => p.id === id)
  // Hidden listings are only visible to their seller (the database enforces this too).
  const product = found && (found.isActive !== false || found.sellerId === user?.id) ? found : null

  if (!product) {
    return (
      <EmptyState
        icon={PackageX}
        title="This product isn’t available"
        className="mt-6"
        action={<Button to="/marketplace">Back to Marketplace</Button>}
      >
        It may have been removed by the seller, or the link is incorrect.
      </EmptyState>
    )
  }

  const isOwner = user?.id === product.sellerId
  // Default to 1 kg (or 1 piece) when that much is available, otherwise the smallest step.
  const maxQty = maxOrderable(product)
  const defaultQty = product.unit === 'kg' && maxQty < 1 ? product.weightStep : 1
  const quantity = Math.min(chosen[product.id] ?? defaultQty, maxQty)
  const moreFromShop = products
    .filter((p) => p.sellerId === product.sellerId && p.id !== product.id && p.isActive !== false)
    .slice(0, 4)
  const details = [
    { icon: Tag, label: 'Category', value: product.category },
    { icon: MapPin, label: 'Location', value: `Brgy. ${product.barangay}, ${product.municipality}` },
    {
      icon: CalendarDays,
      label: 'Listed',
      value: new Date(product.createdAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
    },
  ]

  return (
    <>
      <TextLink to="/marketplace" className="inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Marketplace
      </TextLink>

      <article className="mt-6 grid items-start gap-10 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-vanilla p-4 shadow-neu-lg">
          <ProductImage
            imageUrl={product.imageUrl}
            name={product.name}
            category={product.category}
            iconClassName="size-24"
            className="aspect-square w-full rounded-3xl"
          />
        </div>

        <div>
          {product.isActive === false && (
            <p className="mb-4 flex items-center gap-2 rounded-2xl bg-[#ebe5d6] px-4 py-2 text-sm font-semibold text-muted">
              <EyeOff className="size-4" aria-hidden="true" />
              Hidden from buyers. Only you can see this listing.
            </p>
          )}
          <span className="inline-block rounded-full bg-sage px-3 py-1 text-xs font-semibold text-sage-dark">{product.category}</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-3xl font-extrabold text-nordic">
            {formatPeso(product.price)}
            {product.unit === 'kg' && <span className="text-lg font-semibold text-muted"> per kilo</span>}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
            <AvailabilityBadge stock={product.stock} unit={product.unit} />
            {product.stock > 0 ? `${formatQuantity(product.stock, product.unit)} available` : 'Check back soon for restocks'}
          </div>

          <p className="mt-6 leading-relaxed whitespace-pre-line text-muted">{product.description}</p>

          <QuantityPicker
            key={product.id}
            product={product}
            quantity={quantity}
            onChange={(q) => {
              setChosen((all) => ({ ...all, [product.id]: q }))
              setAdded(null)
            }}
          />

          {added?.productId === product.id && (
            <Alert type="success" onDismiss={() => setAdded(null)} className="mt-6">
              Added {formatQuantity(added.quantity, product.unit)} to your cart.{' '}
              <TextLink to="/cart">View cart</TextLink>
            </Alert>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {!isOwner && product.isActive !== false && maxQty > 0 && (
              <Button
                onClick={() => {
                  addToCart(product.id, quantity)
                  setAdded({ productId: product.id, quantity })
                }}
              >
                <ShoppingCart className="size-5" aria-hidden="true" />
                Add to cart · {formatPeso(Math.round(product.price * quantity * 100) / 100)}
              </Button>
            )}
            <WishlistButton product={product} withLabel />
            {isOwner && (
              <Button to={`/seller/products/edit/${product.id}`} variant="secondary">
                <Pencil className="size-4" aria-hidden="true" />
                Edit listing
              </Button>
            )}
          </div>

          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl p-4 shadow-neu-inset">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <Icon className="size-3.5" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center gap-4 rounded-3xl bg-vanilla p-5 shadow-neu">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-nordic text-white" aria-hidden="true">
              <Store className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-ink">{product.shopName}</p>
              <p className="text-sm text-muted">Run by {product.sellerName}</p>
            </div>
            <TextLink to={`/marketplace?seller=${encodeURIComponent(product.sellerId)}`} className="shrink-0 text-sm">
              View shop
            </TextLink>
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Pay in cash when you pick up or receive your order. The seller confirms each order before preparing it.
          </p>
        </div>
      </article>

      {moreFromShop.length > 0 && (
        <section className="mt-16" aria-labelledby="more-title">
          <h2 id="more-title" className="mb-6 text-2xl font-extrabold text-ink">
            More from {product.shopName}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {moreFromShop.map((p) => (
              <li key={p.id} className="flex">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
