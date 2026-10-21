import { CircleAlert, Crosshair, LoaderCircle, MapPin } from 'lucide-react'
import { useState } from 'react'
import { MUNICIPALITY } from '../lib/config.js'
import { hasPoint, inServiceArea } from '../lib/geo.js'
import MapView from './MapView.jsx'

/**
 * Lets someone pin a spot on the map: tap the map, drag the pin, or use the
 * device's current location. `value` is { lat, lng } or null.
 */
export default function LocationPicker({ id, label, hint, value, onChange, error, kind = 'home', markerLabel }) {
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('Your browser can’t share its location. Tap the map instead.')
      return
    }
    setLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const point = { lat: Math.round(pos.coords.latitude * 1e6) / 1e6, lng: Math.round(pos.coords.longitude * 1e6) / 1e6 }
        if (!inServiceArea(point)) {
          setGeoError(`Your current location seems to be outside ${MUNICIPALITY.name}. Tap the map to pin the right spot.`)
          return
        }
        onChange(point)
      },
      (err) => {
        setLocating(false)
        setGeoError(err.code === err.PERMISSION_DENIED ? 'Location permission was denied. Tap the map to pin your spot instead.' : 'We couldn’t get your location. Tap the map instead.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const outside = hasPoint(value) && !inServiceArea(value)
  // The most recent problem wins: a location lookup failure, then an out-of-area pin, then form validation.
  const message =
    geoError || (outside ? `That pin is outside ${MUNICIPALITY.name}. Please pin a spot within the service area.` : error)

  return (
    <div id={id} tabIndex={-1} className="focus:outline-none">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-nordic shadow-neu-sm transition hover:-translate-y-0.5 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic"
        >
          {locating ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : <Crosshair className="size-3.5" aria-hidden="true" />}
          Use my current location
        </button>
      </div>
      <div className={`rounded-3xl p-1.5 shadow-neu-inset ${message ? 'ring-2 ring-danger/60' : ''}`}>
        <MapView
          label={`${label}: tap the map to place the pin`}
          className="h-64"
          fit={false}
          markers={hasPoint(value) ? [{ id: 'pick', ...value, kind, label: markerLabel ?? label, draggable: true }] : []}
          onPick={(point) => {
            setGeoError('')
            onChange(point)
          }}
        />
      </div>
      {message ? (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      ) : (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {hasPoint(value) ? `Pinned at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}. Drag the pin to adjust.` : hint}
        </p>
      )}
    </div>
  )
}
