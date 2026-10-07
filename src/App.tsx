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
import Courses from './pages/Courses'
import Network from './pages/Network'
import PagePlaceholder from './pages/PagePlaceholder'
import Seminars from './pages/Seminars'
import Talks from './pages/Talks'

export default function App() {
  const page = (key: string) => <PagePlaceholder titleKey={`pages.${key}`} />
  return (
    <Routes>
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
        <Route path={routes.journal} element={page('journal')} />
        <Route path={routes.post} element={page('post')} />
        <Route path={routes.contact} element={page('contact')} />
        <Route path={routes.imprint} element={page('imprint')} />
        <Route path={routes.privacy} element={page('privacy')} />
        <Route path={routes.designSystem} element={<DesignSystem />} />
        <Route
          path="*"
          element={<PagePlaceholder titleKey="pages.notFound" notFound />}
        />
      </Route>
    </Routes>
  )
}
