import { Bike, CircleAlert, Home, LoaderCircle, LogIn, MapPin, Minus, Phone, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import LoadState from '../components/LoadState.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProductImage from '../components/ProductImage.jsx'
import SelectField from '../components/SelectField.jsx'
import TextAreaField from '../components/TextAreaField.jsx'
import TextField from '../components/TextField.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useCart } from '../hooks/useCart.js'
import { useMarket } from '../hooks/useMarket.js'
import { MUNICIPALITY, MUNICIPALITY_LABEL } from '../lib/config.js'
import { EMPTY_CHECKOUT, validateCheckout } from '../lib/orders.js'
import { formatPeso } from '../lib/products.js'
import { readJSON, writeJSON } from '../lib/storage.js'
import { formatQuantity, maxOrderable, totalPrice, unitSuffix } from '../lib/units.js'
import { focusFirstError } from '../lib/validation.js'
import { backend } from '../services/index.js'

const round2 = (n) => Math.round(n * 100) / 100
const checkoutKey = (userId) => `bayanihan.checkout.${userId}`

// Joins cart entries with live product data and flags anything that can't be ordered.
function buildLines(items, products, user) {
  return items.map((item) => {
    const product = products.find((p) => p.id === item.productId)
    if (!product || product.isActive === false) return { ...item, product, problem: 'This item is no longer available.' }
    if (user && product.sellerId === user.id) return { ...item, product, problem: 'This is your own product.' }
    const step = product.unit === 'kg' ? product.weightStep || 1 : 1
    const max = maxOrderable(product)
    if (max < step) return { ...item, product, problem: 'Sold out.' }
    const quantity = Math.min(item.quantity, max)
    return {
      ...item,
      product,
      step,
      max,
      quantity,
      adjusted: quantity !== item.quantity,
      lineTotal: totalPrice(product, quantity),
    }
  })
}

const stepButton =
  'grid size-9 place-items-center rounded-xl bg-vanilla text-nordic shadow-neu-sm transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic'

function CartLine({ line, onQuantity, onRemove }) {
  const { product } = line
  return (
    <li className="flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap">
      {product ? (
        <ProductImage imageUrl={product.imageUrl} name={product.name} category={product.category} iconClassName="size-6" className="size-16 shrink-0 rounded-2xl" />
      ) : (
        <span className="size-16 shrink-0 rounded-2xl shadow-neu-inset" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        {product ? (
          <Link to={`/products/${product.id}`} className="block truncate font-bold text-ink hover:text-nordic">
            {product.name}
          </Link>
        ) : (
          <span className="font-bold text-muted">Removed product</span>
        )}
        {product && (
          <p className="text-sm text-muted">
            {formatPeso(product.price)} {unitSuffix(product.unit)}
          </p>
        )}
        {line.problem && (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-danger">
            <CircleAlert className="size-4" aria-hidden="true" />
            {line.problem}
          </p>
        )}
        {line.adjusted && (
          <p className="mt-1 text-xs font-medium text-[#7a4b00]">Only {formatQuantity(line.max, product.unit)} available, so we adjusted it.</p>
        )}
      </div>

      {!line.problem && (
        <div className="flex items-center gap-2">
          <button type="button" className={stepButton} onClick={() => onQuantity(round2(line.quantity - line.step))} disabled={line.quantity <= line.step} aria-label={`Less ${product.name}`}>
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="min-w-20 text-center font-bold text-ink" aria-live="polite">
            {formatQuantity(line.quantity, product.unit)}
          </span>
          <button type="button" className={stepButton} onClick={() => onQuantity(round2(line.quantity + line.step))} disabled={line.quantity + line.step > line.max + 1e-9} aria-label={`More ${product.name}`}>
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        {!line.problem && <span className="w-24 text-right font-extrabold text-nordic">{formatPeso(line.lineTotal)}</span>}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${product?.name ?? 'item'} from cart`}
          className="grid size-9 place-items-center rounded-xl text-muted transition hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nordic"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default function Cart() {
  const { user } = useAuth()
  const { items, setQuantity, remove } = useCart()
  const { products, status, error, reload } = useMarket()
  const navigate = useNavigate()

  const [form, setForm] = useState(() => ({ ...EMPTY_CHECKOUT, ...(user ? readJSON(localStorage, checkoutKey(user.id), {}) : {}), note: '' }))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [placing, setPlacing] = useState(false)

  if (!items.length) {
    return (
      <>
        <PageHeader eyebrow="Shopping" title="Your Cart" />
        <EmptyState icon={ShoppingCart} title="Your cart is empty" action={<Button to="/marketplace">Browse the Marketplace</Button>}>
          Choose a product, pick how much you need, and tap “Add to cart”.
        </EmptyState>
      </>
    )
  }

  if (status !== 'ready') return <LoadState status={status} error={error} onRetry={reload} label="Loading your cart…" />

  const lines = buildLines(items, products, user)
  const okLines = lines.filter((l) => !l.problem)
  const problemLines = lines.filter((l) => l.problem)
  const shops = Map.groupBy(lines, (l) => l.product?.sellerId ?? 'missing')
  const grandTotal = round2(okLines.reduce((sum, l) => sum + l.lineTotal, 0))
  const shopCount = new Set(okLines.map((l) => l.product.sellerId)).size

  function update(name, value) {
    const next = { ...form, [name]: value }
    setForm(next)
    setFormError('')
    if (submitted) setErrors(validateCheckout(next))
  }

  const field = (name) => ({
    id: `checkout-${name}`,
    value: form[name],
    onChange: (e) => update(name, e.target.value),
    error: errors[name],
  })

  async function handleCheckout(event) {
    event.preventDefault()
    setSubmitted(true)
    const found = validateCheckout(form)
    setErrors(found)
    if (Object.keys(found).length) {
      focusFirstError(found, 'checkout')
      return
    }
    if (problemLines.length) {
      setFormError('Remove the items marked in red before placing your order.')
      return
    }
    setPlacing(true)
    setFormError('')
    try {
      const created = await backend.orders.place(
        form,
        okLines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        { user },
      )
      const { note, ...remembered } = form
      void note
      writeJSON(localStorage, checkoutKey(user.id), remembered)
      remove(okLines.map((l) => l.productId))
      reload()
      const summary = created.map((o) => `#${o.orderNo} (${o.shopName})`).join(', ')
      navigate(created.length === 1 ? `/orders/${created[0].id}` : '/orders', {
        state: {
          flash: {
            type: 'success',
            message:
              created.length === 1
                ? `Order ${summary} placed! The seller will confirm it soon. Pay in cash on ${form.fulfillment === 'delivery' ? 'delivery' : 'pickup'}.${form.fulfillment === 'delivery' ? ' The map below shows how far the shop is from you.' : ''}`
                : `${created.length} orders placed: ${summary}. Each seller will confirm their part.`,
          },
        },
      })
    } catch (err) {
      setFormError(err.message)
      setPlacing(false)
      reload()
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Shopping"
        title="Your Cart"
        description={`${lines.length} ${lines.length === 1 ? 'item' : 'items'}${shopCount > 1 ? ` from ${shopCount} shops (one order per shop)` : ''}.`}
      />

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {[...shops.entries()].map(([sellerId, shopLines]) => (
            <section key={sellerId} className="rounded-[2rem] bg-vanilla px-5 py-2 shadow-neu sm:px-6" aria-label={shopLines[0].product?.shopName ?? 'Unavailable items'}>
              <h2 className="flex items-center gap-2 border-b border-[#e8e1cf] py-4 font-bold text-ink">
                <Store className="size-5 text-nordic" aria-hidden="true" />
                {shopLines[0].product?.shopName ?? 'Unavailable items'}
                {shopLines[0].product?.barangay && <span className="text-sm font-normal text-muted">· Brgy. {shopLines[0].product.barangay}</span>}
              </h2>
              <ul className="divide-y divide-[#e8e1cf]">
                {shopLines.map((line) => (
                  <CartLine
                    key={line.productId}
                    line={line}
                    onQuantity={(q) => setQuantity(line.productId, q)}
                    onRemove={() => remove(line.productId)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>

        <form onSubmit={handleCheckout} noValidate className="space-y-5 rounded-[2rem] bg-vanilla p-6 shadow-neu lg:sticky lg:top-24">
          <h2 className="text-lg font-extrabold text-ink">Checkout</h2>
          {formError && <Alert type="error">{formError}</Alert>}

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-ink">How will you get it?</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'pickup', label: 'Pickup', hint: 'At the shop', icon: Store },
                { value: 'delivery', label: 'Delivery', hint: `Within ${MUNICIPALITY.name}`, icon: Bike },
              ].map(({ value, label, hint, icon: Icon }) => {
                const selected = form.fulfillment === value
                return (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-2xl p-3 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-nordic ${
                      selected ? 'text-nordic shadow-neu-inset ring-2 ring-nordic/70' : 'text-ink shadow-neu hover:-translate-y-0.5'
                    }`}
                  >
                    <input type="radio" name="fulfillment" value={value} checked={selected} onChange={() => update('fulfillment', value)} className="sr-only" />
                    <span className="flex items-center gap-2 font-bold">
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{hint}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <TextField {...field('contactPhone')} label="Mobile number" icon={Phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" hint="The seller will text or call you about your order." />

          {form.fulfillment === 'delivery' && (
            <>
              <SelectField {...field('deliveryBarangay')} label={`Barangay (${MUNICIPALITY_LABEL})`} icon={MapPin} options={MUNICIPALITY.barangays} placeholder="Select your barangay" />
              <TextField {...field('deliveryAddress')} label="Street, purok or landmark" icon={Home} autoComplete="street-address" placeholder="e.g. Purok 3, beside the chapel" />
              <LocationPicker
                id="checkout-deliveryPin"
                label="Pin your delivery location"
                hint="Tap the map where the order should be delivered, or use your current location."
                markerLabel="Delivery spot"
                value={form.deliveryPin}
                onChange={(pin) => update('deliveryPin', pin)}
                error={errors.deliveryPin}
              />
              <p className="text-xs text-muted">Delivery fee, if any, is agreed with the seller.</p>
            </>
          )}

          <TextAreaField {...field('note')} label="Note to seller (optional)" rows={2} placeholder="e.g. Pakihiwa po ng pang-adobo" />

          <div className="space-y-1 rounded-2xl p-4 text-sm shadow-neu-inset">
            {[...shops.values()]
              .filter((shopLines) => shopLines[0].product && !shopLines[0].problem)
              .map((shopLines) => (
                <p key={shopLines[0].product.sellerId} className="flex justify-between gap-3 text-muted">
                  <span className="truncate">{shopLines[0].product.shopName}</span>
                  <span>{formatPeso(round2(shopLines.filter((l) => !l.problem).reduce((s, l) => s + l.lineTotal, 0)))}</span>
                </p>
              ))}
            <p className="flex justify-between border-t border-[#e8e1cf] pt-2 text-base font-extrabold text-ink">
              <span>Total</span>
              <span className="text-nordic">{formatPeso(grandTotal)}</span>
            </p>
            <p className="text-xs text-muted">Cash on {form.fulfillment === 'delivery' ? 'delivery' : 'pickup'}. No online payment needed.</p>
          </div>

          {user ? (
            <Button type="submit" size="lg" className="w-full" disabled={placing || !okLines.length}>
              {placing && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
              {placing ? 'Placing order…' : `Place order · ${formatPeso(grandTotal)}`}
            </Button>
          ) : (
            <Button to="/signin" state={{ from: '/cart', flash: { type: 'info', message: 'Sign in to place your order. Your cart is saved.' } }} size="lg" className="w-full">
              <LogIn className="size-5" aria-hidden="true" />
              Sign in to check out
            </Button>
          )}
        </form>
      </div>
    </>
  )
}
