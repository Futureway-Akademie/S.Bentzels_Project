# Architektur

Geplant (siehe `.workshop/specialization/STACK.md`):

- Frontend: React, TypeScript, Tailwind, Vite, react-i18next
- Daten: bis Phase 2 typisierte Platzhalter in `src/data/`, danach Supabase
- Backend: Supabase mit Row Level Security, Storage, Auth, Edge Functions (Resend)
- Bereiche: Künstler und Galerie, Seminare und Vorträge, Netzwerk, Journal, Admin-Dashboard

Details folgen mit der Umsetzung.

## Design-System (task-2)

- Tokens und Basisstile: `src/styles/index.css` (Tailwind `@theme`, Klassen `.label`, `.btn`, `.btn-link`, `.reveal`, `.container-page`, `.grid-12`, `.prose-measure`, `.artwork-img`)
- Komponenten: `src/components/Button.tsx`, `src/components/Reveal.tsx`
- Vorschauseite zur Abnahme: `/design-system` (wird vor dem Launch entfernt)

## Platzhalterdaten (task-4)

- `src/data/types.ts`: Typen entsprechen dem geplanten Supabase-Datenmodell (Werke, Werkbilder, Journal, Veranstaltungen, Eventfotos, Kunstkurse, Vita). Felder mit `*De` und `*En` für spätere Übersetzung.
- `src/data/artworks.ts` (8 Werke), `events.ts` (3 Veranstaltungen, 2 Kurse), `posts.ts` (2 Beiträge), `vita.ts` (44 Einträge), `placeholder.ts` (graue SVG-Platzhalter in Originalproportionen).
- Beitrags- und Beschreibungstexte, Termine und Orte der Veranstaltungen und Kurse sowie alle Bilder sind Platzhalter und werden in Phase 2 durch Supabase-Daten ersetzt.
- Die Dashboards für Werke, Journal und Veranstaltungen folgen in Phase 2 (task-17 bis 19).

## Komponenten (task-3)

- `SectionLabel`: nummerierter Abschnitt („01 — WERKE“)
- `ArtworkCard`: Werk mit Bild in Originalproportionen, Titel, Jahr, Maßen und Statuslabel, verlinkt auf `/galerie/:slug`
- `Timeline`: Jahr links, Eintrag rechts, aus `VitaEntry[]`
- `Lightbox`: Vollbild per Portal mit Zoom, Pfeiltasten, Esc, Zählung, Fokus auf „Schließen“ und Fokus-Rückgabe, Seiten-Scroll gesperrt
- Alle Komponenten sind auf `/design-system` zu sehen. Wischgesten für die Lightbox folgen in task-31.

## Layout und Routing (task-5)

- `src/config/routes.ts`: alle Pfade zentral. Der Pfad des exklusiven Kreises (`routes.circle`, Arbeitstitel „Bentzel Club“) wird nur hier festgelegt. Der Anzeigename steht in `de.json` unter `circle.name`.
- `src/layout/`: `Layout` (Header, Inhalt, Footer, Scroll nach oben), `Header` (Dropdowns auf dem Desktop, Vollbild-Menü unter 1024 px), `Footer`, `Logo`, `navItems`.
- Seiten ohne eigenen Inhalt nutzen `PagePlaceholder`, bis sie in task-6 bis 12 umgesetzt werden. Unbekannte Pfade zeigen die 404-Seite mit Link zur Galerie (im Stil nachgezogen in task-28).

## Startseite (task-6)

- `src/pages/Home.tsx`: Hero mit Namen und Platzhalterbild, Statement, vier nummerierte Abschnitte (Werke, The Art of Becoming, nächste Begegnung, Journal). Werke, nächster Termin und neuester Beitrag werden aus `src/data/` abgeleitet und später aus Supabase geladen. Mehrteilige Werke laufen über die volle Breite, die übrigen im Spalten-Raster. Fehlt eine kommende Veranstaltung, entfällt der Abschnitt „Nächste Begegnung“ und das Journal wird „03“.
- `src/lib/format.ts`: deutsche Datums- und Zeitformate.

## Künstlerseite (task-7)

- `src/pages/Artist.tsx` (`/kuenstler`): Statement, Porträt mit Einleitung, kreativer Prozess in vier Phasen (Bild und Text abwechselnd), Überleitung zu The Art of Becoming, Vita nach Kategorien (Ausbildung, Ausstellungen, Messen, Kuratorische Projekte) und Zitat „Stimmen“. Die Vita kommt aus `src/data/vita.ts`.
- Porträt und Prozessfotos sind graue Platzhalter.

## Galerie und Werkdetail (task-8)

- Werkdaten: Bis auf Bild und Kennung sind alle Angaben optional (`null`). Untergrund ist Freitext (`supportDe`). Dieselbe Struktur gilt für die Datenbank in Phase 2.
- `src/config/gallerySettings.ts`: globale Sichtbarkeitsschalter (Preis, Maße, Technik, Jahr, Verfügbarkeit, Beschreibung) über `useGalleryVisibility()`. Aktuell Konfiguration im Code, ab task-34 aus der Datenbank. Ein Schalter blendet nur aus und löscht nichts. Neue Schalter werden dort ergänzt.
- `src/pages/Gallery.tsx`: Filter (Untergrund, Zyklus, Jahr, nur verfügbare) entstehen aus den vorhandenen Daten und entfallen bei fehlender oder ausgeblendeter Angabe, Zustand in der URL. Ruhiges Masonry (1 bis 4 Spalten), Mehrteiler in voller Breite.
- `src/pages/ArtworkDetail.tsx`: Bild zuerst, Werkinformationen optional aufklappbar, „Werk anfragen“ vorerst als mailto (Formular in task-23), Vor/Zurück.
- `src/components/Lightbox.tsx`: drei Zoomstufen, Pfeiltasten, Wischen, Wechsel zwischen allen Werken mit Anpassung der URL.
- Fehlende oder ausgeblendete Angaben, auch der Preis, werden nicht angezeigt. Alt-Texte nennen das Jahr nur, wenn es sichtbar ist.

## Seminare, Kunstkurse und Vorträge (task-9)

- `src/pages/Seminars.tsx` (`/seminare`): Label „Ein Format von Sturmfeder Projects“, Headline, Text, drei große Kacheln (invertieren beim Hover). `Courses.tsx` (`/seminare/kunstkurse`): Text und kommende Termine aus `courses` (nur zukünftige, veröffentlichte). `Talks.tsx` (`/seminare/vortraege`): vier nummerierte Themen, Zielgruppe.
- Die Buttons „Individuellen Kunstkurs anfragen“ und „Vortrag anfragen“ sind vorerst E-Mail-Links mit Betreff. Die Formulare folgen in task-23.
- Kurstermine, -beschreibungen und -orte sind Platzhalter.

## The Art of Becoming (task-10)

- `src/pages/ArtOfBecoming.tsx` (`/seminare/the-art-of-becoming`): Hero mit Kernbotschaft, Einleitung, Vierzeiler (zeilenweise gestaffelt eingeblendet), vier Module, Erlebnisliste, wissenschaftliches Fundament als Akkordeon (native `details`), Eckdaten, Leitung, Abschluss-CTA. Alle Texte stehen unter `becoming.*` in `de.json`.
- Die Überraschungsinterventionen der Module sind bewusst nicht genauer beschrieben als im Masterprompt.
- Die Ein-Satz-Erklärungen zum wissenschaftlichen Fundament sind Entwürfe und müssen fachlich geprüft werden. Porträtfotos und die Kurzbio von Antonie Höldrich sind Platzhalter.
- Der Termin-Button ist vorerst ein E-Mail-Link (Formular in task-23).

## Netzwerk, Veranstaltungen und exklusiver Kreis (task-11)

