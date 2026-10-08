// Prüft das Datenbankschema (supabase/migrations) lokal gegen eine echte PostgreSQL-Datenbank
// (PGlite) ohne Supabase-Konto. Rollen und auth-Funktionen werden nachgebaut.
//
// Ausführen: node supabase/tests/schema.test.mjs
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const here = dirname(fileURLToPath(import.meta.url))
const migrations = ['0001_schema.sql', '0002_storage.sql'].map((file) =>
  readFileSync(join(here, '..', 'migrations', file), 'utf8'),
)

const ADMIN = '00000000-0000-0000-0000-0000000000a1'
const USER = '00000000-0000-0000-0000-0000000000b2'

const db = new PGlite()
let passed = 0
const failures = []

// Nachbau der Supabase-Umgebung: Rollen, auth-Schema, Standardrechte.
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public, auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

  -- Nachbau des Supabase-Speichers (nur die für die Regeln relevanten Teile)
  create schema storage;
  create table storage.buckets (
    id text primary key, name text not null, public boolean not null default false,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null,
    created_at timestamptz not null default now()
  );
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated, service_role;
  grant all on storage.objects, storage.buckets to anon, authenticated, service_role;
`)
for (const migration of migrations) await db.exec(migration)

async function as(role, sub, fn) {
  await db.exec(`reset role; set role ${role}`)
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [sub ?? ''])
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}

async function check(name, fn) {
  try {
    await fn()
    passed += 1
  } catch (error) {
    failures.push(`${name}: ${error.message}`)
  }
}

function equal(actual, expected, what) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${what}: erwartet ${JSON.stringify(expected)}, erhalten ${JSON.stringify(actual)}`)
  }
}

async function denied(fn) {
  try {
    await fn()
  } catch {
    return
  }
  throw new Error('hätte abgelehnt werden müssen')
}

const count = async (sql, params = []) => Number((await db.query(sql, params)).rows[0].n)

// Testdaten als Eigentümer (umgeht RLS)
await db.exec(`
  insert into auth.users (id) values ('${ADMIN}'), ('${USER}');
  insert into public.admins (user_id) values ('${ADMIN}');

  insert into public.artworks (id, slug, main_image_url, image_width, image_height, is_published, title_de, price_eur, year, status, technique_de, height_cm, width_cm, description_de)
    values ('11111111-1111-1111-1111-111111111111', 'sichtbar', 'a.webp', 100, 100, true, 'Sichtbar', 3240, 2016, 'verfuegbar', 'Öl', 140, 150, 'Text');
  insert into public.artworks (id, slug, main_image_url, image_width, image_height, is_published)
    values ('22222222-2222-2222-2222-222222222222', 'nur-bild', 'b.webp', 60, 80, true);
  insert into public.artworks (id, slug, main_image_url, image_width, image_height, is_published, title_de)
    values ('33333333-3333-3333-3333-333333333333', 'entwurf', 'c.webp', 10, 10, false, 'Entwurf');
  insert into public.artworks (id, slug, main_image_url, image_width, image_height, is_published, archived_at, title_de)
    values ('44444444-4444-4444-4444-444444444444', 'archiviert', 'd.webp', 10, 10, true, now(), 'Archiviert');

  insert into public.artwork_images (artwork_id, image_url) values
    ('11111111-1111-1111-1111-111111111111', 'detail-1.webp'),
    ('33333333-3333-3333-3333-333333333333', 'detail-entwurf.webp');

  insert into public.events (id, slug, title_de, starts_at, ends_at, is_published, capacity)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'oeffentlich', 'Öffentlich', now(), now() + interval '2 hours', true, 20);
  insert into public.events (id, slug, title_de, starts_at, ends_at, is_published, capacity)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'intern', 'Intern', now(), now() + interval '2 hours', false, 20);
  insert into public.event_photos (event_id, image_url) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'p1.webp'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'p2.webp');
  insert into public.registrations (event_id, name, email) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gast', 'gast@example.com');

  insert into public.posts (slug, title_de, status, published_at) values
    ('veroeffentlicht', 'A', 'veroeffentlicht', now() - interval '1 day'),
    ('entwurf', 'B', 'entwurf', null),
    ('zukunft', 'C', 'veroeffentlicht', now() + interval '10 days');
  insert into public.courses (title_de, starts_at, ends_at, is_published) values ('K1', now(), now(), true), ('K2', now(), now(), false);
  insert into public.vita_entries (year, category, title_de, is_published) values (2003, 'ausbildung', 'V1', true), (2004, 'messe', 'V2', false);
  insert into public.press_items (title_de, external_url, is_published) values ('P1', 'https://example.com', true), ('P2', 'https://example.com', false);
  insert into public.curated_links (url, is_published) values ('https://example.com/a', true), ('https://example.com/b', false);
  insert into public.inquiries (type, name, email) values ('kontakt', 'Alt', 'alt@example.com');
`)

