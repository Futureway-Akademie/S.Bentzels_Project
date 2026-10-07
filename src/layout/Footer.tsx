import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../config/routes'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-32 border-t border-line">
      <div className="container-page grid-12 gap-y-8 py-12">
        <div className="col-span-4 md:col-span-6">
          <p className="label">{t('footer.names')}</p>
          <address className="mt-4 not-italic">
            {t('footer.street')}
            <br />
            {t('footer.city')}
          </address>
        </div>
        <div className="col-span-4 md:col-span-3">
          <p>
            <a href={`mailto:${t('footer.email')}`} className="footer-link">
              {t('footer.email')}
            </a>
          </p>
          <p>
            <a href={`tel:${t('footer.phoneHref')}`} className="footer-link">
              {t('footer.phone')}
            </a>
          </p>
        </div>
        <ul className="col-span-4 m-0 list-none p-0 md:col-span-3">
          <li>
            <Link to={routes.imprint} className="footer-link">
              {t('footer.imprint')}
            </Link>
          </li>
          <li>
            <Link to={routes.privacy} className="footer-link">
              {t('footer.privacy')}
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}