- `src/pages/Network.tsx` (`/netzwerk`): Text, „Kunst als verbindendes Element“, Dreiklang, kommende Veranstaltungen (`EventRow`: Datum groß, Titel, Ort, freie Plätze, Button „Anmelden“) und Rückblick vergangener Veranstaltungen, abgeleitet aus `events` anhand des Enddatums.
- `src/pages/EventDetail.tsx` (`/netzwerk/:slug`): Datum, Uhrzeit, Ort mit Adresse, Beschreibung, Bild, Anmeldung (nur bei offener, noch nicht vergangener Veranstaltung), bei vergangenen Rückblicktext und Fotos. Der Anmelden-Button ist vorerst ein E-Mail-Link (Formular, Kapazität und Warteliste in task-24).
- `src/pages/Circle.tsx` (`routes.circle`): exklusivere Inszenierung mit mehr Weißraum und langsamerer Einblendung.
- Name des Kreises (Arbeitstitel „Bentzel Club“): Anzeigetexte stehen nur in `de.json` unter `circle.*` (name, nameWithArticle, interest, interestSubject), der URL-Pfad nur in `src/config/routes.ts`. Für eine Umbenennung genügen diese zwei Dateien.
- Angemeldete Personen (`registeredGuests`), Eventfotos und die Veranstaltungen sind Platzhalter. Die Regel „Noch X Plätze frei erst ab weniger als 10“ folgt in task-24.

## Journal, Kontakt und Rechtsseiten (task-12)

- `src/pages/Journal.tsx` (`/journal`): veröffentlichte Beiträge nach Datum, mit Titelbild, Datum, Titel und Anreißer. `JournalPost.tsx` (`/journal/:slug`): lesbare Typografie (19 px, Zeilenhöhe 1,75, maximal 65 Zeichen), Titelbild, Anreißer, Text mit Bild im Text. Der Beitragsinhalt nutzt vorerst ein einfaches Blockformat (`src/lib/postContent.ts`: Absätze, `[[bild]]` für ein Bild), das in Phase 2 durch den Rich-Text-Editor ersetzt wird.
- `src/pages/Contact.tsx` (`/kontakt`): Adresse, E-Mail, Telefon und Formular mit Unterlinien-Feldern und Validierung. Beim Absenden öffnet sich vorerst das E-Mail-Programm (Übergangslösung bis task-22/23).
- `src/pages/LegalPage.tsx`: Impressum und Datenschutz mit „Inhalt folgt“ (Pflege im Dashboard in task-29).

## Presse und interessante Artikel (task-37)

- Navigation: Menüpunkt „Presse“ mit „Pressearchiv“ (`/presse`) und „Interessante Artikel“ (`/presse/interessante-artikel`), Pfade in `src/config/routes.ts`. Die Desktop-Navigation hat bei 1024 px engere Abstände und bricht nicht um.
- Daten: `PressItem` und `CuratedLink` in `src/data/types.ts` spiegeln das geplante Datenmodell. Bei Presseeinträgen sind alle Angaben außer Datei bzw. Link optional, bei Links nur die URL. Kategorien: Pressebericht, Interview, Porträt, Ausstellung, Kunst.
- `src/pages/Press.tsx`: Hervorgehobene Einträge zuerst, dann das Archiv. Filter nach Kategorie und Jahr entstehen aus vorhandenen Angaben (Jahr aus Datum oder Jahresfeld). Bilder öffnen in der Lightbox, PDFs und externe Links in neuem Tab mit `rel="noopener noreferrer"`.
- `src/components/PressCard.tsx`: zeigt nur vorhandene Angaben. Ohne Vorschaubild erscheint bei Bildern die Datei selbst, bei PDFs eine typografische Kachel „PDF“.
- `src/pages/CuratedArticles.tsx`: ohne Titel dient der Domainname als Titel.
- Presseeinträge, Autoren, Medien und Links sind Platzhalter. `public/platzhalter.pdf` ist ein Platzhalter-PDF. Vorschaubilder aus PDF-Seiten, Upload und Pflege folgen in Phase 2 (task-15, task-38, task-39).

## Mobile-Prüfung (task-13)

- Alle 22 öffentlichen Routen wurden bei 360, 768, 1280 und 1920 px automatisiert geprüft (horizontales Scrollen, Überlauf über den Rand, verzerrte Bilder, abgeschnittene Texte, zu kleine Bedienflächen, fehlende Überschrift).
- Behoben: Silbentrennung für Überschriften (`hyphens: auto`, Seite ist als Deutsch markiert), Fußzeilen-Raster auf Tablet-Breite (E-Mail-Adresse wurde abgeschnitten), Höhe der Menüeinträge am Desktop (30 px), mobiles Menü setzt direkt unter der Kopfzeile an.

## Datenbank, Sicherheit und Login (task-14)

- `supabase/migrations/0001_schema.sql`: alle Tabellen (Werke, Werkbilder, Journal, Veranstaltungen, Eventfotos, Kurse, Vita, Presse, Links, Anfragen, Anmeldungen, Statistik, Einstellungen, Admins), Row Level Security auf allen Tabellen, `is_admin()`, `artworks_public` (ausgeblendete Angaben serverseitig leer), `track_artwork_event()` (Zähler ohne Personenbezug). Anleitung zum Einspielen: `docs/SUPABASE_SETUP.md`.
- Test des Schemas gegen eine echte lokale PostgreSQL-Datenbank (PGlite) mit nachgebauten Supabase-Rollen: `node supabase/tests/schema.test.mjs` (23 Prüfungen).
- `src/lib/supabase.ts`: Client, nur aktiv wenn `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` gesetzt sind. Die öffentliche Seite funktioniert auch ohne.
- `src/admin/`: Login (`/admin/login`), geschützter Bereich (`/admin`, vorerst Platzhalter), Prüfung über die Tabelle `admins`. Wird nur bei Bedarf nachgeladen, mit `noindex`. Es gibt keine Registrierung.
- Abweichungen vom Masterprompt: Anmeldungen (`registrations`) sind nicht öffentlich einfügbar, sondern laufen über die Edge Function mit Kapazitätsprüfung (task-24). Posts leiten `is_published` aus `status` ab.

## Speicher und Bild-Upload (task-15)

- `supabase/migrations/0002_storage.sql`: Buckets `artworks`, `posts`, `events`, `people`, `press` (öffentlich lesbar, Hochladen, Ersetzen, Löschen und Auflisten nur Admins, nur Bild- bzw. PDF-Typen, Größenlimit), Vorschauspalte `thumb_url` für weitere Werkbilder und Eventfotos.
- `src/admin/lib/imageMath.ts`: reine Rechenfunktionen (Verkleinerung ohne Hochskalieren, Bildausschnitt, Dateitypen, PDF-Erkennung, Zerlegen und Gruppieren von Speicheradressen), getestet in `imageMath.test.ts`.
- `src/admin/lib/images.ts`: `processImage` verkleinert auf höchstens 2400 px, kodiert als WebP (Rückfall auf JPEG, falls der Browser kein WebP erzeugt) und erzeugt die 800-px-Vorschau, optional aus einem Bildausschnitt. Das Original bleibt unverändert.
- `src/admin/lib/pdfThumbnail.ts`: Vorschau aus der ersten PDF-Seite mit `pdfjs-dist` (nur bei Bedarf geladen, der Arbeiter liegt lokal im Build).
- `src/admin/lib/storage.ts`: `uploadImage`, `uploadPressFile` (Bild oder PDF), `removeFilesByUrl`, `deleteArtworkWithFiles`, `deletePressItemWithFiles`. Bei einem Fehler wird nichts Halbes zurückgelassen. Beim Löschen wird zuerst der Datenbankeintrag und danach werden die Dateien entfernt.
- Die Bedienoberfläche für den Upload folgt im Dashboard (task-17, task-38).

## Dashboard-Grundgerüst (task-16)

