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

// Prüft über die Datenbank, ob der eingeloggte Nutzer in der Tabelle admins steht.
async function checkAdmin(session: Session): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle()
  return Boolean(data)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    supabase ? 'loading' : 'signedOut',
  )
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  // Ergebnis der Admin-Prüfung je Nutzer, damit mehrere Auth-Ereignisse nicht mehrfach abfragen.
  const checked = useRef<{ id: string; admin: boolean } | null>(null)

  useEffect(() => {
    if (!supabase) return
    let active = true

    const apply = async (next: Session | null) => {
      let admin = false
      if (next) {
        if (checked.current?.id === next.user.id) {
          admin = checked.current.admin
        } else {
          admin = await checkAdmin(next)
          checked.current = { id: next.user.id, admin }
        }
      } else {
        checked.current = null
      }
      if (!active) return
      setSession(next)
      setIsAdmin(admin)
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
  }, [])

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

  const value = useMemo<AuthValue>(
    () => ({
      status,
      email: session?.user.email ?? null,
      isAdmin,
      signIn,
      signOut,
    }),
    [status, session, isAdmin, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
