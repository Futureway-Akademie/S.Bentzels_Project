import { useRef, useState } from 'react'

type DropzoneProps = {
  label: string
  hint?: string
  chooseLabel: string
  multiple?: boolean
  disabled?: boolean
  onFiles: (files: File[]) => void
  className?: string
}

// Ablagefeld für Bilder per Ziehen oder Auswählen. Auf Touchgeräten und per Tastatur
// funktioniert der Knopf „Auswählen“, der auch die Kamera bzw. Fotos des Geräts öffnet.
export default function Dropzone({
  label,
  hint,
  chooseLabel,
  multiple = false,
  disabled = false,
  onFiles,
  className = '',
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const take = (list: FileList | null) => {
    if (!list || list.length === 0) return
    onFiles(Array.from(list))
  }

  return (
    <div
      className={`dropzone ${over ? 'dropzone-over' : ''} ${className}`}
      onDragOver={(event) => {
        if (disabled) return
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        if (!disabled) take(event.dataTransfer.files)
      }}
    >
      <p>{label}</p>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      <p className="mt-4">
        <button
          type="button"
          className="btn"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {chooseLabel}
        </button>
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          take(event.target.files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