- `src/admin/AdminRoutes.tsx`: `/admin/login` und, hinter `RequireAdmin`, das Layout mit allen Modulen. Module sind in `src/admin/modules.ts` beschrieben (Pfad, Beschriftung, `ready`). Neue Module (Rechtstexte, Sichtbarkeit, Statistik) werden dort ergänzt, nicht umgesetzte zeigen eine Platzhalterseite.
- `RequireAdmin`: Zugriff nur für Admins. Ohne Anmeldung Weiterleitung zum Login, ohne Admin-Eintrag „kein Zugriff“, bei einer Verbindungsstörung (nach etwa 8 bis 9 Sekunden) eine eigene Meldung mit „Erneut versuchen“. Die eigentliche Sicherheit liegt in den Datenbankregeln.
- `AdminLayout`: feste Seitenleiste ab 1024 px, darunter Kopfleiste mit ausklappbarem Menü (schließt mit Esc und beim Seitenwechsel, Einträge 44 px hoch). Zähler neuer Eingänge in der Seitenleiste.
- `pages/Overview.tsx`, `overviewData.ts`: neue Eingänge (Zahl und die letzten 5), nächste Veranstaltung mit belegten Plätzen (nur Status „angemeldet“, inklusive Begleitung), verfügbare und gesamte Werke (archivierte zählen nicht). Leerzustände und Fehlerzustand mit „Erneut versuchen“. Daten laden über `useLoad`.

## Dashboard-Modul Werke (task-17)

- `src/admin/pages/Artworks.tsx` (`/admin/werke`): Ablagefeld für mehrere Bilder (aus jedem Bild entsteht ein Werk, optional sofort veröffentlicht), Raster der Werke mit Vorschau in Originalproportionen, Schnellschalter (sichtbar, Highlight, Status), Duplizieren, Archivieren, Reihenfolge per Ziehen und Ablegen oder per „Nach vorn/hinten“ (für Touch und Tastatur), Archiv-Ansicht mit Wiederherstellen und endgültigem Löschen.
- `src/admin/pages/ArtworkEdit.tsx` (`/admin/werke/:id`): Bild ersetzen, Vorschau mit Bildausschnitt (`CropEditor`: Rahmen ziehen, Griff, Seitenverhältnisse, Pfeiltasten), weitere Bilder (hinzufügen, sortieren, entfernen), alle Angaben als optionales, validiertes Formular. Die Adresse (Slug) entsteht beim Speichern aus dem Titel und ist eindeutig.
- `src/admin/lib/`: `artworks.ts` (Datenzugriff), `artworkForm.ts` (Formular und Prüfung), `slug.ts`, `order.ts`, `cropMath.ts` (reine Funktionen, getestet in `adminLib.test.ts`), `errors.ts`.
- Dateien werden je Werk in einem eigenen Ordner gespeichert (`artworks/<Werk-Kennung>/`). Beim Duplizieren werden die Dateien kopiert, damit das Löschen einer Kopie nie Bilder des Originals entfernt. Ein neues Bild ersetzt alte Dateien erst nach erfolgreichem Speichern.
- Der Bildausschnitt erzeugt nur eine neue 800-px-Vorschau aus dem gespeicherten Bild (höchstens 2400 px) und speichert den Ausschnitt in `thumb_crop`. Das gespeicherte Bild bleibt unverändert.
- `ToastProvider` (Rückmeldungen), `ConfirmDialog` (Bestätigung vor dem Löschen, Fokus bei „Abbrechen“, Esc bricht ab), `Dropzone` (Ziehen oder Auswählen).
- Die öffentliche Galerie liest noch die Platzhalterdaten (task-20).

## Dashboard-Module Journal und Vita (task-18)

- `src/admin/pages/Journal.tsx` (`/admin/journal`): Beiträge nach Datum, Status (Entwurf oder Veröffentlicht), Titelbild-Vorschau, Veröffentlichen und Zurück zum Entwurf, Löschen mit Bestätigung (entfernt alle Bilder des Beitrags). „Neuer Beitrag“ legt sofort einen Entwurf an, damit Bilder einem Beitrag zugeordnet sind.
- `src/admin/pages/JournalEdit.tsx` (`/admin/journal/:id`): Angaben (Titel, Anreißer, Status, Datum), Titelbild und Rich-Text-Editor. Vorschau im Stil der öffentlichen Seite, Hinweis auf ungespeicherte Änderungen mit Schutz vor ungewolltem Verlassen. Wer veröffentlicht, ohne Datum zu setzen, erhält den aktuellen Zeitpunkt. Beim Speichern entstehen Adresse (aus dem Titel), bereinigter Text (leere Absätze am Ende entfallen) und das Aufräumen nicht mehr verwendeter Bilder im Ordner des Beitrags.
- `src/admin/components/RichTextEditor.tsx` (Tiptap, nur bei Bedarf geladen): Überschrift, Unterüberschrift, Fett, Kursiv, Zitat, Liste, Nummerierte Liste, Link (nur http, https, mailto, tel) und Bild (Upload mit Beschreibung, wird nach dem aktuellen Absatz eingefügt). Gespeichert wird HTML.
- `src/lib/sanitizeHtml.ts` (DOMPurify): erlaubt nur die Elemente des Editors, entfernt Skripte, Ereignis-Attribute, Formulare, eingebettete Rahmen und Bilder ohne http-Adresse und setzt `rel="noopener noreferrer"` bei Links in neuem Tab. Wird für die Vorschau genutzt und muss auch die öffentliche Beitragsseite (task-20) vor der Anzeige verwenden. Die Beitragstypografie steckt in der Klasse `.post-content`.
- `src/admin/pages/Vita.tsx` (`/admin/vita`): Einträge nach Kategorie, neueste zuerst, direkte Bearbeitung in der Liste, Sichtbarkeit umschalten, Löschen mit Bestätigung. Prüfung: Jahr vierstellig, Endjahr nicht vor dem Startjahr, Eintrag Pflicht.
- `supabase/migrations/0003_posts_cover_thumb.sql`: Spalte `cover_thumb_url` für das Titelbild-Vorschaubild.
- Hinweis: Das Journal im Dashboard setzt Migration 0003 im Supabase-Projekt voraus. Die englischen Felder von Beiträgen und Vita sind in der Datenbank vorhanden, aber noch ohne Oberfläche.

## Datenmodell Veranstaltungsmodul (task-40)

Migration `supabase/migrations/0004_events_module.sql`.

- **Ein Modul:** `events` gilt für Seminare, Gruppenkurse, Workshops, Vorlesungen, Events, Ausstellungen und Kunstprojekte. Die Art steht in der erweiterbaren Tabelle `event_types` (acht Standardarten, im Dashboard ergänzbar). Die Tabelle `courses` entfällt, ihre Zeilen werden als Art „Gruppenkurs“ übernommen.
- **Pflicht ist nur der Titel.** Datum, Ende, Plätze und alle weiteren Angaben sind optional. Die Adresse (Slug) entsteht automatisch (`veranstaltung-…`). Status: geplant, Anmeldung möglich, wenige Plätze, ausgebucht, verschoben, abgesagt, beendet, archiviert.
- **Termine:** Der erste Termin steht in `events.starts_at` und `ends_at`. Weitere Termine (mehrere, wiederkehrende, mehrtägige Reihen) stehen in `event_dates` und lassen sich einzeln verschieben oder absagen. „Eine Veranstaltung mit mehreren Terminen“ ist damit getrennt von „mehreren eigenständigen Veranstaltungen“. `recurrence_rule` hält die Regel fest, die Termine selbst werden einzeln gespeichert. `copied_from` merkt sich das Original beim Duplizieren.
- **Öffentlich** liest man nur `events_public` (sichtbar: veröffentlicht, und entweder laufend oder im sichtbaren Archiv, einstellbar mit `archive_visible`) und `event_occurrences` (alle Termine für Kalender und Liste). Die Tabellen `events` und `event_dates` sind für Besucher gesperrt, interne Notizen verlassen die Datenbank nie.
- **Sichtbarkeitsschalter** in `site_settings` (Schlüssel `event_visibility`: Preis, freie Plätze, Teilnehmerzahl, Referent, Ort). Ausgeschaltete Angaben sind in `events_public` leer, bleiben aber gespeichert. Das Dashboard für die Schalter folgt mit task-34.
- **Anfragen:** `inquiries` hat `event_id` und `persons` sowie die Art `veranstaltung`. Öffentlich einfügbar sind nur Anfragen zu öffentlich sichtbaren Veranstaltungen.
- **Statistik ohne Personenbezug:** `event_stats` zählt je Veranstaltung und Tag Ansichten, Detailaufrufe, Klicks auf „Informationen anfragen“ und Anfragen (Funktion `track_event_event`).
- **Rollen:** `admins.role` ist `admin` oder `event_editor`. `is_admin()` gilt nur für `admin`, `is_event_editor()` für beide. Letztere steuert die Rechte auf Veranstaltungen, Termine, Arten, Fotos, Veranstaltungsanfragen, Anmeldungen, Statistik und den Speicher-Bucket `events`. Alles andere bleibt Administratoren vorbehalten, durchgesetzt von der Datenbank. Das Dashboard lässt bis task-42 nur Administratoren ein (`AuthProvider` prüft die Rolle).
- **Vorbereitet, nicht gebaut:** `registration_mode` (`anfrage` oder `verbindlich`) für die spätere verbindliche Anmeldung. Warteliste, Zahlung und Rechnungen folgen später in eigenen Tabellen.
- Der Bucket `events` erlaubt jetzt auch PDF (bis 25 MB).
- Die Dashboard-Übersicht lädt die nächste Veranstaltung auch ohne Ende oder Plätze und überspringt abgesagte, beendete und archivierte.

