const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value) {
  if (!value.trim()) return 'Please enter your email address.'
  if (!EMAIL_PATTERN.test(value.trim())) return 'That email doesn’t look right. Try something like juan@example.com.'
  return null
}

export function validateNewPassword(value) {
  if (!value) return 'Please create a password.'
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number.'
  return null
}

export function required(value, message) {
  return String(value ?? '').trim() ? null : message
}

// Philippine mobile numbers: 09XXXXXXXXX or +639XXXXXXXXX (spaces and dashes allowed).
export function validatePhone(value, { required: isRequired = false } = {}) {
  const phone = String(value ?? '').replace(/[\s-]/g, '')
  if (!phone) return isRequired ? 'Please enter your mobile number so the seller can reach you.' : null
  if (!/^(09|\+639)\d{9}$/.test(phone)) return 'Use a PH mobile number like 0917 123 4567.'
  return null
}

// Drops empty entries so the result can be checked with Object.keys().length.
export function compactErrors(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

// Moves keyboard focus to the first invalid field after a failed submit.
export function focusFirstError(errors, idPrefix) {
  const first = Object.keys(errors)[0]
  if (first) document.getElementById(`${idPrefix}-${first}`)?.focus()
}
