import { KeyRound, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import EmptyState from '../components/EmptyState.jsx'
import PasswordField from '../components/PasswordField.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { destinationFor } from '../lib/routing.js'
import { compactErrors, focusFirstError, validateNewPassword } from '../lib/validation.js'

function validate({ password, confirmPassword }) {
  return compactErrors({
    password: validateNewPassword(password),
    confirmPassword: confirmPassword === password ? null : 'Passwords don’t match yet.',
  })
}

/** Landing page for the password-reset email. Supabase signs the user in from the link first. */
export default function ResetPassword() {
  const { user, updatePassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) {
    return (
      <AuthLayout title="Reset your password">
        <EmptyState
          icon={KeyRound}
          title="This reset link is invalid or has expired"
          action={<Button to="/forgot-password">Request a new link</Button>}
        >
          Reset links work once, for a limited time, and must be opened in the same browser you requested them from.
        </EmptyState>
      </AuthLayout>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      focusFirstError(found, 'reset')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await updatePassword(form.password)
      navigate(destinationFor(user), {
        replace: true,
        state: { flash: { type: 'success', message: 'Your password has been updated.' } },
      })
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  return (
    <AuthLayout title="Choose a new password" subtitle={`For ${user.email}`}>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {formError && <Alert type="error">{formError}</Alert>}
        <PasswordField
          id="reset-password"
          label="New password"
          autoComplete="new-password"
          hint="8+ characters with a letter and a number."
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={errors.password}
        />
        <PasswordField
          id="reset-confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          error={errors.confirmPassword}
        />
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {saving ? 'Saving…' : 'Update Password'}
        </Button>
      </form>
    </AuthLayout>
  )
}
