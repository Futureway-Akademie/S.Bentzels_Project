import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { routes } from '../../config/routes'
import type { ZodType } from 'zod'
import {
  fieldErrors,
  submissionSchema,
} from '../../../supabase/functions/_shared/schemas'
import { MIN_FILL_MS } from '../../../supabase/functions/_shared/spam'
import type { FieldDef } from '../../lib/forms/definitions'
import { submitInquiry } from '../../lib/forms/submit'

export type SelectOption = { value: string; label: string }

type Props = {
  /** Art der Anfrage, steuert auch die Kennungen der Felder */
  type: string
  /** Regeln, Standard: die Anfrageformulare */
  schema?: ZodType
  /** Sendet die geprüften Daten, Standard: Anfrage an die Funktion submit-inquiry */
  submitFn?: (data: never) => Promise<unknown>
  fields: FieldDef[]
  /** Feste Angaben, z. B. artworkId oder eventId */
  fixed?: Record<string, unknown>
  /** Auswahlwerte für Felder ohne feste Liste (z. B. Kurs, Vortragsthema) */
  options?: Record<string, SelectOption[]>
  /** Schlüssel des Knopftextes, Standard forms.send */
  submitKey?: string
  /** Schlüssel der Bestätigung, Standard forms.thanks */
  successKey?: string
  /** Übersetzungsschlüssel einer besonderen Fehlermeldung zu einem Fehler, sonst der allgemeine Hinweis */
  errorFor?: (error: unknown) => string | null
  /** Bestätigung abhängig vom Ergebnis des Sendens (z. B. Warteliste), überschreibt successKey */
  successFor?: (result: unknown) => string
  /** E-Mail-Adresse mit Betreff als Ausweichmöglichkeit bei einer Störung */
  mailFallback: string
  onSent?: (result: unknown) => void
  className?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Gemeinsame Grundlage aller Anfrageformulare: nur Unterlinien, Beschriftungen in Versalien,
 * Prüfung im Browser mit denselben zod-Regeln wie auf dem Server, Pflicht-Zustimmung zur
 * Datenschutzerklärung, Spamschutz ohne Cookies (verstecktes Köderfeld und Mindestausfüllzeit von
 * 3 Sekunden) und eine Bestätigung an Stelle des Formulars.
 */
export default function InquiryForm({
  type,
  schema = submissionSchema,
  submitFn = submitInquiry as (data: never) => Promise<unknown>,
  fields,
  fixed = {},
  options = {},
  submitKey = 'forms.send',
  successKey = 'forms.thanks',
  successFor,
  errorFor,
  mailFallback,
  onSent,
  className = '',
}: Props) {
  const { t } = useTranslation()
  const [values, setValues] = useState<Record<string, string>>({})
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  )
  // Zeitpunkt, an dem das Formular geöffnet wurde (für die Mindestausfüllzeit)
  const [startedAt] = useState(() => Date.now())
  const thanks = useRef<HTMLParagraphElement>(null)
  const [success, setSuccess] = useState(successKey)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    if (state === 'sent') thanks.current?.focus()
  }, [state])

  const set = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const input = {
      ...values,
      ...fixed,
      type,
      consent: consent ? true : undefined,
      website,
      startedAt,
    }
    const parsed = schema.safeParse(input)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      setTimeout(
        () =>
          document
            .querySelector<HTMLElement>(
              '[data-inquiry-form] [aria-invalid="true"]',
            )
            ?.focus(),
        0,
      )
      return
    }
    setErrors({})
    setState('sending')
    try {
      // Eine sehr schnelle Eingabe wartet bis zur Mindestausfüllzeit, statt abgelehnt zu werden
      await sleep(Math.max(0, MIN_FILL_MS + 100 - (Date.now() - startedAt)))
      const result = await submitFn(parsed.data as never)
      setSuccess(successFor ? successFor(result) : successKey)
      setState('sent')
      onSent?.(result)
    } catch (error) {
      setFailure(errorFor ? errorFor(error) : null)
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <p
        ref={thanks}
        tabIndex={-1}
        role="status"
        data-inquiry-sent
        className="prose-measure text-[1.125rem] outline-none"
      >
        {t(success)}
      </p>
    )
  }

  const errorText = (name: string) =>
    errors[name] ? t(`forms.error.${errors[name]}`) : undefined

  return (
    <form
      noValidate
      data-inquiry-form
      className={`space-y-8 ${className}`}
      onSubmit={(event) => void submit(event)}
    >
      {fields.map((field) => {
        const id = `f-${type}-${field.name}`
        const error = errorText(field.name)
        const label = `${t(`forms.fields.${field.name}`)}${field.required ? ' *' : ''}`
        const common = {
          id,
          name: field.name,
          'aria-invalid': !!error,
          'aria-describedby': error ? `${id}-error` : undefined,
          value: values[field.name] ?? '',
        }
        const choices: SelectOption[] =
          options[field.name] ??
          (field.options ?? []).map((key) => ({
            value: key,
            label: t(`forms.options.${field.name}.${key}`),
          }))
        return (
          <div key={field.name}>
            <label htmlFor={id} className="label block">
              {label}
            </label>
            {field.kind === 'textarea' ? (
              <textarea
                {...common}
                rows={field.rows ?? 5}
                className="field"
                onChange={(event) => set(field.name, event.target.value)}
              />
            ) : field.kind === 'select' ? (
              <select
                {...common}
                className="field min-h-11"
                onChange={(event) => set(field.name, event.target.value)}
              >
                <option value="">{t('forms.choose')}</option>
                {choices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...common}
                type={field.kind === 'number' ? 'text' : field.kind}
                inputMode={field.kind === 'number' ? 'numeric' : undefined}
                autoComplete={field.autoComplete}
                className="field"
                onChange={(event) => set(field.name, event.target.value)}
              />
            )}
            {error && (
              <p id={`${id}-error`} role="alert" className="field-error">
                {error}
              </p>
            )}
          </div>
        )
      })}

      {/* Köderfeld: für Menschen unsichtbar und nicht erreichbar */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor={`f-${type}-website`}>Website</label>
        <input
          id={`f-${type}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <div>
        <label
          htmlFor={`f-${type}-consent`}
          className="flex min-h-11 cursor-pointer items-start gap-3"
        >
          <input
            id={`f-${type}-consent`}
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-foreground"
            checked={consent}
            aria-invalid={!!errors.consent}
            aria-describedby={
              errors.consent ? `f-${type}-consent-error` : undefined
            }
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span className="text-sm leading-snug">
            {t('forms.consentBefore')}{' '}
            <Link to={routes.privacy} className="btn-link">
              {t('forms.consentLink')}
            </Link>{' '}
            {t('forms.consentAfter')}
          </span>
        </label>
        {errors.consent && (
          <p
            id={`f-${type}-consent-error`}
            role="alert"
            className="field-error"
          >
            {t('forms.error.consent')}
          </p>
        )}
      </div>

      {state === 'error' && (
        <p role="alert" className="field-error">
          {t(failure ?? 'forms.failed')}{' '}
          <a href={mailFallback} className="btn-link">
            {t('forms.viaMail')}
          </a>
        </p>
      )}

      <button type="submit" className="btn" disabled={state === 'sending'}>
        {state === 'sending' ? t('forms.sending') : t(submitKey)}
      </button>
    </form>
  )
}
