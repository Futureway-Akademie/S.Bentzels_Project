import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../config/routes'

export default function Logo({ onClick }: { onClick?: () => void }) {
  const { t } = useTranslation()
  return (
    <Link
      to={routes.home}
      onClick={onClick}
      aria-label={`${t('brand.name')} – ${t('nav.home')}`}
      className="block text-foreground no-underline"
    >
      <span className="block text-[0.7rem] font-medium uppercase leading-tight tracking-[0.42em] md:text-xs">
        {t('logo.line1')}
      </span>
      <span className="block text-[0.7rem] font-medium uppercase leading-tight tracking-[0.42em] md:text-xs">
        {t('logo.line2')}
      </span>
    </Link>
  )
}
