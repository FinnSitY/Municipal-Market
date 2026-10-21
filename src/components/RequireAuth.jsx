import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

/** Sends signed-out visitors to Sign In and brings them back afterwards. UI only; RLS protects the data. */
export default function RequireAuth() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{ from: location.pathname, flash: { type: 'info', message: 'Please sign in to continue.' } }}
      />
    )
  }
  return <Outlet />
}
