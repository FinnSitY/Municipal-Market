import { ShieldAlert } from 'lucide-react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Button from './Button.jsx'
import EmptyState from './EmptyState.jsx'

/**
 * Keeps seller pages to demo seller accounts. This is a UI guard only: with
 * localStorage auth, anyone with browser access could still change the data.
 */
export default function RequireSeller() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{
          from: location.pathname,
          flash: { type: 'info', message: 'Please sign in with a seller account to open the seller dashboard.' },
        }}
      />
    )
  }

  if (user.accountType !== 'seller') {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Seller accounts only"
        className="mt-6"
        action={
          <>
            <Button to="/marketplace">Back to Marketplace</Button>
            <Button
              variant="secondary"
              onClick={() => {
                signOut()
                navigate('/signin', { state: { from: location.pathname } })
              }}
            >
              Switch account
            </Button>
          </>
        }
      >
        You’re signed in as a buyer. To list products, sign in with a seller account or create one.
      </EmptyState>
    )
  }

  return <Outlet />
}
