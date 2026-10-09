// Edge Function „register-event“: verbindliche Anmeldung zu einer Veranstaltung.
// Die Kapazitätsprüfung geschieht atomar in der Datenbankfunktion register_for_event
// (Migration 0007). Secrets: RESEND_API_KEY, IP_SALT, TOKEN_SECRET (Stornierungslinks).
// Optional: NOTIFY_TO, MAIL_FROM, SITE_NAME, SITE_URL, ALLOWED_ORIGIN.
import {
  handleRegistration,
  type RegistrationDeps,
} from '../_shared/registration.ts'
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
  const deps: RegistrationDeps = {
    now: () => Date.now(),
    senderKey: await requestSenderKey(request),
    rates: rateStore(db),
    data: {
      async register(input) {
        const { data, error } = await db
          .rpc('register_for_event', {
            p_event: input.eventId,
            p_name: input.name,
            p_email: input.email,
            p_phone: input.phone ?? '',
            p_company: input.company ?? '',
            p_guests: input.guests,
          })
          .single()
        if (error) throw new Error(error.message)
        const row = data as {
          registration_id: string
          cancel_key: string
          status: 'angemeldet' | 'warteliste'
          seats_left: number | null
        }
        return {
          registrationId: row.registration_id,
          cancelKey: row.cancel_key,
          status: row.status,
          seatsLeft: row.seats_left,
        }
      },
      async findEvent(id) {
        const { data } = await db
          .from('events')
          .select(
            'title_de, slug, starts_at, ends_at, location_name, location_address',
          )
          .eq('id', id)
          .maybeSingle()
        if (!data) return null
        return {
          title: data.title_de,
          slug: data.slug,
          startsAt: data.starts_at,
          endsAt: data.ends_at,
          location: data.location_name,
          address: data.location_address,
        }
      },
    },
    mail: { send: sendMail },
    config: {
      notifyTo: env('NOTIFY_TO', 'stephan.bentzel@viqua.de'),
      siteName: env('SITE_NAME', 'Stephan Graf Bentzel-Sturmfeder'),
      siteUrl: env('SITE_URL', 'https://bentzel-sturmfeder.de'),
      tokenSecret: env('TOKEN_SECRET', 'ohne-geheimnis'),
    },
    log: (message, detail) => console.error(message, detail),
  }

  try {
    const result = await handleRegistration(raw, deps)
    return respond(result.status, result.body)
  } catch (error) {
    console.error('Anmeldung fehlgeschlagen', String(error))
    return respond(500, { ok: false, error: 'server' })
  }
})
