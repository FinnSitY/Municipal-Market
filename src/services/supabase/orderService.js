import { supabase } from '../../lib/supabase.js'
import { toError } from '../errors.js'

const ORDER_SELECT = `
  id, order_no, buyer_id, seller_id, shop_id, buyer_name, shop_name, status, fulfillment,
  contact_phone, delivery_barangay, delivery_address, delivery_lat, delivery_lng, note, total, cancelled_by, cancel_reason,
  created_at, updated_at,
  items:order_items ( id, product_id, product_name, unit, unit_price, quantity, line_total ),
  shop:shops ( barangay, municipality, latitude, longitude )
`

export function mapOrder(row) {
  return {
    id: row.id,
    orderNo: row.order_no,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    shopId: row.shop_id,
    buyerName: row.buyer_name,
    shopName: row.shop_name,
    shopBarangay: row.shop?.barangay ?? '',
    shopMunicipality: row.shop?.municipality ?? '',
    shopLat: row.shop?.latitude ?? null,
    shopLng: row.shop?.longitude ?? null,
    deliveryLat: row.delivery_lat,
    deliveryLng: row.delivery_lng,
    status: row.status,
    fulfillment: row.fulfillment,
    contactPhone: row.contact_phone,
    deliveryBarangay: row.delivery_barangay ?? '',
    deliveryAddress: row.delivery_address ?? '',
    note: row.note ?? '',
    total: Number(row.total),
    cancelledBy: row.cancelled_by,
    cancelReason: row.cancel_reason ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      unit: item.unit,
      unitPrice: Number(item.unit_price),
      quantity: Number(item.quantity),
      lineTotal: Number(item.line_total),
    })),
  }
}

async function list(column, user) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq(column, user.id)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw toError(error, 'We couldn’t load orders right now.')
  return data.map(mapOrder)
}

export const orderService = {
  /**
   * Places one order per shop. Prices, stock and rules are checked by the
   * place_order() database function; only product ids and quantities are sent.
   */
  async place(checkout, lines) {
    const { data, error } = await supabase.rpc('place_order', {
      p_items: lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
      p_fulfillment: checkout.fulfillment,
      p_contact_phone: checkout.contactPhone,
      p_delivery_barangay: checkout.fulfillment === 'delivery' ? checkout.deliveryBarangay : null,
      p_delivery_address: checkout.fulfillment === 'delivery' ? checkout.deliveryAddress : null,
      p_note: checkout.note || null,
      p_delivery_lat: checkout.fulfillment === 'delivery' ? checkout.deliveryPin?.lat ?? null : null,
      p_delivery_lng: checkout.fulfillment === 'delivery' ? checkout.deliveryPin?.lng ?? null : null,
    })
    if (error) throw toError(error, 'We couldn’t place your order. Please try again.')
    return data.map((o) => ({ id: o.id, orderNo: o.order_no, shopName: o.shop_name, total: Number(o.total) }))
  },

  async get(orderId) {
    const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', orderId).maybeSingle()
    if (error) throw toError(error, 'We couldn’t load this order.')
    return data ? mapOrder(data) : null
  },

  listMine(user) {
    return list('buyer_id', user)
  },

  listForShop(user) {
    return list('seller_id', user)
  },

  async updateStatus(orderId, status, reason) {
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: orderId,
      p_status: status,
      p_reason: reason || null,
    })
    if (error) throw toError(error, 'We couldn’t update this order.')
  },

  subscribe(onChange) {
    const channel = supabase
      .channel(`orders-changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, onChange)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  },
}
