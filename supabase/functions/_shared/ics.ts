// Kalenderdatei (.ics) für Anmeldungen (reine Funktion, RFC 5545).

const pad = (n: number) => String(n).padStart(2, '0')

const utc = (date: Date): string =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`

const escapeText = (value: string): string =>
  value.replace(/([\\;,])/g, '\\$1').replace(/\r?\n/g, '\\n')

/** Zeilen länger als 75 Zeichen werden laut Norm umgebrochen. */
function fold(line: string): string {
  const parts: string[] = []
  let rest = line
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74))
    rest = ` ${rest.slice(74)}`
  }
  parts.push(rest)
  return parts.join('\r\n')
}

export type IcsInput = {
  uid: string
  title: string
  startsAt: string | null
  endsAt?: string | null
  location?: string | null
  description?: string | null
  url?: string | null
  /** Zeitpunkt der Erstellung, Standard jetzt */
  now?: Date
}

/** Kalendereintrag, oder null ohne gültigen Beginn. Ohne Ende dauert der Termin zwei Stunden. */
export function buildIcs(input: IcsInput): string | null {
  if (!input.startsAt) return null
  const start = new Date(input.startsAt)
  if (Number.isNaN(start.getTime())) return null
  const parsedEnd = input.endsAt ? new Date(input.endsAt) : null
  const end =
    parsedEnd && !Number.isNaN(parsedEnd.getTime()) && parsedEnd > start
      ? parsedEnd
      : new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stephan Graf Bentzel-Sturmfeder//Veranstaltungen//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}@sturmfederprojects.de`,
    `DTSTAMP:${utc(input.now ?? new Date())}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(end)}`,
    `SUMMARY:${escapeText(input.title)}`,
  ]
  if (input.location) lines.push(`LOCATION:${escapeText(input.location)}`)
  if (input.description)
    lines.push(`DESCRIPTION:${escapeText(input.description)}`)
  if (input.url) lines.push(`URL:${input.url}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return `${lines.map(fold).join('\r\n')}\r\n`
}
