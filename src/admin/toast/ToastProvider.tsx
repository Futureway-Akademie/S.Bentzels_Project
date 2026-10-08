import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ToastContext, type ToastApi, type ToastKind } from './toastContext'

type Toast = { id: number; kind: ToastKind; text: string }

const DURATION: Record<ToastKind, number> = { success: 4000, error: 9000 }

// Kurze Rückmeldungen (Gespeichert, Fehler). Erfolgsmeldungen verschwinden von selbst,
// Fehlermeldungen bleiben länger. Ein Klick schließt eine Meldung.
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback<ToastApi['notify']>(
    (text, kind = 'success') => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current.slice(-3), { id, kind, text }])
      setTimeout(() => dismiss(id), DURATION[kind])
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className="toast pointer-events-auto flex max-w-md items-start gap-4 border border-foreground bg-background px-4 py-3 text-sm"
          >
            <span className="flex-1">{toast.text}</span>
            <button
              type="button"
              className="btn-link shrink-0"
              onClick={() => dismiss(toast.id)}
              aria-label={t('admin.toastClose')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
