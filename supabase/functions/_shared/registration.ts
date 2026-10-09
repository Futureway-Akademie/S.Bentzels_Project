// Verarbeitung einer Anmeldung zu einer Veranstaltung (ohne Deno- oder Supabase-Abhängigkeiten).
// Ablauf: prüfen (zod) -> Spam verwerfen -> Begrenzung -> anmelden (Datenbankfunktion mit
// Kapazitätsprüfung, Begleitpersonen zählen mit, sonst Warteliste) -> E-Mails mit .ics-Datei.
import { buildIcs } from './ics.ts'
import { escapeHtml, type Mail } from './emails.ts'
import { fieldErrors, registrationSchema } from './schemas.ts'
import {
  checkSpam,
  isRateLimited,
  nextRateState,
  type RateState,
} from './spam.ts'
import { signToken } from './token.ts'

export type EventForMail = {
  title: string
  startsAt: string | null
  endsAt: string | null
  location: string | null
  address: string | null
  slug: string
}

export type RegisterResult = {
  registrationId: string
  cancelKey: string
  status: 'angemeldet' | 'warteliste'
  seatsLeft: number | null
}

export type RegistrationDeps = {
  now: () => number
  senderKey: string
  rates: {
    get(key: string): Promise<RateState | null>
    set(key: string, state: RateState): Promise<void>
  }
  data: {
    /** Ruft die Datenbankfunktion register_for_event auf. Wirft mit dem Fehlercode als Nachricht. */
    register(input: {
      eventId: string
      name: string
      email: string
      phone: string | null
      company: string | null
      guests: number
    }): Promise<RegisterResult>
    findEvent(id: string): Promise<EventForMail | null>
  }
  mail: { send(mail: Mail): Promise<void> }
  config: {
    notifyTo: string
    siteName: string
    siteUrl: string
    /** Geheimer Schlüssel für die Stornierungslinks */
    tokenSecret: string
  }
  log?: (message: string, detail?: unknown) => void
}

export type RegistrationResponse = {
  status: number
  body: {
    ok: boolean
    error?: string
    errors?: Record<string, string>
    registration?: 'angemeldet' | 'warteliste'
  }
}

const CODES = ['unknown_event', 'closed', 'duplicate'] as const

const dateLine = (startsAt: string | null): string | null =>
  startsAt
    ? new Intl.DateTimeFormat('de-DE', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Europe/Berlin',
      }).format(new Date(startsAt))
    : null

const FONT = "font-family:'Helvetica Neue',Helvetica,Arial,sans-serif"

export function layout(siteName: string, body: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;padding:0;background:#F7F6F2;color:#141414;${FONT}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%"><tr><td style="padding-bottom:32px;border-bottom:1px solid #D9D7D0;font-size:13px;letter-spacing:0.18em;text-transform:uppercase">${escapeHtml(siteName)}</td></tr><tr><td style="padding-top:32px;font-size:16px;line-height:1.6">${body}</td></tr></table></td></tr></table></body></html>`
}

export type Details = {
  event: EventForMail
  persons: number
  waitlist: boolean
  cancelUrl: string
}

export function detailRows(details: Details): [string, string][] {
  const rows: [string, string][] = [['Veranstaltung', details.event.title]]
  const when = dateLine(details.event.startsAt)
  if (when) rows.push(['Datum und Uhrzeit', when])
  const place = [details.event.location, details.event.address]
    .filter(Boolean)
    .join(', ')
  if (place) rows.push(['Ort', place])
  rows.push([
    'Personen',
    details.persons === 1
      ? '1 Person'
      : `${details.persons} Personen (mit Begleitung)`,
  ])
  return rows
}

