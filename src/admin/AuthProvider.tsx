import type { Session } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthStatus, type AuthValue } from './authContext'
import { isAdminRole, type AdminRole } from './permissions'

const CHECK_TIMEOUT_MS = 8000

// Liest über die Datenbank die Rolle des eingeloggten Nutzers aus der Tabelle admins.
// Ohne Eintrag oder mit unbekannter Rolle gibt es keinen Zugang.
async function checkRole(session: Session): Promise<AdminRole | null> {
  if (!supabase) return null
  const request = supabase
    .from('admins')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle()
  // Eine Störung der Verbindung darf nicht wie „kein Admin“ aussehen.
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Zeitüberschreitung')), CHECK_TIMEOUT_MS),
  )
  const { data, error } = await Promise.race([request, timeout])
  if (error) throw new Error(error.message)
  return isAdminRole(data?.role) ? data.role : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    supabase ? 'loading' : 'signedOut',
  )
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<AdminRole | null>(null)
  const [attempt, setAttempt] = useState(0)
  // Ergebnis der Admin-Prüfung je Nutzer, damit mehrere Auth-Ereignisse nicht mehrfach abfragen.
  const checked = useRef<{ id: string; role: AdminRole | null } | null>(null)

  useEffect(() => {
    if (!supabase) return
    let active = true

    const apply = async (next: Session | null) => {
      let nextRole: AdminRole | null = null
      if (next) {
        if (checked.current?.id === next.user.id) {
          nextRole = checked.current.role
        } else {
          try {
            nextRole = await checkRole(next)
          } catch {
            if (active) setStatus('error')
            return
          }
          checked.current = { id: next.user.id, role: nextRole }
        }
      } else {
        checked.current = null
      }
      if (!active) return
      setSession(next)
      setRole(nextRole)
      setStatus(next ? 'signedIn' : 'signedOut')
    }

    void supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        // Nicht innerhalb des Callbacks awaiten, sonst blockiert die Bibliothek weitere Anfragen.
        setTimeout(() => void apply(next), 0)
      },
    )
    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [attempt])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return false
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return !error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const retry = useCallback(() => {
    setStatus('loading')
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      status,
      email: session?.user.email ?? null,
      role,
      isAdmin: role === 'admin',
      signIn,
      signOut,
      retry,
    }),
    [status, session, role, signIn, signOut, retry],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
