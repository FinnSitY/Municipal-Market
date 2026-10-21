import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { MUNICIPALITY } from '../lib/config.js'

// Simple inline icons so markers don't depend on Leaflet's image files.
const ICONS = {
  shop: '<path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9h18M9 20v-6h6v6"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
}

function pinIcon(kind) {
  return L.divIcon({
    className: '',
    html: `<div class="bm-pin bm-pin-${kind}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind] ?? ICONS.home}</svg></div>`,
    iconSize: [38, 38],
    // The pin is rotated 45°, so its tip sits ~27px below the centre.
    iconAnchor: [19, 46],
    popupAnchor: [0, -42],
  })
}

/**
 * Leaflet + OpenStreetMap map.
 *   markers: [{ id, lat, lng, kind: 'shop' | 'home', label, draggable }]
 *   path:    [[lat, lng], ...] drawn as a line (e.g. a route)
 *   onPick({ lat, lng }) is called when the map is tapped or a draggable marker is moved.
 */
export default function MapView({ markers = [], path, dashedPath = false, onPick, fit = true, zoom = 14, className = '', label }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const onPickRef = useRef(onPick)

  useEffect(() => {
    onPickRef.current = onPick
  }, [onPick])

  // Create the map once.
  useEffect(() => {
    const map = L.map(containerRef.current, { scrollWheelZoom: false, tap: true }).setView(
      [MUNICIPALITY.center.lat, MUNICIPALITY.center.lng],
      zoom,
    )
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    map.on('click', (e) => onPickRef.current?.({ lat: round6(e.latlng.lat), lng: round6(e.latlng.lng) }))
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    // Leaflet measures the container on creation; re-measure once layout settles.
    const timer = setTimeout(() => map.invalidateSize(), 150)
    return () => {
      clearTimeout(timer)
      map.remove()
      mapRef.current = null
    }
    // The initial zoom only applies on creation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Redraw markers and path when they change.
  const markerKey = JSON.stringify(markers.map((m) => [m.id, m.lat, m.lng, m.kind, m.label, m.draggable]))
  const pathKey = JSON.stringify(path ?? null)
  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const points = []
    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(m.kind), draggable: Boolean(m.draggable), title: m.label, alt: m.label })
      if (m.label) marker.bindTooltip(m.label, { direction: 'top', offset: [0, -42] })
      if (m.draggable) {
        marker.on('dragend', () => {
          const { lat, lng } = marker.getLatLng()
          onPickRef.current?.({ lat: round6(lat), lng: round6(lng) })
        })
      }
      marker.addTo(layer)
      points.push([m.lat, m.lng])
    }
    if (path?.length > 1) {
      L.polyline(path, { color: '#3f4685', weight: 5, opacity: 0.85, dashArray: dashedPath ? '8 10' : null }).addTo(layer)
      points.push(...path)
    }
    if (fit && points.length > 1) map.fitBounds(points, { padding: [48, 48], maxZoom: 17 })
    else if (points.length === 1) map.setView(points[0], Math.max(map.getZoom(), 15))
    // markers/path are captured through their serialized keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey, pathKey, dashedPath, fit])

  return <div ref={containerRef} role="region" aria-label={label} className={`z-0 overflow-hidden rounded-3xl ${className}`} />
}

function round6(n) {
  return Math.round(n * 1e6) / 1e6
}
