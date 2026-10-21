import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { backend } from '../services/index.js'
import { MarketContext } from './market-context.js'

const { products: productApi, wishlist: wishlistApi, capabilities } = backend

export default function MarketProvider({ children }) {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading') // loading → ready | error
  const [error, setError] = useState('')
  const [wishlist, setWishlist] = useState([])
  const [actionError, setActionError] = useState('')

  const reload = useCallback(async () => {
    try {
      const list = await productApi.list()
      setProducts(list)
      setError('')
      setStatus('ready')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  // What a user may see depends on who they are (RLS), so reload when the account changes.
  const userId = user?.id
  useEffect(() => {
    let active = true
    productApi.list().then(
      (list) => {
        if (!active) return
        setProducts(list)
        setError('')
        setStatus('ready')
      },
      (err) => {
        if (!active) return
        setError(err.message)
        setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    let active = true
    wishlistApi.list(user).then(
      (ids) => active && setWishlist(ids),
      (err) => active && setActionError(err.message),
    )
    return () => {
      active = false
    }
    // Only the account id matters, not profile edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Live updates when any seller adds, edits or deletes a listing (Supabase Realtime).
  useEffect(() => {
    let timer
    const unsubscribe = productApi.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(reload, 400)
    })
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [reload])

  const addProduct = useCallback(
    async (input, imageFile) => {
      const product = await productApi.create(input, { user, imageFile })
      setProducts((list) => [product, ...list.filter((p) => p.id !== product.id)])
      return product
    },
    [user],
  )

  const updateProduct = useCallback(
    async (id, input, imageFile) => {
      const existing = products.find((p) => p.id === id)
      if (!existing) throw new Error('This product no longer exists.')
      const updated = await productApi.update(existing, input, { user, imageFile })
      setProducts((list) => list.map((p) => (p.id === id ? updated : p)))
      return updated
    },
    [products, user],
  )

  const deleteProduct = useCallback(
    async (id) => {
      const existing = products.find((p) => p.id === id)
      if (!existing) throw new Error('This product no longer exists.')
      await productApi.remove(existing, { user })
      setProducts((list) => list.filter((p) => p.id !== id))
      setWishlist((ids) => ids.filter((x) => x !== id))
      return existing
    },
    [products, user],
  )

  const syncSellerProducts = useCallback(
    async (account) => {
      await productApi.syncSeller(account)
      await reload()
    },
    [reload],
  )

  const wishlistNeedsSignIn = !user && !capabilities.guestWishlist

  // Optimistic toggle that rolls back if the server rejects it.
  const toggleWishlist = useCallback(
    async (id) => {
      if (wishlistNeedsSignIn) return { needsSignIn: true }
      const saved = wishlist.includes(id)
      setWishlist((ids) => (saved ? ids.filter((x) => x !== id) : [...ids, id]))
      try {
        if (saved) await wishlistApi.remove(user, id)
        else await wishlistApi.add(user, id)
      } catch (err) {
        setWishlist((ids) => (saved ? [...ids, id] : ids.filter((x) => x !== id)))
        setActionError(err.message)
      }
      return { needsSignIn: false }
    },
    [user, wishlist, wishlistNeedsSignIn],
  )

  const clearWishlist = useCallback(async () => {
    const previous = wishlist
    setWishlist([])
    try {
      await wishlistApi.clear(user)
    } catch (err) {
      setWishlist(previous)
      setActionError(err.message)
    }
  }, [user, wishlist])

  const value = useMemo(
    () => ({
      products,
      status,
      error,
      reload,
      wishlist,
      wishlistNeedsSignIn,
      isWishlisted: (id) => wishlist.includes(id),
      toggleWishlist,
      clearWishlist,
      addProduct,
      updateProduct,
      deleteProduct,
      syncSellerProducts,
      actionError,
      clearActionError: () => setActionError(''),
      capabilities,
    }),
    [products, status, error, reload, wishlist, wishlistNeedsSignIn, toggleWishlist, clearWishlist, addProduct, updateProduct, deleteProduct, syncSellerProducts, actionError],
  )

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}
