// Globale Sichtbarkeitsschalter der öffentlichen Galerie.
// Ein Schalter blendet die Angabe überall aus, löscht aber keine Daten.
// Ab Phase 2 (task-34) werden die Werte aus der Datenbank gelesen. Neue Schalter
// werden hier ergänzt, die Komponenten fragen sie über useGalleryVisibility ab.
export type GalleryVisibility = {
  price: boolean
  dimensions: boolean
  technique: boolean
  year: boolean
  availability: boolean
  description: boolean
}

export const defaultGalleryVisibility: GalleryVisibility = {
  price: true,
  dimensions: true,
  technique: true,
  year: true,
  availability: true,
  description: true,
}

export function useGalleryVisibility(): GalleryVisibility {
  return defaultGalleryVisibility
}
