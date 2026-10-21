import { Minus, Plus, Scale } from 'lucide-react'
import { formatPeso } from '../lib/products.js'
import { formatQuantity, isByWeight, maxOrderable, totalPrice, weightOptions } from '../lib/units.js'

const round2 = (n) => Math.round(n * 100) / 100

const stepButton =
  'grid size-11 shrink-0 place-items-center rounded-2xl bg-vanilla text-nordic shadow-neu transition hover:-translate-y-0.5 active:shadow-neu-inset disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic'

/**
 * Lets a buyer choose how much to buy (by weight or by piece) and shows the total.
 * Controlled: `quantity` and `onChange` live in the parent.
 */
export default function QuantityPicker({ product, quantity, onChange }) {
  const byWeight = isByWeight(product)
  const step = byWeight ? product.weightStep || 1 : 1
  const max = maxOrderable(product)
  const options = byWeight ? weightOptions(product) : []

  if (max < step) return null

  const set = (value) => onChange(Math.min(max, Math.max(step, round2(value))))

  return (
    <section aria-labelledby="quantity-title" className="mt-8 rounded-3xl bg-vanilla p-5 shadow-neu">
      <h2 id="quantity-title" className="flex items-center gap-2 text-sm font-semibold text-ink">
        {byWeight && <Scale className="size-4 text-nordic" aria-hidden="true" />}
        {byWeight ? 'How many kilos?' : 'How many pieces?'}
      </h2>

      {options.length > 0 && (
        <div role="group" aria-label="Quick weight options" className="mt-4 flex flex-wrap gap-2">
          {options.map((weight) => {
            const active = weight === quantity
            return (
              <button
                key={weight}
                type="button"
                aria-pressed={active}
                onClick={() => set(weight)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic ${
                  active ? 'bg-nordic text-white shadow-neu-pressed' : 'bg-vanilla text-muted shadow-neu-sm hover:text-nordic'
                }`}
              >
                {formatQuantity(weight, 'kg')}
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <button type="button" className={stepButton} onClick={() => set(quantity - step)} disabled={quantity <= step} aria-label={`Decrease by ${formatQuantity(step, product.unit)}`}>
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <output aria-live="polite" className="min-w-24 rounded-2xl px-4 py-2.5 text-center text-lg font-extrabold text-ink shadow-neu-inset">
            {formatQuantity(quantity, product.unit)}
          </output>
          <button type="button" className={stepButton} onClick={() => set(quantity + step)} disabled={quantity + step > max + 1e-9} aria-label={`Increase by ${formatQuantity(step, product.unit)}`}>
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="ml-auto text-right">
          <p className="text-xs text-muted">
            {formatQuantity(quantity, product.unit)} × {formatPeso(product.price)}
            {byWeight ? '/kg' : ''}
          </p>
          <p className="text-2xl font-extrabold text-nordic" aria-live="polite">
            Total: {formatPeso(totalPrice(product, quantity))}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        {byWeight
          ? `Sold in ${formatQuantity(step, 'kg')} steps · up to ${formatQuantity(max, 'kg')} available`
          : `Up to ${formatQuantity(max, 'piece')} available`}
      </p>
    </section>
  )
}
