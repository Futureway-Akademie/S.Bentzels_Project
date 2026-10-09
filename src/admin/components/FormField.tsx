import type { ReactNode } from 'react'

type Common = {
  id: string
  label: string
  /** Bereits übersetzte Fehlermeldung */
  error?: string
  hint?: string
}

type TextProps = Common & {
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'url' | 'datetime-local' | 'date'
  rows?: number
  inputMode?: 'numeric' | 'decimal'
}

function Message({ id, error, hint }: Pick<Common, 'id' | 'error' | 'hint'>) {
  if (error)
    return (
      <p id={`${id}-error`} role="alert" className="field-error">
        {error}
      </p>
    )
  if (hint)
    return (
      <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
        {hint}
      </p>
    )
  return null
}

/** Beschriftetes Textfeld, mehrzeilig bei `rows`. Fehler und Hinweis sind per ARIA verbunden. */
export function TextField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  rows,
  inputMode,
  error,
  hint,
}: TextProps) {
  const described = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div>
      <label htmlFor={id} className="label block">
        {label}
      </label>
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          className="field"
          value={value}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          className={`field ${type === 'datetime-local' || type === 'date' ? 'min-h-11' : ''}`}
          value={value}
          aria-invalid={!!error}
          aria-describedby={described}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      <Message id={id} error={error} hint={hint} />
    </div>
  )
}

type CheckProps = {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  hint?: string
}

/** Kontrollkästchen mit mindestens 44 px Trefferfläche. */
export function CheckField({ id, label, checked, onChange, hint }: CheckProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-center gap-3"
      >
        <input
          id={id}
          type="checkbox"
          className="size-5 shrink-0 accent-foreground"
          checked={checked}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{label}</span>
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

type SectionProps = {
  id: string
  title: string
  hint?: string
  children: ReactNode
}

export function Section({ id, title, hint, children }: SectionProps) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-6">
      <h2 id={id} className="label">
        {title}
      </h2>
      {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-6">{children}</div>
    </section>
  )
}
