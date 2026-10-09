import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { navItems } from './navItems'

export default function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  // Menüs beim Seitenwechsel schließen (Zustand während des Renderns angleichen).
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMobileOpen(false)
    setOpenGroup(null)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        setOpenGroup(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header className="relative z-40 border-b border-line bg-background">
      <div className="container-page flex items-center justify-between gap-6 py-5">
        <Logo />

        {/* Desktop */}
        <nav aria-label={t('nav.main')} className="hidden min-[1100px]:block">
          <ul className="m-0 flex list-none items-center gap-5 p-0 xl:gap-9">
            {navItems.map((item) => {
              const label = t(item.labelKey)
              if (!item.children) {
                return (
                  <li key={item.labelKey}>
                    <NavLink to={item.to!} className="nav-link">
                      {label}
                    </NavLink>
                  </li>
                )
              }
              const open = openGroup === item.labelKey
              return (
                <li
                  key={item.labelKey}
                  className="relative"
                  onMouseEnter={() => setOpenGroup(item.labelKey)}
                  onMouseLeave={() => setOpenGroup(null)}
                  onBlur={(event) => {
                    if (
                      !event.currentTarget.contains(event.relatedTarget as Node)
                    )
                      setOpenGroup(null)
                  }}
                >
                  <div className="flex items-center gap-2">
                    {item.to ? (
                      <NavLink
                        to={item.to}
                        end
                        className="nav-link"
                        onFocus={() => setOpenGroup(item.labelKey)}
                      >
                        {label}
                      </NavLink>
                    ) : (
                      <span className="nav-link">{label}</span>
                    )}
                    <button
                      type="button"
                      className="nav-toggle"
                      aria-expanded={open}
                      aria-label={label}
                      onClick={() => setOpenGroup(open ? null : item.labelKey)}
                    >
                      {open ? '−' : '+'}
                    </button>
                  </div>
                  {open && (
                    <ul className="absolute left-0 top-full m-0 min-w-56 list-none border border-line bg-background p-0">
                      {item.children.map((child) => (
                        <li key={child.to}>
                          <Link
                            to={child.to}
                            className="nav-link block px-5 py-3"
                          >
                            {t(child.labelKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <button
          type="button"
          className="btn-link min-[1100px]:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? t('nav.closeMenu') : t('nav.menu')}
        </button>
      </div>

      {/* Mobil: Vollbild-Menü */}
      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label={t('nav.main')}
          className="absolute inset-x-0 top-full z-40 h-[calc(100dvh-100%)] overflow-y-auto bg-background min-[1100px]:hidden"
        >
          <ul className="container-page m-0 list-none py-8">
            {navItems.map((item) => (
              <li key={item.labelKey} className="border-b border-line py-5">
                {item.to ? (
                  <Link to={item.to} className="mobile-link">
                    {t(item.labelKey)}
                  </Link>
                ) : (
                  <span className="mobile-link">{t(item.labelKey)}</span>
                )}
                {item.children && (
                  <ul className="m-0 mt-3 list-none p-0">
                    {item.children.map((child) => (
                      <li key={child.to} className="py-2">
                        <Link to={child.to} className="nav-link">
                          {t(child.labelKey)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
