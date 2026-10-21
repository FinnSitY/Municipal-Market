import { setRememberMe, supabase } from '../../lib/supabase.js'
import { toError } from '../errors.js'

const PROFILE_COLUMNS = 'id, full_name, role, seller_status, municipality, barangay, created_at'
const SHOP_COLUMNS = 'id, shop_name, description, category, municipality, barangay, latitude, longitude'

function toAppUser(authUser, profile, shop) {
  return {
    id: profile.id,
    email: authUser.email,
    fullName: profile.full_name,
    accountType: profile.role,
    sellerStatus: profile.seller_status,
    municipality: profile.municipality ?? '',
    barangay: profile.barangay ?? '',
    shop: shop
      ? {
          id: shop.id,
          name: shop.shop_name,
          description: shop.description ?? '',
          category: shop.category,
          municipality: shop.municipality,
          barangay: shop.barangay,
          lat: shop.latitude,
          lng: shop.longitude,
        }
      : null,
    createdAt: profile.created_at,
  }
}

async function loadUser(authUser) {
  if (!authUser) return null
  const [profileResult, shopResult] = await Promise.all([
    supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', authUser.id).maybeSingle(),
    supabase.from('shops').select(SHOP_COLUMNS).eq('owner_id', authUser.id).maybeSingle(),
  ])
  if (profileResult.error) throw toError(profileResult.error)
  if (shopResult.error) throw toError(shopResult.error)
  if (!profileResult.data) {
    throw new Error('Your account has no profile yet. Make sure the database migration was run, then sign in again.')
  }
  return toAppUser(authUser, profileResult.data, shopResult.data)
}

export const authService = {
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw toError(error)
    return loadUser(data.session?.user)
  },

  onAuthChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event) => callback(event))
    return () => data.subscription.unsubscribe()
  },

  async signIn(email, password, remember) {
    setRememberMe(remember)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw toError(error)
    return loadUser(data.user)
  },

  /** Returns { user } when signed in right away, or { needsConfirmation } when email confirmation is on. */
  async signUp(form) {
    const isSeller = form.accountType === 'seller'
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/signin`,
        // Read by the handle_new_user() database trigger to create the profile and shop.
        data: {
          full_name: form.fullName.trim(),
          role: form.accountType,
          municipality: form.municipality.trim(),
          barangay: form.barangay.trim(),
          ...(isSeller ? { shop_name: form.shopName.trim(), shop_category: form.category } : {}),
        },
      },
    })
    if (error) throw toError(error)
    if (!data.session) return { user: null, needsConfirmation: true }
    return { user: await loadUser(data.user), needsConfirmation: false }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw toError(error)
  },

  /** Updates the caller's profile and (for sellers) their shop, then returns the fresh user. */
  async updateProfile(user, changes) {
    const profileUpdate = { full_name: changes.fullName.trim(), barangay: changes.barangay.trim() }
    if (user.accountType === 'buyer') profileUpdate.municipality = changes.municipality.trim()

    const { error } = await supabase.from('profiles').update(profileUpdate).eq('id', user.id)
    if (error) throw toError(error)

    if (changes.shop) {
      const shopRow = {
        shop_name: changes.shop.name.trim(),
        description: changes.shop.description.trim() || null,
        category: changes.shop.category,
        barangay: changes.shop.barangay.trim(),
        ...('location' in changes.shop
          ? { latitude: changes.shop.location?.lat ?? null, longitude: changes.shop.location?.lng ?? null }
          : {}),
      }
      const result = user.shop
        ? await supabase.from('shops').update(shopRow).eq('id', user.shop.id)
        : await supabase.from('shops').insert({ owner_id: user.id, ...shopRow })
      if (result.error) throw toError(result.error)
    }

    return loadUser({ id: user.id, email: user.email })
  },

  async requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw toError(error)
  },

  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw toError(error)
  },
}
