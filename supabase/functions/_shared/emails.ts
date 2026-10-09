// E-Mails zu Anfragen (reine Funktionen): schlicht und typografisch, Galerieweiß, Namensschriftzug
// als Text, keine Bilder außer beim Werk. Alle Eingaben werden für HTML maskiert.
import type { Submission } from './schemas.ts'

export type Attachment = {
  filename: string
  content: string
  contentType: string
}

export type Mail = {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
  attachments?: Attachment[]
}

export type ArtworkInfo = {
  title: string | null
  imageUrl: string | null
  dimensions: string | null
  priceEur: number | null
}
export type EventInfo = {
  title: string
  dateLine: string | null
  location: string | null
}

export type Context = {
  siteName: string
  /** Name des Kreises, in den E-Mails nur als Text verwendet */
  circleName: string
  artwork?: ArtworkInfo | null
  event?: EventInfo | null
}

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const PARTICIPANTS: Record<string, string> = {
  s: 'bis 8',
  m: '9–15',
  l: '16–25',
  xl: 'mehr als 25',
}
const LOCATIONS: Record<string, string> = {
  unternehmen: 'Bei uns im Unternehmen',
  location: 'Besondere Location gewünscht',
  offen: 'Noch offen',
}
const EXPERIENCE: Record<string, string> = {
  keine: 'Keine',
  etwas: 'Etwas',
  viel: 'Viel',
}

const price = (value: number) =>
  `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value)} € inkl. MwSt.`

type Line = [label: string, value: string]

/** Angaben der Anfrage als Zeilen, nur vorhandene. */
export function detailLines(data: Submission, context: Context): Line[] {
  const lines: Line[] = []
  const add = (label: string, value: string | number | undefined | null) => {
    if (value !== undefined && value !== null && String(value).trim() !== '')
      lines.push([label, String(value)])
  }
  add('Name', data.name)
  add('E-Mail', data.email)
  add('Telefon', data.phone)
  switch (data.type) {
    case 'werk':
      add('Werk', context.artwork?.title ?? 'Ohne Titel')
      break
    case 'seminar':
      add('Unternehmen', data.company)
      add('Position', data.position)
      add('Teilnehmende', data.participants && PARTICIPANTS[data.participants])
      add('Gewünschter Zeitraum', data.period)
      add('Ort', data.location && LOCATIONS[data.location])
      break
    case 'vortrag':
      add('Organisation', data.organization)
      add('Wunschthema', data.topic)
      add('Anlass', data.occasion)
      add('Datum', data.date)
      add('Erwartete Gäste', data.guests)
      break
    case 'kunstkurs':
      add('Kurstermin', data.course)
      add('Personen', data.persons)
      add('Vorerfahrung', data.experience && EXPERIENCE[data.experience])
      break
    case 'bentzel_club':
      add('Tätigkeit oder Hintergrund', data.background)
      add('Was bedeutet Kunst für Sie?', data.meaning)
      add('Aufmerksam geworden durch', data.source)
      break
    case 'kontakt':
      add('Betreff', data.subject)
      break
    case 'veranstaltung':
      add('Veranstaltung', context.event?.title)
      add('Personen', data.persons)
      add(
        'Art der Anfrage',
        data.interest ? 'Interesse angemeldet' : 'Informationen angefragt',
      )
      break
  }
  add('Nachricht', data.message)
  return lines
}

/** Betreffzeile der Benachrichtigung an den Künstler. */
export function notificationSubject(
  data: Submission,
  context: Context,
): string {
  switch (data.type) {
    case 'werk':
      return `Anfrage zu: ${context.artwork?.title ?? 'Werk ohne Titel'}`
    case 'seminar':
      return `Anfrage The Art of Becoming: ${data.company}`
    case 'vortrag':
      return `Vortragsanfrage: ${data.organization}`
    case 'kunstkurs':
      return 'Anfrage Kunstkurs'
    case 'bentzel_club':
      return `Interesse am ${context.circleName}`
    case 'kontakt':
      return data.subject ? `Kontakt: ${data.subject}` : 'Kontaktanfrage'
    case 'veranstaltung':
      return `Anfrage zu: ${context.event?.title ?? 'Veranstaltung'}`
  }
}

