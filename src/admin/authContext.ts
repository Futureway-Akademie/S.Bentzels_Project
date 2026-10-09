import { createContext } from 'react'
import type { AdminRole } from './permissions'

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'error'

export type AuthValue = {
  status: AuthStatus
  email: string | null
  /** Rolle laut Tabelle admins, null ohne Eintrag */
  role: AdminRole | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  /** Prüft die Anmeldung erneut, z. B. nach einer Verbindungsstörung. */
  retry: () => void
}

export const AuthContext = createContext<AuthValue | null>(null)
