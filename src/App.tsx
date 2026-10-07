import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { routes } from './config/routes'
import Layout from './layout/Layout'
import ArtOfBecoming from './pages/ArtOfBecoming'
import ArtworkDetail from './pages/ArtworkDetail'
import Artist from './pages/Artist'
import EventDetail from './pages/EventDetail'
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

const AdminRoutes = lazy(() => import('./admin/AdminRoutes'))

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
        <Route path={routes.event} element={<EventDetail />} />
        <Route path={routes.journal} element={<Journal />} />
        <Route path={routes.post} element={<JournalPost />} />
        <Route path={routes.press} element={<Press />} />
        <Route path={routes.curated} element={<CuratedArticles />} />
        <Route path={routes.contact} element={<Contact />} />
        <Route
          path={routes.imprint}
          element={<LegalPage titleKey="pages.imprint" />}
        />
        <Route
          path={routes.privacy}
          element={<LegalPage titleKey="pages.privacy" />}
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
