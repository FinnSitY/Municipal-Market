// Small JSON helpers around Web Storage that never throw (private mode, quota, bad JSON).

export function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage is full or unavailable; the demo keeps working in memory.
  }
}
