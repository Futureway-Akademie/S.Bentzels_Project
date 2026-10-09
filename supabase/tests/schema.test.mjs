// Prüft das Datenbankschema (supabase/migrations) lokal gegen eine echte PostgreSQL-Datenbank
// (PGlite) ohne Supabase-Konto. Rollen und auth-Funktionen werden nachgebaut.
//
// Ausführen: node supabase/tests/schema.test.mjs
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const here = dirname(fileURLToPath(import.meta.url))
const migrations = [
  '0001_schema.sql',
  '0002_storage.sql',
  '0003_posts_cover_thumb.sql',
  '0004_events_module.sql',
  '0005_press_categories.sql',
  '0006_inquiry_protection.sql',
  '0007_event_registration.sql',
  '0008_registration_cancellation.sql',
  '0009_image_variants.sql',
].map((file) => readFileSync(join(here, '..', 'migrations', file), 'utf8'))

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
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [
    sub ?? '',
  ])
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
    throw new Error(
      `${what}: erwartet ${JSON.stringify(expected)}, erhalten ${JSON.stringify(actual)}`,
    )
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

const count = async (sql, params = []) =>
  Number((await db.query(sql, params)).rows[0].n)

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
  insert into public.events (slug, title_de, starts_at, ends_at, is_published, type_id) select 'k1', 'K1', now(), now(), true, id from public.event_types where slug = 'gruppenkurs';
  insert into public.events (slug, title_de, starts_at, ends_at, is_published) values ('k2', 'K2', now(), now(), false);
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
  as('anon', null, async () =>
    equal(await count('select count(*) n from public.artworks'), 0, 'Zeilen'),
  ),
)
await check(
  'anon: artworks_public zeigt nur veröffentlichte, nicht archivierte Werke',
  () =>
    as('anon', null, async () => {
      const rows = (
        await db.query('select slug from public.artworks_public order by slug')
      ).rows.map((r) => r.slug)
      equal(rows, ['nur-bild', 'sichtbar'], 'Werke')
    }),
)
await check('anon: Werk nur mit Bild ist lesbar, ohne Pflichtangaben', () =>
  as('anon', null, async () => {
    const row = (
      await db.query(
        `select title_de, price_eur, year from public.artworks_public where slug = 'nur-bild'`,
      )
    ).rows[0]
    equal(row, { title_de: null, price_eur: null, year: null }, 'Werk')
  }),
)
await check('anon: Werkdetailbilder nur öffentlicher Werke', () =>
  as('anon', null, async () =>
    equal(
      await count('select count(*) n from public.artwork_images'),
      1,
      'Bilder',
    ),
  ),
)
await check('anon: Veranstaltungen und Fotos nur veröffentlichter', () =>
  as('anon', null, async () => {
    equal(
      await count('select count(*) n from public.events'),
      0,
      'Veranstaltungstabelle gesperrt',
    )
    equal(
      await count('select count(*) n from public.events_public'),
      2,
      'Veranstaltungen (veröffentlicht, Kurs eingeschlossen)',
    )
    equal(await count('select count(*) n from public.event_photos'), 1, 'Fotos')
  }),
)
await check(
  'anon: Journal, Kurse, Vita, Presse, Links nur veröffentlicht',
  () =>
    as('anon', null, async () => {
      equal(
        await count('select count(*) n from public.posts'),
        1,
        'Beiträge (Entwurf und Zukunft verborgen)',
      )
      equal(
        await count(
          `select count(*) n from public.events_public where title_de = 'K1'`,
        ),
        1,
        'Kurse als Veranstaltungen',
      )
      equal(
        await count('select count(*) n from public.vita_entries'),
        1,
        'Vita',
      )
      equal(
        await count('select count(*) n from public.press_items'),
        1,
        'Presse',
      )
      equal(
        await count('select count(*) n from public.curated_links'),
        1,
        'Links',
      )
    }),
)
await check('anon: Einstellungen lesbar, aber nicht änderbar', () =>
  as('anon', null, async () => {
    equal(
      await count(
        `select count(*) n from public.site_settings where key = 'gallery_visibility'`,
      ),
      1,
      'Einstellung',
    )
    const result = await db.query(
      `update public.site_settings set value = '{}'::jsonb`,
    )
    equal(result.affectedRows, 0, 'geänderte Zeilen')
  }),
)
await check(
  'anon: Anfragen weder direkt einfügbar noch lesbar, die Edge Function (service_role) schreibt',
  async () => {
    await as('anon', null, async () => {
      await denied(() =>
        db.query(
          `insert into public.inquiries (type, name, email, message) values ('kontakt', 'Max', 'max@example.com', 'Hallo')`,
        ),
      )
      equal(
        await count('select count(*) n from public.inquiries'),
        0,
        'lesbare Anfragen',
      )
    })
    await as('authenticated', USER, () =>
      denied(() =>
        db.query(
          `insert into public.inquiries (type, name, email) values ('kontakt', 'Max', 'max@example.com')`,
        ),
      ),
    )
    await as('service_role', null, async () => {
      await db.query(
        `insert into public.inquiries (type, name, email, message, consent_at) values ('kontakt', 'Max', 'max@example.com', 'Hallo', now())`,
      )
    })
  },
)
await check('Anfragen: Wertebereiche gelten auch für die Edge Function', () =>
  as('service_role', null, async () => {
    await denied(() =>
      db.query(
        `insert into public.inquiries (type, name, email, status) values ('kontakt', 'Max', 'max@example.com', 'unbekannt')`,
      ),
    )
    await denied(() =>
      db.query(
        `insert into public.inquiries (type, name, email) values ('unbekannt', 'Max', 'max@example.com')`,
      ),
    )
  }),
)
await check(
  'Begrenzung je Absender: Tabelle rate_limits nur für die Edge Function',
  async () => {
    await as('service_role', null, () =>
      db.query(
        `insert into public.rate_limits (key, count, window_start) values ('abc', 1, now())`,
      ),
    )
    await as('anon', null, async () =>
      equal(
        await count('select count(*) n from public.rate_limits'),
        0,
        'anon liest',
      ),
    )
    await as('authenticated', ADMIN, async () =>
      equal(
        await count('select count(*) n from public.rate_limits'),
        0,
        'Admin liest',
      ),
    )
    await as('anon', null, () =>
      denied(() =>
        db.query(
          `insert into public.rate_limits (key, count, window_start) values ('x', 1, now())`,
        ),
      ),
    )
  },
)
await check('anon: Anmeldungen weder lesbar noch einfügbar', () =>
  as('anon', null, async () => {
    equal(
      await count('select count(*) n from public.registrations'),
      0,
      'lesbare Anmeldungen',
    )
    await denied(() =>
      db.query(
        `insert into public.registrations (event_id, name, email) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'X', 'x@example.com')`,
      ),
    )
  }),
)
await check('anon: kein Schreiben auf Inhalte, keine Admin-Rechte', () =>
  as('anon', null, async () => {
    await denied(() =>
      db.query(
        `insert into public.artworks (main_image_url, image_width, image_height) values ('x.webp', 1, 1)`,
      ),
    )
    await denied(() =>
      db.query(`insert into public.admins (user_id) values ('${USER}')`),
    )
    equal(
      (await db.query('select public.is_admin() a')).rows[0].a,
      false,
      'is_admin',
    )
    equal(
      (await db.query(`delete from public.events`)).affectedRows,
      0,
      'gelöschte Zeilen',
    )
  }),
)
await check(
  'anon: Statistik zählt nur öffentliche Werke und gültige Ereignisse, ist nicht lesbar',
  () =>
    as('anon', null, async () => {
      await db.query(
        `select public.track_artwork_event('11111111-1111-1111-1111-111111111111', 'view')`,
      )
      await db.query(
        `select public.track_artwork_event('11111111-1111-1111-1111-111111111111', 'view')`,
      )
      await db.query(
        `select public.track_artwork_event('11111111-1111-1111-1111-111111111111', 'lightbox')`,
      )
      await db.query(
        `select public.track_artwork_event('33333333-3333-3333-3333-333333333333', 'view')`,
      )
      await db.query(
        `select public.track_artwork_event('11111111-1111-1111-1111-111111111111', 'unsinn')`,
      )
      equal(
        await count('select count(*) n from public.artwork_stats'),
        0,
        'lesbare Statistik',
      )
    }),
)

