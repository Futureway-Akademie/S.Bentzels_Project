import type {
  Registration,
  Submission,
} from '../../../supabase/functions/_shared/schemas'

/**
 * Sendet eine geprüfte Anfrage an die Edge Function „submit-inquiry“ (Speicherung, E-Mails,
 * Spamschutz). Wirft bei jeder Störung, damit die Oberfläche die Ausweichmöglichkeit zeigt.
 */
export async function submitInquiry(data: Submission): Promise<void> {
  const { supabase } = await import('../supabase')
  if (!supabase) throw new Error('Supabase ist nicht eingerichtet')
  const { data: result, error } = await supabase.functions.invoke(
    'submit-inquiry',
    { body: data },
  )
  if (error) throw error
  if (!result || (result as { ok?: boolean }).ok !== true)
    throw new Error('Die Anfrage wurde nicht angenommen')
}

export type RegistrationOutcome = 'angemeldet' | 'warteliste'

/** Fehler der Anmeldung mit dem Code des Servers (closed, duplicate, rate_limited, ...). */
export class RegistrationError extends Error {
  code: string
  constructor(code: string) {
    super(`Anmeldung abgelehnt: ${code}`)
    this.code = code
  }
}

async function errorCode(error: unknown): Promise<string | null> {
  const response = (error as { context?: Response } | null)?.context
  if (!response || typeof response.json !== 'function') return null
  try {
    const body = (await response.json()) as { error?: string }
    return typeof body.error === 'string' ? body.error : null
  } catch {
    return null
  }
}

/**
 * Meldet zu einer Veranstaltung an (Edge Function „register-event“). Die Kapazität prüft der
 * Server. Das Ergebnis sagt, ob die Person angemeldet ist oder auf der Warteliste steht.
 */
export async function submitRegistration(
  data: Registration,
): Promise<RegistrationOutcome> {
  const { supabase } = await import('../supabase')
  if (!supabase) throw new Error('Supabase ist nicht eingerichtet')
  const { data: result, error } = await supabase.functions.invoke(
    'register-event',
    { body: data },
  )
  if (error) {
    const code = await errorCode(error)
    throw code ? new RegistrationError(code) : error
  }
  const outcome = (
    result as { ok?: boolean; registration?: RegistrationOutcome } | null
  )?.registration
  if (!result || (result as { ok?: boolean }).ok !== true || !outcome)
    throw new Error('Die Anmeldung wurde nicht angenommen')
  return outcome
}

export type CancelOutcome = 'cancelled' | 'already_cancelled'

/** Storniert eine Anmeldung über das Token aus dem Link (Edge Function „cancel-registration“). */
export async function cancelRegistration(
  token: string,
): Promise<CancelOutcome> {
  const { supabase } = await import('../supabase')
  if (!supabase) throw new Error('Supabase ist nicht eingerichtet')
  const { data: result, error } = await supabase.functions.invoke(
    'cancel-registration',
    { body: { token } },
  )
  if (error) {
    const code = await errorCode(error)
    throw code ? new RegistrationError(code) : error
  }
  const outcome = (result as { result?: CancelOutcome } | null)?.result
  if (outcome !== 'cancelled' && outcome !== 'already_cancelled')
    throw new Error('Die Stornierung wurde nicht angenommen')
  return outcome
}
