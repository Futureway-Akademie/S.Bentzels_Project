import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  artworkLd,
  compact,
  eventLd,
  organizationLd,
  personLd,
  postLd,
  summarize,
  websiteLd,
  type ArtworkInput,
  type Site,
} from './seoLd.ts'

const site: Site = {
  url: 'https://www.sturmfederprojects.de',
  name: 'Stephan Graf Bentzel-Sturmfeder',
  organization: 'Sturmfeder Projects',
  email: 'stephan.bentzel@viqua.de',
  telephone: '+49 177 4346401',
  street: 'Schloss Jägersburg, Fürstenweg 1',
  postalCode: '91330',
  locality: 'Bammersdorf',
}

const artwork = (extra: Partial<ArtworkInput> = {}): ArtworkInput => ({
  slug: 'goessweinstein',
  titleDe: 'Gössweinstein',
  year: 2013,
  techniqueDe: 'Triptychon',
  supportDe: 'Leinwand',
  heightCm: 100,
  widthCm: 240,
  depthCm: null,
  descriptionDe: null,
  priceEur: 6230,
  status: 'verfuegbar',
  mainImageUrl: '/platzhalter/4800x2000.svg',
  ...extra,
})

test('Leere Werte entfallen', () => {
  assert.deepEqual(
    compact({ a: 1, b: null, c: undefined, d: '', e: [], f: 0, g: false }),
    { a: 1, f: 0, g: false },
  )
})

test('Organisation, Person und Website verweisen aufeinander', () => {
  const org = organizationLd(site)
  assert.equal(org['@type'], 'Organization')
  assert.equal(org['@id'], 'https://www.sturmfederprojects.de/#organization')
  assert.deepEqual(org.founder, {
    '@id': 'https://www.sturmfederprojects.de/#person',
  })
  const person = personLd(site, 'Künstler')
  assert.equal(person['@type'], 'Person')
  assert.equal(person.jobTitle, 'Künstler')
  assert.deepEqual(person.worksFor, {
    '@id': 'https://www.sturmfederprojects.de/#organization',
  })
  assert.equal(websiteLd(site)['@type'], 'WebSite')
})

test('Werk: Maße, Technik, Jahr, Preis und Verfügbarkeit nur wenn vorhanden', () => {
  const full = artworkLd(site, artwork(), 'Ohne Titel')
  assert.equal(full['@type'], 'VisualArtwork')
  assert.equal(full.name, 'Gössweinstein')
  assert.equal(full.dateCreated, '2013')
  assert.equal(full.artMedium, 'Triptychon, Leinwand')
  assert.deepEqual(full.height, {
    '@type': 'QuantitativeValue',
    value: 100,
    unitCode: 'CMT',
  })
  assert.equal(
    full.image,
    'https://www.sturmfederprojects.de/platzhalter/4800x2000.svg',
  )
  const offers = full.offers as Record<string, unknown>
  assert.equal(offers.price, 6230)
  assert.equal(offers.availability, 'https://schema.org/InStock')
  const hidden = artworkLd(
    site,
    artwork({
      priceEur: null,
      status: null,
      year: null,
      heightCm: null,
      widthCm: null,
      techniqueDe: null,
      supportDe: null,
      titleDe: null,
    }),
    'Ohne Titel',
  )
  assert.equal(hidden.name, 'Ohne Titel')
  for (const key of ['offers', 'dateCreated', 'height', 'width', 'artMedium'])
    assert.equal(key in hidden, false, key)
  assert.equal(
    artworkLd(site, artwork({ status: 'verkauft' }), '')['offers'] !==
      undefined,
    true,
  )
})

test('Werk: Bild als Data-Adresse wird nicht übernommen, absolute Adressen bleiben', () => {
  assert.equal(
    'image' in
      artworkLd(
        site,
        artwork({ mainImageUrl: 'data:image/svg+xml;utf8,x' }),
        '',
      ),
    false,
  )
  assert.equal(
    artworkLd(
      site,
      artwork({ mainImageUrl: 'https://cdn.example.com/w.webp' }),
      '',
    ).image,
    'https://cdn.example.com/w.webp',
  )
})

test('Veranstaltung: Status, Ort, Termin, Preis', () => {
  const base = {
    slug: 'abend',
    titleDe: 'Abend',
    descriptionDe: 'Lang',
    shortDescriptionDe: 'Kurz',
    status: 'geplant',
    imageUrl: null,
    locationName: 'Schloss',
    locationAddress: null,
    priceEur: null,
  }
  const ld = eventLd(site, base, {
    startsAt: '2027-03-10T17:30:00.000Z',
    endsAt: null,
  })
  assert.equal(ld['@type'], 'Event')
  assert.equal(ld.description, 'Kurz')
  assert.equal(ld.eventStatus, 'https://schema.org/EventScheduled')
  assert.equal(ld.startDate, '2027-03-10T17:30:00.000Z')
  assert.equal('endDate' in ld, false)
  assert.equal('offers' in ld, false)
  assert.deepEqual(ld.location, { '@type': 'Place', name: 'Schloss' })
  assert.equal(
    eventLd(
      site,
      { ...base, status: 'abgesagt' },
      { startsAt: null, endsAt: null },
    ).eventStatus,
    'https://schema.org/EventCancelled',
  )
  assert.equal(
    eventLd(
      site,
      { ...base, status: 'verschoben' },
      { startsAt: null, endsAt: null },
    ).eventStatus,
    'https://schema.org/EventRescheduled',
  )
  assert.equal(
    'location' in
      eventLd(
        site,
        { ...base, locationName: null },
        { startsAt: null, endsAt: null },
      ),
    false,
  )
  assert.equal(
    (
      eventLd(
        site,
        { ...base, priceEur: 89.5 },
        { startsAt: null, endsAt: null },
      ).offers as Record<string, unknown>
    ).price,
    89.5,
  )
})

test('Beitrag', () => {
  const ld = postLd(
    site,
    {
      slug: 'strich',
      titleDe: null,
      excerptDe: 'Anreißer',
      publishedAt: '2026-09-15T09:00:00Z',
      coverImageUrl: null,
    },
    'Ohne Titel',
  )
  assert.equal(ld['@type'], 'BlogPosting')
  assert.equal(ld.headline, 'Ohne Titel')
  assert.equal('image' in ld, false)
  assert.equal(ld.datePublished, '2026-09-15T09:00:00Z')
})

test('Beschreibung kürzen: Wortgrenze, HTML entfernen, leer bleibt leer', () => {
  assert.equal(summarize(null), null)
  assert.equal(summarize('  \n '), null)
  assert.equal(summarize('<p>Kurz</p>'), 'Kurz')
  const long =
    'Ein ziemlich langer Satz über Kunst und ihre Wirkung auf Menschen und Räume, der deutlich über die erlaubte Länge hinausgeht und deshalb gekürzt wird.'
  const short = summarize(long, 60)!
  assert.equal(short.length <= 60, true)
  assert.equal(short.endsWith('…'), true)
  assert.equal(short.includes('Wirkung'), true)
  assert.equal(short.endsWith(' …'), false)
})
