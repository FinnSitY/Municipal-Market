import { readJSON, writeJSON } from '../../lib/storage.js'

// Wishlists keyed by account id, or "guest" when nobody is signed in.
const WISHLISTS_KEY = 'bayanihan.demo.donsol.wishlists'
const owner = (user) => user?.id ?? 'guest'

function update(user, change) {
  const all = readJSON(localStorage, WISHLISTS_KEY, {})
  writeJSON(localStorage, WISHLISTS_KEY, { ...all, [owner(user)]: change(all[owner(user)] ?? []) })
}

export const mockWishlistService = {
  async list(user) {
    return readJSON(localStorage, WISHLISTS_KEY, {})[owner(user)] ?? []
  },
  async add(user, productId) {
    update(user, (ids) => (ids.includes(productId) ? ids : [...ids, productId]))
  },
  async remove(user, productId) {
    update(user, (ids) => ids.filter((id) => id !== productId))
  },
  async clear(user) {
    update(user, () => [])
  },
}
