import { LoaderCircle, Mail } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import Button from '../components/Button.jsx'
import TextField from '../components/TextField.jsx'
import TextLink from '../components/TextLink.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { validateEmail } from '../lib/validation.js'
import { backend } from '../services/index.js'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState('')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validateEmail(email)
    setError(problem)
    if (problem) {
      document.getElementById('forgot-email')?.focus()
      return
    }
    setSending(true)
    setFormError('')
    try {
      await requestPasswordReset(email)
      setSentTo(email.trim())
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter the email you registered with and we’ll help you get back in.">
      {sentTo ? (
        <Alert type="success" className="mb-6">
          {backend.capabilities.passwordReset ? (
            <>
              If an account exists for <strong>{sentTo}</strong>, we’ve sent a link to reset your password. Open it in this
              browser. It expires after a short time.
            </>
          ) : (
            <>Mock data mode doesn’t send emails. Create a new demo account or use the built-in demo accounts instead.</>
          )}
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {formError && <Alert type="error">{formError}</Alert>}
          <TextField
            id="forgot-email"
            label="Email address"
            type="email"
            icon={Mail}
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError(validateEmail(e.target.value))
            }}
            error={error}
          />
          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            {sending && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
            {sending ? 'Sending…' : 'Send Reset Link'}
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        Remembered it? <TextLink to="/signin">Back to sign in</TextLink>
      </p>
    </AuthLayout>
  )
}
