import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import FullPageStatus from '../components/FullPageStatus.jsx'
import { backend } from '../services/index.js'
import { AuthContext } from './auth-context.js'

const { auth } = backend

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading → ready | error
  const [loadError, setLoadError] = useState('')

  const refreshUser = useCallback(async () => {
    try {
      const current = await auth.getCurrentUser()
      setUser(current)
      setLoadError('')
      setStatus('ready')
      return current
    } catch (error) {
      setUser(null)
      setLoadError(error.message)
      setStatus('error')
      return null
    }
  }, [])

  useEffect(() => {
    let active = true
    auth.getCurrentUser().then(
      (current) => {
        if (!active) return
        setUser(current)
        setStatus('ready')
      },
      (error) => {
        if (!active) return
        setLoadError(error.message)
        setStatus('error')
      },
    )

    // Keeps tabs in sync (sign in/out elsewhere, token refresh, password recovery links).
    // Supabase calls are deferred out of the callback, as the supabase-js docs advise.
    const unsubscribe = auth.onAuthChange((event) => {
      if (!active) return
      if (event === 'SIGNED_OUT') {
        startTransition(() => setUser(null))
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
        setTimeout(() => active && refreshUser(), 0)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [refreshUser])

  const signIn = useCallback(async (email, password, remember) => {
    const account = await auth.signIn(email, password, remember)
    setUser(account)
    return account
  }, [])

  const register = useCallback(async (form) => {
    const result = await auth.signUp(form)
    if (result.user) setUser(result.user)
    return result
  }, [])

  // React Router navigates inside a transition. Clearing the user in one too lets a
  // "sign out, then navigate" handler commit both together, so route guards on the
  // page being left don't briefly redirect to Sign In.
  const signOut = useCallback(() => {
    startTransition(() => setUser(null))
    auth.signOut().catch(() => {
      // The local session is cleared even if the server call fails (e.g. offline).
    })
  }, [])

  const updateProfile = useCallback(
    async (changes) => {
      if (!user) throw new Error('Please sign in again to update your profile.')
      const updated = await auth.updateProfile(user, changes)
      setUser(updated)
      return updated
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      signIn,
      signOut,
      register,
      updateProfile,
      refreshUser,
      requestPasswordReset: auth.requestPasswordReset,
      updatePassword: auth.updatePassword,
    }),
    [user, signIn, signOut, register, updateProfile, refreshUser],
  )

  if (status === 'loading') return <FullPageStatus loading title="Loading Bayanihan Market…" />
  if (status === 'error') {
    return (
      <FullPageStatus title="We couldn’t load your account" action={{ label: 'Try again', onClick: refreshUser }}>
        {loadError}
      </FullPageStatus>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
