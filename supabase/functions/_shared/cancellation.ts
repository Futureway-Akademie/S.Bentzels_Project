// Stornierung einer Anmeldung über den persönlichen Link (ohne Deno- oder Supabase-Abhängigkeiten).
// Ablauf: Token prüfen -> Begrenzung -> stornieren und nachrücken (Datenbankfunktion) -> E-Mails an
// die stornierende Person, den Künstler und alle, die nachgerückt sind.
import { z } from 'zod'
import { buildIcs } from './ics.ts'
import { escapeHtml, type Mail } from './emails.ts'
import {
  detailRows,
  layout,
  rowsHtml,
  type Details,
  type EventForMail,
} from './registration.ts'
import { isRateLimited, nextRateState, type RateState } from './spam.ts'
import { signToken, verifyToken } from './token.ts'

export type PromotedRegistration = {
  id: string
  name: string
  email: string
  guests: number
  cancelKey: string
}

export type CancelOutcome =
  | { outcome: 'unknown' }
  | { outcome: 'already_cancelled' }
  | {
      outcome: 'cancelled'
      eventId: string
      name: string
      email: string
      /** Status der stornierten Anmeldung (angemeldet oder warteliste) */
      status: string
      promoted: PromotedRegistration[]
    }

export type CancellationDeps = {
  now: () => number
  senderKey: string
  rates: {
    get(key: string): Promise<RateState | null>
    set(key: string, state: RateState): Promise<void>
  }
  data: {
    cancel(cancelKey: string): Promise<CancelOutcome>
    findEvent(id: string): Promise<EventForMail | null>
  }
  mail: { send(mail: Mail): Promise<void> }
  config: {
    notifyTo: string
    siteName: string
    siteUrl: string
    tokenSecret: string
  }
  log?: (message: string, detail?: unknown) => void
}

export type CancellationResponse = {
  status: number
  body: {
    ok: boolean
    error?: string
    result?: 'cancelled' | 'already_cancelled'
  }
}

const cancelSchema = z.object({ token: z.string().min(10).max(500) })

const frame = (
  siteName: string,
  greeting: string,
  paragraphs: string[],
  rows: [string, string][],
) => {
  const text = `${greeting}\n\n${paragraphs.join('\n\n')}\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}\n\nHerzliche Grüße\n${siteName}\n`
  const html = layout(
    siteName,
    `<p style="margin:0">${escapeHtml(greeting)}</p>${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}${rowsHtml(rows)}<p style="margin-top:28px">Herzliche Grüße<br>${escapeHtml(siteName)}</p>`,
  )
  return { text, html }
}

/** Bestätigung der Stornierung an die Person. */
export function buildCancellationMail(
  data: { name: string; email: string; status: string },
  event: EventForMail,
  siteName: string,
): Mail {
  const wait = data.status === 'warteliste'
  const subject = `Abmeldung bestätigt: ${event.title}`
  const { text, html } = frame(
    siteName,
    `Guten Tag ${data.name},`,
    [
      wait
        ? 'Sie wurden von der Warteliste genommen.'
        : 'Ihre Anmeldung wurde storniert. Der Platz ist wieder frei.',
    ],
    [['Veranstaltung', event.title]],
  )
  return { to: data.email, subject, text, html }
}

export function buildCancellationNotice(
  data: { name: string; email: string; status: string },
  event: EventForMail,
  to: string,
  promoted: PromotedRegistration[],
): Mail {
  const wait = data.status === 'warteliste'
  const subject = `${wait ? 'Warteliste storniert' : 'Stornierung'}: ${event.title}`
  const rows: [string, string][] = [
    ['Veranstaltung', event.title],
    ['Name', data.name],
    ['E-Mail', data.email],
  ]
  if (promoted.length > 0)
    rows.push([
      'Nachgerückt',
      promoted.map((p) => `${p.name} (${1 + p.guests})`).join(', '),
    ])
  const text = `${subject}\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}\n`
  const html = layout(
    'Anmeldung',
    `<p style="margin:0;font-size:22px;line-height:1.3">${escapeHtml(subject)}</p>${rowsHtml(rows)}`,
  )
  return { to, subject, text, html, replyTo: data.email }
}

/** E-Mail an eine Person, die von der Warteliste nachgerückt ist: Bestätigung mit Termin, Kalenderdatei und Stornierungslink. */
export function buildPromotionMail(
  person: PromotedRegistration,
  details: Details,
  siteName: string,
): Mail {
  const subject = `Ein Platz ist frei: ${details.event.title}`
  const rows = detailRows(details)
  const intro =
    'gute Nachrichten: Es ist ein Platz frei geworden und Sie sind von der Warteliste nachgerückt. Ihre Anmeldung ist jetzt bestätigt. Der Termin hängt als Kalenderdatei an.'
  const cancel =
    'Wenn Sie doch nicht teilnehmen können, melden Sie sich bitte hier ab:'
  const greeting = `Guten Tag ${person.name},`
  const text = `${greeting}\n\n${intro}\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}\n\n${cancel}\n${details.cancelUrl}\n\nHerzliche Grüße\n${siteName}\n`
  const html = layout(
    siteName,
    `<p style="margin:0">${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>${rowsHtml(rows)}<p style="margin-top:28px;color:#6B6B66;font-size:14px">${escapeHtml(cancel)}<br><a href="${escapeHtml(details.cancelUrl)}" style="color:#141414">${escapeHtml(details.cancelUrl)}</a></p><p style="margin-top:28px">Herzliche Grüße<br>${escapeHtml(siteName)}</p>`,
  )
  const mail: Mail = { to: person.email, subject, text, html }
  const ics = buildIcs({
    uid: person.id,
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
  return mail
}

export async function handleCancellation(
  raw: unknown,
  deps: CancellationDeps,
): Promise<CancellationResponse> {
  const parsed = cancelSchema.safeParse(raw)
  if (!parsed.success)
    return { status: 400, body: { ok: false, error: 'invalid' } }

  const state = nextRateState(await deps.rates.get(deps.senderKey), deps.now())
  await deps.rates.set(deps.senderKey, state)
  if (isRateLimited(state))
    return { status: 429, body: { ok: false, error: 'rate_limited' } }

  const cancelKey = await verifyToken(
    parsed.data.token,
    deps.config.tokenSecret,
  )
  if (!cancelKey)
    return { status: 400, body: { ok: false, error: 'invalid_token' } }

  const result = await deps.data.cancel(cancelKey)
  if (result.outcome === 'unknown')
    return { status: 404, body: { ok: false, error: 'unknown' } }
  if (result.outcome === 'already_cancelled')
    return { status: 200, body: { ok: true, result: 'already_cancelled' } }

  const event = await deps.data.findEvent(result.eventId)
  if (event) {
    const base = deps.config.siteUrl.replace(/\/$/, '')
    const mails: Mail[] = [
      buildCancellationMail(result, event, deps.config.siteName),
      buildCancellationNotice(
        result,
        event,
        deps.config.notifyTo,
        result.promoted,
      ),
    ]
    for (const person of result.promoted) {
      const token = await signToken(person.cancelKey, deps.config.tokenSecret)
      mails.push(
        buildPromotionMail(
          person,
          {
            event,
            persons: 1 + person.guests,
            waitlist: false,
            cancelUrl: `${base}/abmelden?token=${encodeURIComponent(token)}`,
          },
          deps.config.siteName,
        ),
      )
    }
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
  return { status: 200, body: { ok: true, result: 'cancelled' } }
}
