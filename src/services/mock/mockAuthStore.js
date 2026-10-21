/*
 * DEV-ONLY MOCK AUTHENTICATION (VITE_USE_MOCK_DATA=true)
 * Accounts and sessions live in this browser's storage. This is not secure and
 * nothing is shared between devices. The real app uses Supabase Auth instead.
 */
import { MUNICIPALITY } from '../../lib/config.js'
import { readJSON, writeJSON } from '../../lib/storage.js'
import { DEMO_ACCOUNTS } from './seedData.js'

const USERS_KEY = 'bayanihan.demo.donsol.users'
const SESSION_KEY = 'bayanihan.demo.donsol.session'

async function hashPassword(password) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(password)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  return btoa(unescape(encodeURIComponent(password)))
}

function toPublicUser(user) {
  const { passwordHash, ...rest } = user
  void passwordHash
  return rest
}

// Always includes the built-in demo accounts, unless someone registered the same email.
function getUsers() {
  const users = readJSON(localStorage, USERS_KEY, [])
  const missing = DEMO_ACCOUNTS.filter((demo) => !users.some((u) => u.email === demo.email || u.id === demo.id))
  return missing.length ? [...missing, ...users] : users
}

function saveUsers(users) {
  writeJSON(localStorage, USERS_KEY, users)
}

export async function registerUser(form) {
  const users = getUsers()
  const email = form.email.trim().toLowerCase()

  if (users.some((u) => u.email === email)) {
    throw new Error('An account with this email already exists. Try signing in instead.')
  }

  const isSeller = form.accountType === 'seller'
  const user = {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    accountType: form.accountType,
    fullName: form.fullName.trim(),
    email,
    passwordHash: await hashPassword(form.password),
    municipality: isSeller ? MUNICIPALITY.name : form.municipality.trim(),
    barangay: form.barangay.trim(),
    shop: isSeller
      ? {
          name: form.shopName.trim(),
          municipality: MUNICIPALITY.name,
          barangay: form.barangay.trim(),
          category: form.category,
          about: '',
        }
      : null,
    createdAt: new Date().toISOString(),
  }

  saveUsers([...users, user])
  return toPublicUser(user)
}

export async function authenticate(email, password) {
  const user = getUsers().find((u) => u.email === email.trim().toLowerCase())
  if (!user || user.passwordHash !== (await hashPassword(password))) {
    throw new Error('That email and password combination doesn’t match any demo account.')
  }
  return toPublicUser(user)
}

export function updateUser(userId, changes) {
  const users = getUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) throw new Error('We couldn’t find your demo account. Please sign in again.')

  const updated = { ...users[index], ...changes, updatedAt: new Date().toISOString() }
  users[index] = updated
  saveUsers(users)
  return toPublicUser(updated)
}

// "Remember me" keeps the session in localStorage; otherwise it ends when the tab closes.
export function saveSession(user, remember) {
  clearSession()
  const storage = remember ? localStorage : sessionStorage
  writeJSON(storage, SESSION_KEY, { user, signedInAt: new Date().toISOString() })
}

export function refreshSession(user) {
  for (const storage of [localStorage, sessionStorage]) {
    const session = readJSON(storage, SESSION_KEY, null)
    if (session) writeJSON(storage, SESSION_KEY, { ...session, user })
  }
}

export function loadSession() {
  const session = readJSON(localStorage, SESSION_KEY, null) ?? readJSON(sessionStorage, SESSION_KEY, null)
  return session?.user ?? null
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}
