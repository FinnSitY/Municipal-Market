// Products are sold per piece or per kilo. For kilos, `price` is the price per kilo,
// `stock` is kilos available, and `weightStep` is the smallest weight a buyer can order.

export const UNITS = [
  { value: 'piece', label: 'Per piece', hint: 'Bundles, packs, bottles, crafts…' },
  { value: 'kg', label: 'Per kilo', hint: 'Vegetables, fruit, meat, fish, rice…' },
]

export const WEIGHT_STEPS = [
  { value: 0.25, label: '¼ kg' },
  { value: 0.5, label: '½ kg' },
  { value: 1, label: '1 kg' },
]

// Categories where selling by weight is the usual choice; used to pre-select "Per kilo".
export const WEIGHT_CATEGORIES = ['Fresh Produce', 'Meat & Seafood']

// Weights buyers can pick with one tap (only those allowed by the step and stock are shown).
const PRESET_WEIGHTS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5, 10]

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' }

const round2 = (n) => Math.round(n * 100) / 100

export function isByWeight(product) {
  return product?.unit === 'kg'
}

/** "¼ kg", "1½ kg", "2.3 kg", "1 pc", "3 pcs". */
export function formatQuantity(quantity, unit) {
  const qty = round2(Number(quantity) || 0)
  if (unit !== 'kg') return `${qty} ${qty === 1 ? 'pc' : 'pcs'}`
  const whole = Math.floor(qty)
  const fraction = FRACTIONS[round2(qty - whole)]
  if (fraction) return `${whole > 0 ? whole : ''}${fraction} kg`
  return `${qty} kg`
}

/** "per kilo" suffix for prices. */
export function unitSuffix(unit) {
  return unit === 'kg' ? '/ kg' : ''
}

/** Quick-pick weights for a product: multiples of its step, no more than what's in stock. */
export function weightOptions(product) {
  const step = product.weightStep || 1
  return PRESET_WEIGHTS.filter((w) => w >= step && isMultiple(w, step) && w <= product.stock)
}

export function isMultiple(value, step) {
  return Math.abs(Math.round(value / step) * step - value) < 1e-9
}

/** Price for the chosen quantity, rounded to centavos. */
export function totalPrice(product, quantity) {
  return round2(product.price * quantity)
}

/** The largest orderable quantity: stock rounded down to the step (e.g. 2.3 kg with ½ kg steps → 2 kg). */
export function maxOrderable(product) {
  const step = isByWeight(product) ? product.weightStep || 1 : 1
  return round2(Math.floor(round2(product.stock / step)) * step)
}
