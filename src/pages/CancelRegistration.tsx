import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { routes } from '../config/routes'
import { cancelRegistration, RegistrationError } from '../lib/forms/submit'

type State = 'ready' | 'sending' | 'cancelled' | 'already' | 'invalid' | 'error'

// Stornierung über den persönlichen Link aus der E-Mail. Erst ein Klick auf den Knopf storniert,
// damit das bloße Öffnen oder Vorladen des Links (z. B. durch Mailprogramme) nichts auslöst.
export default function CancelRegistration() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<State>(token ? 'ready' : 'invalid')

  const cancel = async () => {
    if (!token) return
    setState('sending')
    try {
      const outcome = await cancelRegistration(token)
      setState(outcome === 'cancelled' ? 'cancelled' : 'already')
    } catch (error) {
      setState(
        error instanceof RegistrationError &&
          (error.code === 'invalid_token' || error.code === 'unknown')
          ? 'invalid'
          : 'error',
      )
    }
  }

  return (
    <main className="container-page py-12 md:py-20">
      <p className="label">{t('cancel.label')}</p>
      <h1 className="mt-6 max-w-[16ch]">{t('cancel.title')}</h1>

      <div className="mt-12 max-w-xl" data-cancel-state={state}>
        {(state === 'ready' || state === 'sending') && (
          <>
            <p className="prose-measure">{t('cancel.question')}</p>
            <p className="mt-8">
              <button
                type="button"
                className="btn"
                disabled={state === 'sending'}
                onClick={() => void cancel()}
              >
                {state === 'sending' ? t('cancel.sending') : t('cancel.button')}
              </button>
            </p>
          </>
        )}
        {state === 'cancelled' && (
          <p role="status" className="prose-measure text-[1.125rem]">
            {t('cancel.done')}
          </p>
        )}
        {state === 'already' && (
          <p role="status" className="prose-measure text-[1.125rem]">
            {t('cancel.already')}
          </p>
        )}
        {state === 'invalid' && (
          <p role="alert" className="prose-measure">
            {t('cancel.invalid')}
          </p>
        )}
        {state === 'error' && (
          <p role="alert" className="prose-measure">
            {t('cancel.error')}{' '}
            <a
              href={`mailto:${t('footer.email')}?subject=${encodeURIComponent(t('cancel.mailSubject'))}`}
              className="btn-link"
            >
              {t('forms.viaMail')}
            </a>
          </p>
        )}
      </div>

      <p className="mt-16">
        <Link to={routes.events} className="btn-link">
          {t('cancel.toEvents')}
        </Link>
      </p>
    </main>
  )
}
