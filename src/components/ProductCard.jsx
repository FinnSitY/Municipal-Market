import { MapPin, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatPeso } from '../lib/products.js'
import { unitSuffix } from '../lib/units.js'
import AvailabilityBadge from './AvailabilityBadge.jsx'
import ProductImage from './ProductImage.jsx'
import WishlistButton from './WishlistButton.jsx'

export default function ProductCard({ product }) {
  return (
    <article className="group relative flex w-full flex-col rounded-3xl bg-vanilla p-3 shadow-neu transition duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-2xl">
        <ProductImage
          imageUrl={product.imageUrl}
          name={product.name}
          category={product.category}
          className={`aspect-[4/3] w-full transition duration-500 group-hover:scale-105 ${product.stock <= 0 ? 'opacity-60 grayscale' : ''}`}
        />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-nordic">
          {product.category}
        </span>
      </div>
      <WishlistButton product={product} className="absolute top-5 right-5 z-10" />

      <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
        <h3 className="font-bold leading-snug text-ink">
          {/* Stretched link makes the whole card clickable while keeping one focusable link. */}
          <Link
            to={`/products/${product.id}`}
            className="rounded after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-nordic"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted">
          <Store className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{product.shopName}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          Brgy. {product.barangay}, {product.municipality}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="text-xl font-extrabold text-nordic">
            {formatPeso(product.price)}
            {product.unit === 'kg' && <span className="text-sm font-semibold text-muted"> {unitSuffix(product.unit)}</span>}
          </p>
          <AvailabilityBadge stock={product.stock} unit={product.unit} />
        </div>
      </div>
    </article>
  )
}
