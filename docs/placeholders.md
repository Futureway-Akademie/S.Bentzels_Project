# Verbleibende Platzhalter und offene Inhalte (task-32)

Stand der Abschlussprüfung. Alles hier muss vor dem Launch ersetzt oder bewusst entschieden werden.

## Platzhalterbilder

| Ort                                      | Datei oder Quelle                                                                      | Ersetzen durch                                             | Wo pflegbar                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------- |
| Beispielwerke (10)                       | `public/platzhalter/*.svg` über `supabase/seed.sql`                                    | echte Werkfotos                                            | Dashboard > Werke           |
| Beispielveranstaltungen (6)              | `/platzhalter/1600x1067.svg`                                                           | Veranstaltungsbilder                                       | Dashboard > Veranstaltungen |
| Beispielbeiträge (2)                     | Platzhalter-Titelbilder                                                                | Titelbilder                                                | Dashboard > Journal         |
| Startseite, Titelbild                    | `placeholderImage(...)` in `src/pages/Home.tsx`                                        | Hauptwerk als Foto                                         | **nur im Code**             |
| Künstler, Atelierporträt und Prozessfoto | `placeholderImage(...)` in `src/pages/Artist.tsx`                                      | Fotos                                                      | **nur im Code**             |
| The Art of Becoming, Porträtfoto         | `placeholderImage(...)` in `src/pages/ArtOfBecoming.tsx`                               | Foto                                                       | **nur im Code**             |
| Vorschaubild beim Teilen (Open Graph)    | `defaultShareImage` in `src/config/site.ts` (SVG, wird von Netzwerken nicht angezeigt) | ein JPG oder PNG, 1200 × 630 px, z. B. `public/teilen.jpg` | **nur im Code**             |

Die vier festen Seitenbilder (Startseite, Künstler, The Art of Becoming) haben kein Dashboard-Modul. Empfehlung: Bilder in `public/` ablegen und die Adressen im Code eintragen, oder ein kleines Dashboard-Modul „Seitenbilder“ ergänzen.

## Platzhaltertexte

- `home.heroAlt`, `artist.portraitAlt`, `artist.processImageAlt`, `artOfBecoming.photoAlt` und die Alt-Texte in den Bereichen Veranstaltung und Beitrag in `src/i18n/de.json` („Platzhalter für …“): mit den echten Bildern passende Beschreibungen eintragen.
- `artOfBecoming.lead[1].bio` „Kurzbio folgt.“ (Antonie Höldrich): Kurzbio ergänzen.
- Beispieldaten in `supabase/seed.sql`: „Beschreibung folgt.“, „Rückblick folgt.“ bei Veranstaltungen, Beispielpresse, die Beispielbeiträge und die Vita. Die Vita stammt aus dem Konzept und ist zu prüfen.
- Rechtstexte: Impressum und Datenschutz sind nach dem Einspielen leer („Inhalt folgt“). Im Dashboard unter „Rechtstexte“ gibt es Vorlagen mit eckigen Klammern (Umsatzsteuer-ID, Hosting-Anbieter, Löschfrist, Garantien für Resend). Rechtlich prüfen lassen.
- Die Ein-Satz-Erklärungen zum wissenschaftlichen Fundament von The Art of Becoming (task-10) sind Entwürfe und fachlich zu prüfen.
- Rechte an Fremdartikeln im Pressearchiv klären, bevor gescannte Artikel veröffentlicht werden.

## Offene Entscheidungen

- Name des exklusiven Kreises (Arbeitstitel „Bentzel Club“, Kandidaten in `.workshop/CURRENT_STATE.md`). Anzeigetexte stehen in `de.json` (`circle.*`), der Pfad in `src/config/routes.ts`.
- `/design-system` ist öffentlich erreichbar (nicht indexiert, in `robots.txt` gesperrt). Für den Livebetrieb entscheiden, ob die Route entfernt wird.
- Adresse der Website (`VITE_SITE_URL`) und Weiterleitung `/sitemap.xml` auf die Edge Function `sitemap`.

## Ergebnis der Breitenprüfung

Alle 21 öffentlichen Seiten (Startseite, Künstler, Galerie, Werk, Seminare mit drei Unterseiten, Netzwerk, Kreis, Veranstaltungen, Veranstaltung, Journal, Beitrag, Presse, Interessante Artikel, Kontakt, Impressum, Datenschutz, Abmeldung, 404) wurden mit Beispieldaten bei 360, 768, 1280 und 1920 px Breite geladen und automatisch geprüft: kein seitliches Überlaufen, keine Elemente außerhalb des Bildschirms, keine defekten Bilder, alle Bilder mit Alt-Attribut, genau eine Hauptüberschrift je Seite. Das Dashboard wurde nicht bei allen Breiten geprüft, und die Prüfung erfolgte gegen einen lokalen Ersatz der Datenbank, nicht gegen das echte Projekt. Touchbedienung auf echten Geräten und Bildschirmleser sind nicht geprüft.
