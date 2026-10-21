import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import { CartContext } from './cart-context.js'

/*
 * The cart is a list of { productId, quantity } kept in this browser per account
 * (or "guest"). Prices and stock are always read from the live product list, and the
 * database re-checks everything when the order is placed.
 */
const cartKey = (owner) => `bayanihan.cart.${owner}`
const round2 = (n) => Math.round(n * 100) / 100

function loadCart(owner) {
  const items = readJSON(localStorage, cartKey(owner), [])
  return Array.isArray(items) ? items.filter((i) => i?.productId && Number(i.quantity) > 0) : []
}

function mergeItems(base, extra) {
  const merged = base.map((i) => ({ ...i }))
  for (const item of extra) {
    const existing = merged.find((i) => i.productId === item.productId)
    if (existing) existing.quantity = round2(existing.quantity + item.quantity)
    else merged.push({ ...item })
  }
  return merged
}

// Loads the cart for an account, moving any guest cart into it after sign-in.
function cartFor(owner) {
  if (owner === 'guest') return loadCart('guest')
  const guest = loadCart('guest')
  if (!guest.length) return loadCart(owner)
  const merged = mergeItems(loadCart(owner), guest)
  writeJSON(localStorage, cartKey(owner), merged)
  writeJSON(localStorage, cartKey('guest'), [])
  return merged
}

export default function CartProvider({ children }) {
  const { user } = useAuth()
  const owner = user?.id ?? 'guest'
  const [cart, setCart] = useState(() => ({ owner, items: cartFor(owner) }))

  // Switch carts when the signed-in account changes.
  if (cart.owner !== owner) setCart({ owner, items: cartFor(owner) })

  useEffect(() => writeJSON(localStorage, cartKey(cart.owner), cart.items), [cart])

  const add = useCallback((productId, quantity) => {
    setCart((c) => ({ ...c, items: mergeItems(c.items, [{ productId, quantity: round2(quantity) }]) }))
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setCart((c) => ({
      ...c,
      items: c.items.map((i) => (i.productId === productId ? { ...i, quantity: round2(quantity) } : i)),
    }))
  }, [])

  const remove = useCallback((productIds) => {
    const ids = [].concat(productIds)
    setCart((c) => ({ ...c, items: c.items.filter((i) => !ids.includes(i.productId)) }))
  }, [])

  const value = useMemo(
    () => ({ items: cart.items, count: cart.items.length, add, setQuantity, remove }),
    [cart.items, add, setQuantity, remove],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
