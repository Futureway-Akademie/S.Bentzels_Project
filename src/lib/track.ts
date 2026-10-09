// Anonyme Zähler ohne Personenbezug. Es werden weder Cookies gesetzt noch Adressen oder
// Kennungen gespeichert, in der Datenbank steht nur eine Zahl je Objekt und Tag. Damit ein
// Besucher nicht mehrfach zählt, merkt sich der Browser pro Sitzung (sessionStorage, endet mit
// dem Schließen des Tabs), dass er ein Ereignis schon gesendet hat. Fehler dürfen die Seite nie stören.

type Client = NonNullable<Awaited<typeof import('./supabase')>['supabase']>

/** Führt `run` höchstens einmal je Sitzung und Schlüssel aus. */
export function trackOnce(
  key: string,
  run: (supabase: Client) => PromiseLike<unknown> | undefined,
): void {
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    // Ohne Speicher wird eben öfter gezählt
  }
  void import('./supabase')
    .then(({ supabase }) => (supabase ? run(supabase) : undefined))
    .catch(() => undefined)
}

export type ArtworkEvent = 'view' | 'click' | 'lightbox' | 'inquiry'

/** Zählt ein Ereignis eines Werks: Anzeige in der Übersicht, Öffnen der Werkseite, Großansicht, Werkanfrage. */
export function trackArtwork(artworkId: string, kind: ArtworkEvent): void {
  trackOnce(`art:${kind}:${artworkId}`, (supabase) =>
    supabase.rpc('track_artwork_event', {
      p_artwork: artworkId,
      p_event: kind,
    }),
  )
}
