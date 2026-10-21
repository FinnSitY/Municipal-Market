import { LoaderCircle, Mail, ShoppingBasket, Store } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import Checkbox from '../components/Checkbox.jsx'
import PasswordField from '../components/PasswordField.jsx'
import TextField from '../components/TextField.jsx'
import TextLink from '../components/TextLink.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { useFlash } from '../hooks/useFlash.js'
import { destinationFor } from '../lib/routing.js'
import { compactErrors, focusFirstError, required, validateEmail } from '../lib/validation.js'
import { backendMode } from '../services/index.js'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../services/mock/seedData.js'

const demoButtons = [
  { type: 'seller', label: 'Demo seller', icon: Store },
  { type: 'buyer', label: 'Demo buyer', icon: ShoppingBasket },
]

function validate({ email, password }) {
  return compactErrors({
    email: validateEmail(email),
    password: required(password, 'Please enter your password.'),
  })
}

export default function SignIn() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [flash, dismissFlash] = useFlash()

  const [form, setForm] = useState({ email: location.state?.email ?? '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from

  if (user && !loading) return <Navigate to={destinationFor(user, from)} replace />

  function fillDemo(type) {
    const account = DEMO_ACCOUNTS.find((a) => a.accountType === type)
    const next = { ...form, email: account.email, password: DEMO_PASSWORD }
    setForm(next)
    setFormError('')
    setErrors({})
  }

  function update(field, value) {
    const next = { ...form, [field]: value }
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
      focusFirstError(found, 'signin')
      return
    }

    setLoading(true)
    try {
      const account = await signIn(form.email, form.password, form.remember)
      navigate(destinationFor(account, from), {
        replace: true,
        state: { flash: { type: 'success', message: `Welcome back, ${account.fullName.split(' ')[0]}! You’re signed in.` } },
      })
    } catch (error) {
      setFormError(error.message)
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue supporting your local sellers.">
      {flash && (
        <Alert type={flash.type} onDismiss={dismissFlash} className="mb-6">
          {flash.message}
        </Alert>
      )}
      {formError && (
        <Alert type="error" className="mb-6">
          {formError}{' '}
          <TextLink to="/register" className="text-danger">
            Need an account?
          </TextLink>
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <TextField
          id="signin-email"
          label="Email address"
          type="email"
          icon={Mail}
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
        />
        <PasswordField
          id="signin-password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          error={errors.password}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox id="signin-remember" checked={form.remember} onChange={(e) => update('remember', e.target.checked)}>
            Remember me
          </Checkbox>
          <TextLink to="/forgot-password" className="text-sm">
            Forgot password?
          </TextLink>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      {backendMode === 'mock' && (
        <div className="mt-8 rounded-3xl p-5 shadow-neu-inset">
          <p className="text-sm font-semibold text-ink">Try a mock demo account</p>
          <p className="mt-1 text-xs text-muted">
            Fills in the form for you. Password for both: <code className="font-semibold">{DEMO_PASSWORD}</code>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {demoButtons.map(({ type, label, icon: Icon }) => (
              <Button key={type} variant="secondary" size="sm" onClick={() => fillDemo(type)}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        New to Bayanihan Market? <TextLink to="/register">Create an account</TextLink>
      </p>
    </AuthLayout>
  )
}
