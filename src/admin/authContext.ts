import { createContext } from 'react'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'error'

export type AuthValue = {
  status: AuthStatus
  email: string | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  /** Prüft die Anmeldung erneut, z. B. nach einer Verbindungsstörung. */
  retry: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)
