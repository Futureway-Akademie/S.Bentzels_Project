import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { routes } from '../config/routes'
import { site } from '../config/site'
import { useSeo } from '../lib/seo'
import { organizationLd, personLd, websiteLd } from '../lib/seoLd'
import Footer from './Footer'
import Header from './Header'
import { transitionKey } from './transitionKey'

// Seiten ohne eigene Datenabfrage: Titel und Beschreibung aus de.json
const STATIC: [path: string, page: string, seo: string][] = [
  [routes.home, '', 'home'],
  [routes.artist, 'artist', 'artist'],
  [routes.gallery, 'gallery', 'gallery'],
  [routes.seminars, 'seminars', 'seminars'],
  [routes.artOfBecoming, 'artOfBecoming', 'artOfBecoming'],
  [routes.courses, 'courses', 'courses'],
  [routes.talks, 'talks', 'talks'],
  [routes.network, 'network', 'network'],
  [routes.circle, 'circle', 'circle'],
  [routes.events, 'events', 'events'],
  [routes.journal, 'journal', 'journal'],
  [routes.press, 'pressArchive', 'press'],
  [routes.curated, 'curated', 'curated'],
  [routes.contact, 'contact', 'contact'],
  [routes.imprint, 'imprint', 'imprint'],
  [routes.privacy, 'privacy', 'privacy'],
  [routes.cancel, 'cancel', 'cancel'],
]

// Wird nur für bekannte Seiten gerendert. Detailseiten (Werk, Veranstaltung, Beitrag) setzen ihre
// Angaben selbst, weil ihre Effekte vor denen des Layouts laufen würden und sonst überschrieben würden.
function StaticSeo({
  page,
  seo,
  home,
}: {
  page: string
  seo: string
  home: boolean
}) {
  const { t } = useTranslation()
  useSeo({
    title: home ? site.name : t(`pages.${page}`, { name: t('circle.name') }),
    description: t(`seo.${seo}`),
    jsonLd: home
      ? [
          websiteLd(site),
          organizationLd(site),
          personLd(site, t('seo.jobTitle')),
        ]
      : undefined,
    noindex: page === 'cancel',
  })
  return null
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const hit = STATIC.find(([path]) => matchPath({ path, end: true }, pathname))
  return (
    <div className="flex min-h-screen flex-col">
      {hit && (
        <StaticSeo
          key={hit[0]}
          page={hit[1]}
          seo={hit[2]}
          home={hit[0] === routes.home}
        />
      )}
      <Header />
      {/* Sanftes Einblenden bei jedem Seitenwechsel (nur Deckkraft, damit fixierte Elemente wie die Großansicht nicht verrutschen) */}
      <div key={transitionKey(pathname)} className="page-transition flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
