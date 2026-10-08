import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { routes } from '../config/routes'
import { adminModules } from './modules'
import { loadNewInquiryCount } from './overviewData'
import { useAuth } from './useAuth'
import { useLoad } from './useLoad'

function Navigation({
  onNavigate,
  newCount,
}: {
  onNavigate?: () => void
  newCount: number
}) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('admin.navLabel')}>
      <ul className="m-0 list-none p-0">
        {adminModules.map((module) => (
          <li key={module.id}>
            <NavLink
              to={module.to}
              end={module.to === routes.admin}
              onClick={onNavigate}
              className="admin-link"
            >
              <span>{t(module.labelKey)}</span>
              {module.badge === 'inquiries' && newCount > 0 && (
                <span
                  className="admin-badge"
                  aria-label={t('admin.newCount', { count: newCount })}
                >
                  {newCount}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function AdminLayout() {
  const { t } = useTranslation()
  const { email, signOut } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [lastPath, setLastPath] = useState(location.pathname)

  // Schmales Menü beim Seitenwechsel schließen
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setOpen(false)
  }

  const { state } = useLoad(loadNewInquiryCount)
  const newCount = state.status === 'ready' ? state.data : 0

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const account = (
    <div className="border-t border-line pt-6">
      <p className="label">{t('admin.userMenu')}</p>
      <p className="mt-2 break-all text-sm">{email}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link to={routes.home} className="btn-link">
          {t('admin.backToSite')}
        </Link>
        <button
          type="button"
          className="btn-link"
          onClick={() => void signOut()}
        >
          {t('admin.signOut')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Breite Ansicht: feste Seitenleiste */}
      <aside className="hidden border-r border-line lg:block">
        <div className="sticky top-0 flex h-screen flex-col justify-between overflow-y-auto p-6">
          <div>
            <p className="label">{t('admin.area')}</p>
            <p className="mt-2 text-lg">{t('brand.name')}</p>
            <div className="mt-8">
              <Navigation newCount={newCount} />
            </div>
          </div>
          {account}
        </div>
      </aside>

      {/* Schmale Ansicht: Kopfleiste mit ausklappbarem Menü */}
      <header className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
        <p className="label">{t('admin.area')}</p>
        <button
          type="button"
          className="btn-link"
          aria-expanded={open}
          aria-controls="admin-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('admin.closeMenu') : t('admin.menu')}
          {!open && newCount > 0 && (
            <span className="admin-badge ml-3">{newCount}</span>
          )}
        </button>
      </header>
      {open && (
        <div
          id="admin-drawer"
          className="absolute inset-x-0 top-[49px] z-40 flex h-[calc(100dvh-49px)] flex-col justify-between overflow-y-auto bg-background p-6 lg:hidden"
        >
          <Navigation onNavigate={() => setOpen(false)} newCount={newCount} />
          <div className="mt-10">{account}</div>
        </div>
      )}

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
