import { BadgeCheck, Building2, Clock, LoaderCircle, Mail, MapPin, Store, Tag, User, XCircle } from 'lucide-react'
import { useState } from 'react'
import Alert from '../../components/Alert.jsx'
import Button from '../../components/Button.jsx'
import LocationPicker from '../../components/LocationPicker.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import SelectField from '../../components/SelectField.jsx'
import TextAreaField from '../../components/TextAreaField.jsx'
import TextField from '../../components/TextField.jsx'
import { useAuth } from '../../hooks/useAuth.js'
import { useMarket } from '../../hooks/useMarket.js'
import { CATEGORIES, MUNICIPALITY, MUNICIPALITY_LABEL } from '../../lib/config.js'
import { hasPoint, inServiceArea } from '../../lib/geo.js'
import { compactErrors, focusFirstError, required } from '../../lib/validation.js'

const statusBadges = {
  approved: { icon: BadgeCheck, label: 'Approved seller', classes: 'bg-sage text-sage-dark' },
  pending: { icon: Clock, label: 'Awaiting approval', classes: 'bg-[#f6e3bf] text-[#7a4b00]' },
  rejected: { icon: XCircle, label: 'Not approved', classes: 'bg-[#fbe4e0] text-danger' },
}

function toForm(user) {
  return {
    fullName: user.fullName,
    shopName: user.shop?.name ?? '',
    barangay: user.shop?.barangay ?? user.barangay ?? '',
    category: user.shop?.category ?? '',
    about: user.shop?.description ?? '',
    location: hasPoint({ lat: user.shop?.lat, lng: user.shop?.lng }) ? { lat: user.shop.lat, lng: user.shop.lng } : null,
  }
}

// Mirrors the shops table CHECK constraints.
function validate(form) {
  const shopName = form.shopName.trim()
  return compactErrors({
    fullName: required(form.fullName, 'Please enter your full name.'),
    shopName:
      required(shopName, 'Your shop needs a name.') ??
      (shopName.length < 2 || shopName.length > 80 ? 'Use 2 to 80 characters.' : null),
    category: required(form.category, 'Choose your main product category.'),
    barangay: required(form.barangay, 'Please choose your barangay.'),
    about: form.about.trim().length > 300 ? 'Keep your shop description under 300 characters.' : null,
    location: form.location && !inServiceArea(form.location) ? `Your shop pin must be inside ${MUNICIPALITY.name}.` : null,
  })
}

export default function ShopProfile() {
  const { user, updateProfile } = useAuth()
  const { syncSellerProducts } = useMarket()
  const [form, setForm] = useState(() => toForm(user))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const badge = statusBadges[user.sellerStatus] ?? statusBadges.pending
  const BadgeIcon = badge.icon

  function update(name, value) {
    const next = { ...form, [name]: value }
    setForm(next)
    setNotice(null)
    if (submitted) setErrors(validate(next))
  }

  const field = (name) => ({
    id: `profile-${name}`,
    value: form[name],
    onChange: (e) => update(name, e.target.value),
    error: errors[name],
  })

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      setNotice({ type: 'error', message: 'Please fix the highlighted fields before saving.' })
      focusFirstError(found, 'profile')
      return
    }
    setSaving(true)
    try {
      const updated = await updateProfile({
        fullName: form.fullName,
        barangay: form.barangay,
        shop: { name: form.shopName, description: form.about, category: form.category, barangay: form.barangay, location: form.location },
      })
      await syncSellerProducts(updated)
      setNotice({ type: 'success', message: 'Shop profile saved. Your listings now show the updated details.' })
    } catch (err) {
      setNotice({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Seller dashboard"
        title="Shop Profile"
        description="This is how buyers see your shop in the marketplace."
        actions={
          user.shop && (
            <Button to={`/marketplace?seller=${encodeURIComponent(user.id)}`} variant="secondary">
              <Store className="size-4" aria-hidden="true" />
              View my shop
            </Button>
          )
        }
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-[2rem] bg-vanilla p-6 shadow-neu sm:p-8">
        {notice && (
          <Alert type={notice.type} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Alert>
        )}

        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${badge.classes}`}>
          <BadgeIcon className="size-4" aria-hidden="true" />
          {badge.label}
        </span>

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField {...field('fullName')} label="Owner’s full name" icon={User} autoComplete="name" />
          <TextField id="profile-email" label="Email address" icon={Mail} value={user.email} readOnly hint="Your email is private and never shown to buyers." />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField {...field('shopName')} label="Shop name" icon={Store} />
          <SelectField {...field('category')} label="Main product category" icon={Tag} options={CATEGORIES} placeholder="Select a category" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id="profile-municipality"
            label="Municipality"
            icon={Building2}
            value={MUNICIPALITY_LABEL}
            readOnly
            hint="All shops are registered in the marketplace municipality."
          />
          <SelectField
            {...field('barangay')}
            label="Barangay"
            icon={MapPin}
            options={
              form.barangay && !MUNICIPALITY.barangays.includes(form.barangay)
                ? [form.barangay, ...MUNICIPALITY.barangays]
                : MUNICIPALITY.barangays
            }
            placeholder="Select your barangay"
          />
        </div>
        <LocationPicker
          id="profile-location"
          kind="shop"
          label="Shop location on the map"
          markerLabel={form.shopName || 'Your shop'}
          hint="Tap the map where your shop is, or use your current location while you’re at the shop. Buyers see this to know how far you are."
          value={form.location}
          onChange={(location) => update('location', location)}
          error={errors.location}
        />
        <TextAreaField
          {...field('about')}
          label="About your shop (optional)"
          rows={3}
          placeholder="Share your story, specialties, or pickup schedule."
          hint={`${form.about.trim().length}/300 characters`}
        />
        <p className="text-xs leading-relaxed text-muted">
          Shown publicly: shop name, description, category, barangay, municipality and your name. Your email stays private.
        </p>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </>
  )
}
