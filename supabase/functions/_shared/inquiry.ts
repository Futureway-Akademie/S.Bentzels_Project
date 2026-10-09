// Verarbeitung einer Anfrage (ohne Deno- oder Supabase-Abhängigkeiten, daher in Node testbar).
// Ablauf: prüfen (zod) -> Spam verwerfen -> Begrenzung je Absender -> speichern -> E-Mails.
import {
  buildConfirmation,
  buildNotification,
  type ArtworkInfo,
  type Context,
  type EventInfo,
  type Mail,
} from './emails.ts'
import { fieldErrors, submissionSchema, type Submission } from './schemas.ts'
import {
  checkSpam,
  isRateLimited,
  nextRateState,
  type RateState,
} from './spam.ts'

export type InquiryRow = {
  type: Submission['type']
  name: string
  email: string
  phone: string | null
  company: string | null
  message: string | null
  artwork_id: string | null
  event_id: string | null
  persons: number | null
  payload: Record<string, unknown>
  consent_at: string
}

export type Deps = {
  now: () => number
  /** Anonymer Schlüssel des Absenders (Hash) */
  senderKey: string
  rates: {
    get(key: string): Promise<RateState | null>
    set(key: string, state: RateState): Promise<void>
  }
  data: {
    insertInquiry(row: InquiryRow): Promise<void>
    findArtwork(id: string): Promise<ArtworkInfo | null>
    findEvent(id: string): Promise<EventInfo | null>
  }
  mail: { send(mail: Mail): Promise<void> }
  config: { notifyTo: string; siteName: string; circleName: string }
  log?: (message: string, detail?: unknown) => void
}

export type Result = {
  status: number
  body: { ok: boolean; error?: string; errors?: Record<string, string> }
}

const BASE_KEYS = new Set([
  'type',
  'name',
  'email',
  'phone',
  'message',
  'consent',
  'website',
  'startedAt',
  'artworkId',
  'eventId',
  'persons',
  'company',
  'organization',
])

export async function handleInquiry(raw: unknown, deps: Deps): Promise<Result> {
  const parsed = submissionSchema.safeParse(raw)
  if (!parsed.success)
    return {
      status: 400,
      body: { ok: false, error: 'invalid', errors: fieldErrors(parsed.error) },
    }
  const data = parsed.data
  const now = deps.now()

  // Spam wird stillschweigend verworfen und sieht aus wie ein Erfolg
  if (
    checkSpam({ website: data.website, startedAt: data.startedAt }, now) !==
    'ok'
  )
    return { status: 200, body: { ok: true } }

  const state = nextRateState(await deps.rates.get(deps.senderKey), now)
  await deps.rates.set(deps.senderKey, state)
  if (isRateLimited(state))
    return { status: 429, body: { ok: false, error: 'rate_limited' } }

  const context: Context = {
    siteName: deps.config.siteName,
    circleName: deps.config.circleName,
  }
  if (data.type === 'werk') {
    context.artwork = await deps.data.findArtwork(data.artworkId)
    if (!context.artwork)
      return { status: 400, body: { ok: false, error: 'unknown_artwork' } }
  }
  if (data.type === 'veranstaltung') {
    context.event = await deps.data.findEvent(data.eventId)
    if (!context.event)
      return { status: 400, body: { ok: false, error: 'unknown_event' } }
  }

  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data))
    if (!BASE_KEYS.has(key) && value !== undefined) payload[key] = value
  const row: InquiryRow = {
    type: data.type,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    company:
      'company' in data
        ? (data.company ?? null)
        : 'organization' in data
          ? (data.organization ?? null)
          : null,
    message: data.message ?? null,
    artwork_id: data.type === 'werk' ? data.artworkId : null,
    event_id: data.type === 'veranstaltung' ? data.eventId : null,
    persons: 'persons' in data ? (data.persons ?? null) : null,
    payload,
    consent_at: new Date(now).toISOString(),
  }
  await deps.data.insertInquiry(row)

  // Die Anfrage ist gespeichert. Ein Fehler beim Versand ändert daran nichts und wird nur protokolliert.
  for (const mail of [
    buildNotification(data, context, deps.config.notifyTo),
    buildConfirmation(data, context),
  ]) {
    try {
      await deps.mail.send(mail)
    } catch (error) {
      deps.log?.('E-Mail nicht gesendet', { to: mail.to, error: String(error) })
    }
  }
  return { status: 200, body: { ok: true } }
}
