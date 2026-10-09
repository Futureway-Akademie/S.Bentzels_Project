// Edge Function „cancel-registration“: Stornierung über den persönlichen Link aus der E-Mail.
// Die Datenbankfunktion cancel_registration (Migration 0008) storniert und lässt die Warteliste
// nachrücken. Secrets: RESEND_API_KEY, IP_SALT, TOKEN_SECRET (derselbe Wert wie bei register-event).
// Optional: NOTIFY_TO, MAIL_FROM, SITE_NAME, SITE_URL, ALLOWED_ORIGIN.
import {
  handleCancellation,
  type CancellationDeps,
} from '../_shared/cancellation.ts'
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
  const deps: CancellationDeps = {
    now: () => Date.now(),
    senderKey: await requestSenderKey(request),
    rates: rateStore(db),
    data: {
      async cancel(cancelKey) {
        const { data, error } = await db.rpc('cancel_registration', {
          p_cancel_key: cancelKey,
        })
        if (error) throw new Error(error.message)
        const rows = (data ?? []) as {
          outcome: 'cancelled' | 'already_cancelled' | 'unknown'
          event_id: string | null
          cancelled_name: string | null
          cancelled_email: string | null
          cancelled_status: string | null
          promoted_id: string | null
          promoted_name: string | null
          promoted_email: string | null
          promoted_guests: number | null
          promoted_cancel_key: string | null
        }[]
        const first = rows[0]
        if (!first || first.outcome === 'unknown') return { outcome: 'unknown' }
        if (first.outcome === 'already_cancelled')
          return { outcome: 'already_cancelled' }
        return {
          outcome: 'cancelled',
          eventId: first.event_id as string,
          name: first.cancelled_name as string,
          email: first.cancelled_email as string,
          status: first.cancelled_status as string,
          promoted: rows
            .filter((row) => row.promoted_id)
            .map((row) => ({
              id: row.promoted_id as string,
              name: row.promoted_name as string,
              email: row.promoted_email as string,
              guests: row.promoted_guests ?? 0,
              cancelKey: row.promoted_cancel_key as string,
            })),
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
    const result = await handleCancellation(raw, deps)
    return respond(result.status, result.body)
  } catch (error) {
    console.error('Stornierung fehlgeschlagen', String(error))
    return respond(500, { ok: false, error: 'server' })
  }
})
