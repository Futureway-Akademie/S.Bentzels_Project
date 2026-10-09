// Edge Function „sitemap“: erzeugt die Sitemap (XML) aus den veröffentlichten Inhalten.
// Öffentlich aufrufbar (ohne Anmeldung), Deploy mit --no-verify-jwt. Optional: SITE_URL.
import {
  buildSitemap,
  detailEntries,
  STATIC_PATHS,
} from '../_shared/sitemap.ts'
import { env, serviceClient } from '../_runtime/runtime.ts'

Deno.serve(async (request) => {
  if (request.method !== 'GET' && request.method !== 'HEAD')
    return new Response('method', { status: 405 })
  const db = serviceClient()
  const [artworks, posts, events] = await Promise.all([
    db.from('artworks_public').select('slug'),
    db.from('posts').select('slug, updated_at').eq('is_published', true),
    db.from('events_public').select('slug'),
  ])
  const failed = artworks.error ?? posts.error ?? events.error
  if (failed) {
    console.error('Sitemap fehlgeschlagen', failed.message)
    return new Response('server', { status: 500 })
  }
  const xml = buildSitemap(
    env('SITE_URL', 'https://www.sturmfederprojects.de'),
    [
      ...STATIC_PATHS.map((path) => ({ path })),
      ...detailEntries('/galerie', artworks.data ?? []),
      ...detailEntries('/journal', posts.data ?? []),
      ...detailEntries('/veranstaltungen', events.data ?? []),
    ],
  )
  return new Response(request.method === 'HEAD' ? null : xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
})
