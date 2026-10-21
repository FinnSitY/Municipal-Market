import { PRODUCT_IMAGES_BUCKET, supabase } from '../../lib/supabase.js'
import { toError } from '../errors.js'

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Uploads into "<userId>/<random>.<ext>", the only folder Storage policies let the seller write. */
export async function uploadProductImage(userId, file) {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const path = `${userId}/${id}.${EXTENSIONS[file.type] ?? 'jpg'}`

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
  if (error) throw toError(error, 'We couldn’t upload that image. Please try again.')

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)
  return { image_url: data.publicUrl, image_path: path }
}

// Best effort: a leftover file is harmless, so failures here never block the user.
export async function removeProductImage(path) {
  if (!path) return
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
}
