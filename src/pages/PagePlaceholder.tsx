import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../config/routes'
import { useSeo } from '../lib/seo'

type PagePlaceholderProps = {
  titleKey: string
  titleValues?: Record<string, string>
  notFound?: boolean
}

// Gestaltete 404-Seite, auch für nicht gefundene Werke, Beiträge und Veranstaltungen.
function NotFound({ message }: { message: string }) {
  const { t } = useTranslation()
  useSeo({ title: t('pages.notFound'), noindex: true })
  return (
    <main className="container-page py-20 md:py-28">
      <p className="label">{t('notFound.label')}</p>
      <h1 className="mt-6">{message}</h1>
      <p className="mt-6 max-w-[48ch] text-muted">{t('notFound.text')}</p>
      <p className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
        <Link to={routes.gallery} className="btn-link">
          {t('pages.backToGallery')}
        </Link>
        <Link to={routes.home} className="btn-link">
          {t('notFound.home')}
        </Link>
      </p>
    </main>
  )
}

// Platzhalter, bis die jeweilige Seite in den folgenden Tasks umgesetzt wird.
export default function PagePlaceholder({
  titleKey,
  titleValues,
  notFound,
}: PagePlaceholderProps) {
  const { t } = useTranslation()
  if (notFound) return <NotFound message={t(titleKey, titleValues)} />
  return (
    <main className="container-page py-20 md:py-28">
      <p className="label">{t('pages.comingSoon')}</p>
      <h1 className="mt-6">{t(titleKey, titleValues)}</h1>
    </main>
  )
}
