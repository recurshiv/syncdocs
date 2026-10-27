import { createContext } from 'react'
import type { User } from '../types/user.ts'

export interface AuthContextValue {
  user: User | null
  // True until we know whether the browser already has a valid session.
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
