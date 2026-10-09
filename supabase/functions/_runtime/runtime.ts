// Gemeinsame Bausteine der Edge Functions (nur Deno): Umgebung, CORS, Datenbank-Client,
// Begrenzung je Absender und E-Mail-Versand über Resend. Die Geschäftslogik steht in ../_shared.
import { createClient } from 'npm:@supabase/supabase-js@2'
import type { Mail } from '../_shared/emails.ts'
import { senderKey } from '../_shared/spam.ts'

export const env = (name: string, fallback = ''): string =>
  Deno.env.get(name) ?? fallback

const cors = {
  'Access-Control-Allow-Origin': env('ALLOWED_ORIGIN', '*'),
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const respond = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

/** Beantwortet Vorabfragen und falsche Methoden, liefert sonst null. */
export function preflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST')
    return respond(405, { ok: false, error: 'method' })
  return null
}

export function serviceClient() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })
}

export type Db = ReturnType<typeof serviceClient>

/** Anonymer Schlüssel des Absenders: Hash aus Adresse und Salz. */
export async function requestSenderKey(request: Request): Promise<string> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unbekannt'
  return senderKey(ip, env('IP_SALT', 'ohne-salz'))
}

export const rateStore = (db: Db) => ({
  async get(key: string) {
    const { data } = await db
      .from('rate_limits')
      .select('count, window_start')
      .eq('key', key)
      .maybeSingle()
    return data
      ? {
          count: data.count as number,
          windowStart: new Date(data.window_start as string).getTime(),
        }
      : null
  },
  async set(key: string, state: { count: number; windowStart: number }) {
    await db.from('rate_limits').upsert({
      key,
      count: state.count,
      window_start: new Date(state.windowStart).toISOString(),
    })
  },
})

const toBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Sendet eine E-Mail über Resend. Der API-Schlüssel kommt nur aus dem Secret RESEND_API_KEY. */
export async function sendMail(mail: Mail): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env(
        'MAIL_FROM',
        'Stephan Graf Bentzel-Sturmfeder <info@bentzel-sturmfeder.de>',
      ),
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      reply_to: mail.replyTo,
      attachments: mail.attachments?.map((a) => ({
        filename: a.filename,
        content: toBase64(a.content),
        content_type: a.contentType,
      })),
    }),
  })
  if (!response.ok) throw new Error(`Resend ${response.status}`)
}
