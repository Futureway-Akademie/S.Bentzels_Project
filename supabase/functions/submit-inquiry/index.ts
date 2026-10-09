// Edge Function „submit-inquiry“: nimmt alle Anfrageformulare entgegen.
// Geheimnisse (nur als Secret, nie im Code oder Chat): RESEND_API_KEY, IP_SALT.
// Optional: NOTIFY_TO (Standard sb@jaegersburg.com), MAIL_FROM, SITE_NAME, CIRCLE_NAME, ALLOWED_ORIGIN.
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY stellt Supabase bereit.
// Einrichtung und Test: docs/SUPABASE_SETUP.md, Abschnitt „Anfragen und E-Mails“.
import { handleInquiry, type Deps } from '../_shared/inquiry.ts'
import {
  env,
  preflight,
  rateStore,
  requestSenderKey,
  respond,
  sendMail,
  serviceClient,
} from '../_runtime/runtime.ts'

Deno.serve(async (request) => {
  const early = preflight(request)
  if (early) return early

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return respond(400, { ok: false, error: 'invalid' })
  }

  const db = serviceClient()
  const deps: Deps = {
    now: () => Date.now(),
    senderKey: await requestSenderKey(request),
    rates: rateStore(db),
    data: {
      async insertInquiry(row) {
        const { error } = await db.from('inquiries').insert(row)
        if (error) throw new Error(error.message)
      },
      async findArtwork(id) {
        // Über die öffentliche Sicht, damit ausgeschaltete Angaben (z. B. der Preis) nie in E-Mails stehen
        const { data } = await db
          .from('artworks_public')
          .select(
            'title_de, main_image_url, thumb_url, height_cm, width_cm, price_eur',
          )
          .eq('id', id)
          .maybeSingle()
        if (!data) return null
        return {
          title: data.title_de,
          imageUrl: data.thumb_url ?? data.main_image_url,
          dimensions:
            data.height_cm && data.width_cm
              ? `${data.height_cm} × ${data.width_cm} cm`
              : null,
          priceEur: data.price_eur,
        }
      },
      async findEvent(id) {
        const { data } = await db
          .from('events_public')
          .select('title_de, starts_at, location_name')
          .eq('id', id)
          .maybeSingle()
        if (!data) return null
        const dateLine = data.starts_at
          ? new Intl.DateTimeFormat('de-DE', {
              dateStyle: 'long',
              timeStyle: 'short',
              timeZone: 'Europe/Berlin',
            }).format(new Date(data.starts_at))
          : null
        return { title: data.title_de, dateLine, location: data.location_name }
      },
    },
    mail: { send: sendMail },
    config: {
      notifyTo: env('NOTIFY_TO', 'sb@jaegersburg.com'),
      siteName: env('SITE_NAME', 'Stephan Graf Bentzel-Sturmfeder'),
      circleName: env('CIRCLE_NAME', 'Bentzel Club'),
    },
    log: (message, detail) => console.error(message, detail),
  }

  try {
    const result = await handleInquiry(raw, deps)
    return respond(result.status, result.body)
  } catch (error) {
    console.error('Anfrage fehlgeschlagen', String(error))
    return respond(500, { ok: false, error: 'server' })
  }
})
