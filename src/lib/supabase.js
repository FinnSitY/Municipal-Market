import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim()

/** Offline demo data, only ever in `npm run dev` and only when explicitly enabled. */
export const USE_MOCK_DATA = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true'

// Secret / service_role keys bypass Row Level Security and must never ship to a browser.
function isSecretKey(value) {
  if (value.startsWith('sb_secret_')) return true
  const payload = value.split('.')[1]
  if (!payload) return false
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    return JSON.parse(atob(base64)).role === 'service_role'
  } catch {
    return false
  }
}

function getConfigError() {
  if (USE_MOCK_DATA) return null
  if (!url || !key) return 'missing'
  if (isSecretKey(key)) return 'secret-key'
  try {
    new URL(url)
  } catch {
    return 'bad-url'
  }
  return null
}

export const configError = getConfigError()

const REMEMBER_KEY = 'bayanihan.rememberMe'

export function setRememberMe(remember) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false')
  } catch {
    // Storage unavailable; Supabase falls back to its in-memory session.
  }
}

/*
 * Session storage for supabase-js. With "Remember me" the session survives browser
 * restarts (localStorage); without it, it lasts only for this tab (sessionStorage).
 * The PKCE code verifier always goes to localStorage so email links opened in a new
 * tab (password reset, email confirmation) still work.
 */
const authStorage = {
  getItem(name) {
    return localStorage.getItem(name) ?? sessionStorage.getItem(name)
  },
  setItem(name, value) {
    const remember = name.endsWith('-code-verifier') || localStorage.getItem(REMEMBER_KEY) !== 'false'
    const [target, other] = remember ? [localStorage, sessionStorage] : [sessionStorage, localStorage]
    target.setItem(name, value)
    other.removeItem(name)
  },
  removeItem(name) {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const supabase =
  !USE_MOCK_DATA && !configError
    ? createClient(url, key, {
        auth: {
          storage: authStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
        },
      })
    : null

export const PRODUCT_IMAGES_BUCKET = 'product-images'
