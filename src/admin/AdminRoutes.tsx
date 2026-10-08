import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import AdminLogin from './AdminLogin'
import { AuthProvider } from './AuthProvider'
import { adminModules } from './modules'
import ModulePlaceholder from './pages/ModulePlaceholder'
import Overview from './pages/Overview'
import RequireAdmin from './RequireAdmin'

// Der Admin-Bereich wird nur bei Bedarf geladen und nicht von Suchmaschinen erfasst.
export default function AdminRoutes() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      meta.remove()
    }
  }, [])

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Overview />} />
            {adminModules
              .filter((module) => module.id !== 'overview')
              .map((module) => (
                <Route
                  key={module.id}
                  path={module.to.replace('/admin/', '')}
                  element={<ModulePlaceholder titleKey={module.labelKey} />}
                />
              ))}
            <Route path="*" element={<Overview />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
