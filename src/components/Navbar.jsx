import { Heart, LayoutDashboard, LogOut, Menu, ReceiptText, ShoppingBasket, ShoppingCart, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useCart } from '../hooks/useCart.js'
import { useMarket } from '../hooks/useMarket.js'
import Button from './Button.jsx'
import Logo from './Logo.jsx'

const linkClasses = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic ${
    isActive ? 'text-nordic shadow-neu-inset' : 'text-muted hover:text-nordic'
  }`

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { wishlist } = useMarket()
  const { count: cartCount } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = [
    { to: '/marketplace', label: 'Marketplace', icon: ShoppingBasket },
    { to: '/wishlist', label: 'Wishlist', icon: Heart, count: wishlist.length },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, count: cartCount, countLabel: 'in cart' },
    ...(user ? [{ to: '/orders', label: 'My Orders', icon: ReceiptText }] : []),
    ...(user?.accountType === 'seller' ? [{ to: '/seller/dashboard', label: 'Seller Dashboard', icon: LayoutDashboard }] : []),
  ]

  function handleSignOut() {
    setMenuOpen(false)
    signOut()
    navigate('/', { state: { flash: { type: 'info', message: 'You’ve been signed out. See you again soon!' } } })
  }

  const navItems = links.map(({ to, label, icon: Icon, count, countLabel = 'saved' }) => (
    <NavLink key={to} to={to} className={linkClasses} onClick={() => setMenuOpen(false)}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
      {count > 0 && (
        <span className="grid min-w-5 place-items-center rounded-full bg-nordic px-1.5 text-xs leading-5 text-white">
          {count}
          <span className="sr-only"> {countLabel}</span>
        </span>
      )}
    </NavLink>
  ))

  return (
    <header className="sticky top-0 z-40 bg-vanilla/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {navItems}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <NavLink
                to="/account"
                aria-label={`My profile (${user.fullName})`}
                className="hidden items-center gap-2 rounded-full pr-2 text-sm font-medium text-muted transition hover:text-nordic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic sm:flex"
              >
                <span className="grid size-9 place-items-center rounded-full bg-sage font-bold text-nordic shadow-neu-sm" aria-hidden="true">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
                {user.fullName.split(' ')[0]}
              </NavLink>
              <Button variant="secondary" size="sm" onClick={handleSignOut} className="max-sm:hidden">
                <LogOut className="size-4" aria-hidden="true" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button to="/signin" variant="ghost" size="sm" className="max-sm:hidden">
                Sign In
              </Button>
              <Button to="/register" size="sm">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Create Account</span>
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="grid size-10 place-items-center rounded-2xl text-nordic shadow-neu transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic xl:hidden"
          >
            {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="mx-4 mb-4 flex flex-col gap-1 rounded-3xl bg-vanilla p-3 shadow-neu xl:hidden">
          {navItems}
          <div className="my-2 border-t border-[#e8e1cf]" />
          {user ? (
            <>
              <NavLink to="/account" className={linkClasses} onClick={() => setMenuOpen(false)}>
                <UserRound className="size-4" aria-hidden="true" />
                My Profile
              </NavLink>
              <button type="button" onClick={handleSignOut} className={linkClasses({ isActive: false })}>
                <LogOut className="size-4" aria-hidden="true" />
                Sign Out ({user.fullName.split(' ')[0]})
              </button>
            </>
          ) : (
            <NavLink to="/signin" className={linkClasses} onClick={() => setMenuOpen(false)}>
              Sign In
            </NavLink>
          )}
        </nav>
      )}
    </header>
  )
}