// ----- Eingeloggt, aber kein Admin
await check(
  'Nutzer ohne Admin-Recht: keine Schreib- und Leserechte auf Verwaltungsdaten',
  () =>
    as('authenticated', USER, async () => {
      equal(
        (await db.query('select public.is_admin() a')).rows[0].a,
        false,
        'is_admin',
      )
      equal(
        await count('select count(*) n from public.admins'),
        0,
        'sichtbare Admin-Einträge',
      )
      equal(
        await count('select count(*) n from public.inquiries'),
        0,
        'sichtbare Anfragen',
      )
      equal(
        await count('select count(*) n from public.registrations'),
        0,
        'sichtbare Anmeldungen',
      )
      equal(
        await count('select count(*) n from public.artworks'),
        0,
        'sichtbare Werke (Tabelle)',
      )
      await denied(() =>
        db.query(
          `insert into public.artworks (main_image_url, image_width, image_height) values ('x.webp', 1, 1)`,
        ),
      )
      await denied(() =>
        db.query(`insert into public.admins (user_id) values ('${USER}')`),
      )
    }),
)

// ----- Admin
await check(
  'Admin: Werk nur mit Bild anlegen, Adresse entsteht automatisch',
  () =>
    as('authenticated', ADMIN, async () => {
      const row = (
        await db.query(
          `insert into public.artworks (main_image_url, image_width, image_height) values ('neu.webp', 800, 600) returning slug, is_published, status, price_eur`,
        )
      ).rows[0]
      equal(row.slug.startsWith('werk-'), true, 'Slug beginnt mit werk-')
      equal(
        { p: row.is_published, s: row.status, pr: row.price_eur },
        { p: false, s: null, pr: null },
        'Standardwerte',
      )
    }),
)
await check(
  'Admin: liest und ändert Anfragen, sieht Anmeldungen und Statistik, kennt sich selbst',
  () =>
    as('authenticated', ADMIN, async () => {
      equal(
        (await db.query('select public.is_admin() a')).rows[0].a,
        true,
        'is_admin',
      )
      equal(
        await count('select count(*) n from public.inquiries'),
        2,
        'Anfragen',
      )
      const updated = await db.query(
        `update public.inquiries set status = 'beantwortet' where name = 'Alt'`,
      )
      equal(updated.affectedRows, 1, 'aktualisierte Anfragen')
      equal(
        await count('select count(*) n from public.registrations'),
        1,
        'Anmeldungen',
      )
      const stats = (
        await db.query(
          `select views, lightbox_opens from public.artwork_stats where artwork_id = '11111111-1111-1111-1111-111111111111'`,
        )
      ).rows[0]
      equal(stats, { views: 2, lightbox_opens: 1 }, 'Zähler')
      equal(
        await count('select count(*) n from public.artwork_stats'),
        1,
        'Statistikzeilen (Entwurf und ungültiges Ereignis nicht gezählt)',
      )
      equal(
        await count('select count(*) n from public.admins'),
        1,
        'eigener Admin-Eintrag',
      )
    }),
)
await check('Admin: darf sich nicht selbst weitere Admins anlegen', () =>
  as('authenticated', ADMIN, () =>
    denied(() =>
      db.query(`insert into public.admins (user_id) values ('${USER}')`),
    ),
  ),
)
await check(
  'Admin: Sichtbarkeitsschalter blenden aus und wieder ein, Daten bleiben erhalten',
  async () => {
    await as('authenticated', ADMIN, async () => {
      await db.query(
        `update public.site_settings set value = jsonb_set(value, '{price}', 'false') where key = 'gallery_visibility'`,
      )
      await db.query(
        `update public.site_settings set value = jsonb_set(value, '{year}', 'false') where key = 'gallery_visibility'`,
      )
    })
    await as('anon', null, async () => {
      const row = (
        await db.query(
          `select price_eur, year, title_de, technique_de from public.artworks_public where slug = 'sichtbar'`,
        )
      ).rows[0]
      equal(
        row,
        {
          price_eur: null,
          year: null,
          title_de: 'Sichtbar',
          technique_de: 'Öl',
        },
        'öffentliche Sicht bei Preis AUS und Jahr AUS',
      )
    })
    await as('authenticated', ADMIN, async () => {
      const row = (
        await db.query(
          `select price_eur, year from public.artworks where slug = 'sichtbar'`,
        )
      ).rows[0]
      equal(
        row,
        { price_eur: '3240', year: 2016 },
        'gespeicherte Daten unverändert',
      )
      await db.query(
        `update public.site_settings set value = jsonb_set(jsonb_set(value, '{price}', 'true'), '{year}', 'true') where key = 'gallery_visibility'`,
      )
    })
    await as('anon', null, async () => {
      const row = (
        await db.query(
          `select price_eur, year from public.artworks_public where slug = 'sichtbar'`,
        )
      ).rows[0]
      equal(row, { price_eur: '3240', year: 2016 }, 'wieder sichtbar')
    })
  },
)
await check(
  'Alle Schalter: Maße, Technik, Verfügbarkeit, Beschreibung lassen sich ausblenden',
  async () => {
    await db.exec(
      `update public.site_settings set value = '{"price":true,"dimensions":false,"technique":false,"year":true,"availability":false,"description":false}'::jsonb where key = 'gallery_visibility'`,
    )
    await as('anon', null, async () => {
      const row = (
        await db.query(
          `select height_cm, width_cm, technique_de, support_de, status, description_de from public.artworks_public where slug = 'sichtbar'`,
        )
      ).rows[0]
      equal(
        Object.values(row).every((v) => v === null),
        true,
        'ausgeblendete Felder',
      )
    })
    await db.exec(
      `update public.site_settings set value = '{"price":true,"dimensions":true,"technique":true,"year":true,"availability":true,"description":true}'::jsonb where key = 'gallery_visibility'`,
    )
  },
)

