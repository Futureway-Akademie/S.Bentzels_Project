import { useId, useState, type ReactNode } from 'react'

type Props = {
  /** Beschriftung des Knopfes, der das Formular öffnet */
  label: string
  /** Aussehen des Knopfes */
  variant?: 'btn' | 'btn-link'
  children: ReactNode
}

// Klappt ein Anfrageformular unter dem Knopf auf, ohne die Seite zu verlassen.
export default function InquiryDisclosure({
  label,
  variant = 'btn',
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div>
      <button
        type="button"
        className={variant}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen((value) => !value)
          if (!open)
            setTimeout(
              () =>
                document
                  .getElementById(id)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
              50,
            )
        }}
      >
        {label}
      </button>
      {open && (
        <div id={id} className="mt-10 max-w-xl">
          {children}
        </div>
      )}
    </div>
  )
}
