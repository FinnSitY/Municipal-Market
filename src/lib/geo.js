import { MUNICIPALITY } from './config.js'

/** Straight-line ("as the crow flies") distance in km between two { lat, lng } points. */
export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/** "850 m" or "3.2 km". */
export function formatDistance(km) {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

/** "about 6 min" for a duration in seconds. */
export function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `about ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `about ${hours} hr ${minutes % 60} min`
}

export function hasPoint(point) {
  return point && Number.isFinite(point.lat) && Number.isFinite(point.lng)
}

/** Mirrors in_service_area() in the database. */
export function inServiceArea(point) {
  return hasPoint(point) && distanceKm(point, MUNICIPALITY.center) <= MUNICIPALITY.serviceRadiusKm
}

/** Google Maps directions link (opens the app on phones); no API key needed. */
export function directionsUrl(destination, origin) {
  const params = new URLSearchParams({ api: '1', destination: `${destination.lat},${destination.lng}`, travelmode: 'driving' })
  if (origin) params.set('origin', `${origin.lat},${origin.lng}`)
  return `https://www.google.com/maps/dir/?${params}`
}

/**
 * Road route between two points from the public OSRM demo server (OpenStreetMap data).
 * Best effort: returns null when offline, rate-limited or no road is found, so callers
 * fall back to the straight-line distance.
 */
export async function fetchRoadRoute(from, to, signal) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  try {
    const response = await fetch(url, { signal })
    if (!response.ok) return null
    const data = await response.json()
    const route = data.routes?.[0]
    if (data.code !== 'Ok' || !route) return null
    return {
      distanceKm: route.distance / 1000,
      durationSeconds: route.duration,
      path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    }
  } catch {
    return null
  }
}
