/*
 * DEV-ONLY MOCK CATALOG (VITE_USE_MOCK_DATA=true), persisted in this browser's
 * localStorage. Not shared between devices; anyone using the browser can edit it.
 */
import { readJSON, writeJSON } from '../../lib/storage.js'
import { SEED_PRODUCTS } from './seedData.js'

const PRODUCTS_KEY = 'bayanihan.demo.donsol.v4.products'
const NOT_YOURS = 'You can only manage your own listings.'

function load() {
  const stored = readJSON(localStorage, PRODUCTS_KEY, null)
  const products = Array.isArray(stored) ? stored : SEED_PRODUCTS
  if (!Array.isArray(stored)) writeJSON(localStorage, PRODUCTS_KEY, products)
  return products.map((p) => ({ isActive: true, imagePath: null, unit: 'piece', weightStep: 1, ...p }))
}

function save(products) {
  writeJSON(localStorage, PRODUCTS_KEY, products)
}

function normalize(input) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: Math.round(Number(input.price) * 100) / 100,
    category: input.category,
    unit: input.unit === 'kg' ? 'kg' : 'piece',
    weightStep: input.unit === 'kg' ? Number(input.weightStep) : 1,
    stock: input.unit === 'kg' ? Math.round(Number(input.stock) * 100) / 100 : Number.parseInt(input.stock, 10),
    imageUrl: input.imageUrl.trim(),
    isActive: input.isActive,
  }
}

function requireOwn(id, user) {
  if (user?.accountType !== 'seller') throw new Error('Only seller accounts can manage products.')
  const product = load().find((p) => p.id === id)
  if (!product) throw new Error('This product no longer exists.')
  if (product.sellerId !== user.id) throw new Error(NOT_YOURS)
  return product
}

export const mockProductService = {
  async list() {
    return load()
  },

  async create(input, { user }) {
    if (user?.accountType !== 'seller' || !user.shop) throw new Error('Set up your shop profile before adding products.')
    const now = new Date().toISOString()
    const product = {
      id: globalThis.crypto?.randomUUID?.() ?? `p-${Date.now()}`,
      ...normalize(input),
      imagePath: null,
      sellerId: user.id,
      shopName: user.shop.name,
      sellerName: user.fullName,
      municipality: user.shop.municipality,
      barangay: user.shop.barangay,
      shopLat: user.shop.lat ?? null,
      shopLng: user.shop.lng ?? null,
      createdAt: now,
      updatedAt: now,
    }
    save([product, ...load()])
    return product
  },

  async update(existing, input, { user }) {
    const current = requireOwn(existing.id, user)
    const updated = { ...current, ...normalize(input), updatedAt: new Date().toISOString() }
    save(load().map((p) => (p.id === updated.id ? updated : p)))
    return updated
  },

  async remove(existing, { user }) {
    requireOwn(existing.id, user)
    save(load().filter((p) => p.id !== existing.id))
  },

  // Copies shop details onto the seller's listings after a profile change.
  async syncSeller(user) {
    save(
      load().map((p) =>
        p.sellerId === user.id && user.shop
          ? { ...p, shopName: user.shop.name, sellerName: user.fullName, municipality: user.shop.municipality, barangay: user.shop.barangay, shopLat: user.shop.lat ?? null, shopLng: user.shop.lng ?? null }
          : p,
      ),
    )
  },

  subscribe() {
    return () => {}
  },
}

// Used by the mock order service to check and adjust stock.
export { load as loadMockProducts, save as saveMockProducts }
