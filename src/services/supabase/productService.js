import { supabase } from '../../lib/supabase.js'
import { toError } from '../errors.js'
import { removeProductImage, uploadProductImage } from './storageService.js'

const PRODUCT_SELECT = `
  id, seller_id, shop_id, name, description, price, category, stock_quantity,
  unit, weight_step, image_url, image_path, is_active, created_at, updated_at,
  shop:shops ( shop_name, municipality, barangay, owner:profiles ( full_name ) )
`

const NOT_YOURS = 'You can only manage your own listings.'

function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    stock: Number(row.stock_quantity),
    unit: row.unit ?? 'piece',
    weightStep: Number(row.weight_step ?? 1),
    imageUrl: row.image_url ?? '',
    imagePath: row.image_path ?? null,
    isActive: row.is_active,
    sellerId: row.seller_id,
    shopId: row.shop_id,
    shopName: row.shop?.shop_name ?? 'Local shop',
    sellerName: row.shop?.owner?.full_name ?? '',
    municipality: row.shop?.municipality ?? '',
    barangay: row.shop?.barangay ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(input) {
  const byWeight = input.unit === 'kg'
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: Math.round(Number(input.price) * 100) / 100,
    category: input.category,
    unit: byWeight ? 'kg' : 'piece',
    weight_step: byWeight ? Number(input.weightStep) : 1,
    stock_quantity: byWeight ? Math.round(Number(input.stock) * 100) / 100 : Number.parseInt(input.stock, 10),
    is_active: input.isActive,
  }
}

export const productService = {
  // RLS decides what comes back: active products from approved sellers, plus the
  // caller's own listings (including hidden ones).
  async list() {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) throw toError(error, 'We couldn’t load products right now.')
    return data.map(mapProduct)
  },

  async create(input, { user, imageFile }) {
    if (!user?.shop) throw new Error('Set up your shop profile before adding products.')

    const image = imageFile
      ? await uploadProductImage(user.id, imageFile)
      : { image_url: input.imageUrl.trim() || null, image_path: null }

    const { data, error } = await supabase
      .from('products')
      .insert({ seller_id: user.id, shop_id: user.shop.id, ...toRow(input), ...image })
      .select(PRODUCT_SELECT)
      .single()

    if (error) {
      await removeProductImage(image.image_path)
      throw toError(error, 'We couldn’t publish this product.')
    }
    return mapProduct(data)
  },

  async update(existing, input, { user, imageFile }) {
    if (existing.sellerId !== user?.id) throw new Error(NOT_YOURS)

    let image
    if (imageFile) {
      image = await uploadProductImage(user.id, imageFile)
    } else if (input.imageUrl.trim() !== existing.imageUrl) {
      // The seller pasted a different link or removed the photo.
      image = { image_url: input.imageUrl.trim() || null, image_path: null }
    }

    const { data, error } = await supabase
      .from('products')
      .update({ ...toRow(input), ...image })
      .eq('id', existing.id)
      .select(PRODUCT_SELECT)
      .maybeSingle()

    if (error || !data) {
      await removeProductImage(image?.image_path)
      throw error ? toError(error, 'We couldn’t save your changes.') : new Error(NOT_YOURS)
    }
    if (image && existing.imagePath) await removeProductImage(existing.imagePath)
    return mapProduct(data)
  },

  async remove(existing, { user }) {
    if (existing.sellerId !== user?.id) throw new Error(NOT_YOURS)

    // RLS silently skips rows you don't own, so check that a row was actually deleted.
    const { data, error } = await supabase.from('products').delete().eq('id', existing.id).select('id')
    if (error) throw toError(error, 'We couldn’t delete this product.')
    if (!data.length) throw new Error(NOT_YOURS)
    await removeProductImage(existing.imagePath)
  },

  // Shop details are joined from the shops table, so there is nothing to copy.
  async syncSeller() {},

  subscribe(onChange) {
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, onChange)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  },
}
