/*
 * DEV-ONLY MOCK ORDERS (VITE_USE_MOCK_DATA=true), stored in this browser's localStorage.
 * Mirrors the rules of the place_order() / update_order_status() database functions.
 */
import { readJSON, writeJSON } from '../../lib/storage.js'
import { inServiceArea } from '../../lib/geo.js'
import { isMultiple } from '../../lib/units.js'
import { validatePhone } from '../../lib/validation.js'
import { loadMockProducts, saveMockProducts } from './mockProductService.js'

const ORDERS_KEY = 'bayanihan.demo.donsol.orders'
const round2 = (n) => Math.round(n * 100) / 100

const load = () => readJSON(localStorage, ORDERS_KEY, [])
const save = (orders) => writeJSON(localStorage, ORDERS_KEY, orders)

const SELLER_STEPS = { pending: ['confirmed', 'cancelled'], confirmed: ['ready', 'cancelled'], ready: ['completed', 'cancelled'] }

export const mockOrderService = {
  async place(checkout, lines, { user }) {
    if (!user) throw new Error('Please sign in to place an order.')
    const phoneError = validatePhone(checkout.contactPhone, { required: true })
    if (phoneError) throw new Error(phoneError)
    if (!lines.length) throw new Error('Your cart is empty.')
    if (checkout.fulfillment === 'delivery' && !inServiceArea(checkout.deliveryPin)) throw new Error('Pin your delivery location on the map.')

    const products = loadMockProducts()
    const lineData = lines.map(({ productId, quantity }) => {
      const product = products.find((p) => p.id === productId)
      const qty = round2(Number(quantity))
      if (!product || product.isActive === false) throw new Error('An item in your cart is no longer available. Please review your cart.')
      if (product.sellerId === user.id) throw new Error(`You can’t order your own product "${product.name}".`)
      if (product.unit === 'kg' ? !isMultiple(qty, product.weightStep) : !Number.isInteger(qty)) {
        throw new Error(`Please choose a valid quantity for "${product.name}".`)
      }
      if (qty <= 0 || qty > product.stock) throw new Error(`Only ${product.stock} left of "${product.name}".`)
      product.stock = round2(product.stock - qty)
      return { product, qty }
    })
    saveMockProducts(products)

    const orders = load()
    let nextNo = orders.reduce((max, o) => Math.max(max, o.orderNo), 1000) + 1
    const now = new Date().toISOString()
    const byShop = Map.groupBy(lineData, ({ product }) => product.sellerId)
    const created = [...byShop.values()].map((shopLines) => {
      const { product: first } = shopLines[0]
      const items = shopLines.map(({ product, qty }) => ({
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity: qty,
        lineTotal: round2(product.price * qty),
      }))
      return {
        id: globalThis.crypto?.randomUUID?.() ?? `o-${Date.now()}-${Math.random()}`,
        orderNo: nextNo++,
        buyerId: user.id,
        sellerId: first.sellerId,
        shopId: first.sellerId,
        buyerName: user.fullName,
        shopName: first.shopName,
        shopBarangay: first.barangay,
        shopMunicipality: first.municipality,
        shopLat: first.shopLat ?? null,
        shopLng: first.shopLng ?? null,
        deliveryLat: checkout.fulfillment === 'delivery' ? checkout.deliveryPin?.lat ?? null : null,
        deliveryLng: checkout.fulfillment === 'delivery' ? checkout.deliveryPin?.lng ?? null : null,
        status: 'pending',
        fulfillment: checkout.fulfillment,
        contactPhone: checkout.contactPhone.replace(/[\s-]/g, ''),
        deliveryBarangay: checkout.fulfillment === 'delivery' ? checkout.deliveryBarangay : '',
        deliveryAddress: checkout.fulfillment === 'delivery' ? checkout.deliveryAddress.trim() : '',
        note: checkout.note.trim(),
        total: round2(items.reduce((sum, i) => sum + i.lineTotal, 0)),
        cancelledBy: null,
        cancelReason: '',
        createdAt: now,
        updatedAt: now,
        items,
      }
    })
    save([...created, ...orders])
    return created.map((o) => ({ id: o.id, orderNo: o.orderNo, shopName: o.shopName, total: o.total }))
  },

  async get(orderId, { user }) {
    return load().find((o) => o.id === orderId && [o.buyerId, o.sellerId].includes(user?.id)) ?? null
  },

  async listMine(user) {
    return load().filter((o) => o.buyerId === user.id)
  },

  async listForShop(user) {
    return load().filter((o) => o.sellerId === user.id)
  },

  async updateStatus(orderId, status, reason, { user }) {
    const orders = load()
    const order = orders.find((o) => o.id === orderId)
    if (!order || ![order.buyerId, order.sellerId].includes(user?.id)) throw new Error('Order not found.')
    const isSeller = order.sellerId === user.id
    const allowed = isSeller ? (SELLER_STEPS[order.status] ?? []).includes(status) : order.status === 'pending' && status === 'cancelled'
    if (!allowed) throw new Error('This order can’t be changed to that status.')

    if (status === 'cancelled') {
      const products = loadMockProducts()
      for (const item of order.items) {
        const product = products.find((p) => p.id === item.productId)
        if (product) product.stock = round2(product.stock + item.quantity)
      }
      saveMockProducts(products)
      order.cancelledBy = isSeller ? 'seller' : 'buyer'
      order.cancelReason = (reason ?? '').trim().slice(0, 300)
    }
    order.status = status
    order.updatedAt = new Date().toISOString()
    save(orders)
  },

  subscribe() {
    return () => {}
  },
}
