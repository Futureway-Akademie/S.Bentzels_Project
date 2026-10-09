import { useEffect, useSyncExternalStore } from 'react'

// Globale Sichtbarkeitsschalter der öffentlichen Galerie.
// Ein Schalter blendet die Angabe überall aus, löscht aber keine Daten. Die Werte stehen in
// der Tabelle site_settings (Schlüssel gallery_visibility) und werden im Dashboard unter
// „Sichtbarkeit“ gepflegt. Neue Schalter werden hier und in `src/admin/lib/visibility.ts`
// ergänzt, die Komponenten fragen sie über useGalleryVisibility ab.
// Die Datenbank-Sicht artworks_public blendet ausgeschaltete Angaben zusätzlich serverseitig aus.
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

/** Nur ein ausdrückliches „false“ blendet eine Angabe aus. */
export function parseGalleryVisibility(value: unknown): GalleryVisibility {
  const stored =
    value !== null && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {}
  const result = { ...defaultGalleryVisibility }
  for (const key of Object.keys(result) as (keyof GalleryVisibility)[])
    result[key] = stored[key] !== false
  return result
}

let current: GalleryVisibility = defaultGalleryVisibility
let started = false
const listeners = new Set<() => void>()

// Der Datenbank-Client wird erst beim ersten Bedarf geladen und nur einmal je Besuch gefragt.
function start() {
  if (started) return
  started = true
  void import('../lib/supabase')
    .then(async ({ supabase }) => {
      if (!supabase) return
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'gallery_visibility')
        .maybeSingle()
      if (error || !data) return
      current = parseGalleryVisibility(data.value)
      listeners.forEach((listener) => listener())
    })
    .catch(() => undefined)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useGalleryVisibility(): GalleryVisibility {
  useEffect(start, [])
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => defaultGalleryVisibility,
  )
}