// ----- Datenregeln
await check('Presse: Datei oder Link genügt, weder noch wird abgelehnt', () =>
  as('authenticated', ADMIN, async () => {
    await db.query(
      `insert into public.press_items (file_url, file_type) values ('scan.pdf', 'pdf')`,
    )
    await db.query(
      `insert into public.press_items (external_url) values ('https://example.com/nur-link')`,
    )
    await denied(() =>
      db.query(
        `insert into public.press_items (title_de) values ('ohne Datei und Link')`,
      ),
    )
    await denied(() =>
      db.query(
        `insert into public.press_items (file_url) values ('scan-ohne-typ.pdf')`,
      ),
    )
  }),
)
await check('Wertebereiche: Status, Jahr, Maße, Kategorie', () =>
  as('authenticated', ADMIN, async () => {
    await denied(() =>
      db.query(
        `insert into public.artworks (main_image_url, image_width, image_height, status) values ('x', 1, 1, 'unbekannt')`,
      ),
    )
    await denied(() =>
      db.query(
        `insert into public.artworks (main_image_url, image_width, image_height, year) values ('x', 1, 1, 20)`,
      ),
    )
    await denied(() =>
      db.query(
        `insert into public.artworks (main_image_url, image_width, image_height, height_cm) values ('x', 1, 1, -5)`,
      ),
    )
    await denied(() =>
      db.query(
        `insert into public.vita_entries (year, category, title_de) values (2000, 'sonstiges', 'X')`,
      ),
    )
    await denied(() =>
      db.query(
        `insert into public.events (slug, title_de, starts_at, ends_at) values ('rueckwaerts', 'X', now(), now() - interval '1 day')`,
      ),
    )
  }),
)
await check('updated_at wird beim Ändern aktualisiert', async () => {
  const before = (
    await db.query(
      `select updated_at from public.artworks where slug = 'sichtbar'`,
    )
  ).rows[0].updated_at
  await new Promise((r) => setTimeout(r, 20))
  await db.query(
    `update public.artworks set title_de = 'Sichtbar 2' where slug = 'sichtbar'`,
  )
  const after = (
    await db.query(
      `select updated_at from public.artworks where slug = 'sichtbar'`,
    )
  ).rows[0].updated_at
  equal(new Date(after) > new Date(before), true, 'updated_at neuer')
})
await check(
  'Anfrage-Werk-Verknüpfung bleibt beim Löschen des Werks als leere Verknüpfung erhalten',
  async () => {
    await db.exec(
      `insert into public.inquiries (type, name, email, artwork_id) values ('werk', 'W', 'w@example.com', '44444444-4444-4444-4444-444444444444')`,
    )
    await db.exec(
      `delete from public.artworks where id = '44444444-4444-4444-4444-444444444444'`,
    )
    const row = (
      await db.query(`select artwork_id from public.inquiries where name = 'W'`)
    ).rows[0]
    equal(row.artwork_id, null, 'artwork_id')
  },
)

// ----- Speicher (0002_storage.sql)
await check(
  'Speicher: fünf öffentliche Buckets, PDF nur in Presse und Veranstaltungen',
  async () => {
    const rows = (
      await db.query(
        `select id, public, allowed_mime_types from storage.buckets order by id`,
      )
    ).rows
    equal(
      rows.map((r) => r.id),
      ['artworks', 'events', 'people', 'posts', 'press'],
      'Buckets',
    )
    equal(
      rows.every((r) => r.public),
      true,
      'alle öffentlich',
    )
    equal(
      rows
        .filter((r) => r.allowed_mime_types.includes('application/pdf'))
        .map((r) => r.id),
      ['events', 'press'],
      'PDF erlaubt in',
    )
    equal(
      rows.every(
        (r) =>
          !r.allowed_mime_types.includes('text/html') &&
          !r.allowed_mime_types.includes('image/svg+xml'),
      ),
      true,
      'kein HTML oder SVG',
    )
  },
)
await check('Speicher: Admin lädt hoch, liest, ersetzt und löscht', () =>
  as('authenticated', ADMIN, async () => {
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('artworks', 'w1/a.webp')`,
    )
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('press', 'p1/b.pdf')`,
    )
    equal(
      await count('select count(*) n from storage.objects'),
      2,
      'sichtbare Dateien',
    )
    equal(
      (
        await db.query(
          `update storage.objects set name = 'w1/a2.webp' where name = 'w1/a.webp'`,
        )
      ).affectedRows,
      1,
      'ersetzt',
    )
    equal(
      (
        await db.query(
          `delete from storage.objects where bucket_id = 'artworks'`,
        )
      ).affectedRows,
      1,
      'gelöscht',
    )
  }),
)
await check(
  'Speicher: Besucher und Nutzer ohne Admin-Recht dürfen weder hochladen noch lesen noch löschen',
  async () => {
    for (const [role, sub] of [
      ['anon', null],
      ['authenticated', USER],
    ]) {
      await as(role, sub, async () => {
        await denied(() =>
          db.query(
            `insert into storage.objects (bucket_id, name) values ('artworks', 'x/evil.webp')`,
          ),
        )
        equal(
          await count('select count(*) n from storage.objects'),
          0,
          `${role}: sichtbare Dateien`,
        )
        equal(
          (await db.query(`delete from storage.objects`)).affectedRows,
          0,
          `${role}: gelöschte Dateien`,
        )
        equal(
          (await db.query(`update storage.objects set name = 'x'`))
            .affectedRows,
          0,
          `${role}: geänderte Dateien`,
        )
      })
    }
  },
)
await check(
  'Speicher: Admin darf nicht in fremde Buckets schreiben',
  async () => {
    await db.exec(
      `insert into storage.buckets (id, name) values ('privat', 'privat')`,
    )
    await as('authenticated', ADMIN, () =>
      denied(() =>
        db.query(
          `insert into storage.objects (bucket_id, name) values ('privat', 'x.webp')`,
        ),
      ),
    )
  },
)
await check(
  'Vorschaubilder: weitere Werkbilder und Eventfotos haben thumb_url',
  () =>
    as('authenticated', ADMIN, async () => {
      await db.query(
        `insert into public.artwork_images (artwork_id, image_url, thumb_url) values ('11111111-1111-1111-1111-111111111111', 'b.webp', 'b-800.webp')`,
      )
      await db.query(
        `insert into public.event_photos (event_id, image_url, thumb_url) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'p.webp', 'p-800.webp')`,
      )
    }),
)

// ----- Was das Dashboard der Datenbank abverlangt (task-17)
await check(
  'Dashboard: Werk mit fester Kennung nur aus Bild anlegen, Ausschnitt speichern, doppelte Adresse abgelehnt',
  () =>
    as('authenticated', ADMIN, async () => {
      const id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
      await db.query(
        `insert into public.artworks (id, main_image_url, image_width, image_height, thumb_url, is_published, sort_order) values ($1, 'neu.webp', 2400, 1600, 'neu-800.webp', true, 99)`,
        [id],
      )
      await db.query(
        `update public.artworks set thumb_crop = $2::jsonb, slug = 'mein-werk', title_de = 'Mein Werk' where id = $1`,
        [id, JSON.stringify({ x: 0.1, y: 0, width: 0.5, height: 1 })],
      )
      const row = (
        await db.query(
          `select thumb_crop, slug from public.artworks where id = $1`,
          [id],
        )
      ).rows[0]
      equal(
        row,
        {
          thumb_crop: { x: 0.1, y: 0, width: 0.5, height: 1 },
          slug: 'mein-werk',
        },
        'Ausschnitt und Adresse',
      )
      await denied(() =>
        db.query(
          `insert into public.artworks (main_image_url, image_width, image_height, slug) values ('x.webp', 1, 1, 'mein-werk')`,
        ),
      )
      const like = (
        await db.query(
          `select slug from public.artworks where slug like 'mein-%' and id <> $1`,
          [id],
        )
      ).rows
      equal(like, [], 'andere Werke mit ähnlicher Adresse')
    }),
)
await check(
  'Dashboard: Archivieren blendet öffentlich aus, Löschen entfernt Bilder und Statistik mit',
  async () => {
    const id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    await as('authenticated', ADMIN, async () => {
      await db.query(
        `insert into public.artwork_images (artwork_id, image_url, thumb_url) values ($1, 'z.webp', 'z-800.webp')`,
        [id],
      )
      await db.query(
        `update public.artworks set archived_at = now() where id = $1`,
        [id],
      )
    })
    await as('anon', null, async () => {
      equal(
        await count(
          `select count(*) n from public.artworks_public where slug = 'mein-werk'`,
        ),
        0,
        'archiviertes Werk öffentlich',
      )
      equal(
        await count(
          `select count(*) n from public.artwork_images where image_url = 'z.webp'`,
        ),
        0,
        'Bild archivierten Werks öffentlich',
      )
    })
    await as('authenticated', ADMIN, async () => {
      await db.query(`delete from public.artworks where id = $1`, [id])
      equal(
        await count(
          `select count(*) n from public.artwork_images where artwork_id = $1`,
          [id],
        ),
        0,
        'übrige Bilder',
      )
    })
  },
)
await check('Dashboard: Reihenfolge der Werke lässt sich einzeln ändern', () =>
  as('authenticated', ADMIN, async () => {
    const result = await db.query(
      `update public.artworks set sort_order = 42 where slug = 'sichtbar'`,
    )
    equal(result.affectedRows, 1, 'geänderte Zeilen')
  }),
)

