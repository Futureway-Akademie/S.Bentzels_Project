import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import { routes } from '../config/routes'
import { useAuth } from './useAuth'

// Zugriff nur für angemeldete Admins. Die eigentliche Sicherheit liegt in den Datenbankregeln,
// dies ist die Benutzerführung davor.
export default function RequireAdmin() {
  const { t } = useTranslation()
  const { status, email, isAdmin, signOut, retry } = useAuth()

  if (status === 'loading') {
    return (
      <main className="container-page py-20">
        <p className="label" role="status">
          {t('admin.loading')}
        </p>
      </main>
    )
  }
  if (status === 'signedOut') return <Navigate to={routes.adminLogin} replace />

  if (status === 'error') {
    return (
      <main className="container-page py-20 md:py-32">
        <p className="label">{t('admin.area')}</p>
        <h1 className="mt-6 text-[clamp(2.5rem,1.5rem+4vw,4.5rem)]">
          {t('admin.title')}
        </h1>
        <p className="prose-measure mt-12" role="alert">
          {t('admin.connectionError')}
        </p>
        <p className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <button type="button" className="btn" onClick={retry}>
            {t('admin.retry')}
          </button>
          <button
            type="button"
            className="btn-link"
            onClick={() => void signOut()}
          >
            {t('admin.signOut')}
          </button>
        </p>
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="container-page py-20 md:py-32">
        <p className="label">{t('admin.area')}</p>
        <h1 className="mt-6 text-[clamp(2.5rem,1.5rem+4vw,4.5rem)]">
          {t('admin.title')}
        </h1>
        <p className="mt-6 text-muted">{email}</p>
        <p className="prose-measure mt-12" role="alert">
          {t('admin.noAccess')}
        </p>
        <p className="mt-12">
          <button type="button" className="btn" onClick={() => void signOut()}>
            {t('admin.signOut')}
          </button>
        </p>
      </main>
    )
  }

  return <Outlet />
}
