import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { routes } from '../config/routes'
import { useAuth } from './useAuth'

// Geschützter Bereich. Das eigentliche Dashboard folgt in task-16 bis task-19.
export default function AdminHome() {
  const { t } = useTranslation()
  const { status, email, isAdmin, signOut } = useAuth()

  if (status === 'loading') {
    return (
      <main className="container-page py-20 md:py-32">
        <p className="label" role="status">
          {t('admin.loading')}
        </p>
      </main>
    )
  }
  if (status === 'signedOut') return <Navigate to={routes.adminLogin} replace />

  return (
    <main className="container-page py-20 md:py-32">
      <p className="label">{t('admin.area')}</p>
      <h1 className="mt-6 text-[clamp(2.5rem,1.5rem+4vw,4.5rem)]">
        {t('admin.title')}
      </h1>
      <p className="mt-6 text-muted">{email}</p>
      {isAdmin ? (
        <p className="prose-measure mt-12">{t('admin.comingSoon')}</p>
      ) : (
        <p className="prose-measure mt-12" role="alert">
          {t('admin.noAccess')}
        </p>
      )}
      <p className="mt-12">
        <button type="button" className="btn" onClick={() => void signOut()}>
          {t('admin.signOut')}
        </button>
      </p>
    </main>
  )
}
