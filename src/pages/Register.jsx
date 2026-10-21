import { Building2, LoaderCircle, Mail, MapPin, Store, Tag, User } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AccountTypePicker from '../components/AccountTypePicker.jsx'
import Alert from '../components/Alert.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import Checkbox from '../components/Checkbox.jsx'
import PasswordField from '../components/PasswordField.jsx'
import SelectField from '../components/SelectField.jsx'
import TextField from '../components/TextField.jsx'
import TextLink from '../components/TextLink.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { CATEGORIES, MUNICIPALITY, MUNICIPALITY_LABEL } from '../lib/config.js'
import { destinationFor } from '../lib/routing.js'
import { compactErrors, focusFirstError, required, validateEmail, validateNewPassword } from '../lib/validation.js'

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  municipality: MUNICIPALITY.name,
  barangay: '',
  shopName: '',
  category: '',
  terms: false,
}

// Key order matches the on-screen order so focus lands on the first invalid field.
function validate(form) {
  const isSeller = form.accountType === 'seller'
  return compactErrors({
    fullName:
      required(form.fullName, 'Please enter your full name.') ??
      (form.fullName.trim().length < 2 ? 'Your name looks a bit short.' : null),
    email: validateEmail(form.email),
    password: validateNewPassword(form.password),
    confirmPassword: !form.confirmPassword
      ? 'Please confirm your password.'
      : form.confirmPassword !== form.password
        ? 'Passwords don’t match yet.'
        : null,
    shopName: isSeller ? required(form.shopName, 'What’s the name of your shop?') : null,
    barangay: isSeller ? required(form.barangay, 'Please choose your shop’s barangay.') : null,
    category: isSeller ? required(form.category, 'Choose the category that best fits your products.') : null,
    terms: form.terms ? null : 'Please accept the terms and conditions to continue.',
  })
}

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState(() => ({
    ...initialForm,
    accountType: searchParams.get('type') === 'seller' ? 'seller' : 'buyer',
  }))
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user && !loading) return <Navigate to={destinationFor(user)} replace />

  const isSeller = form.accountType === 'seller'
  const field = (name) => ({
    id: `register-${name}`,
    value: form[name],
    onChange: (e) => update(name, e.target.value),
    error: errors[name],
  })

  function update(name, value) {
    const next = { ...form, [name]: value }
    setForm(next)
    setFormError('')
    if (submitted) setErrors(validate(next))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      setFormError('A few details need your attention before we can create your account.')
      focusFirstError(found, 'register')
      return
    }

    setLoading(true)
    const firstName = form.fullName.trim().split(' ')[0]
    // Sellers always register in the configured municipality.
    const payload = isSeller ? { ...form, municipality: MUNICIPALITY.name } : form
    try {
      const { user: account, needsConfirmation } = await register(payload)
      if (account) {
        navigate(destinationFor(account), {
          replace: true,
          state: { flash: { type: 'success', message: `Welcome to Bayanihan Market, ${firstName}!` } },
        })
      } else if (needsConfirmation) {
        navigate('/signin', {
          state: {
            email: form.email.trim(),
            flash: {
              type: 'success',
              message: `Almost there, ${firstName}! We sent a confirmation link to ${form.email.trim()}. Open it, then sign in here.`,
            },
          },
        })
      } else {
        navigate('/signin', {
          state: {
            email: form.email.trim(),
            flash: { type: 'success', message: `Your ${isSeller ? 'seller' : 'buyer'} account is ready, ${firstName}! Sign in to continue.` },
          },
        })
      }
    } catch (error) {
      setFormError(error.message)
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join your neighbors in buying and selling local.">
      {formError && (
        <Alert type="error" className="mb-6">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <AccountTypePicker value={form.accountType} onChange={(type) => update('accountType', type)} />

        <TextField {...field('fullName')} label="Full name" icon={User} autoComplete="name" placeholder="Juan Dela Cruz" />
        <TextField
          {...field('email')}
          label="Email address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <PasswordField
            {...field('password')}
            label="Password"
            autoComplete="new-password"
            placeholder="Create a password"
            hint="8+ characters with a letter and a number."
          />
          <PasswordField
            {...field('confirmPassword')}
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Re-enter password"
          />
        </div>

        {isSeller ? (
          <fieldset className="space-y-6 rounded-3xl p-5 shadow-neu-inset sm:p-6">
            <legend className="sr-only">Shop details</legend>
            <div className="flex items-center gap-2 font-bold text-nordic" aria-hidden="true">
              <Store className="size-5" />
              Shop details
            </div>
            <TextField {...field('shopName')} label="Shop name" icon={Store} placeholder="e.g. Aling Nena’s Garden" />
            <div className="grid gap-6 sm:grid-cols-2">
              <TextField
                id="register-seller-municipality"
                label="Municipality"
                icon={Building2}
                value={MUNICIPALITY_LABEL}
                readOnly
                hint={`Only sellers based in ${MUNICIPALITY.name} can sell here.`}
              />
              <SelectField
                {...field('barangay')}
                label="Barangay"
                icon={MapPin}
                options={MUNICIPALITY.barangays}
                placeholder="Select your barangay"
              />
            </div>
            <SelectField
              {...field('category')}
              label="Product category"
              icon={Tag}
              options={CATEGORIES}
              placeholder="Select a category"
            />
            <p className="text-xs leading-relaxed text-muted">
              New seller accounts are reviewed by the marketplace administrator. You can set up your shop right away and
              start listing products once you’re approved.
            </p>
          </fieldset>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField
              {...field('municipality')}
              label="Municipality (optional)"
              icon={Building2}
              autoComplete="address-level2"
              placeholder={`e.g. ${MUNICIPALITY.name}`}
            />
            <TextField
              {...field('barangay')}
              label="Barangay (optional)"
              icon={MapPin}
              list="register-barangays"
              placeholder="e.g. Dancalan"
            />
            <datalist id="register-barangays">
              {MUNICIPALITY.barangays.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        )}

        <Checkbox
          id="register-terms"
          checked={form.terms}
          onChange={(e) => update('terms', e.target.checked)}
          error={errors.terms}
        >
          I agree to the <TextLink to="/terms">Terms and Conditions</TextLink>.
        </Checkbox>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account? <TextLink to="/signin">Sign in</TextLink>
      </p>
    </AuthLayout>
  )
}