## Dashboard: Veranstaltungen (task-19)

- `src/admin/pages/Events.tsx` (`/admin/veranstaltungen`): Schnellanlage mit Titel, optionalem Datum und optionaler Art. Reiter Kommende, Vergangene, Archiv und Alle (ohne Datum zählt eine Veranstaltung als kommend, `scopeOf` in `eventForm.ts`). Je Zeile: Status direkt änderbar, veröffentlichen oder ausblenden, hervorheben, duplizieren, archivieren oder wiederherstellen, löschen mit Bestätigung. Alle Schalter speichern sofort.
- `src/admin/pages/EventEdit.tsx` (`/admin/veranstaltungen/:id`): ein Formular mit Grunddaten (Art mit „Neue Art anlegen“, Kategorie, Kurz- und ausführliche Beschreibung), Status und Sichtbarkeit (veröffentlicht, hervorgehoben, im Archiv sichtbar), Termin (Beginn, Ende, Uhrzeit anzeigen, mehrtägig, „Auf einen anderen Tag verschieben“, „Veranstaltung absagen“), weiteren Terminen, wiederkehrenden Terminen, Ort und Referent, Plätzen, Preis und Anmeldung, weiteren Informationen, Bildern und PDF sowie interner Notiz. Gespeichert wird mit „Speichern“, ungespeicherte Änderungen lösen eine Warnung beim Verlassen aus.
- **Termine:** Der erste Termin liegt in `events`, weitere in `event_dates`. „Termine erzeugen“ legt wöchentliche, zweiwöchentliche oder monatliche Termine mit gleicher Uhrzeit und Dauer an (höchstens 60). Jeder Termin lässt sich einzeln ändern, absagen oder entfernen. Beim Speichern werden entfernte Termine gelöscht, bekannte aktualisiert, neue angelegt.
- **Duplizieren** (`duplicateEvent`): übernimmt alle Angaben, Titelbild, weitere Bilder und PDF (Dateien werden kopiert, das Löschen einer Kopie berührt das Original nie). Die Kopie hat kein Datum, ist nicht veröffentlicht und geplant. Weitere Termine werden nicht übernommen. Danach öffnet sich die Kopie zum Eintragen des neuen Datums. Bei einem Fehler wird nichts Halbes zurückgelassen.
- **Dateien** im Bucket `events`, je Veranstaltung ein Ordner: Bilder wie bei den Werken (höchstens 2400 px, WebP, 800-px-Vorschau, nie beschnitten), PDF unverändert (höchstens 25 MB, Prüfung auf PDF-Kennung, `uploadPdf` in `storage.ts`). Löschen entfernt alle Dateien des Ordners.
- `src/admin/lib/eventForm.ts` (reine Funktionen, getestet in `eventForm.test.ts`): Prüfung, Umwandlung, Wiederholung, Verschieben, Zuordnung zu den Reitern. `src/admin/lib/events.ts`: Datenzugriff. `src/admin/components/FormField.tsx`: Textfeld, Kontrollkästchen und Abschnitt mit Fehlertext und Hinweis per ARIA.
- Die Kunstkurse haben kein eigenes Dashboard-Modul mehr, sie sind Veranstaltungen der Art „Gruppenkurs“.
- Die öffentliche Website liest weiterhin die Platzhalterdaten (task-41 und task-20).

## Öffentlicher Veranstaltungskalender (task-41)

- **Seiten:** `/veranstaltungen` (`src/pages/Events.tsx`) und `/veranstaltungen/:slug` (`src/pages/EventPage.tsx`), beide erst beim Öffnen geladen, damit der Datenbank-Client nicht in das Haupt-Bundle gelangt. Neuer Menüpunkt „Veranstaltungen“. Die Menüleiste wechselt jetzt erst ab 1100 px (statt 1024 px) auf die breite Darstellung, weil sieben Punkte bei 1024 px nicht passten. Die Seiten Kunstkurse und Netzwerk verweisen auf den Kalender.
- **Übersicht:** „Nächste Veranstaltungen“ mit bis zu drei großen Karten (hervorgehobene zuerst, dann nach dem nächsten Termin, abgesagte nicht). Darunter der Kalender mit vier Ansichten: Kommende (eine Zeile je Veranstaltung mit dem nächsten Termin, Veranstaltungen ohne Datum als „Termin folgt“), Liste (jeder Termin, nach Monaten gruppiert), Monat (Raster ab 768 px, auf dem Smartphone dieselben Termine als Liste) und Archiv. Ansicht, Filter und Monat stehen in der Adresszeile und lassen sich teilen.
- **Filter** (eingeklappt, öffnen sich bei aktivem Filter): Art, Monat, Ort, Referent, Verfügbarkeit. Felder ohne Werte erscheinen nicht, ist zum Beispiel der Ort zentral ausgeschaltet, entfällt der Ortsfilter.
- **Detailseite:** zeigt nur vorhandene Angaben (Datum, Ort, Referent, Teilnehmerzahl, freie Plätze, Preis, Anmeldefrist, Beschreibung, Zielgruppe, Voraussetzungen, Material, Leistungen, PDF, Link, Kontakt, Fotos). Mehrere Termine als Liste, abgesagte Termine durchgestrichen. Abgesagte Veranstaltungen zeigen einen Hinweis statt der Anfrage, vergangene den Rückblick.
- **Anfrage:** Der Knopf „Informationen anfragen“ (oder „Interesse anmelden“, wenn die Anmeldung freigegeben ist) öffnet ein kurzes Formular (Name, E-Mail, Telefon und Personenzahl optional, Nachricht). Es speichert in `inquiries` mit `event_id`, `persons` und der Art `veranstaltung`. Ein unsichtbares Köderfeld hält einfache Programme ab. Task-23 vereinheitlicht die Formulare und Task-22 ergänzt die E-Mails.
- **Statistik:** Je Sitzung wird pro Veranstaltung nur einmal gezählt: die großen Karten als „view“, die Detailseite als „detail“, der Klick auf den Anfrageknopf als „inquiry_click“, die gesendete Anfrage als „inquiry“ (`track_event_event`, ohne Personenbezug).
- **Daten:** `src/lib/publicEvents.ts` liest `events_public`, `event_occurrences` und `event_types`. Ohne Zugangsdaten in `.env` erscheinen die Platzhalterdaten. `src/lib/eventCalendar.ts` enthält die getestete Logik (Filter, nächste Veranstaltungen, Monatsraster, Status, Anmeldefrist).
- Die Seiten Seminare, Kunstkurse, Vorträge und Netzwerk lesen noch Platzhalterdaten (task-20).

## Rollen und Veranstaltungsstatistik (task-42)