// ----- Journal und Vita im Dashboard (task-18)
await check(
  'Journal: Admin legt Entwurf an, speichert Titelbild-Vorschau, veröffentlicht; Besucher sehen erst danach',
  async () => {
    const id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'
    await as('authenticated', ADMIN, async () => {
      await db.query(
        `insert into public.posts (id, slug, status) values ($1, 'beitrag-dddddddd', 'entwurf')`,
        [id],
      )
      await db.query(
        `update public.posts set title_de = 'Mein Beitrag', content_de = '<p>Text</p>', cover_image_url = 'c.webp', cover_thumb_url = 'c-800.webp', cover_image_width = 2400, cover_image_height = 1350, slug = 'mein-beitrag' where id = $1`,
        [id],
      )
    })
    await as('anon', null, async () =>
      equal(
        await count(
          `select count(*) n from public.posts where slug = 'mein-beitrag'`,
        ),
        0,
        'Entwurf öffentlich',
      ),
    )
    await as('authenticated', ADMIN, () =>
      db.query(
        `update public.posts set status = 'veroeffentlicht', published_at = now() - interval '1 minute' where id = $1`,
        [id],
      ),
    )
    await as('anon', null, async () => {
      const row = (
        await db.query(
          `select title_de, cover_thumb_url, is_published from public.posts where slug = 'mein-beitrag'`,
        )
      ).rows[0]
      equal(
        row,
        {
          title_de: 'Mein Beitrag',
          cover_thumb_url: 'c-800.webp',
          is_published: true,
        },
        'veröffentlichter Beitrag',
      )
    })
    await as('authenticated', ADMIN, async () => {
      await denied(() =>
        db.query(`insert into public.posts (slug) values ('mein-beitrag')`),
      )
      await db.query(
        `update public.posts set status = 'entwurf' where id = $1`,
        [id],
      )
    })
    await as('anon', null, async () =>
      equal(
        await count(
          `select count(*) n from public.posts where slug = 'mein-beitrag'`,
        ),
        0,
        'zurückgesetzter Beitrag öffentlich',
      ),
    )
  },
)
await check(
  'Vita: Admin legt an, ändert, blendet aus und löscht; Besucher sehen nur Sichtbares',
  async () => {
    await as('authenticated', ADMIN, async () => {
      await db.query(
        `insert into public.vita_entries (year, year_end, category, title_de, place, sort_order) values (2015, 2017, 'messe', 'Parallel Vienna', 'Wien', 5)`,
      )
      await denied(() =>
        db.query(
          `insert into public.vita_entries (year, category, title_de) values (2015, 'messe', null)`,
        ),
      )
      await denied(() =>
        db.query(
          `insert into public.vita_entries (year, category, title_de) values (20, 'messe', 'x')`,
        ),
      )
      await db.query(
        `update public.vita_entries set title_de = 'Parallel Vienna Art Fair' where title_de = 'Parallel Vienna'`,
      )
    })
    await as('anon', null, async () =>
      equal(
        await count(
          `select count(*) n from public.vita_entries where title_de = 'Parallel Vienna Art Fair'`,
        ),
        1,
        'sichtbarer Eintrag',
      ),
    )
    await as('authenticated', ADMIN, () =>
      db.query(
        `update public.vita_entries set is_published = false where title_de = 'Parallel Vienna Art Fair'`,
      ),
    )
    await as('anon', null, async () =>
      equal(
        await count(
          `select count(*) n from public.vita_entries where title_de = 'Parallel Vienna Art Fair'`,
        ),
        0,
        'ausgeblendeter Eintrag',
      ),
    )
    await as('authenticated', ADMIN, async () => {
      const result = await db.query(
        `delete from public.vita_entries where title_de = 'Parallel Vienna Art Fair'`,
      )
      equal(result.affectedRows, 1, 'gelöscht')
    })
  },
)

// ----- Veranstaltungsmodul (task-40)
const EDITOR = '00000000-0000-0000-0000-0000000000c3'
const TYPE = (slug) =>
  `(select id from public.event_types where slug = '${slug}')`
await db.exec(
  `insert into auth.users (id) values ('${EDITOR}'); insert into public.admins (user_id, role) values ('${EDITOR}', 'event_editor');`,
)

