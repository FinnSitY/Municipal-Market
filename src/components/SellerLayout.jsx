import { LayoutDashboard, LogOut, Package, PackagePlus, ReceiptText, Store } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const links = [
  { to: '/seller/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/seller/orders', label: 'Orders', icon: ReceiptText },
  { to: '/seller/products', label: 'My Products', icon: Package, end: true },
  { to: '/seller/products/add', label: 'Add Product', icon: PackagePlus },
  { to: '/seller/profile', label: 'Shop Profile', icon: Store },
]

const itemClasses =
  'inline-flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic'

export default function SellerLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    signOut()
    navigate('/', { state: { flash: { type: 'info', message: 'You’ve logged out of your seller dashboard.' } } })
  }

  return (
    <div className="grid items-start gap-8 pt-2 lg:grid-cols-[250px_1fr]">
      <aside className="rounded-[2rem] bg-vanilla p-4 shadow-neu lg:sticky lg:top-24">
        <div className="flex items-center gap-3 px-2 pt-1 pb-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-nordic text-white shadow-neu-sm" aria-hidden="true">
            <Store className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink">{user.shop?.name ?? 'Your shop'}</p>
            <p className="truncate text-xs text-muted">
              {user.shop ? `Brgy. ${user.shop.barangay}, ${user.shop.municipality}` : 'Not set up yet'}
            </p>
          </div>
        </div>

        <nav aria-label="Seller dashboard" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${itemClasses} ${isActive ? 'bg-nordic text-white shadow-neu-pressed' : 'text-muted hover:text-nordic hover:shadow-neu-sm'}`
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          <button type="button" onClick={handleLogout} className={`${itemClasses} text-danger hover:shadow-neu-sm lg:mt-4`}>
            <LogOut className="size-5" aria-hidden="true" />
            Logout
          </button>
        </nav>
      </aside>

      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  )
}
