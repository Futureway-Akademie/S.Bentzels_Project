import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../config/routes'

type PagePlaceholderProps = {
  titleKey: string
  titleValues?: Record<string, string>
  notFound?: boolean
}

// Platzhalter, bis die jeweilige Seite in den folgenden Tasks umgesetzt wird.
export default function PagePlaceholder({
  titleKey,
  titleValues,
  notFound,
}: PagePlaceholderProps) {
  const { t } = useTranslation()
  return (
    <main className="container-page py-20 md:py-28">
      <p className="label">{t('pages.comingSoon')}</p>
      <h1 className="mt-6">{t(titleKey, titleValues)}</h1>
      {notFound && (
        <p className="mt-10">
          <Link to={routes.gallery} className="btn-link">
            {t('pages.backToGallery')}
          </Link>
        </p>
      )}
    </main>
  )
}
