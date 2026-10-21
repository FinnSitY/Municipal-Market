import { Bike, ExternalLink, LoaderCircle, MapPinOff, Navigation, Ruler } from 'lucide-react'
import { useEffect, useState } from 'react'
import { directionsUrl, distanceKm, fetchRoadRoute, formatDistance, formatDuration, hasPoint } from '../lib/geo.js'
import MapView from './MapView.jsx'

/**
 * Map for an order: the shop pin, the buyer's delivery pin (for deliveries), the
 * route between them, and how far apart they are.
 */
export default function OrderMap({ order, viewer }) {
  const shop = { lat: order.shopLat, lng: order.shopLng }
  const home = { lat: order.deliveryLat, lng: order.deliveryLng }
  const delivery = order.fulfillment === 'delivery'
  const hasShop = hasPoint(shop)
  const hasHome = delivery && hasPoint(home)
  const both = hasShop && hasHome

  // Road route is looked up per order; `route` holds { key, value } so stale results are ignored.
  const routeKey = both ? `${shop.lat},${shop.lng};${home.lat},${home.lng}` : ''
  const [route, setRoute] = useState({ key: '', value: null, done: false })

  useEffect(() => {
    if (!routeKey) return
    // A timeout gives up (showing the straight-line fallback); unmounting just ignores the result.
    let cancelled = false
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const [from, to] = routeKey.split(';').map((p) => {
      const [lat, lng] = p.split(',').map(Number)
      return { lat, lng }
    })
    fetchRoadRoute(from, to, controller.signal).then((value) => {
      if (!cancelled) setRoute({ key: routeKey, value, done: true })
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      controller.abort()
    }
  }, [routeKey])

  const roadRoute = route.key === routeKey ? route.value : null
  const routeLoading = both && route.key !== routeKey
  const straight = both ? distanceKm(shop, home) : null

  const markers = [
    ...(hasShop ? [{ id: 'shop', ...shop, kind: 'shop', label: order.shopName }] : []),
    ...(hasHome ? [{ id: 'home', ...home, kind: 'home', label: viewer === 'seller' ? `${order.buyerName}’s delivery spot` : 'Your delivery spot' }] : []),
  ]

  if (!markers.length) {
    return (
      <div className="flex items-start gap-3 rounded-3xl p-5 text-sm text-muted shadow-neu-inset">
        <MapPinOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        {viewer === 'seller'
          ? 'Pin your shop location in Shop Profile so buyers can see how far you are.'
          : 'The seller hasn’t pinned their shop on the map yet.'}
      </div>
    )
  }

  return (
    <section aria-label="Delivery map" className="rounded-[2rem] bg-vanilla p-4 shadow-neu sm:p-5">
      <MapView
        label={`Map for order #${order.orderNo}`}
        className="h-80 sm:h-96"
        markers={markers}
        path={both ? roadRoute?.path ?? [[shop.lat, shop.lng], [home.lat, home.lng]] : undefined}
        dashedPath={!roadRoute}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {both && (
          <>
            <div className="rounded-2xl p-4 shadow-neu-inset">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Bike className="size-3.5" aria-hidden="true" />
                By road
              </p>
              <p className="mt-1 text-xl font-extrabold text-nordic" aria-live="polite">
                {routeLoading ? (
                  <LoaderCircle className="size-5 animate-spin" aria-label="Calculating route" />
                ) : roadRoute ? (
                  formatDistance(roadRoute.distanceKm)
                ) : (
                  '—'
                )}
              </p>
              <p className="text-xs text-muted">
                {roadRoute ? `${formatDuration(roadRoute.durationSeconds)} by vehicle` : routeLoading ? 'Finding a route…' : 'Route not available'}
              </p>
            </div>
            <div className="rounded-2xl p-4 shadow-neu-inset">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Ruler className="size-3.5" aria-hidden="true" />
                Straight line
              </p>
              <p className="mt-1 text-xl font-extrabold text-ink">{formatDistance(straight)}</p>
              <p className="text-xs text-muted">Shop to delivery pin</p>
            </div>
          </>
        )}
        <a
          href={both ? directionsUrl(home, shop) : directionsUrl(hasShop ? shop : home)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl bg-nordic p-4 font-semibold text-white shadow-neu transition hover:-translate-y-0.5 hover:bg-nordic-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic focus-visible:ring-offset-2 focus-visible:ring-offset-vanilla"
        >
          <span className="flex items-center gap-2">
            <Navigation className="size-5" aria-hidden="true" />
            {both ? 'Open route in Google Maps' : hasShop ? 'Directions to the shop' : 'Directions to the buyer'}
          </span>
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </div>

      {delivery && !hasHome && <p className="mt-3 text-sm text-muted">This order has no delivery pin (it was placed before maps were added).</p>}
      {delivery && hasHome && !hasShop && <p className="mt-3 text-sm text-muted">The shop isn’t pinned yet, so the distance can’t be shown.</p>}
      {both && (
        <p className="mt-3 text-xs text-muted">
          Road distance uses OpenStreetMap routing and may differ from the actual path. Map data © OpenStreetMap contributors.
        </p>
      )}
    </section>
  )
}
