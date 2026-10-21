import { Building2, LoaderCircle, Mail, MapPin, User } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import PageHeader from '../components/PageHeader.jsx'
import TextField from '../components/TextField.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { MUNICIPALITY } from '../lib/config.js'
import { compactErrors, focusFirstError, required } from '../lib/validation.js'

function validate(form) {
  return compactErrors({
    fullName: required(form.fullName, 'Please enter your full name.'),
    municipality: form.municipality.length > 100 ? 'Keep this under 100 characters.' : null,
    barangay: form.barangay.length > 100 ? 'Keep this under 100 characters.' : null,
  })
}

/** Lets any signed-in user edit the profile fields they're allowed to change. */
export default function Account() {
  const { user, updateProfile } = useAuth()
  const isSeller = user.accountType === 'seller'
  const [form, setForm] = useState({ fullName: user.fullName, municipality: user.municipality, barangay: user.barangay })
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)

  const field = (name) => ({
    id: `account-${name}`,
    value: form[name],
    onChange: (e) => {
      setForm({ ...form, [name]: e.target.value })
      setNotice(null)
    },
    error: errors[name],
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) {
      focusFirstError(found, 'account')
      return
    }
    setSaving(true)
    try {
      await updateProfile(form)
      setNotice({ type: 'success', message: 'Your profile was saved.' })
    } catch (err) {
      setNotice({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="My Profile" description="Your buyer profile is private. Only you can see it." />
      <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-6 rounded-[2rem] bg-vanilla p-6 shadow-neu sm:p-8">
        {notice && (
          <Alert type={notice.type} onDismiss={() => setNotice(null)}>
            {notice.message}
          </Alert>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField {...field('fullName')} label="Full name" icon={User} autoComplete="name" />
          <TextField id="account-email" label="Email address" icon={Mail} value={user.email} readOnly />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            {...field('municipality')}
            label="Municipality"
            icon={Building2}
            readOnly={isSeller}
            hint={isSeller ? 'Sellers are registered to the marketplace municipality.' : undefined}
          />
          <TextField {...field('barangay')} label="Barangay" icon={MapPin} list="account-barangays" />
          <datalist id="account-barangays">
            {MUNICIPALITY.barangays.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
        <p className="text-xs text-muted">
          Account type: <strong className="text-ink">{isSeller ? 'Seller' : 'Buyer'}</strong>. Account types can’t be
          changed here.
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
