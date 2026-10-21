import { MUNICIPALITY } from '../../lib/config.js'
import { authenticate, clearSession, loadSession, refreshSession, registerUser, saveSession, updateUser } from './mockAuthStore.js'

// Shapes a stored demo account like the Supabase-backed user object.
function toAppUser(account) {
  if (!account) return null
  const shop = account.shop
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    accountType: account.accountType,
    sellerStatus: account.accountType === 'seller' ? 'approved' : 'none',
    municipality: account.municipality ?? shop?.municipality ?? '',
    barangay: account.barangay ?? shop?.barangay ?? '',
    shop: shop
      ? {
          id: account.id,
          name: shop.name,
          description: shop.description ?? shop.about ?? '',
          category: shop.category,
          municipality: shop.municipality ?? MUNICIPALITY.name,
          barangay: shop.barangay,
          lat: shop.latitude ?? null,
          lng: shop.longitude ?? null,
        }
      : null,
    createdAt: account.createdAt,
  }
}

export const mockAuthService = {
  async getCurrentUser() {
    return toAppUser(loadSession())
  },

  onAuthChange() {
    return () => {}
  },

  async signIn(email, password, remember) {
    const account = await authenticate(email, password)
    saveSession(account, remember)
    return toAppUser(account)
  },

  // Demo sign-up doesn't sign in automatically: the user is sent to Sign In.
  async signUp(form) {
    await registerUser(form)
    return { user: null, needsConfirmation: false }
  },

  async signOut() {
    clearSession()
  },

  async updateProfile(user, changes) {
    const stored = loadSession()
    const updated = updateUser(user.id, {
      fullName: changes.fullName.trim(),
      barangay: changes.barangay.trim(),
      ...(user.accountType === 'buyer' ? { municipality: changes.municipality.trim() } : {}),
      ...(changes.shop
        ? {
            shop: {
              ...stored?.shop,
              name: changes.shop.name.trim(),
              description: changes.shop.description.trim(),
              category: changes.shop.category,
              barangay: changes.shop.barangay.trim(),
              municipality: MUNICIPALITY.name,
              ...('location' in changes.shop
                ? { latitude: changes.shop.location?.lat ?? null, longitude: changes.shop.location?.lng ?? null }
                : {}),
            },
          }
        : {}),
    })
    refreshSession(updated)
    return toAppUser(updated)
  },

  async requestPasswordReset() {},

  async updatePassword() {
    throw new Error('Password reset isn’t available with mock data.')
  },
}
