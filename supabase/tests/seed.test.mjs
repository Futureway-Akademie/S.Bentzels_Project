// Prüft die Beispieldaten (supabase/seed.sql) lokal: Sie lassen sich nach allen Migrationen
// einspielen, mehrfach ausführen und zeigen Besuchern die erwarteten Inhalte.
//
// Ausführen: node supabase/tests/seed.test.mjs
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const here = dirname(fileURLToPath(import.meta.url))
const read = (file) => readFileSync(join(here, '..', file), 'utf8')
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
].map((f) => read(join('migrations', f)))
const seed = read('seed.sql')

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

const count = async (sql) => Number((await db.query(sql)).rows[0].n)
async function check(name, fn) {
  try {
    await fn()
    passed += 1
  } catch (error) {
    failures.push(`${name}: ${error.message}`)
  }
}
const equal = (actual, expected, what) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(
      `${what}: erwartet ${JSON.stringify(expected)}, erhalten ${JSON.stringify(actual)}`,
    )
}
async function asAnon(fn) {
  await db.exec('reset role; set role anon')
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
  }
}

await check('Beispieldaten lassen sich einspielen', async () => {
  await db.exec(seed)
  equal(await count('select count(*) n from public.artworks'), 10, 'Werke')
  equal(await count('select count(*) n from public.vita_entries'), 44, 'Vita')
  equal(await count('select count(*) n from public.posts'), 2, 'Beiträge')
  equal(
    await count('select count(*) n from public.events'),
    6,
    'Veranstaltungen',
  )
  equal(await count('select count(*) n from public.press_items'), 6, 'Presse')
  equal(
    await count('select count(*) n from public.curated_links'),
    3,
    'Artikel',
  )
})

await check('Mehrfaches Einspielen ändert nichts', async () => {
  await db.exec(seed)
  equal(await count('select count(*) n from public.artworks'), 10, 'Werke')
  equal(await count('select count(*) n from public.vita_entries'), 44, 'Vita')
  equal(
    await count('select count(*) n from public.events'),
    6,
    'Veranstaltungen',
  )
  equal(await count('select count(*) n from public.press_items'), 6, 'Presse')
})

await check(
  'Besucher sehen veröffentlichte Beispiele, Werke nur über die Sicht',
  async () => {
    await asAnon(async () => {
      equal(
        await count('select count(*) n from public.artworks_public'),
        10,
        'Werke',
      )
      equal(
        await count('select count(*) n from public.artworks'),
        0,
        'Werktabelle gesperrt',
      )
      equal(
        await count('select count(*) n from public.vita_entries'),
        44,
        'Vita',
      )
      equal(await count('select count(*) n from public.posts'), 2, 'Beiträge')
      equal(
        await count('select count(*) n from public.press_items'),
        6,
        'Presse',
      )
      equal(
        await count('select count(*) n from public.curated_links'),
        3,
        'Artikel',
      )
      equal(
        await count('select count(*) n from public.press_categories'),
        5,
        'Kategorien',
      )
    })
  },
)

await check(
  'Werke: Beispiele mit fehlenden Angaben, Preis und Verfügbarkeit',
  async () => {
    await asAnon(async () => {
      const row = (
        await db.query(
          `select title_de, price_eur, status from public.artworks_public where slug = 'werk-9'`,
        )
      ).rows[0]
      equal(
        row,
        { title_de: null, price_eur: null, status: null },
        'Werk nur mit Bild',
      )
      equal(
        (await count(
          `select count(*) n from public.artworks_public where price_eur is not null`,
        )) > 0,
        true,
        'Werke mit Preis',
      )
      equal(
        (await count(
          `select count(*) n from public.artworks_public where is_highlight`,
        )) > 0,
        true,
        'Highlights',
      )
    })
  },
)

await check(
  'Veranstaltungen: Events und Kurse im gemeinsamen Modul, Status passend zum Datum',
  async () => {
    await asAnon(async () => {
      const types = (
        await db.query(
          `select t.slug, count(*)::int n from public.events_public e join public.event_types t on t.id = e.type_id group by t.slug order by t.slug`,
        )
      ).rows
      equal(
        types,
        [
          { slug: 'event', n: 4 },
          { slug: 'gruppenkurs', n: 2 },
        ],
        'Arten',
      )
      equal(
        await count(`select count(*) n from public.event_occurrences`),
        6,
        'Termine',
      )
    })
    equal(
      (await count(
        `select count(*) n from public.events where status = 'beendet'`,
      )) >= 1,
      true,
      'vergangene beendet',
    )
  },
)

await check('Beiträge: Text als HTML mit Absätzen', async () => {
  const row = (
    await db.query(
      `select content_de, cover_image_url from public.posts where slug = 'warum-der-erste-strich-zaehlt'`,
    )
  ).rows[0]
  equal(row.content_de.startsWith('<p>'), true, 'HTML')
  equal(
    row.cover_image_url.startsWith('/platzhalter/'),
    true,
    'Bildplatzhalter',
  )
})

await check(
  'Presse: Beispiele mit Datei, Link und nur Datei, Kategorien verweisen auf die Tabelle',
  async () => {
    equal(
      (await count(
        `select count(*) n from public.press_items where external_url is not null and file_url is null`,
      )) >= 1,
      true,
      'nur Link',
    )
    equal(
      (await count(
        `select count(*) n from public.press_items where file_url is not null and title_de is null`,
      )) >= 1,
      true,
      'nur Datei',
    )
    equal(
      (await count(
        `select count(*) n from public.press_items p join public.press_categories c on c.slug = p.category`,
      )) >= 1,
      true,
      'Kategorie',
    )
  },
)

console.log(`${passed} Prüfungen bestanden, ${failures.length} fehlgeschlagen`)
for (const failure of failures) console.log(`  FEHLER: ${failure}`)
process.exit(failures.length === 0 ? 0 : 1)
