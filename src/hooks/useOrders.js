import { useCallback, useEffect, useState } from 'react'
import { backend } from '../services/index.js'
import { useAuth } from './useAuth.js'

/**
 * Loads the signed-in user's orders as a buyer ("mine") or for their shop ("shop"),
 * and refreshes when orders change (Supabase Realtime). `updateStatus` re-loads after.
 */
export function useOrders(scope) {
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading', orders: [], error: '' })

  const fetchOrders = useCallback(
    () => (scope === 'shop' ? backend.orders.listForShop(user) : backend.orders.listMine(user)),
    [scope, user],
  )

  const reload = useCallback(async () => {
    try {
      const orders = await fetchOrders()
      setState({ status: 'ready', orders, error: '' })
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }))
    }
  }, [fetchOrders])

  useEffect(() => {
    let active = true
    fetchOrders().then(
      (orders) => active && setState({ status: 'ready', orders, error: '' }),
      (err) => active && setState((s) => ({ ...s, status: 'error', error: err.message })),
    )
    let timer
    const unsubscribe = backend.orders.subscribe(() => {
      clearTimeout(timer)
      timer = setTimeout(reload, 400)
    })
    return () => {
      active = false
      clearTimeout(timer)
      unsubscribe()
    }
  }, [fetchOrders, reload])

  const updateStatus = useCallback(
    async (orderId, status, reason) => {
      await backend.orders.updateStatus(orderId, status, reason, { user })
      await reload()
    },
    [reload, user],
  )

  return { ...state, reload, updateStatus }
}