// Alle Tabellen besitzen Row Level Security
await check('RLS auf allen Tabellen', async () => {
  const rows = (
    await db.query(
      `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    )
  ).rows
  equal(rows, [], 'Tabellen ohne RLS')
})

// ----- Öffentlich (anon)
await check('anon: Werktabelle gesperrt', () =>
  as('anon', null, async () => equal(await count('select count(*) n from public.artworks'), 0, 'Zeilen')),
)
await check('anon: artworks_public zeigt nur veröffentlichte, nicht archivierte Werke', () =>
  as('anon', null, async () => {
    const rows = (await db.query('select slug from public.artworks_public order by slug')).rows.map((r) => r.slug)
    equal(rows, ['nur-bild', 'sichtbar'], 'Werke')
  }),
)
await check('anon: Werk nur mit Bild ist lesbar, ohne Pflichtangaben', () =>
  as('anon', null, async () => {
    const row = (await db.query(`select title_de, price_eur, year from public.artworks_public where slug = 'nur-bild'`)).rows[0]
    equal(row, { title_de: null, price_eur: null, year: null }, 'Werk')
  }),
)
await check('anon: Werkdetailbilder nur öffentlicher Werke', () =>
  as('anon', null, async () => equal(await count('select count(*) n from public.artwork_images'), 1, 'Bilder')),
)
await check('anon: Veranstaltungen und Fotos nur veröffentlichter', () =>
  as('anon', null, async () => {
    equal(await count('select count(*) n from public.events'), 1, 'Veranstaltungen')
    equal(await count('select count(*) n from public.event_photos'), 1, 'Fotos')
  }),
)
await check('anon: Journal, Kurse, Vita, Presse, Links nur veröffentlicht', () =>
  as('anon', null, async () => {
    equal(await count('select count(*) n from public.posts'), 1, 'Beiträge (Entwurf und Zukunft verborgen)')
    equal(await count('select count(*) n from public.courses'), 1, 'Kurse')
    equal(await count('select count(*) n from public.vita_entries'), 1, 'Vita')
    equal(await count('select count(*) n from public.press_items'), 1, 'Presse')
    equal(await count('select count(*) n from public.curated_links'), 1, 'Links')
  }),
)
await check('anon: Einstellungen lesbar, aber nicht änderbar', () =>
  as('anon', null, async () => {
    equal(await count(`select count(*) n from public.site_settings where key = 'gallery_visibility'`), 1, 'Einstellung')
    const result = await db.query(`update public.site_settings set value = '{}'::jsonb`)
    equal(result.affectedRows, 0, 'geänderte Zeilen')
  }),
)
await check('anon: Anfrage einfügen erlaubt, Lesen verboten', () =>
  as('anon', null, async () => {
    await db.query(`insert into public.inquiries (type, name, email, message) values ('kontakt', 'Max', 'max@example.com', 'Hallo')`)
    equal(await count('select count(*) n from public.inquiries'), 0, 'lesbare Anfragen')
  }),
)
await check('anon: Anfrage mit fremdem Status oder leerem Namen abgelehnt', () =>
  as('anon', null, async () => {
    await denied(() => db.query(`insert into public.inquiries (type, name, email, status) values ('kontakt', 'Max', 'max@example.com', 'erledigt')`))
    await denied(() => db.query(`insert into public.inquiries (type, name, email) values ('kontakt', '', 'max@example.com')`))
    await denied(() => db.query(`insert into public.inquiries (type, name, email) values ('unbekannt', 'Max', 'max@example.com')`))
  }),
)
await check('anon: Anmeldungen weder lesbar noch einfügbar', () =>
  as('anon', null, async () => {
    equal(await count('select count(*) n from public.registrations'), 0, 'lesbare Anmeldungen')
    await denied(() => db.query(`insert into public.registrations (event_id, name, email) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'X', 'x@example.com')`))
  }),
)
await check('anon: kein Schreiben auf Inhalte, keine Admin-Rechte', () =>
  as('anon', null, async () => {
    await denied(() => db.query(`insert into public.artworks (main_image_url, image_width, image_height) values ('x.webp', 1, 1)`))
    await denied(() => db.query(`insert into public.admins (user_id) values ('${USER}')`))
    equal((await db.query('select public.is_admin() a')).rows[0].a, false, 'is_admin')
    equal((await db.query(`delete from public.events`)).affectedRows, 0, 'gelöschte Zeilen')
  }),
)
await check('anon: Statistik zählt nur öffentliche Werke und gültige Ereignisse, ist nicht lesbar', () =>
  as('anon', null, async () => {
    await db.query(`select public.track_artwork_event('11111111-1111-1111-1111-111111111111', 'view')`)
    await db.query(`select public.track_artwork_event('11111111-1111-1111-1111-111111111111', 'view')`)
    await db.query(`select public.track_artwork_event('11111111-1111-1111-1111-111111111111', 'lightbox')`)
    await db.query(`select public.track_artwork_event('33333333-3333-3333-3333-333333333333', 'view')`)
    await db.query(`select public.track_artwork_event('11111111-1111-1111-1111-111111111111', 'unsinn')`)
    equal(await count('select count(*) n from public.artwork_stats'), 0, 'lesbare Statistik')
  }),
)

// ----- Eingeloggt, aber kein Admin
await check('Nutzer ohne Admin-Recht: keine Schreib- und Leserechte auf Verwaltungsdaten', () =>
  as('authenticated', USER, async () => {
    equal((await db.query('select public.is_admin() a')).rows[0].a, false, 'is_admin')
    equal(await count('select count(*) n from public.admins'), 0, 'sichtbare Admin-Einträge')
    equal(await count('select count(*) n from public.inquiries'), 0, 'sichtbare Anfragen')
    equal(await count('select count(*) n from public.registrations'), 0, 'sichtbare Anmeldungen')
    equal(await count('select count(*) n from public.artworks'), 0, 'sichtbare Werke (Tabelle)')
    await denied(() => db.query(`insert into public.artworks (main_image_url, image_width, image_height) values ('x.webp', 1, 1)`))
    await denied(() => db.query(`insert into public.admins (user_id) values ('${USER}')`))
  }),
)

// ----- Admin
await check('Admin: Werk nur mit Bild anlegen, Adresse entsteht automatisch', () =>
  as('authenticated', ADMIN, async () => {
    const row = (
      await db.query(`insert into public.artworks (main_image_url, image_width, image_height) values ('neu.webp', 800, 600) returning slug, is_published, status, price_eur`)
    ).rows[0]
    equal(row.slug.startsWith('werk-'), true, 'Slug beginnt mit werk-')
    equal({ p: row.is_published, s: row.status, pr: row.price_eur }, { p: false, s: null, pr: null }, 'Standardwerte')
  }),
)
await check('Admin: liest und ändert Anfragen, sieht Anmeldungen und Statistik, kennt sich selbst', () =>
  as('authenticated', ADMIN, async () => {
    equal((await db.query('select public.is_admin() a')).rows[0].a, true, 'is_admin')
    equal(await count('select count(*) n from public.inquiries'), 2, 'Anfragen')
    const updated = await db.query(`update public.inquiries set status = 'beantwortet' where name = 'Alt'`)
    equal(updated.affectedRows, 1, 'aktualisierte Anfragen')
    equal(await count('select count(*) n from public.registrations'), 1, 'Anmeldungen')
    const stats = (await db.query(`select views, lightbox_opens from public.artwork_stats where artwork_id = '11111111-1111-1111-1111-111111111111'`)).rows[0]
    equal(stats, { views: 2, lightbox_opens: 1 }, 'Zähler')
    equal(await count('select count(*) n from public.artwork_stats'), 1, 'Statistikzeilen (Entwurf und ungültiges Ereignis nicht gezählt)')
    equal(await count('select count(*) n from public.admins'), 1, 'eigener Admin-Eintrag')
  }),
)
await check('Admin: darf sich nicht selbst weitere Admins anlegen', () =>
  as('authenticated', ADMIN, () => denied(() => db.query(`insert into public.admins (user_id) values ('${USER}')`))),
)
await check('Admin: Sichtbarkeitsschalter blenden aus und wieder ein, Daten bleiben erhalten', async () => {
  await as('authenticated', ADMIN, async () => {
    await db.query(`update public.site_settings set value = jsonb_set(value, '{price}', 'false') where key = 'gallery_visibility'`)
    await db.query(`update public.site_settings set value = jsonb_set(value, '{year}', 'false') where key = 'gallery_visibility'`)
  })
  await as('anon', null, async () => {
    const row = (await db.query(`select price_eur, year, title_de, technique_de from public.artworks_public where slug = 'sichtbar'`)).rows[0]
    equal(row, { price_eur: null, year: null, title_de: 'Sichtbar', technique_de: 'Öl' }, 'öffentliche Sicht bei Preis AUS und Jahr AUS')
  })
  await as('authenticated', ADMIN, async () => {
    const row = (await db.query(`select price_eur, year from public.artworks where slug = 'sichtbar'`)).rows[0]
    equal(row, { price_eur: '3240', year: 2016 }, 'gespeicherte Daten unverändert')
    await db.query(`update public.site_settings set value = jsonb_set(jsonb_set(value, '{price}', 'true'), '{year}', 'true') where key = 'gallery_visibility'`)
  })
  await as('anon', null, async () => {
    const row = (await db.query(`select price_eur, year from public.artworks_public where slug = 'sichtbar'`)).rows[0]
    equal(row, { price_eur: '3240', year: 2016 }, 'wieder sichtbar')
  })
})
await check('Alle Schalter: Maße, Technik, Verfügbarkeit, Beschreibung lassen sich ausblenden', async () => {
  await db.exec(`update public.site_settings set value = '{"price":true,"dimensions":false,"technique":false,"year":true,"availability":false,"description":false}'::jsonb where key = 'gallery_visibility'`)
  await as('anon', null, async () => {
    const row = (
      await db.query(`select height_cm, width_cm, technique_de, support_de, status, description_de from public.artworks_public where slug = 'sichtbar'`)
    ).rows[0]
    equal(Object.values(row).every((v) => v === null), true, 'ausgeblendete Felder')
  })
  await db.exec(`update public.site_settings set value = '{"price":true,"dimensions":true,"technique":true,"year":true,"availability":true,"description":true}'::jsonb where key = 'gallery_visibility'`)
})

// ----- Datenregeln
await check('Presse: Datei oder Link genügt, weder noch wird abgelehnt', () =>
  as('authenticated', ADMIN, async () => {
    await db.query(`insert into public.press_items (file_url, file_type) values ('scan.pdf', 'pdf')`)
    await db.query(`insert into public.press_items (external_url) values ('https://example.com/nur-link')`)
    await denied(() => db.query(`insert into public.press_items (title_de) values ('ohne Datei und Link')`))
    await denied(() => db.query(`insert into public.press_items (file_url) values ('scan-ohne-typ.pdf')`))
  }),
)
await check('Wertebereiche: Status, Jahr, Maße, Kategorie', () =>
  as('authenticated', ADMIN, async () => {
    await denied(() => db.query(`insert into public.artworks (main_image_url, image_width, image_height, status) values ('x', 1, 1, 'unbekannt')`))
    await denied(() => db.query(`insert into public.artworks (main_image_url, image_width, image_height, year) values ('x', 1, 1, 20)`))
    await denied(() => db.query(`insert into public.artworks (main_image_url, image_width, image_height, height_cm) values ('x', 1, 1, -5)`))
    await denied(() => db.query(`insert into public.vita_entries (year, category, title_de) values (2000, 'sonstiges', 'X')`))
    await denied(() => db.query(`insert into public.events (slug, title_de, starts_at, ends_at) values ('rueckwaerts', 'X', now(), now() - interval '1 day')`))
  }),
)
await check('updated_at wird beim Ändern aktualisiert', async () => {
  const before = (await db.query(`select updated_at from public.artworks where slug = 'sichtbar'`)).rows[0].updated_at
  await new Promise((r) => setTimeout(r, 20))
  await db.query(`update public.artworks set title_de = 'Sichtbar 2' where slug = 'sichtbar'`)
  const after = (await db.query(`select updated_at from public.artworks where slug = 'sichtbar'`)).rows[0].updated_at
  equal(new Date(after) > new Date(before), true, 'updated_at neuer')
})
await check('Anfrage-Werk-Verknüpfung bleibt beim Löschen des Werks als leere Verknüpfung erhalten', async () => {
  await db.exec(`insert into public.inquiries (type, name, email, artwork_id) values ('werk', 'W', 'w@example.com', '44444444-4444-4444-4444-444444444444')`)
  await db.exec(`delete from public.artworks where id = '44444444-4444-4444-4444-444444444444'`)
  const row = (await db.query(`select artwork_id from public.inquiries where name = 'W'`)).rows[0]
  equal(row.artwork_id, null, 'artwork_id')
})

// ----- Speicher (0002_storage.sql)
await check('Speicher: fünf öffentliche Buckets, PDF nur im Presse-Bucket', async () => {
  const rows = (await db.query(`select id, public, allowed_mime_types from storage.buckets order by id`)).rows
  equal(rows.map((r) => r.id), ['artworks', 'events', 'people', 'posts', 'press'], 'Buckets')
  equal(rows.every((r) => r.public), true, 'alle öffentlich')
  equal(rows.filter((r) => r.allowed_mime_types.includes('application/pdf')).map((r) => r.id), ['press'], 'PDF erlaubt in')
  equal(rows.every((r) => !r.allowed_mime_types.includes('text/html') && !r.allowed_mime_types.includes('image/svg+xml')), true, 'kein HTML oder SVG')
})
await check('Speicher: Admin lädt hoch, liest, ersetzt und löscht', () =>
  as('authenticated', ADMIN, async () => {
    await db.query(`insert into storage.objects (bucket_id, name) values ('artworks', 'w1/a.webp')`)
    await db.query(`insert into storage.objects (bucket_id, name) values ('press', 'p1/b.pdf')`)
    equal(await count('select count(*) n from storage.objects'), 2, 'sichtbare Dateien')
    equal((await db.query(`update storage.objects set name = 'w1/a2.webp' where name = 'w1/a.webp'`)).affectedRows, 1, 'ersetzt')
    equal((await db.query(`delete from storage.objects where bucket_id = 'artworks'`)).affectedRows, 1, 'gelöscht')
  }),
)
await check('Speicher: Besucher und Nutzer ohne Admin-Recht dürfen weder hochladen noch lesen noch löschen', async () => {
  for (const [role, sub] of [['anon', null], ['authenticated', USER]]) {
    await as(role, sub, async () => {
      await denied(() => db.query(`insert into storage.objects (bucket_id, name) values ('artworks', 'x/evil.webp')`))
      equal(await count('select count(*) n from storage.objects'), 0, `${role}: sichtbare Dateien`)
      equal((await db.query(`delete from storage.objects`)).affectedRows, 0, `${role}: gelöschte Dateien`)
      equal((await db.query(`update storage.objects set name = 'x'`)).affectedRows, 0, `${role}: geänderte Dateien`)
    })
  }
})
await check('Speicher: Admin darf nicht in fremde Buckets schreiben', async () => {
  await db.exec(`insert into storage.buckets (id, name) values ('privat', 'privat')`)
  await as('authenticated', ADMIN, () =>
    denied(() => db.query(`insert into storage.objects (bucket_id, name) values ('privat', 'x.webp')`)),
  )
})
await check('Vorschaubilder: weitere Werkbilder und Eventfotos haben thumb_url', () =>
  as('authenticated', ADMIN, async () => {
    await db.query(`insert into public.artwork_images (artwork_id, image_url, thumb_url) values ('11111111-1111-1111-1111-111111111111', 'b.webp', 'b-800.webp')`)
    await db.query(`insert into public.event_photos (event_id, image_url, thumb_url) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'p.webp', 'p-800.webp')`)
  }),
)

// ----- Was das Dashboard der Datenbank abverlangt (task-17)
await check('Dashboard: Werk mit fester Kennung nur aus Bild anlegen, Ausschnitt speichern, doppelte Adresse abgelehnt', () =>
  as('authenticated', ADMIN, async () => {
    const id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    await db.query(
      `insert into public.artworks (id, main_image_url, image_width, image_height, thumb_url, is_published, sort_order) values ($1, 'neu.webp', 2400, 1600, 'neu-800.webp', true, 99)`,
      [id],
    )
    await db.query(`update public.artworks set thumb_crop = $2::jsonb, slug = 'mein-werk', title_de = 'Mein Werk' where id = $1`, [
      id,
      JSON.stringify({ x: 0.1, y: 0, width: 0.5, height: 1 }),
    ])
    const row = (await db.query(`select thumb_crop, slug from public.artworks where id = $1`, [id])).rows[0]
    equal(row, { thumb_crop: { x: 0.1, y: 0, width: 0.5, height: 1 }, slug: 'mein-werk' }, 'Ausschnitt und Adresse')
    await denied(() =>
      db.query(`insert into public.artworks (main_image_url, image_width, image_height, slug) values ('x.webp', 1, 1, 'mein-werk')`),
    )
    const like = (await db.query(`select slug from public.artworks where slug like 'mein-%' and id <> $1`, [id])).rows
    equal(like, [], 'andere Werke mit ähnlicher Adresse')
  }),
)
await check('Dashboard: Archivieren blendet öffentlich aus, Löschen entfernt Bilder und Statistik mit', async () => {
  const id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  await as('authenticated', ADMIN, async () => {
    await db.query(`insert into public.artwork_images (artwork_id, image_url, thumb_url) values ($1, 'z.webp', 'z-800.webp')`, [id])
    await db.query(`update public.artworks set archived_at = now() where id = $1`, [id])
  })
  await as('anon', null, async () => {
    equal(await count(`select count(*) n from public.artworks_public where slug = 'mein-werk'`), 0, 'archiviertes Werk öffentlich')
    equal(await count(`select count(*) n from public.artwork_images where image_url = 'z.webp'`), 0, 'Bild archivierten Werks öffentlich')
  })
  await as('authenticated', ADMIN, async () => {
    await db.query(`delete from public.artworks where id = $1`, [id])
    equal(await count(`select count(*) n from public.artwork_images where artwork_id = $1`, [id]), 0, 'übrige Bilder')
  })
})
await check('Dashboard: Reihenfolge der Werke lässt sich einzeln ändern', () =>
  as('authenticated', ADMIN, async () => {
    const result = await db.query(`update public.artworks set sort_order = 42 where slug = 'sichtbar'`)
    equal(result.affectedRows, 1, 'geänderte Zeilen')
  }),
)

console.log(`${passed} Prüfungen bestanden, ${failures.length} fehlgeschlagen`)
for (const failure of failures) console.log(`  FEHLER: ${failure}`)
process.exit(failures.length === 0 ? 0 : 1)
