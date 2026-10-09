// Strukturierte Daten (JSON-LD, schema.org) für Suchmaschinen (reine Funktionen, ohne Imports).
// Es erscheinen nur Angaben, die öffentlich sichtbar sind: ausgeschaltete Angaben (z. B. Preise)
// kommen gar nicht erst aus der Datenbank und fehlen deshalb auch hier.

export type Site = {
  url: string
  name: string
  email: string
  telephone: string
  street: string
  postalCode: string
  locality: string
  organization: string
}

type Json = Record<string, unknown>

/** Entfernt leere Werte, damit keine leeren Felder in den Daten stehen. */
export function compact<T extends Json>(value: T): T {
  const result: Json = {}
  for (const [key, entry] of Object.entries(value)) {
    if (entry === null || entry === undefined || entry === '') continue
    if (Array.isArray(entry) && entry.length === 0) continue
    result[key] = entry
  }
  return result as T
}

const absolute = (
  site: Site,
  path: string | null | undefined,
): string | undefined => {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith('data:')) return undefined
  return `${site.url}${path.startsWith('/') ? '' : '/'}${path}`
}

const address = (site: Site) => ({
  '@type': 'PostalAddress',
  streetAddress: site.street,
  postalCode: site.postalCode,
  addressLocality: site.locality,
  addressCountry: 'DE',
})

export function organizationLd(site: Site): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.organization,
    url: site.url,
    email: site.email,
    telephone: site.telephone,
    address: address(site),
    founder: { '@id': `${site.url}/#person` },
  })
}

export function personLd(site: Site, jobTitle: string): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: site.name,
    url: site.url,
    jobTitle,
    email: site.email,
    telephone: site.telephone,
    address: address(site),
    worksFor: { '@id': `${site.url}/#organization` },
  })
}

export function websiteLd(site: Site): Json {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: site.url,
    inLanguage: 'de-DE',
    publisher: { '@id': `${site.url}/#organization` },
  })
}

export type ArtworkInput = {
  slug: string
  titleDe: string | null
  year: number | null
  techniqueDe: string | null
  supportDe: string | null
  heightCm: number | null
  widthCm: number | null
  depthCm: number | null
  descriptionDe: string | null
  priceEur: number | null
  status: 'verfuegbar' | 'reserviert' | 'verkauft' | null
  mainImageUrl: string
}

const AVAILABILITY: Record<string, string> = {
  verfuegbar: 'https://schema.org/InStock',
  reserviert: 'https://schema.org/LimitedAvailability',
  verkauft: 'https://schema.org/SoldOut',
}

const cm = (value: number) => ({
  '@type': 'QuantitativeValue',
  value,
  unitCode: 'CMT',
})

export function artworkLd(
  site: Site,
  artwork: ArtworkInput,
  fallbackName: string,
): Json {
  const url = `${site.url}/galerie/${artwork.slug}`
  const medium = [artwork.techniqueDe, artwork.supportDe]
    .filter(Boolean)
    .join(', ')
  return compact({
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    '@id': `${url}#werk`,
    name: artwork.titleDe ?? fallbackName,
    url,
    image: absolute(site, artwork.mainImageUrl),
    creator: { '@id': `${site.url}/#person` },
    dateCreated: artwork.year ? String(artwork.year) : undefined,
    artMedium: medium,
    height: artwork.heightCm ? cm(artwork.heightCm) : undefined,
    width: artwork.widthCm ? cm(artwork.widthCm) : undefined,
    depth: artwork.depthCm ? cm(artwork.depthCm) : undefined,
    description: artwork.descriptionDe,
    offers:
      artwork.priceEur !== null
        ? compact({
            '@type': 'Offer',
            price: artwork.priceEur,
            priceCurrency: 'EUR',
            availability: artwork.status
              ? AVAILABILITY[artwork.status]
              : undefined,
            url,
          })
        : undefined,
  })
}

export type EventInput = {
  slug: string
  titleDe: string
  descriptionDe: string | null
  shortDescriptionDe: string | null
  status: string
  imageUrl: string | null
  locationName: string | null
  locationAddress: string | null
  priceEur: number | null
}

const EVENT_STATUS: Record<string, string> = {
  abgesagt: 'https://schema.org/EventCancelled',
  verschoben: 'https://schema.org/EventRescheduled',
}

export function eventLd(
  site: Site,
  event: EventInput,
  dates: { startsAt: string | null; endsAt: string | null },
): Json {
  const url = `${site.url}/veranstaltungen/${event.slug}`
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': `${url}#veranstaltung`,
    name: event.titleDe,
    url,
    description: event.shortDescriptionDe ?? event.descriptionDe,
    startDate: dates.startsAt ?? undefined,
    endDate: dates.endsAt ?? undefined,
    eventStatus:
      EVENT_STATUS[event.status] ?? 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: absolute(site, event.imageUrl),
    location:
      event.locationName || event.locationAddress
        ? compact({
            '@type': 'Place',
            name: event.locationName,
            address: event.locationAddress,
          })
        : undefined,
    organizer: { '@id': `${site.url}/#organization` },
    offers:
      event.priceEur !== null
        ? { '@type': 'Offer', price: event.priceEur, priceCurrency: 'EUR', url }
        : undefined,
  })
}

export type PostInput = {
  slug: string
  titleDe: string | null
  excerptDe: string | null
  publishedAt: string | null
  coverImageUrl: string | null
}

export function postLd(
  site: Site,
  post: PostInput,
  fallbackTitle: string,
): Json {
  const url = `${site.url}/journal/${post.slug}`
  return compact({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#beitrag`,
    headline: post.titleDe ?? fallbackTitle,
    url,
    description: post.excerptDe,
    datePublished: post.publishedAt ?? undefined,
    image: absolute(site, post.coverImageUrl),
    author: { '@id': `${site.url}/#person` },
    publisher: { '@id': `${site.url}/#organization` },
    mainEntityOfPage: url,
  })
}

/** Kürzt einen Text für die Meta-Beschreibung auf höchstens `max` Zeichen an einer Wortgrenze. */
export function summarize(
  text: string | null | undefined,
  max = 160,
): string | null {
  const clean = (text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!clean) return null
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, '')}…`
}
