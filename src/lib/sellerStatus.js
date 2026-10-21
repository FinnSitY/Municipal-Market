/**
 * What a seller can do right now. The database enforces the same rule
 * (is_approved_seller); this only decides what the UI shows.
 */
export function sellerReadiness(user) {
  if (user?.accountType !== 'seller') return 'not-seller'
  if (!user.shop) return 'no-shop'
  if (user.sellerStatus === 'approved') return 'ready'
  if (user.sellerStatus === 'rejected') return 'rejected'
  return 'pending'
}
