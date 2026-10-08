import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import AdminLogin from './AdminLogin'
import { AuthProvider } from './AuthProvider'
import { adminModules } from './modules'
import ModulePlaceholder from './pages/ModulePlaceholder'
import ArtworkEdit from './pages/ArtworkEdit'
import Artworks from './pages/Artworks'
import Overview from './pages/Overview'
import RequireAdmin from './RequireAdmin'
import { ToastProvider } from './toast/ToastProvider'

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
      <ToastProvider>
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Overview />} />
              <Route path="werke" element={<Artworks />} />
              <Route path="werke/:id" element={<ArtworkEdit />} />
              {adminModules
                .filter((module) => module.id !== 'overview' && !module.ready)
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
      </ToastProvider>
    </AuthProvider>
  )
}