export const rowsHtml = (rows: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">${rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0;border-top:1px solid #D9D7D0;vertical-align:top"><div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6B6B66">${escapeHtml(label)}</div><div style="margin-top:4px">${escapeHtml(value)}</div></td></tr>`,
    )
    .join('')}</table>`

/** E-Mail an den Gast: Bestätigung mit Kalenderdatei oder Hinweis auf die Warteliste, jeweils mit Stornierungslink. */
export function buildRegistrationMail(
  data: { name: string; email: string },
  details: Details,
  siteName: string,
  registrationId: string,
): Mail {
  const rows = detailRows(details)
  const subject = details.waitlist
    ? `Warteliste: ${details.event.title}`
    : `Ihre Anmeldung: ${details.event.title}`
  const intro = details.waitlist
    ? 'die Veranstaltung ist derzeit ausgebucht. Sie stehen auf der Warteliste. Wird ein Platz frei, rücken Sie automatisch nach und wir informieren Sie sofort per E-Mail.'
    : 'vielen Dank, Ihre Anmeldung ist bestätigt. Wir freuen uns auf Sie. Der Termin hängt als Kalenderdatei an.'
  const cancel = details.waitlist
    ? 'Wenn Sie nicht mehr auf der Warteliste stehen möchten, können Sie sich hier abmelden:'
    : 'Wenn Sie nicht teilnehmen können, melden Sie sich bitte hier ab, damit ein Platz frei wird:'
  const greeting = `Guten Tag ${data.name},`
  const text = `${greeting}\n\n${intro}\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}\n\n${cancel}\n${details.cancelUrl}\n\nHerzliche Grüße\n${siteName}\n`
  const html = layout(
    siteName,
    `<p style="margin:0">${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>${rowsHtml(rows)}<p style="margin-top:28px;color:#6B6B66;font-size:14px">${escapeHtml(cancel)}<br><a href="${escapeHtml(details.cancelUrl)}" style="color:#141414">${escapeHtml(details.cancelUrl)}</a></p><p style="margin-top:28px">Herzliche Grüße<br>${escapeHtml(siteName)}</p>`,
  )
  const mail: Mail = { to: data.email, subject, text, html }
  if (!details.waitlist) {
    const ics = buildIcs({
      uid: registrationId,
      title: details.event.title,
      startsAt: details.event.startsAt,
      endsAt: details.event.endsAt,
      location:
        [details.event.location, details.event.address]
          .filter(Boolean)
          .join(', ') || null,
    })
    if (ics)
      mail.attachments = [
        {
          filename: 'termin.ics',
          content: ics,
          contentType: 'text/calendar; charset=utf-8',
        },
      ]
  }
  return mail
}

export function buildRegistrationNotice(
  data: { name: string; email: string; phone?: string; company?: string },
  details: Details,
  to: string,
  seatsLeft: number | null,
): Mail {
  const rows = detailRows(details)
  rows.push(['Name', data.name], ['E-Mail', data.email])
  if (data.phone) rows.push(['Telefon', data.phone])
  if (data.company) rows.push(['Unternehmen', data.company])
  if (seatsLeft !== null) rows.push(['Noch frei', String(seatsLeft)])
  const subject = `${details.waitlist ? 'Neue Warteliste' : 'Neue Anmeldung'}: ${details.event.title}`
  const text = `${subject}\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}\n`
  const html = layout(
    'Anmeldung',
    `<p style="margin:0;font-size:22px;line-height:1.3">${escapeHtml(subject)}</p>${rowsHtml(rows)}`,
  )
  return { to, subject, text, html, replyTo: data.email }
}

export async function handleRegistration(
  raw: unknown,
  deps: RegistrationDeps,
): Promise<RegistrationResponse> {
  const parsed = registrationSchema.safeParse(raw)
  if (!parsed.success)
    return {
      status: 400,
      body: { ok: false, error: 'invalid', errors: fieldErrors(parsed.error) },
    }
  const data = parsed.data
  const now = deps.now()

  if (
    checkSpam({ website: data.website, startedAt: data.startedAt }, now) !==
    'ok'
  )
    return { status: 200, body: { ok: true, registration: 'angemeldet' } }

  const state = nextRateState(await deps.rates.get(deps.senderKey), now)
  await deps.rates.set(deps.senderKey, state)
  if (isRateLimited(state))
    return { status: 429, body: { ok: false, error: 'rate_limited' } }

  let result: RegisterResult
  try {
    result = await deps.data.register({
      eventId: data.eventId,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      company: data.company ?? null,
      guests: data.guests,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const code = CODES.find((candidate) => message.includes(candidate))
    if (code)
      return {
        status: code === 'duplicate' ? 409 : 400,
        body: { ok: false, error: code },
      }
    throw error
  }

  const event = await deps.data.findEvent(data.eventId)
  if (event) {
    const token = await signToken(result.cancelKey, deps.config.tokenSecret)
    const details: Details = {
      event,
      persons: 1 + data.guests,
      waitlist: result.status === 'warteliste',
      cancelUrl: `${deps.config.siteUrl.replace(/\/$/, '')}/abmelden?token=${encodeURIComponent(token)}`,
    }
    const mails = [
      buildRegistrationMail(
        data,
        details,
        deps.config.siteName,
        result.registrationId,
      ),
      buildRegistrationNotice(
        data,
        details,
        deps.config.notifyTo,
        result.seatsLeft,
      ),
    ]
    for (const mail of mails) {
      try {
        await deps.mail.send(mail)
      } catch (error) {
        deps.log?.('E-Mail nicht gesendet', {
          to: mail.to,
          error: String(error),
        })
      }
    }
  }
  return { status: 200, body: { ok: true, registration: result.status } }
}
