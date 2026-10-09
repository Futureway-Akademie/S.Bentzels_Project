// Spamschutz ohne Cookies und ohne externe Dienste (reine Funktionen).
// Köderfeld, Mindestausfüllzeit und Begrenzung der Eingänge je Absender.

export const MIN_FILL_MS = 3000
/** Höchstens so viele Anfragen je Zeitfenster und Absender. */
export const RATE_LIMIT = 5
export const RATE_WINDOW_MS = 60 * 60 * 1000

export type SpamVerdict = 'ok' | 'honeypot' | 'too_fast' | 'bad_time'

/**
 * Prüft Köderfeld und Ausfüllzeit. `startedAt` kommt vom Browser. Eine Zeit in der Zukunft oder
 * älter als ein Tag gilt als ungültig. Spam wird stillschweigend verworfen, damit Programme
 * keinen Hinweis erhalten.
 */
export function checkSpam(
  input: { website?: string | undefined; startedAt: number },
  now: number,
): SpamVerdict {
  if (input.website && input.website.trim() !== '') return 'honeypot'
  const elapsed = now - input.startedAt
  if (elapsed < 0 || elapsed > 24 * 60 * 60 * 1000) return 'bad_time'
  if (elapsed < MIN_FILL_MS) return 'too_fast'
  return 'ok'
}

export type RateState = { count: number; windowStart: number }

/** Neuer Zustand nach einer Anfrage: Zähler erhöht oder, nach Ablauf des Fensters, neu begonnen. */
export function nextRateState(
  previous: RateState | null,
  now: number,
): RateState {
  if (!previous || now - previous.windowStart >= RATE_WINDOW_MS)
    return { count: 1, windowStart: now }
  return { count: previous.count + 1, windowStart: previous.windowStart }
}

/** Ob diese Anfrage das Limit überschreitet (die erste über dem Limit wird abgelehnt). */
export function isRateLimited(state: RateState): boolean {
  return state.count > RATE_LIMIT
}

/** Anonymer Schlüssel je Absender: Hash aus Adresse und Salz, die Adresse selbst wird nie gespeichert. */
export async function senderKey(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
