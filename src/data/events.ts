import { placeholderImage } from './placeholder'
import type { Course, EventItem, EventPhoto } from './types'

const address = 'Fürstenweg 1, 91330 Bammersdorf'

export const events: EventItem[] = [
  {
    id: 'event-1',
    slug: 'atelierabend-kunst-denken-begegnung',
    titleDe: 'Atelierabend: Kunst. Denken. Begegnung.',
    titleEn: '',
    descriptionDe:
      'Ein Abend im Atelier mit Vortrag, Gespräch und Werkbetrachtung. Beschreibung folgt.',
    descriptionEn: '',
    startsAt: '2026-11-14T18:30:00+01:00',
    endsAt: '2026-11-14T21:30:00+01:00',
    locationName: 'Schloss Jägersburg',
    locationAddress: address,
    imageUrl: placeholderImage(1600, 1067),
    capacity: 30,
    registrationOpen: true,
    recapTextDe: null,
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 'event-2',
    slug: 'salon-kunstgeschichte-neu-erleben',
    titleDe: 'Salon: Kunstgeschichte neu erleben',
    titleEn: '',
    descriptionDe:
      'Ein Salonabend mit persönlichen Zugängen zur Kunstgeschichte. Beschreibung folgt.',
    descriptionEn: '',
    startsAt: '2026-12-05T18:00:00+01:00',
    endsAt: '2026-12-05T21:00:00+01:00',
    locationName: 'Schloss Jägersburg',
    locationAddress: address,
    imageUrl: placeholderImage(1600, 1067),
    capacity: 20,
    registrationOpen: true,
    recapTextDe: null,
    sortOrder: 2,
    isPublished: true,
  },
  {
    id: 'event-3',
    slug: 'vernissage-sommer-2026',
    titleDe: 'Kleine Vernissage im Sommer',
    titleEn: '',
    descriptionDe: 'Rückblick folgt.',
    descriptionEn: '',
    startsAt: '2026-06-20T18:00:00+02:00',
    endsAt: '2026-06-20T21:00:00+02:00',
    locationName: 'Schloss Jägersburg',
    locationAddress: address,
    imageUrl: placeholderImage(1600, 1067),
    capacity: 40,
    registrationOpen: false,
    recapTextDe: 'Ein Rückblick auf den Abend folgt.',
    sortOrder: 3,
    isPublished: true,
  },
  {
    id: 'event-4',
    slug: 'atelierbesuch-fruehling-2026',
    titleDe: 'Atelierbesuch im Frühling',
    titleEn: '',
    descriptionDe: 'Rückblick folgt.',
    descriptionEn: '',
    startsAt: '2026-04-18T17:00:00+02:00',
    endsAt: '2026-04-18T20:00:00+02:00',
    locationName: 'Schloss Jägersburg',
    locationAddress: address,
    imageUrl: placeholderImage(1600, 1067),
    capacity: 25,
    registrationOpen: false,
    recapTextDe: null,
    sortOrder: 4,
    isPublished: true,
  },
]

export const courses: Course[] = [
  {
    id: 'course-1',
    titleDe: 'Malen ohne Vorkenntnisse',
    titleEn: '',
    descriptionDe:
      'Ein Tag mit Leinwand, Farbe und Spachtel. Beschreibung folgt.',
    startsAt: '2026-11-21T10:00:00+01:00',
    endsAt: '2026-11-21T17:00:00+01:00',
    location: 'Schloss Jägersburg',
    capacity: 8,
    priceEur: 180,
    registrationOpen: true,
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 'course-2',
    titleDe: 'Kohle und Intuition',
    titleEn: '',
    descriptionDe:
      'Zeichnen mit Kohle als Weg zur eigenen Formensprache. Beschreibung folgt.',
    startsAt: '2027-01-23T10:00:00+01:00',
    endsAt: '2027-01-23T17:00:00+01:00',
    location: 'Schloss Jägersburg',
    capacity: 8,
    priceEur: 180,
    registrationOpen: true,
    sortOrder: 2,
    isPublished: true,
  },
]

// Platzhalter für Rückblick-Fotos (Maße für platzsparendes Laden ohne Layoutsprünge).
const photoSizes: [number, number][] = [
  [1600, 1067],
  [1067, 1600],
  [1600, 1067],
]

export const eventPhotos: EventPhoto[] = photoSizes.map(([w, h], i) => ({
  id: `event-photo-${i + 1}`,
  eventId: 'event-3',
  imageUrl: placeholderImage(w, h),
  imageWidth: w,
  imageHeight: h,
  sortOrder: i + 1,
}))

// Platzhalter für die Zahl angemeldeter Personen je Veranstaltung (inkl. Begleitung).
// Ab Phase 3 wird sie aus den Anmeldungen berechnet.
export const registeredGuests: Record<string, number> = {
  'event-1': 21,
  'event-2': 4,
}
