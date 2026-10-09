import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { homePath } from './homePath'
import { adminModules } from './modules'
import { canAccess } from './permissions'
import { useAuth } from './useAuth'

// Lässt nur Rollen ein, die das Modul nutzen dürfen, alle anderen gehen zu ihrer Startseite.
// Die Datenbank erzwingt dieselben Rechte, dies ist die Benutzerführung davor.
export default function ModuleGuard({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  const { role } = useAuth()
  const module = adminModules.find((item) => item.id === id)
  if (!canAccess(role, module?.roles))
    return <Navigate to={homePath(role)} replace />
  return <>{children}</>
}