- **Rollen:** `AuthProvider` liest die Rolle aus `admins.role` (`admin` oder `event_editor`, sonst kein Zugang). `src/admin/permissions.ts` (getestet) enthält `canAccess` und `modulesFor`: Administratoren dürfen alles, weitere Rollen nur Module, die in `src/admin/modules.ts` im Feld `roles` stehen (Veranstaltungen, Statistik, Eingänge). Das Menü zeigt nur erlaubte Module, `ModuleGuard` in `AdminRoutes.tsx` leitet bei direktem Aufruf zur Startseite der Rolle um (`homePath`: Redakteure beginnen bei den Veranstaltungen). Die Datenbank erzwingt dieselben Rechte (Migration 0004).
- **Rechte erweitern:** neue Rolle in `AdminRole` und in der Tabellenprüfung von `admins.role` ergänzen, passende Regeln in der Datenbank anlegen, bei den Modulen unter `roles` eintragen.
- **Statistik** (`/admin/statistik`, `src/admin/pages/EventStats.tsx`): Zeitraum (7, 30, 90 Tage, gesamt), Summen, Tabelle je Veranstaltung mit Angesehen, Detailseite geöffnet, Klicks auf „Informationen anfragen“ und Anfragen, sortierbar, „Meistgefragt“ für die bis zu drei Veranstaltungen mit den meisten Anfragen und Klicks. Veranstaltungen ohne Aufrufe sind zunächst ausgeblendet. Auf dem Smartphone erscheinen Karten statt der Tabelle. Die Auswertung (`src/admin/lib/eventStats.ts`) ist getestet.
- **Datenschutz:** Gespeichert werden nur Zähler je Veranstaltung und Tag (`event_stats`), keine Namen, Adressen, Cookies oder Kennungen. Die Spalte „Anfragen“ zählt die tatsächlich eingegangenen Anfragen aus `inquiries`. Das Werkstatistik-Modul (task-35) ergänzt dieselbe Seite.

## Globale Sichtbarkeitsschalter (task-34)

- **Dashboard** (`/admin/sichtbarkeit`, nur Administratoren, `src/admin/pages/Visibility.tsx`): zwei Gruppen. Galerie: Preise, Maße, Technik, Jahr, Verfügbarkeit, Beschreibung. Veranstaltungen: Preise, freie Plätze, Teilnehmerzahl, Referent, Ort. Jeder Schalter speichert sofort (Rückmeldung per Meldung, bei einem Fehler springt die Anzeige auf den gespeicherten Stand zurück). Kontrollkästchen mit 44 px Trefferfläche, bedienbar auf dem Smartphone.
- **Speicherung:** Tabelle `site_settings`, je Gruppe ein Eintrag (`gallery_visibility`, `event_visibility`) mit den Schaltern als JSON. Nur ein ausdrückliches `false` blendet aus, ein fehlender Schalter gilt als sichtbar. Beim Speichern bleiben unbekannte Einträge erhalten. Die Daten selbst werden nie verändert.
- **Wirkung öffentlich:** Die Datenbank-Sichten `artworks_public` und `events_public` leeren ausgeschaltete Angaben serverseitig, sie sind also auch über die API nicht abrufbar. Zusätzlich liest `useGalleryVisibility` (`src/config/gallerySettings.ts`) den Eintrag für die Galerie-Komponenten (der Datenbank-Client wird dafür erst bei Bedarf nachgeladen). Ausgeschaltete Preise blenden auch den Kaufhinweis aus.
- **Neuen Schalter ergänzen:** in `VISIBILITY_GROUPS` (`src/admin/lib/visibility.ts`) eintragen, die Texte unter `admin.visibility.flags` ergänzen, die Angabe in der Datenbank-Sicht maskieren und in den Komponenten abfragen. Ein Umbau der Seite ist nicht nötig.

## Dashboard: Presse (task-38)

- **Liste** (`/admin/presse`, `src/admin/pages/Press.tsx`): Ablagefeld für mehrere Dateien gleichzeitig (JPEG, PNG, PDF). Aus jeder Datei entsteht ohne weitere Angaben ein Eintrag, Bilder werden wie Werkbilder verarbeitet (höchstens 2400 px, WebP, 800-px-Vorschau), bei PDF entsteht die Vorschau aus der ersten Seite, das PDF bleibt unverändert. Eine ungültige Datei wird abgelehnt und hinterlässt keine Reste, die anderen Dateien laufen weiter. Daneben gibt es das Anlegen eines Eintrags nur mit Link.
- **Sortieren:** per Ziehen und Ablegen (`useDragSort`) oder mit den Knöpfen „Nach oben“ und „Nach unten“ für Touch und Tastatur. Gespeichert werden nur geänderte Positionen. Die Reihenfolge gilt auch auf der Website.
- **Schnellaktionen je Zeile:** veröffentlichen oder ausblenden, hervorheben, bearbeiten, löschen mit Bestätigung (entfernt Datei und Vorschau).
- **Bearbeiten** (`/admin/presse/:id`): Datei ansehen, ersetzen (die alten Dateien werden erst nach dem Speichern entfernt) oder entfernen (nur wenn zusätzlich ein Link da ist, ein Eintrag braucht Datei oder Link), Titel, Medium, Art des Mediums, Autor, Erscheinungsdatum, Jahr (ohne Angabe gilt das Jahr des Datums), Kategorie, Kurz- und ausführliche Beschreibung, Link, hervorgehoben, veröffentlicht. Alle Angaben außer Datei oder Link sind optional.
- **Kategorien** (Migration `0005_press_categories.sql`): eigene Tabelle `press_categories`, im Dashboard unter „Kategorien verwalten“ ergänzen, umbenennen, löschen. Einträge verweisen über die Adresse (slug). Beim Löschen einer Kategorie behalten die Einträge ihre Daten und haben danach keine Kategorie.
- **Urheberrechtshinweis** steht dauerhaft auf der Liste und der Bearbeitungsseite.
- **Weitere Dateiformate:** Der Dateityp (`file_type`) ist in der Datenbank auf Bild und PDF beschränkt. Ein neues Format braucht einen Eintrag in `fileKind` (`src/admin/lib/pressForm.ts`), im Bucket `press` den erlaubten Dateityp (Migration 0002) und eine erweiterte Prüfung in `press_items`, der übrige Ablauf bleibt gleich.
- Die öffentliche Presseseite liest weiterhin Platzhalterdaten (task-20).

## Dashboard: Interessante Artikel (task-39)

- **Seite** (`/admin/artikel`, `src/admin/pages/Curated.tsx`): Ein Link genügt zum Anlegen (Prüfung auf http oder https). Neue Einträge sind zunächst ausgeblendet. Ohne Titel erscheint die Domain als Bezeichnung.
- **Bearbeiten** direkt in der Liste: Link, Titel, Quelle, Notiz und Vorschaubild, alles außer dem Link optional. Das Vorschaubild wird auf höchstens 800 px verkleinert (das große Bild wird nicht gespeichert), beim Ersetzen oder Entfernen verschwindet die alte Datei.
- **Sortieren** per Ziehen und Ablegen (`useDragSort`) oder mit den Knöpfen „Nach oben“ und „Nach unten“, **veröffentlichen oder ausblenden**, **löschen** mit Bestätigung (entfernt das Vorschaubild).
- Die öffentliche Seite „Interessante Artikel“ zeigt nur vorhandene Angaben (task-37), sie liest weiterhin Platzhalterdaten (task-20).
- `src/admin/lib/curatedForm.ts` (getestet), `src/admin/lib/curated.ts` (Datenzugriff).

## Umstellung auf Supabase und Beispieldaten (task-20)