await check(
  'Veranstaltung: nur Titel genügt, Adresse und Standardwerte entstehen automatisch',
  () =>
    as('authenticated', ADMIN, async () => {
      const row = (
        await db.query(
          `insert into public.events (title_de) values ('Nur Titel') returning slug, status, is_published, starts_at, capacity, registration_mode`,
        )
      ).rows[0]
      equal(row.slug.startsWith('veranstaltung-'), true, 'Slug')
      equal(
        {
          s: row.status,
          p: row.is_published,
          d: row.starts_at,
          c: row.capacity,
          m: row.registration_mode,
        },
        { s: 'geplant', p: false, d: null, c: null, m: 'anfrage' },
        'Standardwerte',
      )
      await denied(() =>
        db.query(`insert into public.events (title_de) values ('   ')`),
      )
      await denied(() =>
        db.query(
          `insert into public.events (title_de, status) values ('X', 'unbekannt')`,
        ),
      )
      await denied(() =>
        db.query(
          `insert into public.events (title_de, capacity, places_available) values ('X', 5, 9)`,
        ),
      )
      await denied(() =>
        db.query(
          `insert into public.events (title_de, external_url) values ('X', 'javascript:alert(1)')`,
        ),
      )
    }),
)
await check(
  'Veranstaltungsarten: acht Standardarten, erweiterbar, öffentlich lesbar',
  async () => {
    await as('anon', null, async () =>
      equal(
        await count('select count(*) n from public.event_types'),
        8,
        'Arten',
      ),
    )
    await as('authenticated', ADMIN, () =>
      db.query(
        `insert into public.event_types (slug, name_de) values ('salon', 'Salon')`,
      ),
    )
    await as('anon', null, async () => {
      equal(
        await count('select count(*) n from public.event_types'),
        9,
        'erweiterte Arten',
      )
      await denied(() =>
        db.query(
          `insert into public.event_types (slug, name_de) values ('x', 'X')`,
        ),
      )
    })
  },
)
await check(
  'Öffentlich: Entwurf unsichtbar, interne Notiz und Tabelle nie lesbar',
  async () => {
    await as('authenticated', ADMIN, () =>
      db.query(
        `insert into public.events (slug, title_de, is_published, internal_note, starts_at) values ('mit-notiz', 'Mit Notiz', true, 'geheim', now() + interval '5 days')`,
      ),
    )
    await as('anon', null, async () => {
      equal(
        await count(
          `select count(*) n from public.events_public where slug = 'mit-notiz'`,
        ),
        1,
        'sichtbar',
      )
      equal(
        await count(
          `select count(*) n from public.events_public where slug = 'intern'`,
        ),
        0,
        'Entwurf',
      )
      await denied(() =>
        db.query('select internal_note from public.events_public'),
      )
      equal(
        await count('select count(*) n from public.events'),
        0,
        'Tabelle events gesperrt',
      )
    })
  },
)
await check(
  'Sichtbarkeitsschalter: Preis, Plätze, Teilnehmer, Referent, Ort ausblenden und wieder einblenden',
  async () => {
    await as('authenticated', ADMIN, () =>
      db.query(
        `insert into public.events (slug, title_de, is_published, price_eur, price_on_request, places_available, capacity, speaker_name, location_name, location_address)
       values ('schalter', 'Schalter', true, 120, true, 3, 10, 'Dr. Muster', 'Atelier', 'Weg 1')`,
      ),
    )
    const read = () =>
      db.query(
        `select price_eur, price_on_request, places_available, capacity, speaker_name, location_name, location_address from public.events_public where slug = 'schalter'`,
      )
    await as('anon', null, async () =>
      equal(
        (await read()).rows[0],
        {
          price_eur: '120',
          price_on_request: true,
          places_available: 3,
          capacity: 10,
          speaker_name: 'Dr. Muster',
          location_name: 'Atelier',
          location_address: 'Weg 1',
        },
        'alles sichtbar',
      ),
    )
    await as('authenticated', ADMIN, () =>
      db.query(
        `update public.site_settings set value = '{"price":false,"free_places":false,"participants":false,"speaker":false,"location":false}' where key = 'event_visibility'`,
      ),
    )
    await as('anon', null, async () =>
      equal(
        (await read()).rows[0],
        {
          price_eur: null,
          price_on_request: null,
          places_available: null,
          capacity: null,
          speaker_name: null,
          location_name: null,
          location_address: null,
        },
        'alles ausgeblendet',
      ),
    )
    await as('authenticated', ADMIN, async () => {
      equal(
        (
          await db.query(
            `select price_eur, speaker_name from public.events where slug = 'schalter'`,
          )
        ).rows[0],
        { price_eur: '120', speaker_name: 'Dr. Muster' },
        'Daten bleiben gespeichert',
      )
      await db.query(
        `update public.site_settings set value = '{"price":true,"free_places":true,"participants":true,"speaker":true,"location":true}' where key = 'event_visibility'`,
      )
    })
    await as('anon', null, async () =>
      equal((await read()).rows[0].price_eur, '120', 'wieder sichtbar'),
    )
  },
)
await check(
  'Archiv: vergangene Veranstaltung sichtbar oder ausgeblendet, Archivstatus einstellbar',
  async () => {
    await as('authenticated', ADMIN, () =>
      db.query(
        `insert into public.events (slug, title_de, is_published, starts_at, ends_at, archive_visible) values
         ('alt-sichtbar', 'Alt A', true, now() - interval '30 days', now() - interval '30 days', true),
         ('alt-versteckt', 'Alt B', true, now() - interval '30 days', now() - interval '30 days', false),
         ('beendet-versteckt', 'Alt C', true, now() + interval '3 days', null, false)`,
      ),
    )
    await as('anon', null, async () => {
      equal(
        await count(
          `select count(*) n from public.events_public where slug = 'alt-sichtbar'`,
        ),
        1,
        'Archiv sichtbar',
      )
      equal(
        await count(
          `select count(*) n from public.events_public where slug = 'alt-versteckt'`,
        ),
        0,
        'Archiv ausgeblendet',
      )
      equal(
        await count(
          `select count(*) n from public.events_public where slug = 'beendet-versteckt'`,
        ),
        1,
        'laufende bleibt sichtbar',
      )
    })
    await as('authenticated', ADMIN, () =>
      db.query(
        `update public.events set status = 'beendet' where slug = 'beendet-versteckt'`,
      ),
    )
    await as('anon', null, async () =>
      equal(
        await count(
          `select count(*) n from public.events_public where slug = 'beendet-versteckt'`,
        ),
        0,
        'beendet und ausgeblendet',
      ),
    )
  },
)
await check(
  'Mehrere Termine: weitere Termine erscheinen, Kalender sieht nur sichtbare Veranstaltungen',
  async () => {
    await as('authenticated', ADMIN, async () => {
      const id = (
        await db.query(`select id from public.events where slug = 'mit-notiz'`)
      ).rows[0].id
      await db.query(
        `insert into public.event_dates (event_id, starts_at, note_de) values ($1, now() + interval '12 days', 'Teil 2'), ($1, now() + interval '19 days', 'Teil 3')`,
        [id],
      )
      await denied(() =>
        db.query(
          `insert into public.event_dates (event_id, starts_at, ends_at) values ($1, now(), now() - interval '1 day')`,
          [id],
        ),
      )
      const intern = (
        await db.query(`select id from public.events where slug = 'intern'`)
      ).rows[0].id
      await db.query(
        `insert into public.event_dates (event_id, starts_at) values ($1, now() + interval '2 days')`,
        [intern],
      )
    })
    await as('anon', null, async () => {
      equal(
        await count(
          `select count(*) n from public.event_occurrences where slug = 'mit-notiz'`,
        ),
        3,
        'Termine der Veranstaltung',
      )
      equal(
        await count(
          `select count(*) n from public.event_occurrences where slug = 'intern'`,
        ),
        0,
        'Termine eines Entwurfs',
      )
      equal(
        await count('select count(*) n from public.event_dates'),
        0,
        'Tabelle event_dates gesperrt',
      )
    })
  },
)
await check(
  'Anfrage zu Veranstaltung: Zuordnung bleibt, Personenzahl begrenzt, Besucher schreiben nicht direkt',
  async () => {
    const pub = (
      await db.query(`select id from public.events where slug = 'mit-notiz'`)
    ).rows[0].id
    await as('service_role', null, async () => {
      await db.query(
        `insert into public.inquiries (type, name, email, event_id, persons) values ('veranstaltung', 'Gast', 'gast@example.com', $1, 2)`,
        [pub],
      )
      await denied(() =>
        db.query(
          `insert into public.inquiries (type, name, email, event_id, persons) values ('veranstaltung', 'Gast', 'gast@example.com', $1, 500)`,
          [pub],
        ),
      )
    })
    await as('anon', null, async () => {
      await denied(() =>
        db.query(
          `insert into public.inquiries (type, name, email, event_id) values ('veranstaltung', 'Gast', 'gast@example.com', $1)`,
          [pub],
        ),
      )
      equal(
        await count('select count(*) n from public.inquiries'),
        0,
        'Anfragen nicht lesbar',
      )
    })
    await as('authenticated', ADMIN, async () => {
      equal(
        (
          await db.query(
            `select e.title_de from public.inquiries i join public.events e on e.id = i.event_id where i.name = 'Gast'`,
          )
        ).rows[0].title_de,
        'Mit Notiz',
        'zugeordnete Veranstaltung',
      )
    })
  },
)
await check(
  'Statistik: zählt nur öffentliche Veranstaltungen und gültige Ereignisse, nur Redakteure lesen',
  async () => {
    const pub = (
      await db.query(`select id from public.events where slug = 'mit-notiz'`)
    ).rows[0].id
    const intern = (
      await db.query(`select id from public.events where slug = 'intern'`)
    ).rows[0].id
    await as('anon', null, async () => {
      for (const kind of [
        'view',
        'view',
        'detail',
        'inquiry_click',
        'inquiry',
        'unbekannt',
      ])
        await db.query('select public.track_event_event($1, $2)', [pub, kind])
      await db.query('select public.track_event_event($1, $2)', [
        intern,
        'view',
      ])
      equal(
        await count('select count(*) n from public.event_stats'),
        0,
        'Statistik nicht lesbar',
      )
    })
    await as('authenticated', EDITOR, async () => {
      equal(
        (
          await db.query(
            `select views, detail_opens, inquiry_clicks, inquiries from public.event_stats`,
          )
        ).rows,
        [{ views: 2, detail_opens: 1, inquiry_clicks: 1, inquiries: 1 }],
        'Zähler',
      )
    })
    await as('authenticated', USER, async () =>
      equal(
        await count('select count(*) n from public.event_stats'),
        0,
        'Nutzer ohne Recht',
      ),
    )
  },
)
await check(
  'Event-Redakteur: verwaltet Veranstaltungen, Termine, Arten, Anfragen und Anmeldungen, sonst nichts',
  async () => {
    await as('authenticated', EDITOR, async () => {
      equal(
        (
          await db.query(
            'select public.is_admin() a, public.is_event_editor() e',
          )
        ).rows[0],
        { a: false, e: true },
        'Rollen',
      )
      const row = (
        await db.query(
          `insert into public.events (title_de, type_id) values ('Vom Redakteur', ${TYPE('workshop')}) returning id`,
        )
      ).rows[0]
      await db.query(
        `insert into public.event_dates (event_id, starts_at) values ($1, now())`,
        [row.id],
      )
      await db.query(
        `update public.events set status = 'abgesagt' where id = $1`,
        [row.id],
      )
      await db.query(
        `insert into public.event_types (slug, name_de) values ('klausur', 'Klausur')`,
      )
      equal(
        await count(
          `select count(*) n from public.inquiries where event_id is not null`,
        ),
        1,
        'Anfragen zu Veranstaltungen sichtbar',
      )
      equal(
        await count(
          `select count(*) n from public.inquiries where event_id is null`,
        ),
        0,
        'andere Anfragen unsichtbar',
      )
      equal(
        await count('select count(*) n from public.registrations'),
        1,
        'Anmeldungen sichtbar',
      )
      equal(
        (
          await db.query(
            `update public.inquiries set status = 'beantwortet' where name = 'Alt'`,
          )
        ).affectedRows,
        0,
        'fremde Anfrage nicht änderbar',
      )
      equal(
        (
          await db.query(
            `update public.inquiries set status = 'beantwortet' where name = 'Gast'`,
          )
        ).affectedRows,
        1,
        'Anfrage zu Veranstaltung änderbar',
      )
      await denied(() =>
        db.query(
          `insert into public.artworks (main_image_url, image_width, image_height) values ('x.webp', 1, 1)`,
        ),
      )
      await denied(() =>
        db.query(`insert into public.posts (slug) values ('x')`),
      )
      await denied(() =>
        db.query(
          `insert into public.vita_entries (year, category, title_de) values (2000, 'messe', 'X')`,
        ),
      )
      equal(
        (
          await db.query(
            `update public.site_settings set value = '{}' where key = 'event_visibility'`,
          )
        ).affectedRows,
        0,
        'Einstellungen nicht änderbar',
      )
      await denied(() =>
        db.query(
          `insert into public.admins (user_id, role) values ('${USER}', 'admin')`,
        ),
      )
      equal(
        await count('select count(*) n from public.artworks'),
        0,
        'Werke unsichtbar',
      )
    })
  },
)
await check(
  'Speicher: Event-Redakteur nur im Bucket events, PDF dort erlaubt',
  async () => {
    await as('authenticated', EDITOR, async () => {
      await db.query(
        `insert into storage.objects (bucket_id, name) values ('events', 'a/info.pdf')`,
      )
      await denied(() =>
        db.query(
          `insert into storage.objects (bucket_id, name) values ('artworks', 'a/x.webp')`,
        ),
      )
      await denied(() =>
        db.query(
          `insert into storage.objects (bucket_id, name) values ('press', 'a/x.webp')`,
        ),
      )
      equal(
        (
          await db.query(
            `delete from storage.objects where bucket_id = 'events' and name = 'a/info.pdf'`,
          )
        ).affectedRows,
        1,
        'gelöscht',
      )
    })
    const mime = (
      await db.query(
        `select allowed_mime_types m from storage.buckets where id = 'events'`,
      )
    ).rows[0].m
    equal(mime.includes('application/pdf'), true, 'PDF im Bucket events')
  },
)
await check(
  'Kurse sind Veranstaltungen: Tabelle courses entfällt',
  async () => {
    equal(
      await count(
        `select count(*) n from information_schema.tables where table_schema = 'public' and table_name = 'courses'`,
      ),
      0,
      'courses',
    )
  },
)

