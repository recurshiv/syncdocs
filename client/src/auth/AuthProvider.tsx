import { useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth.ts'
import { setUnauthorizedHandler } from '../api/client.ts'
import type { User } from '../types/user.ts'
import { AuthContext, type AuthContextValue } from './AuthContext.ts'

// Holds the logged-in user for the whole app. The session itself lives in an
// HttpOnly cookie that JavaScript cannot read, so on startup we ask the server
// who we are.
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Any 401 from any request means the session is gone; treat it as logged out.
    setUnauthorizedHandler(() => setUser(null))

    authApi
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    return () => setUnauthorizedHandler(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => setUser(await authApi.login(email, password)),
      signup: async (name, email, password) => setUser(await authApi.signup(name, email, password)),
      // Only clear the user once the server has deleted the session.
      logout: async () => {
        await authApi.logout()
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
