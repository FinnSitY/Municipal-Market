import { supabase } from '../../lib/supabase.js'
import { toError } from '../errors.js'

const UNIQUE_VIOLATION = '23505'

export const wishlistService = {
  async list(user) {
    if (!user) return []
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (error) throw toError(error, 'We couldn’t load your wishlist.')
    return data.map((row) => row.product_id)
  },

  async add(user, productId) {
    // user_id defaults to auth.uid() in the database, so it is never sent from the browser.
    const { error } = await supabase.from('wishlists').insert({ product_id: productId })
    if (error && error.code !== UNIQUE_VIOLATION) throw toError(error, 'We couldn’t save this item.')
  },

  async remove(user, productId) {
    const { error } = await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId)
    if (error) throw toError(error, 'We couldn’t remove this item.')
  },

  async clear(user) {
    const { error } = await supabase.from('wishlists').delete().eq('user_id', user.id)
    if (error) throw toError(error, 'We couldn’t clear your wishlist.')
  },
}
