import { useState } from 'react'
import { useLocation } from 'react-router-dom'

// Reads a one-off { type, message } passed through navigate(path, { state: { flash } }).
export function useFlash() {
  const location = useLocation()
  const [dismissedKey, setDismissedKey] = useState(null)
  const flash = dismissedKey === location.key ? null : (location.state?.flash ?? null)
  return [flash, () => setDismissedKey(location.key)]
}