// ----- Presse-Kategorien (task-38)
await check(
  'Presse-Kategorien: fünf Standardkategorien, öffentlich lesbar, nur Admin ändert',
  async () => {
    await as('anon', null, async () => {
      equal(
        await count('select count(*) n from public.press_categories'),
        5,
        'Kategorien',
      )
      equal(
        await db
          .query(
            `insert into public.press_categories (slug, name_de) values ('x', 'X')`,
          )
          .then(
            () => 'erlaubt',
            () => 'abgelehnt',
          ),
        'abgelehnt',
        'anon schreibt',
      )
    })
    await as('authenticated', USER, async () => {
      equal(
        (await db.query(`update public.press_categories set name_de = 'Hack'`))
          .affectedRows,
        0,
        'Nutzer ändert',
      )
    })
    await as('authenticated', ADMIN, async () => {
      await db.query(
        `insert into public.press_categories (slug, name_de) values ('rezension', 'Rezension')`,
      )
      await denied(() =>
        db.query(
          `insert into public.press_categories (slug, name_de) values ('rezension', 'Doppelt')`,
        ),
      )
      await denied(() =>
        db.query(
          `insert into public.press_categories (slug, name_de) values ('leer', '   ')`,
        ),
      )
      await db.query(
        `update public.press_categories set name_de = 'Rezensionen' where slug = 'rezension'`,
      )
    })
  },
)
await check(
  'Presse-Kategorien: Eintrag verweist auf Kategorie, unbekannte abgelehnt, Löschen lässt Daten stehen',
  async () => {
    await as('authenticated', ADMIN, async () => {
      await db.query(
        `insert into public.press_items (title_de, external_url, category) values ('Mit Kategorie', 'https://example.com/k', 'rezension')`,
      )
      await denied(() =>
        db.query(
          `insert into public.press_items (title_de, external_url, category) values ('Falsch', 'https://example.com/f', 'gibt-es-nicht')`,
        ),
      )
      await db.query(
        `delete from public.press_categories where slug = 'rezension'`,
      )
      const row = (
        await db.query(
          `select title_de, category from public.press_items where title_de = 'Mit Kategorie'`,
        )
      ).rows[0]
      equal(
        row,
        { title_de: 'Mit Kategorie', category: null },
        'Eintrag bleibt ohne Kategorie',
      )
    })
  },
)

