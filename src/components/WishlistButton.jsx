import { Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMarket } from '../hooks/useMarket.js'

export default function WishlistButton({ product, withLabel = false, className = '' }) {
  const { isWishlisted, toggleWishlist } = useMarket()
  const navigate = useNavigate()
  const location = useLocation()
  const saved = isWishlisted(product.id)

  async function handleClick() {
    const { needsSignIn } = await toggleWishlist(product.id)
    if (needsSignIn) {
      navigate('/signin', {
        state: {
          from: location.pathname + location.search,
          flash: { type: 'info', message: 'Sign in to save products to your wishlist.' },
        },
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic focus-visible:ring-offset-2 focus-visible:ring-offset-vanilla ${
        saved ? 'bg-nordic text-white shadow-neu-pressed' : 'bg-vanilla text-nordic shadow-neu hover:-translate-y-0.5'
      } ${withLabel ? 'h-12 px-5' : 'size-10'} ${className}`}
    >
      <Heart className={`size-5 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
      {withLabel && (saved ? 'Saved to wishlist' : 'Add to wishlist')}
    </button>
  )
}
