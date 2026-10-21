import { validateImageFile } from './products.js'
import { compactErrors, required } from './validation.js'

export const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  category: '',
  stock: '',
  unit: 'piece',
  weightStep: '0.25',
  imageUrl: '',
  isActive: true,
}

export function productToForm(product) {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    category: product.category,
    stock: String(product.stock),
    unit: product.unit === 'kg' ? 'kg' : 'piece',
    weightStep: String(product.unit === 'kg' ? product.weightStep : 0.25),
    imageUrl: product.imageUrl ?? '',
    isActive: product.isActive !== false,
  }
}

function validatePrice(value) {
  if (!String(value).trim()) return 'Please enter a price.'
  const price = Number(value)
  if (!Number.isFinite(price) || price <= 0) return 'Price must be more than ₱0.'
  if (price > 1_000_000) return 'Price must be ₱1,000,000 or less.'
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim())) return 'Use up to 2 decimal places, like 85 or 85.50.'
  return null
}

function validateStock(value, unit) {
  const text = String(value).trim()
  if (unit === 'kg') {
    if (!text) return 'Please enter how many kilos you have available.'
    if (!/^\d+(\.\d{1,2})?$/.test(text)) return 'Use kilos with up to 2 decimals, like 12 or 7.5 (0 or more).'
  } else {
    if (!text) return 'Please enter how many you have in stock.'
    if (!/^\d+$/.test(text)) return 'Stock must be a whole number (0 or more).'
  }
  if (Number(text) > 100_000) return 'Stock must be 100,000 or less.'
  return null
}

function validateImageUrl(value) {
  const url = value.trim()
  if (!url) return null
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:' ? null : 'Image links must start with http:// or https://.'
  } catch {
    return 'That doesn’t look like a valid link. Paste the full image URL.'
  }
}

// Mirrors the database CHECK constraints. Key order matches the form for focus.
export function validateProduct(values, imageFile) {
  const name = values.name.trim()
  const description = values.description.trim()
  return compactErrors({
    name:
      required(name, 'Please name your product.') ??
      (name.length < 3 ? 'Use at least 3 characters.' : null) ??
      (name.length > 80 ? 'Keep the name under 80 characters.' : null),
    description:
      required(description, 'Tell buyers about your product.') ??
      (description.length < 20 ? 'Add a bit more detail (at least 20 characters).' : null) ??
      (description.length > 1000 ? 'Keep the description under 1,000 characters.' : null),
    price: validatePrice(values.price),
    category: required(values.category, 'Choose a category.'),
    stock: validateStock(values.stock, values.unit),
    weightStep:
      values.unit === 'kg' && !['0.25', '0.5', '1'].includes(String(values.weightStep))
        ? 'Choose the smallest weight buyers can order.'
        : null,
    imageFile: validateImageFile(imageFile),
    imageUrl: imageFile ? null : validateImageUrl(values.imageUrl),
  })
}
