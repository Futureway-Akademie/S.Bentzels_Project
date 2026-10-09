import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { LoadState } from '../lib/useLoad'

type Props<T> = {
  state: LoadState<T>
  reload: () => void
  children: (data: T) => ReactNode
}

// Zeigt, solange Inhalte laden, einen ruhigen Hinweis, bei Störungen eine Meldung mit
// „Erneut versuchen“ und sonst die Seite. Die Seitenüberschrift bleibt Sache der Seite.
export default function ContentGate<T>({ state, reload, children }: Props<T>) {
  const { t } = useTranslation()
  if (state.status === 'loading')
    return (
      <main className="container-page py-20 md:py-28">
        <p className="label" role="status">
          {t('content.loading')}
        </p>
      </main>
    )
  if (state.status === 'error')
    return (
      <main className="container-page py-20 md:py-28" role="alert">
        <p>{t('content.loadError')}</p>
        <p className="mt-6">
          <button type="button" className="btn" onClick={reload}>
            {t('content.retry')}
          </button>
        </p>
      </main>
    )
  return <>{children(state.data)}</>
}
