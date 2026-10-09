import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  title: string
  onClose: () => void
  /** Knopf, der das Panel geöffnet hat, erhält beim Schließen den Fokus zurück */
  returnFocus?: RefObject<HTMLElement | null>
  children: ReactNode
}

// Seitliches Panel für die Werkanfrage: Esc und Klick auf den Hintergrund schließen es, der Fokus
// bleibt im Panel und kehrt beim Schließen zum Knopf zurück.
export default function InquiryPanel({
  title,
  onClose,
  returnFocus,
  children,
}: Props) {
  const { t } = useTranslation()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    // Der Knopf besteht beim Öffnen schon und bleibt es bis zum Schließen
    const target = returnFocus?.current ?? previous
    panel.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([tabindex="-1"]), select, textarea',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      target?.focus()
    }
  }, [onClose, returnFocus])

  return (
    <div className="fixed inset-0 z-50" data-inquiry-panel>
      <div
        className="absolute inset-0 bg-foreground/30"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-background p-6 outline-none md:p-10"
      >
        <div className="flex items-start justify-between gap-6">
          <h2 className="m-0 text-[1.5rem] leading-snug">{title}</h2>
          <button type="button" className="btn-link shrink-0" onClick={onClose}>
            {t('forms.close')}
          </button>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}
