import { Boxes, CircleAlert, Image, ImageUp, LoaderCircle, MapPin, Package, Scale, Tag, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CATEGORIES } from '../lib/config.js'
import { validateProduct } from '../lib/productForm.js'
import { formatPeso, IMAGE_RULES } from '../lib/products.js'
import { UNITS, unitSuffix, WEIGHT_CATEGORIES, WEIGHT_STEPS } from '../lib/units.js'
import { focusFirstError } from '../lib/validation.js'
import Alert from './Alert.jsx'
import AvailabilityBadge from './AvailabilityBadge.jsx'
import Button from './Button.jsx'
import Checkbox from './Checkbox.jsx'
import ProductImage from './ProductImage.jsx'
import SelectField from './SelectField.jsx'
import TextAreaField from './TextAreaField.jsx'
import TextField from './TextField.jsx'

function PesoSign({ className }) {
  return <span className={`${className} text-center leading-5 font-bold`}>₱</span>
}

/**
 * Add/edit product form with a live preview. `onSubmit(values, imageFile)` may throw
 * to show an error. Uploads are offered when `imageUpload` is true (Supabase Storage).
 */
export default function ProductForm({ initialValues, submitLabel, savingLabel, onSubmit, cancelTo, imageUpload, locationLabel }) {
  const [form, setForm] = useState(initialValues)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInput = useRef(null)
  // Until the seller picks a unit, choosing produce or meat switches to "Per kilo".
  const [unitTouched, setUnitTouched] = useState(Boolean(initialValues.name))

  // Free the temporary preview URL when it changes or the form closes.
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  function update(name, value, file = imageFile) {
    const next = { ...form, [name]: value }
    if (name === 'unit') setUnitTouched(true)
    if (name === 'category' && !unitTouched) next.unit = WEIGHT_CATEGORIES.includes(value) ? 'kg' : 'piece'
    setForm(next)
    setFormError('')
    if (submitted) setErrors(validateProduct(next, file))
  }

  function chooseFile(file) {
    setImageFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
    setFormError('')
    // Validate the file straight away so a too-large photo is flagged before submit.
    setErrors((current) => {
      const next = validateProduct(form, file)
      return submitted ? next : { ...current, imageFile: next.imageFile }
    })
  }

  function removePhoto() {
    chooseFile(null)
    if (fileInput.current) fileInput.current.value = ''
    update('imageUrl', '', null)
  }

  const field = (name) => ({
    id: `product-${name}`,
    value: form[name],
    onChange: (e) => update(name, e.target.value),
    error: errors[name],
  })

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const found = validateProduct(form, imageFile)
    setErrors(found)
    if (Object.keys(found).length) {
      setFormError('Please fix the highlighted fields and try again.')
      focusFirstError(found, 'product')
      return
    }
    setSaving(true)
    try {
      await onSubmit(form, imageFile)
    } catch (error) {
      setFormError(error.message)
      setSaving(false)
    }
  }

  const previewPrice = Number(form.price)
  const byWeight = form.unit === 'kg'
  const previewStock = byWeight ? Number(form.stock) : Number.parseInt(form.stock, 10)
  const shownImage = (!errors.imageFile && previewUrl) || form.imageUrl
  const maxMb = IMAGE_RULES.maxBytes / (1024 * 1024)

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-8 xl:grid-cols-[1fr_280px]">
      <div className="space-y-6 rounded-[2rem] bg-vanilla p-6 shadow-neu sm:p-8">
        {formError && <Alert type="error">{formError}</Alert>}

        <TextField {...field('name')} label="Product name" icon={Package} placeholder="e.g. Honey-Glazed Pili Nuts (250 g)" />
        <TextAreaField
          {...field('description')}
          label="Description"
          rows={5}
          placeholder="What makes it special? Include size, ingredients, or how it’s made."
          hint={`${form.description.trim().length}/1000 characters`}
        />
        <SelectField {...field('category')} label="Category" icon={Tag} options={CATEGORIES} placeholder="Select a category" />

        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink">Sold by</legend>
          <div className="grid grid-cols-2 gap-4">
            {UNITS.map(({ value, label, hint }) => {
              const selected = form.unit === value
              return (
                <label
                  key={value}
                  className={`cursor-pointer rounded-2xl p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-nordic ${
                    selected ? 'text-nordic shadow-neu-inset ring-2 ring-nordic/70' : 'text-ink shadow-neu hover:-translate-y-0.5'
                  }`}
                >
                  <input
                    type="radio"
                    name="product-unit"
                    value={value}
                    checked={selected}
                    onChange={() => update('unit', value)}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-2 font-bold">
                    {value === 'kg' ? <Scale className="size-4" aria-hidden="true" /> : <Package className="size-4" aria-hidden="true" />}
                    {label}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{hint}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            {...field('price')}
            label={byWeight ? 'Price per kilo (PHP)' : 'Price (PHP)'}
            icon={PesoSign}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            hint={byWeight ? 'Buyers pay this × the weight they choose.' : undefined}
          />
          <TextField
            {...field('stock')}
            label={byWeight ? 'Available stock (kg)' : 'Stock quantity'}
            icon={Boxes}
            type="number"
            inputMode={byWeight ? 'decimal' : 'numeric'}
            min="0"
            step={byWeight ? '0.25' : '1'}
            placeholder="0"
            hint="Set to 0 to mark as sold out."
          />
        </div>
        {byWeight && (
          <SelectField
            {...field('weightStep')}
            label="Smallest weight buyers can order"
            icon={Scale}
            options={WEIGHT_STEPS.map((w) => ({ value: String(w.value), label: w.label }))}
            hint="Buyers choose weights in steps of this amount, e.g. ¼, ½, ¾, 1 kg…"
          />
        )}

        <fieldset className="space-y-4 rounded-3xl p-5 shadow-neu-inset">
          <legend className="sr-only">Product photo</legend>
          <p className="text-sm font-semibold text-ink" aria-hidden="true">
            Product photo (optional)
          </p>
          {imageUpload && (
            <div>
              <input
                ref={fileInput}
                id="product-imageFile"
                type="file"
                accept={IMAGE_RULES.types.join(',')}
                onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
                aria-invalid={errors.imageFile ? true : undefined}
                aria-describedby="product-imageFile-help"
                className="peer sr-only"
              />
              <div className="flex flex-wrap items-center gap-3">
                <label
                  htmlFor="product-imageFile"
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-vanilla px-5 text-sm font-semibold text-nordic shadow-neu transition hover:-translate-y-0.5 peer-focus-visible:ring-2 peer-focus-visible:ring-nordic"
                >
                  <ImageUp className="size-4" aria-hidden="true" />
                  {imageFile ? 'Choose a different photo' : 'Upload a photo'}
                </label>
                {(imageFile || form.imageUrl) && (
                  <Button variant="ghost" size="sm" onClick={removePhoto}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove photo
                  </Button>
                )}
              </div>
              <p id="product-imageFile-help" className="mt-2 text-sm text-muted">
                {imageFile ? `Selected: ${imageFile.name}` : `JPG, PNG or WebP, up to ${maxMb} MB.`}
              </p>
              {errors.imageFile && (
                <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {errors.imageFile}
                </p>
              )}
            </div>
          )}
          {!imageFile && (
            <TextField
              {...field('imageUrl')}
              label={imageUpload ? 'Or paste an image link' : 'Product image URL'}
              icon={Image}
              type="url"
              inputMode="url"
              placeholder="https://…"
              hint="Without a photo, a category illustration is shown."
            />
          )}
        </fieldset>

        <Checkbox id="product-isActive" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)}>
          <span className="font-semibold">Visible to buyers</span>
          <span className="block text-muted">Untick to hide this listing from the marketplace without deleting it.</span>
        </Checkbox>

        {locationLabel && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            Sold from {locationLabel} (from your shop profile)
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button to={cancelTo} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
            {saving ? savingLabel : submitLabel}
          </Button>
        </div>
      </div>

      <aside aria-label="Listing preview" className="rounded-[2rem] bg-vanilla p-4 shadow-neu xl:sticky xl:top-24">
        <p className="px-2 pb-3 text-xs font-semibold tracking-[0.2em] text-muted uppercase">Preview</p>
        <ProductImage
          imageUrl={shownImage}
          name={form.name || 'Product preview'}
          category={form.category}
          className={`aspect-[4/3] w-full rounded-2xl ${form.isActive ? '' : 'opacity-60 grayscale'}`}
        />
        <div className="px-2 pt-4 pb-2">
          <p className="font-bold break-words text-ink">{form.name || 'Your product name'}</p>
          <p className="mt-1 text-sm text-muted">{form.category || 'Category'}</p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-lg font-extrabold text-nordic">
              {previewPrice > 0 ? formatPeso(previewPrice) : '₱—'}
              {byWeight && <span className="text-sm font-semibold text-muted"> {unitSuffix('kg')}</span>}
            </p>
            {Number.isFinite(previewStock) && <AvailabilityBadge stock={previewStock} unit={form.unit} />}
          </div>
          {!form.isActive && <p className="mt-2 text-xs font-semibold text-muted">Hidden from buyers</p>}
        </div>
      </aside>
    </form>
  )
}
