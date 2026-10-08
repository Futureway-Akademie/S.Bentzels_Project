import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ASPECTS,
  cropForAspect,
  isFullCrop,
  moveCrop,
  resizeCrop,
  type AspectKey,
  type Crop,
} from '../lib/cropMath'

type CropEditorProps = {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  initialCrop: Crop | null
  busy: boolean
  onApply: (crop: Crop | null) => void
}

type Drag = {
  mode: 'move' | 'resize'
  startX: number
  startY: number
  start: Crop
}

const FULL: Crop = { x: 0, y: 0, width: 1, height: 1 }
const aspectKeys = Object.keys(ASPECTS) as AspectKey[]

// Bildausschnitt für das Vorschaubild. Das Originalbild wird nie verändert.
// Bedienung: Rahmen ziehen (verschieben), Griff rechts unten ziehen (Größe), Pfeiltasten verschieben.
export default function CropEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  initialCrop,
  busy,
  onApply,
}: CropEditorProps) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState<Crop>(initialCrop ?? FULL)
  const [aspectKey, setAspectKey] = useState<AspectKey>('free')
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)

  const aspect = ASPECTS[aspectKey]
  const ratio = imageWidth / imageHeight

  const begin = (event: React.PointerEvent, mode: Drag['mode']) => {
    event.preventDefault()
    event.stopPropagation()
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    drag.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      start: crop,
    }
  }

  const onMove = (event: React.PointerEvent) => {
    const current = drag.current
    const box = stage.current?.getBoundingClientRect()
    if (!current || !box) return
    const dx = (event.clientX - current.startX) / box.width
    const dy = (event.clientY - current.startY) / box.height
    setCrop(
      current.mode === 'move'
        ? moveCrop(current.start, dx, dy)
        : resizeCrop(current.start, dx, dy, imageWidth, imageHeight, aspect),
    )
  }

  const end = () => {
    drag.current = null
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 0.05 : 0.01
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const move = moves[event.key]
    if (move) {
      event.preventDefault()
      setCrop((current) => moveCrop(current, move[0], move[1]))
    }
  }

  const chooseAspect = (key: AspectKey) => {
    setAspectKey(key)
    setCrop(cropForAspect(imageWidth, imageHeight, ASPECTS[key]))
  }

  return (
    <div>
      <p className="label">{t('admin.artworks.aspect')}</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-4">
        {aspectKeys.map((key) => (
          <button
            key={key}
            type="button"
            className="filter-link"
            aria-pressed={aspectKey === key}
            onClick={() => chooseAspect(key)}
          >
            {key === 'free' ? t('admin.artworks.aspectFree') : key}
          </button>
        ))}
      </div>

      <div
        ref={stage}
        className="relative mt-5 select-none overflow-hidden"
        style={{
          width: `min(100%, calc(60vh * ${ratio}))`,
          aspectRatio: `${imageWidth} / ${imageHeight}`,
        }}
        onPointerMove={onMove}
        onPointerUp={end}
        onPointerCancel={end}
      >
        <img
          src={imageUrl}
          width={imageWidth}
          height={imageHeight}
          alt=""
          draggable={false}
          className="block h-full w-full object-contain"
        />
        <div
          role="group"
          tabIndex={0}
          aria-label={t('admin.artworks.cropArea')}
          className="crop-rect"
          style={{
            left: `${crop.x * 100}%`,
            top: `${crop.y * 100}%`,
            width: `${crop.width * 100}%`,
            height: `${crop.height * 100}%`,
          }}
          onPointerDown={(event) => begin(event, 'move')}
          onKeyDown={onKeyDown}
        >
          <span
            className="crop-handle"
            aria-hidden="true"
            onPointerDown={(event) => begin(event, 'resize')}
          />
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">{t('admin.artworks.cropHelp')}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() => onApply(isFullCrop(crop) ? null : crop)}
        >
          {busy
            ? t('admin.artworks.cropWorking')
            : t('admin.artworks.cropApply')}
        </button>
        <button
          type="button"
          className="btn-link"
          disabled={busy}
          onClick={() => {
            setCrop(FULL)
            setAspectKey('free')
            onApply(null)
          }}
        >
          {t('admin.artworks.cropReset')}
        </button>
      </div>
    </div>
  )
}
