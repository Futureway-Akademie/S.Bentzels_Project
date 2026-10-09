import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  artworkFromRow,
  artworkImageFromRow,
  curatedFromRow,
  postFromRow,
  pressCategoryFromRow,
  pressFromRow,
  vitaFromRow,
} from './contentMap.ts'

test('Werk aus der öffentlichen Sicht: ausgeblendete Angaben bleiben null', () => {
  const art = artworkFromRow({
    id: 'a',
    slug: 'werk',
    main_image_url: 'h.webp',
    image_width: 100,
    image_height: 80,
    title_de: 'Titel',
    price_eur: null,
    status: null,
    height_cm: '120',
    framed: true,
    thumb_url: '',
  })
  assert.equal(art.title, undefined)
  assert.equal(art.titleDe, 'Titel')
  assert.equal(art.priceEur, null)
  assert.equal(art.status, null)
  assert.equal(art.heightCm, 120)
  assert.equal(art.framed, true)
  assert.equal(art.thumbUrl, null)
  assert.equal(art.isPublished, true)
})

test('Werk nur mit Bild', () => {
  const art = artworkFromRow({
    id: 'a',
    slug: 'x',
    main_image_url: 'h.webp',
    image_width: 10,
    image_height: 20,
  })
  assert.equal(art.titleDe, null)
  assert.equal(art.year, null)
  assert.equal(art.isHighlight, false)
  assert.equal(art.depthCm, null)
})

test('Weitere Werkbilder', () => {
  const img = artworkImageFromRow({
    id: 'i',
    artwork_id: 'a',
    image_url: 'u',
    thumb_url: 't',
    image_width: 1,
    image_height: 2,
    sort_order: 3,
  })
  assert.deepEqual(img, {
    id: 'i',
    artworkId: 'a',
    imageUrl: 'u',
    thumbUrl: 't',
    imageWidth: 1,
    imageHeight: 2,
    imageVariants: [],
    sortOrder: 3,
  })
  const withVariants = artworkImageFromRow({
    id: 'i',
    artwork_id: 'a',
    image_url: 'u',
    image_variants: [{ url: 'u-w800.webp', width: 800 }, 'kaputt'],
  })
  assert.deepEqual(withVariants.imageVariants, [
    { url: 'u-w800.webp', width: 800 },
  ])
})

test('Vita und Beitrag', () => {
  assert.deepEqual(
    vitaFromRow({
      id: 'v',
      year: 2019,
      year_end: null,
      category: 'messe',
      title_de: 'Parallel',
      place: 'Wien',
    }),
    {
      id: 'v',
      year: 2019,
      yearEnd: null,
      category: 'messe',
      titleDe: 'Parallel',
      titleEn: '',
      place: 'Wien',
      sortOrder: 0,
      isPublished: true,
    },
  )
  const post = postFromRow({
    id: 'p',
    slug: 's',
    status: 'veroeffentlicht',
    title_de: null,
    content_de: '<p>x</p>',
    cover_image_url: 'c.webp',
    cover_image_width: 1600,
    cover_image_height: 900,
    published_at: '2026-01-01T10:00:00Z',
  })
  assert.equal(post.titleDe, null)
  assert.equal(post.contentDe, '<p>x</p>')
  assert.equal(post.coverImageUrl, 'c.webp')
  assert.equal(post.coverThumbUrl, null)
  assert.equal(post.status, 'veroeffentlicht')
  assert.equal(
    postFromRow({ id: 'p', slug: 's', status: 'unbekannt' }).status,
    'entwurf',
  )
})

test('Presse: Datei oder Link, unbekannte Typen werden null', () => {
  const item = pressFromRow({
    id: 'x',
    external_url: 'https://e.com',
    file_type: 'doc',
    medium_type: 'radio',
    category: 'interview',
    year: 2019,
    is_highlight: true,
  })
  assert.equal(item.fileType, null)
  assert.equal(item.mediumType, null)
  assert.equal(item.category, 'interview')
  assert.equal(item.year, 2019)
  assert.equal(item.isHighlight, true)
  assert.equal(item.fileUrl, null)
  const file = pressFromRow({
    id: 'y',
    file_url: 'f.pdf',
    file_type: 'pdf',
    medium_type: 'magazin',
    thumbnail_url: 't.webp',
    thumbnail_width: 600,
    thumbnail_height: 800,
  })
  assert.equal(file.fileType, 'pdf')
  assert.equal(file.mediumType, 'magazin')
  assert.equal(file.thumbnailWidth, 600)
  assert.deepEqual(
    pressCategoryFromRow({ slug: 'a', name_de: 'A', sort_order: 10 }),
    { slug: 'a', nameDe: 'A', sortOrder: 10 },
  )
})

test('Interessanter Artikel: nur der Link ist sicher vorhanden', () => {
  const link = curatedFromRow({ id: 'c', url: 'https://e.com/a' })
  assert.deepEqual(
    [link.titleDe, link.source, link.noteDe, link.thumbnailUrl],
    [null, null, null, null],
  )
  assert.equal(link.url, 'https://e.com/a')
})