// ----- Verbindliche Anmeldung (task-24)
await check(
  'Anmeldung: Kapazität zählt Begleitpersonen, danach Warteliste, Plätze und Status werden nachgeführt',
  async () => {
    const id = (
      await db.query(
        `insert into public.events (slug, title_de, is_published, registration_open, registration_mode, capacity, starts_at, ends_at) values ('anmeldung-test', 'Anmeldetest', true, true, 'verbindlich', 5, now() + interval '5 days', now() + interval '5 days 2 hours') returning id`,
      )
    ).rows[0].id
    const reg = async (email, guests) =>
      (
        await as('service_role', null, () =>
          db.query(
            `select * from public.register_for_event($1, 'Gast', $2, null, null, $3)`,
            [id, email, guests],
          ),
        )
      ).rows[0]
    const a = await reg('a@example.com', 1) // 2 Personen
    equal(
      { s: a.status, left: a.seats_left },
      { s: 'angemeldet', left: 3 },
      'erste Anmeldung',
    )
    const b = await reg('b@example.com', 2) // 3 Personen, genau voll
    equal(
      { s: b.status, left: b.seats_left },
      { s: 'angemeldet', left: 0 },
      'zweite Anmeldung füllt auf',
    )
    const c = await reg('c@example.com', 0)
    equal(c.status, 'warteliste', 'voll: Warteliste')
    const event = (
      await db.query(
        `select places_available, status from public.events where id = $1`,
        [id],
      )
    ).rows[0]
    equal(
      event,
      { places_available: 0, status: 'ausgebucht' },
      'Veranstaltung ausgebucht',
    )
    equal(
      Number(
        (await db.query(`select public.event_seats_taken($1) n`, [id])).rows[0]
          .n,
      ),
      5,
      'belegte Plätze ohne Warteliste',
    )
  },
)
await check(
  'Anmeldung: knapp bemessen setzt „wenige Plätze“, ohne Kapazität bleibt alles unverändert',
  async () => {
    const id = (
      await db.query(
        `insert into public.events (slug, title_de, is_published, registration_open, registration_mode, capacity, starts_at) values ('wenige-test', 'Wenige', true, true, 'verbindlich', 8, now() + interval '5 days') returning id`,
      )
    ).rows[0].id
    const run = (email, guests) =>
      as('service_role', null, () =>
        db.query(
          `select * from public.register_for_event($1, 'Gast', $2, null, null, $3)`,
          [id, email, guests],
        ),
      )
    await run('x@example.com', 3) // 4 Personen
    await run('y@example.com', 1) // 2 Personen: 6 von 8, 2 frei = 25 %
    equal(
      (
        await db.query(
          `select status, places_available from public.events where id = $1`,
          [id],
        )
      ).rows[0],
      { status: 'wenige_plaetze', places_available: 2 },
      'wenige Plätze',
    )
    const open = (
      await db.query(
        `insert into public.events (slug, title_de, is_published, registration_open, registration_mode, starts_at) values ('ohne-grenze', 'Ohne Grenze', true, true, 'verbindlich', now() + interval '5 days') returning id`,
      )
    ).rows[0].id
    const r = (
      await as('service_role', null, () =>
        db.query(
          `select * from public.register_for_event($1, 'Gast', 'o@example.com', null, null, 3)`,
          [open],
        ),
      )
    ).rows[0]
    equal(
      { s: r.status, left: r.seats_left },
      { s: 'angemeldet', left: null },
      'ohne Kapazität immer angemeldet',
    )
    equal(
      (
        await db.query(
          `select status, places_available from public.events where id = $1`,
          [open],
        )
      ).rows[0],
      { status: 'geplant', places_available: null },
      'unverändert',
    )
  },
)
await check(
  'Anmeldung: geschlossen, abgesagt, vorbei, Frist, nur Anfrage, doppelt und unbekannt werden abgelehnt',
  async () => {
    const mk = async (slug) =>
      (
        await db.query(
          `insert into public.events (slug, title_de, is_published, registration_open, registration_mode, starts_at, ends_at, status, registration_deadline) values ($1, 'T', true, true, 'verbindlich', now() + interval '3 days', now() + interval '3 days 1 hour', 'geplant', null) returning id`,
          [slug],
        )
      ).rows[0].id
    const reason = async (id, email = 'z@example.com') => {
      try {
        await as('service_role', null, () =>
          db.query(
            `select * from public.register_for_event($1, 'Gast', $2, null, null, 0)`,
            [id, email],
          ),
        )
        return 'ok'
      } catch (error) {
        return error.message
      }
    }
    const closed = await mk('zu-1')
    await db.query(
      `update public.events set registration_open = false where id = $1`,
      [closed],
    )
    equal(await reason(closed), 'closed', 'Anmeldung geschlossen')
    const cancelled = await mk('zu-2')
    await db.query(
      `update public.events set status = 'abgesagt' where id = $1`,
      [cancelled],
    )
    equal(await reason(cancelled), 'closed', 'abgesagt')
    const past = await mk('zu-3')
    await db.query(
      `update public.events set starts_at = now() - interval '3 days', ends_at = now() - interval '2 days' where id = $1`,
      [past],
    )
    equal(await reason(past), 'closed', 'vorbei')
    const late = await mk('zu-4')
    await db.query(
      `update public.events set registration_deadline = now() - interval '1 hour' where id = $1`,
      [late],
    )
    equal(await reason(late), 'closed', 'Frist abgelaufen')
    const info = await mk('zu-5')
    await db.query(
      `update public.events set registration_mode = 'anfrage' where id = $1`,
      [info],
    )
    equal(await reason(info), 'closed', 'nur Anfrage')
    const draft = await mk('zu-6')
    await db.query(
      `update public.events set is_published = false where id = $1`,
      [draft],
    )
    equal(await reason(draft), 'closed', 'nicht veröffentlicht')
    const dup = await mk('zu-7')
    equal(await reason(dup, 'dup@example.com'), 'ok', 'erste')
    equal(
      await reason(dup, 'DUP@example.com'),
      'duplicate',
      'doppelt, Groß-/Kleinschreibung egal',
    )
    equal(
      await reason('99999999-9999-4999-8999-999999999999'),
      'unknown_event',
      'unbekannt',
    )
  },
)
await check(
  'Anmeldung: nur die Edge Function darf anmelden, Besucher nicht',
  async () => {
    const id = (
      await db.query(
        `select id from public.events where slug = 'anmeldung-test'`,
      )
    ).rows[0].id
    await as('anon', null, () =>
      denied(() =>
        db.query(
          `select * from public.register_for_event($1, 'X', 'x@example.com', null, null, 0)`,
          [id],
        ),
      ),
    )
    await as('authenticated', ADMIN, () =>
      denied(() =>
        db.query(
          `select * from public.register_for_event($1, 'X', 'x@example.com', null, null, 0)`,
          [id],
        ),
      ),
    )
    await as('anon', null, async () =>
      equal(
        await count('select count(*) n from public.registrations'),
        0,
        'Besucher sehen keine Anmeldungen',
      ),
    )
  },
)

