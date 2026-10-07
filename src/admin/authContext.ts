import { createContext } from 'react'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn'

export type AuthValue = {
  status: AuthStatus
  email: string | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)