- **Keine Platzhalterdaten mehr im Frontend:** Der Ordner `src/data` enthält nur noch Typen (`types.ts`) und den Bildplatzhalter für feste Seitenbilder (`placeholder.ts`). Alle Inhalte der öffentlichen Seiten kommen aus der Datenbank.
- **Laden:** `src/lib/content.ts` liest Werke (`artworks_public` und `artwork_images`), Vita, Beiträge, Presse mit Kategorien und empfohlene Artikel, `src/lib/publicEvents.ts` die Veranstaltungen. Jede Liste wird je Besuch einmal geladen und zwischengespeichert, ein Fehler wird beim nächsten Aufruf erneut versucht. Der Datenbank-Client wird erst beim ersten Bedarf nachgeladen und steckt nicht im Haupt-Bundle. Ohne Zugangsdaten in `.env` bleiben die Listen leer. `src/lib/contentMap.ts` (getestet) wandelt Zeilen in die Typen der Seiten um, fehlende Angaben werden zu `null`.
- **Seiten:** Galerie, Werkseite, Journal, Beitrag, Presse und Artikel zeigen bis zum Laden einen ruhigen Hinweis und bei einer Störung „Erneut versuchen“ (`ContentGate`). Startseite, Künstlerseite, Netzwerk und Kunstkurse zeigen ihre festen Teile sofort, die datenbasierten Teile erscheinen nach dem Laden.
- **Werkseite:** weitere Bilder eines Werks erscheinen unter dem Hauptbild.
- **Beiträge:** Der Text kommt als HTML aus dem Editor und wird vor der Anzeige mit `sanitizeHtml` bereinigt (Skripte, Ereignis-Attribute, Rahmen und gefährliche Adressen werden entfernt).
- **Presse:** Die Kategorien kommen aus der Tabelle `press_categories` (Dashboard).
- **Veranstaltungen:** Netzwerk-Abende (Art „Event“) und Kunstkurse (Art „Gruppenkurs“) sind Auswertungen des gemeinsamen Moduls. Die alte Seite `/netzwerk/:slug` leitet auf `/veranstaltungen/:slug` weiter.
- **Sichtbarkeitsschalter:** werden aus `site_settings` gelesen (task-34), die Sichten maskieren zusätzlich serverseitig.
- **Beispieldaten:** `supabase/seed.sql` (einmalig aus den früheren Platzhalterdaten erzeugt) und die grauen Bilder unter `public/platzhalter/`. Die Datei ist mehrfach ausführbar. `node supabase/tests/seed.test.mjs` prüft sie in einer lokalen Datenbank (Einspielen, mehrfaches Einspielen, Sicht für Besucher).

## Formular-Grundlagen, Edge Function und E-Mails (task-21, task-22)

- **Gemeinsame Regeln** (`supabase/functions/_shared/schemas.ts`, zod): ein Schema je Anfrageart (`werk`, `seminar` für The Art of Becoming, `vortrag`, `kunstkurs`, `bentzel_club`, `kontakt`, `veranstaltung`), gemeinsame Pflichtfelder Name und E-Mail, Zustimmung zur Datenschutzerklärung, Köderfeld und Zeitstempel. Dieselbe Datei prüft im Browser und in der Edge Function. Fehler werden als Codes je Feld geliefert (`fieldErrors`), die Oberfläche übersetzt sie.
- **Formular-Baustein** `src/components/forms/InquiryForm.tsx`: Felder werden deklarativ beschrieben (`src/lib/forms/definitions.ts`, Beschriftungen unter `forms.fields` in de.json). Nur Unterlinien, Beschriftungen in Versalien, Fehler direkt am Feld, Pflicht-Zustimmung mit Link auf die Datenschutzerklärung, verstecktes Köderfeld. Eine zu schnelle Eingabe wartet bis zur Mindestausfüllzeit, statt abgelehnt zu werden. Nach dem Senden erscheint die Bestätigung an Stelle des Formulars, bei einer Störung ein Hinweis mit E-Mail-Link. Die Kontaktseite nutzt ihn bereits.
- **Spamschutz** (`supabase/functions/_shared/spam.ts`): Köderfeld, Mindestausfüllzeit von 3 Sekunden, höchstens 5 Anfragen je Stunde und Absender (Hash aus Adresse und Salz, Tabelle `rate_limits`). Spam wird stillschweigend verworfen, nur das Limit meldet 429.
- **Verarbeitung** (`supabase/functions/_shared/inquiry.ts`, ohne Deno-Abhängigkeiten und deshalb in Node getestet): prüfen, Spam verwerfen, Limit, Werk oder Veranstaltung über die öffentlichen Sichten nachschlagen (ausgeschaltete Angaben wie der Preis erscheinen nie in E-Mails), speichern (mit `consent_at`), zwei E-Mails senden. Ein Fehler beim Versand ändert an der gespeicherten Anfrage nichts und wird nur protokolliert.
- **E-Mails** (`supabase/functions/_shared/emails.ts`): schlicht und typografisch, Galerieweiß, Name als Text-Kopf, Eingaben maskiert, leere Angaben entfallen. Betreff der Benachrichtigung: „Anfrage zu: Werktitel“, „Anfrage The Art of Becoming: Unternehmen“, „Vortragsanfrage: Organisation“, „Anfrage Kunstkurs“, „Interesse am Kreis“, „Kontaktanfrage“ oder „Kontakt: Betreff“, „Anfrage zu: Veranstaltung“. Die Bestätigung beim Werk zeigt Bild, Titel, Maße und Preis.
- **Edge Function** `supabase/functions/submit-inquiry/index.ts` (Deno): Anbindung an Supabase (service_role), Resend und die Tabelle `rate_limits`. API-Schlüssel nur als Secret (`RESEND_API_KEY`). Einrichtung in `docs/SUPABASE_SETUP.md`, Abschnitt 1g. Typprüfung der gemeinsamen Teile mit `tsc -p tsconfig.functions.json`.
- **Datenbank** (Migration 0006): Besucher dürfen Anfragen nicht mehr direkt einfügen (nur noch die Funktion), neue Spalte `consent_at`, Tabelle `rate_limits` ohne öffentlichen Zugriff.
- **Nicht lokal prüfbar:** der Versand über Resend und der Betrieb der Funktion in Supabase. Lokal geprüft sind alle Teile mit Test-Ersatz für Datenbank und Versand und die Formulare im Browser gegen einen Test-Ersatz der Funktion.

## Anfrageformulare (task-23)

- **Sechs Formulare plus Veranstaltungsanfrage** auf Basis von `InquiryForm`: Werk (seitliches Panel `InquiryPanel` auf der Werkseite, mit Vorschaubild, Titel und Maßen, Fokus bleibt im Panel, Esc und Klick auf den Hintergrund schließen, der Fokus kehrt zum Knopf zurück), The Art of Becoming (Unternehmen Pflicht, Teilnehmende, Zeitraum, Ort), Vortrag (Organisation Pflicht, Wunschthema aus den Themen der Seite plus „Individuell“), Kunstkurs (Kurstermin aus den Kursen mit offener Anmeldung plus „Individueller Termin“, Personen, Vorerfahrung), Interesse am Kreis, Kontakt und Veranstaltung. Die vier Seitenformulare klappen unter ihrem Knopf auf (`InquiryDisclosure`).
- **Veranstaltungsanfrage:** speichert `event_id`, Personenzahl und, ob Interesse angemeldet wurde. Im Dashboard stehen die Anfragen auf der Bearbeitungsseite der Veranstaltung mit „Per E-Mail antworten“ (mailto).
- Die früheren E-Mail-Links (mailto) sind entfallen, bei einer Störung zeigt jedes Formular den E-Mail-Link als Ausweichmöglichkeit.

## Verbindliche Veranstaltungsanmeldung (task-24)

- **Art der Anmeldung** je Veranstaltung im Dashboard: nur Anfrage (bisheriges Verhalten) oder verbindlich (`registration_mode = 'verbindlich'`).
- **Kapazität in der Datenbank** (Migration 0007): `register_for_event` sperrt die Zeile der Veranstaltung, prüft Freigabe, Anmeldefrist, Termin und Status, lehnt doppelte E-Mail-Adressen ab, zählt Personen inklusive Begleitung (`event_seats_taken`) und vergibt „angemeldet“ oder „warteliste“. `sync_event_seats` führt freie Plätze und Status nach. Beide Funktionen darf nur die Edge Function (service_role) aufrufen. So können gleichzeitige Anmeldungen nie mehr Plätze vergeben als vorhanden sind.
- **Edge Function** `register-event` (`supabase/functions/register-event/index.ts`) mit der Logik in `_shared/registration.ts` (in Node getestet): zod-Prüfung (`registrationSchema`), Spamschutz und Begrenzung wie bei den Anfragen, Bestätigung mit `.ics`-Anhang (`_shared/ics.ts`) und signiertem Stornierungslink (`_shared/token.ts`, HMAC), Mitteilung an den Künstler. Gemeinsame Deno-Bausteine in `supabase/functions/_runtime/runtime.ts`.
- **Oberfläche:** Auf der Veranstaltungsseite erscheint bei offener verbindlicher Anmeldung das Formular `InquiryForm` mit `registrationSchema` und `submitRegistration`. Bei einer vollen Veranstaltung lautet der Knopf „Auf die Warteliste setzen“, die Bestätigung unterscheidet Anmeldung und Warteliste, doppelte Anmeldung und geschlossene Anmeldung haben eigene Hinweise.
- **Folgt in task-25:** Stornierung über den Link, Nachrücken von der Warteliste.

