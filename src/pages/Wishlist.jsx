import { Heart, LogIn, Trash2 } from 'lucide-react'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadState from '../components/LoadState.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProductCard from '../components/ProductCard.jsx'
import TextLink from '../components/TextLink.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useMarket } from '../hooks/useMarket.js'

export default function Wishlist() {
  const { user } = useAuth()
  const { products, status, error, reload, wishlist, wishlistNeedsSignIn, clearWishlist } = useMarket()

  if (wishlistNeedsSignIn) {
    return (
      <>
        <PageHeader eyebrow="Your picks" title="Wishlist" />
        <EmptyState
          icon={LogIn}
          title="Sign in to see your wishlist"
          action={
            <>
              <Button to="/signin" state={{ from: '/wishlist' }}>
                Sign In
              </Button>
              <Button to="/register" variant="secondary">
                Create Account
              </Button>
            </>
          }
        >
          Your wishlist is saved to your account, so it follows you on any device.
        </EmptyState>
      </>
    )
  }

  // Listings that were deleted or hidden by their seller simply drop out of the list.
  const saved = wishlist
    .map((id) => products.find((p) => p.id === id))
    .filter((p) => p && p.isActive !== false)

  return (
    <>
      <PageHeader
        eyebrow="Your picks"
        title="Wishlist"
        description={`${saved.length} saved ${saved.length === 1 ? 'item' : 'items'} from local sellers.`}
        actions={
          saved.length > 0 && (
            <Button variant="secondary" onClick={clearWishlist}>
              <Trash2 className="size-4" aria-hidden="true" />
              Clear wishlist
            </Button>
          )
        }
      />

      {!user && (
        <Alert type="info" className="mb-8">
          You’re browsing as a guest, so this wishlist is saved only in this browser.{' '}
          <TextLink to="/signin">Sign in</TextLink> to keep a separate wishlist for your demo account.
        </Alert>
      )}

      {status !== 'ready' ? (
        <LoadState status={status} error={error} onRetry={reload} />
      ) : saved.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {saved.map((product) => (
            <li key={product.id} className="flex">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Heart} title="Your wishlist is empty" action={<Button to="/marketplace">Browse the Marketplace</Button>}>
          Tap the heart on any product to save it here for later.
        </EmptyState>
      )}
    </>
  )
}