const FONT = "font-family:'Helvetica Neue',Helvetica,Arial,sans-serif"

function layout(siteName: string, body: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;padding:0;background:#F7F6F2;color:#141414;${FONT}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2"><tr><td align="center" style="padding:40px 20px"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%"><tr><td style="padding-bottom:32px;border-bottom:1px solid #D9D7D0;font-size:13px;letter-spacing:0.18em;text-transform:uppercase">${escapeHtml(siteName)}</td></tr><tr><td style="padding-top:32px;font-size:16px;line-height:1.6">${body}</td></tr></table></td></tr></table></body></html>`
}

function table(lines: Line[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">${lines
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0;border-top:1px solid #D9D7D0;vertical-align:top"><div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6B6B66">${escapeHtml(label)}</div><div style="margin-top:4px;white-space:pre-wrap">${escapeHtml(value)}</div></td></tr>`,
    )
    .join('')}</table>`
}

export function buildNotification(
  data: Submission,
  context: Context,
  to: string,
): Mail {
  const lines = detailLines(data, context)
  const subject = notificationSubject(data, context)
  const text = `${subject}\n\n${lines.map(([l, v]) => `${l}: ${v}`).join('\n')}\n`
  const html = layout(
    context.siteName,
    `<p style="margin:0;font-size:22px;line-height:1.3">${escapeHtml(subject)}</p>${table(lines)}<p style="margin-top:28px;color:#6B6B66;font-size:13px">Antworten Sie direkt auf diese E-Mail, sie geht an ${escapeHtml(data.name)}.</p>`,
  )
  return { to, subject, text, html, replyTo: data.email }
}

/** Eingangsbestätigung an den Absender. Beim Werk mit Vorschaubild, Titel, Maßen und Preis. */
export function buildConfirmation(data: Submission, context: Context): Mail {
  const subject = `Ihre Anfrage bei ${context.siteName}`
  const greeting = `Guten Tag ${data.name},`
  const intro =
    'vielen Dank für Ihre Nachricht. Sie ist bei uns angekommen, wir melden uns in Kürze persönlich bei Ihnen.'
  const lines = detailLines(data, context).filter(
    ([label]) => label !== 'Name' && label !== 'E-Mail' && label !== 'Telefon',
  )
  let artworkHtml = ''
  let artworkText = ''
  if (data.type === 'werk' && context.artwork) {
    const a = context.artwork
    const facts = [
      a.dimensions,
      a.priceEur !== null ? price(a.priceEur) : null,
    ].filter(Boolean) as string[]
    artworkHtml = `${a.imageUrl ? `<p style="margin:24px 0 0"><img src="${escapeHtml(a.imageUrl)}" alt="${escapeHtml(a.title ?? 'Werk')}" style="max-width:100%;height:auto;display:block"></p>` : ''}<p style="margin:12px 0 0;font-size:18px">${escapeHtml(a.title ?? 'Ohne Titel')}</p>${facts.length ? `<p style="margin:4px 0 0;color:#6B6B66">${facts.map(escapeHtml).join(' · ')}</p>` : ''}`
    artworkText = `\n${a.title ?? 'Ohne Titel'}${facts.length ? `\n${facts.join(' · ')}` : ''}\n`
  }
  const text = `${greeting}\n\n${intro}\n${artworkText}\n${lines.map(([l, v]) => `${l}: ${v}`).join('\n')}\n\nHerzliche Grüße\n${context.siteName}\n`
  const html = layout(
    context.siteName,
    `<p style="margin:0">${escapeHtml(greeting)}</p><p>${escapeHtml(intro)}</p>${artworkHtml}${lines.length ? table(lines) : ''}<p style="margin-top:32px">Herzliche Grüße<br>${escapeHtml(context.siteName)}</p>`,
  )
  return { to: data.email, subject, text, html }
}