## Stornierung und Nachrücken (task-25)

- **Datenbank** (Migration 0008): `cancel_registration(cancel_key)` sperrt die Veranstaltung, setzt den Status auf „storniert“ (`cancelled_at`), lässt in der Reihenfolge der Anmeldung nachrücken, solange die Gruppe (mit Begleitung) in die freien Plätze passt, und führt Plätze und Status nach. Nur service_role darf sie aufrufen. Ergebnis: `cancelled`, `already_cancelled` oder `unknown` samt Liste der Nachgerückten.
- **Edge Function** `cancel-registration` mit der Logik in `_shared/cancellation.ts` (in Node getestet): Token prüfen (HMAC), Begrenzung, stornieren, E-Mails an die Person (Bestätigung), den Künstler (Mitteilung mit Nachgerückten) und jede nachgerückte Person (Bestätigung, `.ics`, neuer Stornierungslink).
- **Seite** `/abmelden?token=…` (`src/pages/CancelRegistration.tsx`): Der Klick auf den Knopf storniert, nicht das Öffnen des Links. Zustände: bereit, storniert, bereits storniert, ungültiger oder gefälschter Link, Störung mit E-Mail-Link.

## Dashboard: Eingänge und Gästeliste (task-26)

- **Eingänge** (`/admin/eingaenge`, `src/admin/pages/Inquiries.tsx`): Anfragen aus allen Formularen, neueste zuerst. Filter nach Art (Werk, The Art of Becoming, Vortrag, Kunstkurs, Kreis, Kontakt, Veranstaltung), Status (neu, beantwortet, erledigt) und Suchtext (Name, E-Mail, Unternehmen, Telefon, Nachricht). Je Eintrag aufklappbar mit allen Angaben, Zusatzangaben der Anfrage (z. B. Teilnehmende, Wunschthema), Bezug (Titel von Werk oder Veranstaltung), Statuswechsel und „Per E-Mail antworten“ (öffnet das Mailprogramm mit Empfänger und Betreff, kein Massenversand). Eine Zusammenfassung zeigt die Zahlen je Status, der Zähler neuer Eingänge steht in der Seitenleiste.
- **CSV-Export** der gefilterten Liste (`src/admin/lib/csv.ts`, getestet): Semikolon, CRLF und BOM für deutsches Excel, Zellen, die wie Formeln beginnen, werden entschärft.
- **Gästeliste:** Veranstaltung wählen, dann Anmeldungen und Warteliste mit Personenzahl (mit Begleitung), belegten Plätzen, Status, Kontaktdaten, mailto-Antwort und CSV-Export.
- **Rechte:** Event-Redakteure sehen nur Anfragen zu Veranstaltungen und die Anmeldungen (Regeln in Migration 0004), Werke und Titel von Werken bleiben ihnen verborgen. Filter und Suche (`inquiryList.ts`) sind getestet.

## Werkstatistik (task-35)

- **Zählung** (`src/lib/track.ts`): „Angesehen“ (ein Werk war in der Übersicht zur Hälfte sichtbar, IntersectionObserver), „Geöffnet“ (Werkseite, Zähler `clicks`), „Großansicht“ und „Werk anfragen“ (Knopf). Jedes Ereignis zählt je Besuch einmal, dafür merkt sich der Browser nur in `sessionStorage` (endet mit dem Tab), dass es gesendet wurde. Es gibt keine Cookies, keine Adressen, keine Kennungen und keine Profile. In der Datenbank steht je Werk und Tag eine Zahl (`artwork_stats`, Funktion `track_artwork_event`, nur für öffentliche Werke und gültige Ereignisse).
- **Lesen:** `artwork_stats` ist für Besucher nicht lesbar (Row Level Security), nur Administratoren lesen die Zähler. Die Funktion `track_artwork_event` ist die einzige Schreibmöglichkeit.
- **Dashboard** (`/admin/statistik`, Bereich „Werke“ nur für Administratoren, `src/admin/components/ArtworkStatsSection.tsx`): Summen, die drei beliebtesten Werke mit Vorschaubild, Tabelle je Werk (Angesehen, Geöffnet, Großansicht, Klicks auf „Werk anfragen“, tatsächliche Anfragen aus `inquiries`), sortierbar, Werke ohne Aufrufe zunächst ausgeblendet, auf dem Smartphone als Karten. Der Zeitraum (7, 30, 90 Tage, gesamt) gilt für Veranstaltungen und Werke. Die Auswertung (`artworkStats.ts`) ist getestet.

## SEO (task-27)

- **Kopfdaten je Seite** (`src/lib/seo.ts`, Hook `useSeo`): Titel („Seite · Stephan Graf Bentzel-Sturmfeder“, auf der Startseite nur der Name), Meta-Beschreibung, Canonical, Open Graph und Twitter-Karte sowie JSON-LD. Die Tags tragen `data-seo` und werden bei jedem Seitenwechsel ersetzt, nicht angehäuft. SVG-Platzhalter dienen nicht als Vorschaubild (Netzwerke zeigen sie nicht an).
- **Statische Seiten** erhalten Titel und Beschreibung zentral im Layout (`STATIC` in `src/layout/Layout.tsx`, Texte unter `seo.*` und `pages.*` in `de.json`). **Detailseiten** (Werk, Veranstaltung, Beitrag) setzen ihre Angaben selbst, aus den Daten: Beschreibung aus Kurztext oder Text (gekürzt auf 160 Zeichen), Bild aus dem Werk, Veranstaltung oder Beitrag. Nicht gefundene Inhalte sind `noindex`; `/abmelden` ist `noindex`.
- **Strukturierte Daten** (`src/lib/seoLd.ts`, getestet): `WebSite`, `Organization` und `Person` auf der Startseite, `VisualArtwork` je Werk (Maße, Technik, Jahr, Preis und Verfügbarkeit nur, wenn sie laut Sichtbarkeitsschaltern öffentlich sind), `Event` je Veranstaltung (Status, Ort, erster Termin, Preis), `BlogPosting` je Beitrag. Was nicht vorhanden ist, fehlt. `<` wird im JSON maskiert.
- **Alt-Texte:** `artworkAlt` bevorzugt den im Dashboard hinterlegten Alt-Text (`alt_text_de`), sonst „Titel, Jahr“ (Jahr nur wenn öffentlich).
- **Adresse:** `VITE_SITE_URL` (sonst die aktuelle Adresse) bildet die absoluten Links. Vor dem Launch in `.env` setzen (task-33).
- **Grenze:** Die Kopfdaten entstehen im Browser. Google führt JavaScript aus und liest sie, manche Vorschaudienste (Messenger, soziale Netzwerke) nicht; dafür bräuchte es Vorab-Rendering (Prerender) oder Edge-Rendering, dies ist für task-30 und task-33 vorgemerkt. Die statische `index.html` enthält die Standardbeschreibung der Startseite.

## Sitemap, robots.txt und 404 (task-28)

- **Sitemap:** Edge Function `sitemap` (`supabase/functions/sitemap/index.ts`), Logik in `_shared/sitemap.ts` (in Node getestet). Sie enthält die statischen Seiten, alle veröffentlichten Werke (`artworks_public`), Beiträge und Veranstaltungen (`events_public`) mit absoluten Adressen aus `SITE_URL`, Beiträge mit `lastmod`. Admin, Abmeldeseite und Design-System fehlen. Die Antwort wird eine Stunde zwischengespeichert. Unter `/sitemap.xml` erreichbar per Rewrite beim Hosting (siehe `docs/SUPABASE_SETUP.md`).
- **robots.txt** (`public/robots.txt`): sperrt `/admin`, `/abmelden`, `/design-system`. Das Vite-Plugin in `vite.config.ts` hängt beim Build die Zeile `Sitemap: <VITE_SITE_URL>/sitemap.xml` an, wenn die Variable gesetzt ist.
- **404:** `PagePlaceholder` mit `notFound` zeigt eine gestaltete Seite (Fehler 404, Erklärung, Links zu Galerie und Startseite, `noindex`). Sie dient auch für nicht gefundene Werke, Beiträge und Veranstaltungen.

