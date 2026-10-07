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

const zoomLevels = [1, 2, 3]
const swipeThreshold = 50

export default function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: LightboxProps) {
  const { t } = useTranslation()
  const [zoomIndex, setZoomIndex] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const total = images.length
  const image = images[index]
  const zoom = zoomLevels[zoomIndex]

  const go = useCallback(
    (delta: number) => {
      setZoomIndex(0)
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

  // Wischen wechselt das Bild, solange nicht vergrößert ist (dann scrollt das Bild).
  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current =
      event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
  }
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || zoom > 1 || total < 2) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.abs(dx) > swipeThreshold && Math.abs(dx) > Math.abs(dy) * 1.5)
      go(dx < 0 ? 1 : -1)
  }

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
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="btn-link py-2"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
          >
            {t('lightbox.zoomOut')}
          </button>
          <button
            type="button"
            className="btn-link py-2"
            disabled={zoomIndex === zoomLevels.length - 1}
            onClick={() =>
              setZoomIndex((z) => Math.min(zoomLevels.length - 1, z + 1))
            }
          >
            {t('lightbox.zoomIn')}
          </button>
          <button
            ref={closeRef}
            type="button"
            className="btn-link py-2"
            onClick={onClose}
          >
            {t('lightbox.close')}
          </button>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex min-h-full items-center justify-center p-4 md:p-8"
          style={zoom > 1 ? { width: `${zoom * 100}%` } : undefined}
        >
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className={`object-contain ${zoom > 1 ? 'w-full' : 'max-h-[calc(100vh-9rem)] max-w-full'}`}
            style={{ height: 'auto' }}
            draggable={false}
          />
        </div>
      </div>

      {total > 1 && (
        <div className="flex justify-between px-4 py-4 md:px-8">
          <button
            type="button"
            className="btn-link py-2"
            onClick={() => go(-1)}
          >
            {t('lightbox.previous')}
          </button>
          <button type="button" className="btn-link py-2" onClick={() => go(1)}>
            {t('lightbox.next')}
          </button>
        </div>
      )}
    </div>,
    document.body,
  )
}