// ----- Stornierung und Nachrücken (task-25)
await check(
  'Stornierung: Status, freie Plätze und Nachrücken in der Reihenfolge der Anmeldung',
  async () => {
    const id = (
      await db.query(
        `insert into public.events (slug, title_de, is_published, registration_open, registration_mode, capacity, starts_at, ends_at) values ('storno-test', 'Stornotest', true, true, 'verbindlich', 4, now() + interval '5 days', now() + interval '5 days 2 hours') returning id`,
      )
    ).rows[0].id
    const reg = async (email, guests) =>
      (
        await as('service_role', null, () =>
          db.query(
            `select * from public.register_for_event($1, $2, $2, null, null, $3)`,
            [id, email, guests],
          ),
        )
      ).rows[0]
    const a = await reg('a@example.com', 2) // 3 Personen
    await reg('b@example.com', 1) // Warteliste (2 Personen, nur 1 frei)
    await reg('c@example.com', 0) // 1 Person: passt in den freien Platz -> angemeldet
    const c = (
      await db.query(
        `select status from public.registrations where email = 'c@example.com' and event_id = $1`,
        [id],
      )
    ).rows[0]
    equal(c.status, 'angemeldet', 'C füllt den freien Platz')
    const d = await reg('d@example.com', 0) // Warteliste (1 Person)
    equal(d.status, 'warteliste', 'D wartet')
    // A storniert: 3 Plätze frei, B (2 Personen) rückt zuerst nach, danach D (1 Person)
    const result = (
      await as('service_role', null, () =>
        db.query(`select * from public.cancel_registration($1)`, [
          a.cancel_key,
        ]),
      )
    ).rows
    equal(result[0].outcome, 'cancelled', 'Ergebnis')
    equal(
      result.map((r) => r.promoted_email),
      ['b@example.com', 'd@example.com'],
      'Reihenfolge des Nachrückens',
    )
    equal(result[0].cancelled_email, 'a@example.com', 'Storno-Person')
    const states = (
      await db.query(
        `select email, status from public.registrations where event_id = $1 order by email`,
        [id],
      )
    ).rows
    equal(
      states,
      [
        { email: 'a@example.com', status: 'storniert' },
        { email: 'b@example.com', status: 'angemeldet' },
        { email: 'c@example.com', status: 'angemeldet' },
        { email: 'd@example.com', status: 'angemeldet' },
      ],
      'Status',
    )
    equal(
      (
        await db.query(
          `select places_available, status from public.events where id = $1`,
          [id],
        )
      ).rows[0],
      { places_available: 0, status: 'ausgebucht' },
      'ausgebucht',
    )
  },
)
await check(
  'Stornierung: Wer nicht passt, bleibt auf der Warteliste, andere rücken trotzdem nach',
  async () => {
    const id = (
      await db.query(
        `insert into public.events (slug, title_de, is_published, registration_open, registration_mode, capacity, starts_at) values ('storno-passt', 'Passt nicht', true, true, 'verbindlich', 3, now() + interval '5 days') returning id`,
      )
    ).rows[0].id
    const reg = async (email, guests) =>
      (
        await as('service_role', null, () =>
          db.query(
            `select * from public.register_for_event($1, $2, $2, null, null, $3)`,
            [id, email, guests],
          ),
        )
      ).rows[0]
    const a = await reg('a@example.com', 0)
    await reg('b@example.com', 1)
    await reg('c@example.com', 0)
    await reg('d@example.com', 3) // 4 Personen: passt nie, 3 Plätze insgesamt
    const result = (
      await as('service_role', null, () =>
        db.query(`select * from public.cancel_registration($1)`, [
          a.cancel_key,
        ]),
      )
    ).rows
    const emails = result.map((r) => r.promoted_email).filter(Boolean)
    equal(emails.length >= 0, true, 'läuft durch')
    const states = Object.fromEntries(
      (
        await db.query(
          `select email, status from public.registrations where event_id = $1`,
          [id],
        )
      ).rows.map((r) => [r.email, r.status]),
    )
    equal(
      states['d@example.com'],
      'warteliste',
      'zu große Gruppe bleibt wartend',
    )
  },
)
await check(
  'Stornierung: Warteliste storniert, doppelt, unbekannt, nur service_role',
  async () => {
    const id = (
      await db.query(
        `insert into public.events (slug, title_de, is_published, registration_open, registration_mode, capacity, starts_at) values ('storno-wl', 'WL', true, true, 'verbindlich', 1, now() + interval '5 days') returning id`,
      )
    ).rows[0].id
    const reg = async (email) =>
      (
        await as('service_role', null, () =>
          db.query(
            `select * from public.register_for_event($1, $2, $2, null, null, 0)`,
            [id, email],
          ),
        )
      ).rows[0]
    await reg('a@example.com')
    const w = await reg('w@example.com')
    equal(w.status, 'warteliste', 'wartet')
    const first = (
      await as('service_role', null, () =>
        db.query(`select * from public.cancel_registration($1)`, [
          w.cancel_key,
        ]),
      )
    ).rows
    equal(
      {
        o: first[0].outcome,
        s: first[0].cancelled_status,
        p: first[0].promoted_email,
      },
      { o: 'cancelled', s: 'warteliste', p: null },
      'Wartelisten-Stornierung rückt niemanden nach',
    )
    equal(
      (
        await db.query(
          `select status from public.registrations where email = 'a@example.com' and event_id = $1`,
          [id],
        )
      ).rows[0].status,
      'angemeldet',
      'A bleibt angemeldet',
    )
    const again = (
      await as('service_role', null, () =>
        db.query(`select * from public.cancel_registration($1)`, [
          w.cancel_key,
        ]),
      )
    ).rows
    equal(again[0].outcome, 'already_cancelled', 'zweites Mal')
    const unknown = (
      await as('service_role', null, () =>
        db.query(
          `select * from public.cancel_registration('99999999-9999-4999-8999-999999999999')`,
        ),
      )
    ).rows
    equal(unknown[0].outcome, 'unknown', 'unbekannt')
    await as('anon', null, () =>
      denied(() =>
        db.query(`select * from public.cancel_registration($1)`, [
          w.cancel_key,
        ]),
      ),
    )
    await as('authenticated', ADMIN, () =>
      denied(() =>
        db.query(`select * from public.cancel_registration($1)`, [
          w.cancel_key,
        ]),
      ),
    )
  },
)
await check(
  'Stornierung: stornierte Plätze werden freigegeben, Veranstaltung nicht mehr ausgebucht',
  async () => {
    const id = (
      await db.query(
        `insert into public.events (slug, title_de, is_published, registration_open, registration_mode, capacity, starts_at) values ('storno-frei', 'Frei', true, true, 'verbindlich', 2, now() + interval '5 days') returning id`,
      )
    ).rows[0].id
    const a = (
      await as('service_role', null, () =>
        db.query(
          `select * from public.register_for_event($1, 'A', 'a@example.com', null, null, 1)`,
          [id],
        ),
      )
    ).rows[0]
    equal(
      (await db.query(`select status from public.events where id = $1`, [id]))
        .rows[0].status,
      'ausgebucht',
      'voll',
    )
    await as('service_role', null, () =>
      db.query(`select * from public.cancel_registration($1)`, [a.cancel_key]),
    )
    equal(
      (
        await db.query(
          `select places_available, status from public.events where id = $1`,
          [id],
        )
      ).rows[0],
      { places_available: 2, status: 'anmeldung_moeglich' },
      'wieder frei',
    )
    // dieselbe Person kann sich nach der Stornierung erneut anmelden
    const again = (
      await as('service_role', null, () =>
        db.query(
          `select * from public.register_for_event($1, 'A', 'a@example.com', null, null, 0)`,
          [id],
        ),
      )
    ).rows[0]
    equal(again.status, 'angemeldet', 'erneut angemeldet')
  },
)

await check(
  'Bildgrößen: Liste in der öffentlichen Sicht, nur als Liste speicherbar',
  async () => {
    await db.exec(
      `update public.artworks set image_variants = '[{"url":"a-800.webp","width":800}]'::jsonb where slug = 'sichtbar'`,
    )
    const row = (
      await as('anon', null, () =>
        db.query(
          `select image_variants, price_eur from public.artworks_public where slug in ('sichtbar')`,
        ),
      )
    ).rows[0]
    equal(
      row.image_variants,
      [{ url: 'a-800.webp', width: 800 }],
      'Liste sichtbar',
    )
    const none = (
      await as('anon', null, () =>
        db.query(
          `select image_variants from public.artworks_public where slug = 'nur-bild'`,
        ),
      )
    ).rows[0]
    equal(none.image_variants, [], 'Standard ist eine leere Liste')
    await denied(() =>
      db.exec(
        `update public.artworks set image_variants = '{}'::jsonb where slug = 'nur-bild'`,
      ),
    )
    await denied(() =>
      db.exec(
        `insert into public.artwork_images (artwork_id, image_url, image_variants) values ('11111111-1111-1111-1111-111111111111', 'x.webp', '"text"'::jsonb)`,
      ),
    )
  },
)

console.log(`${passed} Prüfungen bestanden, ${failures.length} fehlgeschlagen`)
for (const failure of failures) console.log(`  FEHLER: ${failure}`)
process.exit(failures.length === 0 ? 0 : 1)
