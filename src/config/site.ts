// Stammdaten der Website für Suchmaschinen und Vorschaukarten.
// Die Adresse kommt aus VITE_SITE_URL (Launch, task-33), sonst vom aktuellen Aufruf.
import type { Site } from '../lib/seoLd'

const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()

export const siteUrl = (
  configured || (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/+$/, '')

export const site: Site = {
  url: siteUrl,
  name: 'Stephan Graf Bentzel-Sturmfeder',
  organization: 'Sturmfeder Projects',
  email: 'stephan.bentzel@viqua.de',
  telephone: '+49 177 4346401',
  street: 'Schloss Jägersburg, Fürstenweg 1',
  postalCode: '91330',
  locality: 'Bammersdorf',
}

export const defaultShareImage = '/platzhalter/4800x2000.svg'
