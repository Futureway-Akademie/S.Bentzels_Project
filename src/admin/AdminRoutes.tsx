import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import AdminLogin from './AdminLogin'
import { AuthProvider } from './AuthProvider'
import { adminModules } from './modules'
import ModuleGuard from './ModuleGuard'
import ModulePlaceholder from './pages/ModulePlaceholder'
import ArtworkEdit from './pages/ArtworkEdit'
import Artworks from './pages/Artworks'
import Curated from './pages/Curated'
import EventEdit from './pages/EventEdit'
import EventStats from './pages/EventStats'
import Inquiries from './pages/Inquiries'
import Events from './pages/Events'
import Journal from './pages/Journal'
import Legal from './pages/Legal'
import JournalEdit from './pages/JournalEdit'
import Overview from './pages/Overview'
import Press from './pages/Press'
import PressEdit from './pages/PressEdit'
import Visibility from './pages/Visibility'
import Vita from './pages/Vita'
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
              <Route
                index
                element={
                  <ModuleGuard id="overview">
                    <Overview />
                  </ModuleGuard>
                }
              />
              <Route
                path="werke"
                element={
                  <ModuleGuard id="artworks">
                    <Artworks />
                  </ModuleGuard>
                }
              />
              <Route
                path="werke/:id"
                element={
                  <ModuleGuard id="artworks">
                    <ArtworkEdit />
                  </ModuleGuard>
                }
              />
              <Route
                path="journal"
                element={
                  <ModuleGuard id="journal">
                    <Journal />
                  </ModuleGuard>
                }
              />
              <Route
                path="journal/:id"
                element={
                  <ModuleGuard id="journal">
                    <JournalEdit />
                  </ModuleGuard>
                }
              />
              <Route
                path="veranstaltungen"
                element={
                  <ModuleGuard id="events">
                    <Events />
                  </ModuleGuard>
                }
              />
              <Route
                path="veranstaltungen/:id"
                element={
                  <ModuleGuard id="events">
                    <EventEdit />
                  </ModuleGuard>
                }
              />
              <Route
                path="artikel"
                element={
                  <ModuleGuard id="curated">
                    <Curated />
                  </ModuleGuard>
                }
              />
              <Route
                path="eingaenge"
                element={
                  <ModuleGuard id="inquiries">
                    <Inquiries />
                  </ModuleGuard>
                }
              />
              <Route
                path="rechtstexte"
                element={
                  <ModuleGuard id="legal">
                    <Legal />
                  </ModuleGuard>
                }
              />
              <Route
                path="presse"
                element={
                  <ModuleGuard id="press">
                    <Press />
                  </ModuleGuard>
                }
              />
              <Route
                path="presse/:id"
                element={
                  <ModuleGuard id="press">
                    <PressEdit />
                  </ModuleGuard>
                }
              />
              <Route
                path="sichtbarkeit"
                element={
                  <ModuleGuard id="visibility">
                    <Visibility />
                  </ModuleGuard>
                }
              />
              <Route
                path="statistik"
                element={
                  <ModuleGuard id="stats">
                    <EventStats />
                  </ModuleGuard>
                }
              />
              <Route
                path="vita"
                element={
                  <ModuleGuard id="vita">
                    <Vita />
                  </ModuleGuard>
                }
              />
              {adminModules
                .filter((module) => module.id !== 'overview' && !module.ready)
                .map((module) => (
                  <Route
                    key={module.id}
                    path={module.to.replace('/admin/', '')}
                    element={
                      <ModuleGuard id={module.id}>
                        <ModulePlaceholder titleKey={module.labelKey} />
                      </ModuleGuard>
                    }
                  />
                ))}
              <Route
                path="*"
                element={
                  <ModuleGuard id="overview">
                    <Overview />
                  </ModuleGuard>
                }
              />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
