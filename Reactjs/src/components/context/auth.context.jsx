import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { readStoredUser, writeStoredUser } from '../../util/api.js'
import { bootstrapAuthSession, loginWithCredentials, logoutSession, loginWithGoogle } from '../../services/auth.api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const clearLegacyAccessToken = () => {
    window.localStorage.removeItem('accessToken')
  }

  const applyUser = useCallback((sessionUser) => {
    setUser(sessionUser)
    writeStoredUser(sessionUser)
  }, [])

  const syncUser = useCallback((sessionUser) => {
    applyUser(sessionUser)
  }, [applyUser])

  useEffect(() => {
    let alive = true

    const bootstrapSession = async () => {
      const storedUser = readStoredUser()
      if (storedUser) {
        setUser(storedUser)
      }

      try {
        const sessionUser = await bootstrapAuthSession()
        if (!alive) return

        applyUser(sessionUser)
      } catch {
        if (!alive) return

        setUser(null)
        writeStoredUser(null)
        clearLegacyAccessToken()
      } finally {
        if (alive) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrapSession()

    const handleSessionExpired = () => {
      setUser(null)
      writeStoredUser(null)
      clearLegacyAccessToken()
    }

    const handleSessionUpdated = (event) => {
      if (event.detail) {
        applyUser(event.detail)
      }
    }

    window.addEventListener('movie-app:auth-expired', handleSessionExpired)
    window.addEventListener('movie-app:session-updated', handleSessionUpdated)

    return () => {
      alive = false
      window.removeEventListener('movie-app:auth-expired', handleSessionExpired)
      window.removeEventListener('movie-app:session-updated', handleSessionUpdated)
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const sessionUser = await loginWithCredentials(credentials)

    applyUser(sessionUser)
    return sessionUser
  }, [applyUser])

  const loginGoogle = useCallback(async (token) => {
    const sessionUser = await loginWithGoogle(token)

    applyUser(sessionUser)
    return sessionUser
  }, [applyUser])


  const logout = useCallback(async () => {
    try {
      await logoutSession()
    } finally {
      setUser(null)
      writeStoredUser(null)
      clearLegacyAccessToken()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      isStaff: user?.role === 'STAFF',
      isBootstrapping,
      login,
      loginGoogle,
      logout,
      syncUser,
    }),
    [user, isBootstrapping, login, loginGoogle, logout, syncUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

