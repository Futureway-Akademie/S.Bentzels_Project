import { useTranslation } from 'react-i18next'
import { Route, Routes } from 'react-router-dom'
import { routes } from './config/routes'
import Layout from './layout/Layout'
import Artist from './pages/Artist'
import DesignSystem from './pages/DesignSystem'
import Home from './pages/Home'
import PagePlaceholder from './pages/PagePlaceholder'

export default function App() {
  const { t } = useTranslation()
  const page = (key: string, values?: Record<string, string>) => (
    <PagePlaceholder titleKey={`pages.${key}`} titleValues={values} />
  )
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={routes.home} element={<Home />} />
        <Route path={routes.artist} element={<Artist />} />
        <Route path={routes.gallery} element={page('gallery')} />
        <Route path={routes.artwork} element={page('artwork')} />
        <Route path={routes.seminars} element={page('seminars')} />
        <Route path={routes.artOfBecoming} element={page('artOfBecoming')} />
        <Route path={routes.courses} element={page('courses')} />
        <Route path={routes.talks} element={page('talks')} />
        <Route path={routes.network} element={page('network')} />
        <Route
          path={routes.circle}
          element={page('circle', { name: t('circle.name') })}
        />
        <Route path={routes.event} element={page('event')} />
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
