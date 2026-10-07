import { placeholderImage } from './placeholder'
import type { Post } from './types'

export const posts: Post[] = [
  {
    id: 'post-1',
    slug: 'warum-der-erste-strich-zaehlt',
    titleDe: 'Warum der erste Strich zählt',
    titleEn: '',
    excerptDe:
      'Über Zögern, Entscheidung und die leere Leinwand. Anreißer folgt.',
    excerptEn: '',
    contentDe:
      'Platzhaltertext. Der Beitragstext folgt.\n\n[[bild]]\n\nPlatzhaltertext. Hier setzt der Beitrag fort.',
    contentEn: '',
    coverImageUrl: placeholderImage(1600, 1067),
    coverImageWidth: 1600,
    coverImageHeight: 1067,
    publishedAt: '2026-09-15T09:00:00+02:00',
    status: 'veroeffentlicht',
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: 'post-2',
    slug: 'atelierblick-fliessen-und-fassen',
    titleDe: 'Atelierblick: Fließen und Fassen',
    titleEn: '',
    excerptDe: 'Ein Blick in den Arbeitsprozess. Anreißer folgt.',
    excerptEn: '',
    contentDe: 'Der Beitragstext folgt.',
    contentEn: '',
    coverImageUrl: placeholderImage(1600, 1067),
    coverImageWidth: 1600,
    coverImageHeight: 1067,
    publishedAt: '2026-08-02T09:00:00+02:00',
    status: 'veroeffentlicht',
    sortOrder: 2,
    isPublished: true,
  },
]
