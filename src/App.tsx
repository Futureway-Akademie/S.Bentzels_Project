import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { routes } from './config/routes'
import Layout from './layout/Layout'
import ArtOfBecoming from './pages/ArtOfBecoming'
import ArtworkDetail from './pages/ArtworkDetail'
import Artist from './pages/Artist'
import Gallery from './pages/Gallery'
import DesignSystem from './pages/DesignSystem'
import Home from './pages/Home'
import Circle from './pages/Circle'
import Contact from './pages/Contact'
import CuratedArticles from './pages/CuratedArticles'
import Courses from './pages/Courses'
import Journal from './pages/Journal'
import JournalPost from './pages/JournalPost'
import LegalPage from './pages/LegalPage'
import Network from './pages/Network'
import PagePlaceholder from './pages/PagePlaceholder'
import Press from './pages/Press'
import Seminars from './pages/Seminars'
import Talks from './pages/Talks'

// Alte Adressen von Netzwerk-Veranstaltungen führen zur Veranstaltungsseite
function EventRedirect() {
  const { slug = '' } = useParams()
  return <Navigate to={`/veranstaltungen/${slug}`} replace />
}

const AdminRoutes = lazy(() => import('./admin/AdminRoutes'))
// Der Kalender lädt den Datenbank-Client erst beim Öffnen der Seite
const Events = lazy(() => import('./pages/Events'))
const EventPage = lazy(() => import('./pages/EventPage'))
const CancelRegistration = lazy(() => import('./pages/CancelRegistration'))

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={null}>
            <AdminRoutes />
          </Suspense>
        }
      />
      <Route element={<Layout />}>
        <Route path={routes.home} element={<Home />} />
        <Route path={routes.artist} element={<Artist />} />
        <Route path={routes.gallery} element={<Gallery />} />
        <Route path={routes.artwork} element={<ArtworkDetail />} />
        <Route path={routes.seminars} element={<Seminars />} />
        <Route path={routes.artOfBecoming} element={<ArtOfBecoming />} />
        <Route path={routes.courses} element={<Courses />} />
        <Route path={routes.talks} element={<Talks />} />
        <Route path={routes.network} element={<Network />} />
        <Route path={routes.circle} element={<Circle />} />
        <Route
          path={routes.cancel}
          element={
            <Suspense fallback={null}>
              <CancelRegistration />
            </Suspense>
          }
        />
        <Route
          path={routes.events}
          element={
            <Suspense fallback={null}>
              <Events />
            </Suspense>
          }
        />
        <Route
          path={routes.eventPage}
          element={
            <Suspense fallback={null}>
              <EventPage />
            </Suspense>
          }
        />
        <Route path={routes.event} element={<EventRedirect />} />
        <Route path={routes.journal} element={<Journal />} />
        <Route path={routes.post} element={<JournalPost />} />
        <Route path={routes.press} element={<Press />} />
        <Route path={routes.curated} element={<CuratedArticles />} />
        <Route path={routes.contact} element={<Contact />} />
        <Route
          path={routes.imprint}
          element={<LegalPage titleKey="pages.imprint" kind="imprint" />}
        />
        <Route
          path={routes.privacy}
          element={<LegalPage titleKey="pages.privacy" kind="privacy" />}
        />
        <Route path={routes.designSystem} element={<DesignSystem />} />
        <Route
          path="*"
          element={<PagePlaceholder titleKey="pages.notFound" notFound />}
        />
      </Route>
    </Routes>
  )
}