## Rechtstexte und Preishinweise (task-29)

- **Rechtstexte im Dashboard** (`/admin/rechtstexte`, nur Administratoren): Impressum und Datenschutz mit dem Texteditor (ohne Bilder), Vorschau, Speichern und „Vorlage einfügen“. Gespeichert wird HTML als `{ html }` in `site_settings` unter `legal_imprint` und `legal_privacy` (öffentlich lesbar, nur Administratoren schreiben; keine neue Migration nötig). Die öffentlichen Seiten `/impressum` und `/datenschutz` laden den Text (`loadLegal`), bereinigen ihn mit `sanitizeHtml` und zeigen bei leerem Text „Inhalt folgt“.
- **Vorlagen** (`src/admin/lib/legalTemplates.ts`): Gliederung mit den technisch zutreffenden Angaben (keine Cookies, keine externen Schriften, Supabase, Resend, Formulare, Anmeldungen, anonyme Zähler, Betroffenenrechte) und eckigen Klammern für Ergänzungen (Umsatzsteuer-ID, Hosting-Anbieter, Löschfrist, Drittlandgarantien). Sie sind kein Rechtstext und müssen vor der Veröffentlichung geprüft werden.
- **Preise:** Werke zeigen „… € inkl. MwSt.“ mit dem Hinweis „Der Erwerb erfolgt nach persönlicher Absprache.“, Veranstaltungen „… € inkl. MwSt.“, E-Mails ebenfalls. Die Dashboard-Felder nennen den Endpreis inkl. MwSt.
- **Keine Tracking-Werkzeuge, keine externen Schriften:** Schriften kommen aus dem Paket `@fontsource/jost`. Der Test `src/lib/privacyGuard.test.ts` schlägt an, sobald Schrift-, Analyse- oder Werbeadressen, `document.cookie` oder Tracking-Pakete auftauchen.

## Performance (task-30)

- **srcset für Werkbilder:** Beim Hochladen entstehen zusätzlich zur Hauptdatei (höchstens 2400 px) und zur Vorschau (800 px, evtl. mit Bildausschnitt) Fassungen des ganzen Bildes mit 800 und 1600 px (`variantEdgesFor`, nur unterhalb der längsten Kante, nie hochskaliert). Dateinamen `<id>-w800.webp`, `<id>-w1600.webp`. Die Liste steht als JSON in `image_variants` (Migration 0009, `[{url, width}]`) bei `artworks` und `artwork_images` und kommt über `artworks_public` zu den Seiten. `buildSrcSet` (`src/lib/imageVariants.ts`, getestet) macht daraus `srcset` mit `w`-Angaben, `sizes` richtet sich nach den Spalten des Rasters. Ohne Fassungen (ältere Bilder) gibt es kein `srcset`. Die Vorschau fließt bewusst nicht ein, weil ein Bildausschnitt das Seitenverhältnis ändert. Beim Ersetzen und Löschen werden die Fassungen mit entfernt.
- **Platz reservieren:** Alle Bilder tragen `width` und `height` (aus der Datenbank), `.artwork-img` ist `height: auto`, daher kein Springen beim Laden.
- **Laden:** Bilder außerhalb des ersten Bildschirms laden `lazy`, das erste Werk der Galerie, das Titelbild von Startseite, Werk, Beitrag und Veranstaltung mit `fetchPriority="high"`, Raster-Bilder `decoding="async"`. Das Haupt-Bundle bleibt klein (Datenbank-Client, Formulare, Kalender und Dashboard werden erst bei Bedarf geladen), Schriften kommen lokal (Jost, 400 und 500) mit `font-display: swap`.
- **Lighthouse:** Die Messung (Ziel über 90 in vier Kategorien, auch mobil) konnte in dieser Umgebung nicht ausgeführt werden und ist daher nicht bestätigt. Ausführung: Chrome öffnen, die gebaute Seite (`vite build`, `vite preview`) laden, in den Entwicklerwerkzeugen „Lighthouse“ wählen (Mobil und Desktop). Ergebnis in task-32 eintragen.

## Feinschliff (task-31)

- **Favicon:** „SB“ in Jost Medium, hell auf dunklem Grund (Farben der Website). Die Buchstaben sind als Pfade aus der Schriftdatei gezeichnet (`scripts/make-favicon.mjs`, liest die Glyphen aus `@fontsource/jost`), damit kein geladener Font nötig ist. Neu erzeugen: `node scripts/make-favicon.mjs`. Ein PNG für Apple-Geräte gibt es noch nicht.
- **Seitenübergang:** Beim Seitenwechsel blendet der Inhalt in 0,3 s ein (nur Deckkraft, damit die fixierte Großansicht nicht verrutscht, ohne Animation bei „Bewegung reduzieren“). Wechsel zwischen Werken, Beiträgen und Veranstaltungen bauen die Seite nicht neu auf (`transitionKey`), damit die Großansicht beim Blättern geöffnet bleibt.
- **Name:** Einheitlich „Stephan Graf Bentzel-Sturmfeder“ (Texte aus `brand.name`, Rechtstexte, Doku, Beispieldaten). `src/lib/nameGuard.test.ts` meldet abweichende Schreibweisen (ohne Bindestrich, falsche Endungen).
- **Großansicht:** Esc, Pfeiltasten und Wischgesten (Schwelle 50 px, waagerecht deutlich stärker als senkrecht) wurden mit simulierten Touch-Ereignissen im mobilen Ansichtsmodus geprüft: Wischen nach links und rechts blättert, senkrechte und kurze Bewegungen werden ignoriert. Ein Test auf echten Touchgeräten steht aus.

## PDF-Werkblatt (task-36)

- **Erzeugung:** Das Werkblatt entsteht im Browser aus den gespeicherten Werkdaten, es wird nichts doppelt gepflegt. `src/lib/datasheet.ts` (reine Funktionen, getestet) macht aus den Angaben eine Liste aus Beschriftung und Wert und lässt fehlende Angaben weg (keine leeren Zeilen, ohne Titel „Kunstwerk“). `src/lib/datasheetPdf.ts` zeichnet daraus mit `pdf-lib` eine A4-Seite im Stil der Website (Galeriepapier, Name als Schriftzug, feine Linien, Beschriftungen in Großbuchstaben, Abbildung als JPEG aus dem Hauptbild, Beschreibung mit Seitenumbruch, Fußzeile mit Anschrift und Kontakt). Das PDF-Paket ist ein eigener Baustein und wird erst beim Klick geladen. `src/lib/datasheetFlow.ts` verbindet beides mit den Texten aus `de.json`.
- **Entscheidung: öffentliche Fassung beachtet die Sichtbarkeitsschalter.** Der Knopf „Werkblatt als PDF“ auf der Werkseite verwendet die Daten aus `artworks_public`. Ausgeblendete Angaben (Preis, Maße, Technik, Jahr, Verfügbarkeit, Beschreibung) liefert die Datenbank gar nicht erst aus, daher stehen sie auch nicht im PDF, und es lässt sich nichts herausholen, was auf der Seite nicht sichtbar ist. Preise stehen als „… € inkl. MwSt.“.
- **Entscheidung: interne Vollversion im Dashboard.** Im Werk-Formular erzeugt „Werkblatt (PDF, mit allen Angaben)“ ein Blatt „Werkblatt (intern)“ aus der Tabelle `artworks`, also mit Preis und Status unabhängig von den Schaltern, zum Beispiel für Anfragen und Galerien. Es gilt der zuletzt gespeicherte Stand (nicht ungespeicherte Eingaben).
- **Schrift:** Das PDF verwendet die eingebaute Helvetica, nicht Jost, um die Dateien klein zu halten. Zeichen, die diese Schrift nicht kennt, erscheinen als „?“. Die Prüfung erfolgte im Browser durch Ansicht der ersten Seite als Bild; in einem PDF-Programm wurde das Blatt nicht geöffnet.
