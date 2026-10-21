import { LOW_STOCK_THRESHOLD } from './config.js'
import { formatQuantity, unitSuffix } from './units.js'

// Low-stock warnings: 5 pieces or fewer, or 2 kg or less.
const LOW_KG_THRESHOLD = 2

export function getAvailability(stock, unit = 'piece') {
  if (stock <= 0) return { status: 'sold-out', label: 'Sold out' }
  const low = unit === 'kg' ? stock <= LOW_KG_THRESHOLD : stock <= LOW_STOCK_THRESHOLD
  if (low) return { status: 'low', label: `Only ${formatQuantity(stock, unit)} left` }
  return { status: 'in-stock', label: 'In stock' }
}

/** "₱140" or "₱140 / kg". */
export function formatPrice(product) {
  const suffix = unitSuffix(product.unit)
  return suffix ? `${formatPeso(product.price)} ${suffix}` : formatPeso(product.price)
}

export function formatPeso(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Must match the product-images bucket limits in the Supabase migration.
export const IMAGE_RULES = {
  maxBytes: 5 * 1024 * 1024,
  types: ['image/jpeg', 'image/png', 'image/webp'],
}

export function validateImageFile(file) {
  if (!file) return null
  if (!IMAGE_RULES.types.includes(file.type)) return 'Please choose a JPG, PNG or WebP image.'
  if (file.size > IMAGE_RULES.maxBytes) return 'That image is larger than 5 MB. Please choose a smaller file.'
  return null
}
