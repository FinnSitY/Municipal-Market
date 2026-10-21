// Turns Supabase / network errors into messages a shopper or seller can act on.
const rules = [
  [/invalid login credentials/i, 'That email and password combination doesn’t match an account.'],
  [/email not confirmed/i, 'Please confirm your email first. Check your inbox for the confirmation link.'],
  [/user already registered|already been registered/i, 'An account with this email already exists. Try signing in instead.'],
  [/password should be at least|weak password/i, 'Please choose a stronger password (at least 8 characters with a letter and a number).'],
  [/rate limit|too many requests|security purposes/i, 'Too many attempts. Please wait a minute and try again.'],
  [/failed to fetch|networkerror|load failed|network request failed/i, 'We can’t reach the server. Check your internet connection and try again.'],
  [/row-level security|permission denied|42501/i, 'You don’t have permission to do that.'],
  [/payload too large|maximum allowed size|exceeded the maximum/i, 'That image is too large. Please use a file under 5 MB.'],
  [/mime type|invalid_mime|not supported/i, 'That file type isn’t allowed. Please upload a JPG, PNG or WebP image.'],
  [/jwt expired|refresh token/i, 'Your session has expired. Please sign in again.'],
  [/relation .* does not exist|could not find the table|schema cache/i, 'The database isn’t set up yet. Run the Supabase migration described in the README.'],
]

export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback
  const text = [error.message, error.code, error.details, error.error_description].filter(Boolean).join(' ')
  const match = rules.find(([pattern]) => pattern.test(text))
  if (match) return match[1]
  return error.message || fallback
}

export function toError(error, fallback) {
  return new Error(friendlyError(error, fallback))
}
