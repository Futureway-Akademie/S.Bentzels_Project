import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

export type LightboxImage = {
  src: string
  alt: string
  width: number
  height: number
}

type LightboxProps = {
  images: LightboxImage[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export default function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: LightboxProps) {
  const { t } = useTranslation()
  const [zoomed, setZoomed] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const total = images.length
  const image = images[index]

  const go = useCallback(
    (delta: number) => {
      setZoomed(false)
      onIndexChange((index + delta + total) % total)
    },
    [index, total, onIndexChange],
  )

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight' && total > 1) go(1)
      else if (event.key === 'ArrowLeft' && total > 1) go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose, total])

  if (!image) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('lightbox.label')}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="flex items-center justify-between px-4 py-4 md:px-8">
        <span className="label">
          {t('lightbox.counter', { current: index + 1, total })}
        </span>
        <div className="flex gap-6">
          <button
            type="button"
            className="btn-link"
            onClick={() => setZoomed((z) => !z)}
          >
            {zoomed ? t('lightbox.zoomOut') : t('lightbox.zoomIn')}
          </button>
          <button
            ref={closeRef}
            type="button"
            className="btn-link"
            onClick={onClose}
          >
            {t('lightbox.close')}
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto">
        <div
          className={`flex min-h-full items-center justify-center p-4 md:p-8 ${zoomed ? 'w-[200%]' : ''}`}
        >
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className={`object-contain ${zoomed ? 'w-full' : 'max-h-[calc(100vh-9rem)] max-w-full'}`}
            style={{ height: 'auto' }}
          />
        </div>
      </div>

      {total > 1 && (
        <div className="flex justify-between px-4 py-4 md:px-8">
          <button type="button" className="btn-link" onClick={() => go(-1)}>
            {t('lightbox.previous')}
          </button>
          <button type="button" className="btn-link" onClick={() => go(1)}>
            {t('lightbox.next')}
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
