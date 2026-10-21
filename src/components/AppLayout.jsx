import { Outlet } from 'react-router-dom'
import { useFlash } from '../hooks/useFlash.js'
import { useMarket } from '../hooks/useMarket.js'
import Alert from './Alert.jsx'
import Footer from './Footer.jsx'
import Navbar from './Navbar.jsx'

/** Shell for app pages: navbar, one-off flash and action-error messages, content and footer. */
export default function AppLayout() {
  const [flash, dismissFlash] = useFlash()
  const { actionError, clearActionError } = useMarket()

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 pb-16 sm:px-6">
        {flash && (
          <Alert type={flash.type} onDismiss={dismissFlash} className="mb-6">
            {flash.message}
          </Alert>
        )}
        {actionError && (
          <Alert type="error" onDismiss={clearActionError} className="mb-6">
            {actionError}
          </Alert>
        )}
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
