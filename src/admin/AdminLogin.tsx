import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { routes } from '../config/routes'
import { supabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'

export default function AdminLogin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { status, signIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (status === 'signedIn') return <Navigate to={routes.admin} replace />

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')
    if (!email || !password) {
      setError(t('admin.errorRequired'))
      return
    }
    setBusy(true)
    setError(null)
    const ok = await signIn(email, password)
    setBusy(false)
    if (ok) navigate(routes.admin, { replace: true })
    else setError(t('admin.errorLogin'))
  }

  return (
    <main className="container-page py-20 md:py-32">
      <p className="label">{t('admin.area')}</p>
      <h1 className="mt-6 text-[clamp(2.5rem,1.5rem+4vw,4.5rem)]">
        {t('admin.loginTitle')}
      </h1>

      {!supabaseConfigured ? (
        <p className="prose-measure mt-12 text-muted" role="status">
          {t('admin.notConfigured')}
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-12 max-w-md space-y-8"
        >
          <div>
            <label htmlFor="admin-email" className="label block">
              {t('admin.email')}
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              className="field"
              aria-invalid={!!error}
              aria-describedby={error ? 'admin-error' : undefined}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label block">
              {t('admin.password')}
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="field"
              aria-invalid={!!error}
              aria-describedby={error ? 'admin-error' : undefined}
            />
          </div>
          {error && (
            <p id="admin-error" role="alert" className="field-error">
              {error}
            </p>
          )}
          <button type="submit" className="btn" disabled={busy}>
            {busy ? t('admin.signingIn') : t('admin.signIn')}
          </button>
        </form>
      )}
    </main>
  )
}
