-- Beispieldaten (task-20)
--
-- Einspielen (optional): Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach den Migrationen 0001 bis 0005). Details: docs/SUPABASE_SETUP.md
--
-- Die Daten zeigen, wie die Website mit Inhalt aussieht: Werke und Beiträge mit grauen
-- Bildplatzhaltern (public/platzhalter), Veranstaltungen, Pressebeispiele und die Vita.
-- Alle Texte außer der Vita sind Beispiele und werden im Dashboard ersetzt oder gelöscht.
-- Die Datei darf mehrfach ausgeführt werden: Werke, Beiträge und Veranstaltungen werden über
-- ihre Adresse erkannt, die übrigen Tabellen werden nur gefüllt, solange sie leer sind.
-- Entstanden aus den früheren Platzhalterdaten der Website (einmalig erzeugt).

insert into public.artworks (slug, sort_order, is_published, main_image_url, image_width, image_height, title_de, cycle, year, technique_de, support_de, height_cm, width_cm, framed, is_multipart, price_eur, status, description_de, is_highlight) values
  ('das-juengste-gericht-nach-michelangelo', 1, true, '/platzhalter/6000x2400.svg', 6000, 2400, 'Das jüngste Gericht nach Michelangelo', null, 2010, 'Triptychon', 'Leinwand', 120, 300, null, true, 7240, 'verfuegbar', null, true),
  ('goessweinstein', 2, true, '/platzhalter/4800x2000.svg', 4800, 2000, 'Gössweinstein', 'Pellegrinaggio', 2013, 'Triptychon', 'Leinwand', 100, 240, null, true, 6230, 'verfuegbar', null, true),
  ('poppy-picking', 3, true, '/platzhalter/3000x2800.svg', 3000, 2800, 'Poppy Picking', 'Blood and Opium', 2016, 'Leinwand', 'Leinwand', 140, 150, null, false, 3240, 'verfuegbar', null, true),
  ('flower-i', 4, true, '/platzhalter/1060x860.svg', 1060, 860, 'Flower I', null, 2020, 'Aquarell auf Papier', 'Papier', 43, 53, true, false, 345, 'verfuegbar', null, true),
  ('flower-ii', 5, true, '/platzhalter/1060x860.svg', 1060, 860, 'Flower II', null, 2020, 'Aquarell auf Papier', 'Papier', 43, 53, true, false, 345, 'verfuegbar', null, false),
  ('bloody-rider', 6, true, '/platzhalter/940x720.svg', 940, 720, 'Bloody Rider', null, 2019, 'Mixed Media auf Papier', 'Papier', 36, 47, null, false, 285, 'verfuegbar', null, true),
  ('forchheim', 7, true, '/platzhalter/860x1060.svg', 860, 1060, 'Forchheim', 'Intuition', 2020, 'Papier', 'Papier', 53, 43, true, false, 460, 'verfuegbar', null, false),
  ('the-swimmer-wiesent', 8, true, '/platzhalter/860x1060.svg', 860, 1060, 'The Swimmer Wiesent', null, 2020, 'Papier', 'Papier', 53, 43, null, false, 320, 'verfuegbar', null, false),
  ('werk-9', 9, true, '/platzhalter/1200x1600.svg', 1200, 1600, null, null, null, null, null, null, null, null, false, null, null, null, false),
  ('werk-10', 10, true, '/platzhalter/1400x1400.svg', 1400, 1400, 'Ohne Titel', null, null, null, null, null, null, null, false, null, null, null, false)
on conflict (slug) do nothing;

do $$
begin
  if not exists (select 1 from public.vita_entries) then
  insert into public.vita_entries (year, year_end, category, title_de, title_en, place, sort_order, is_published) values
    (2003, null, 'ausbildung', 'Bachelor of Fine Arts, London Institute', null, null, 1, true),
    (2003, null, 'ausbildung', 'Studium in München und London', null, null, 2, true),
    (2003, null, 'ausbildung', 'Klassische künstlerische Ausbildung bei Alexander Schwartz', null, null, 3, true),
    (2019, null, 'messe', 'Parallel Vienna Art Fair', null, 'Wien', 4, true),
    (2016, null, 'messe', 'Parallel Vienna Art Fair', null, 'Wien', 5, true),
    (2014, null, 'messe', 'Parallel Vienna Art Fair', null, 'Wien', 6, true),
    (2017, null, 'kuratorisch', 'Gründung der Contemporary Art Gallery', null, 'Forchheim', 7, true),
    (2017, null, 'kuratorisch', 'Kuration Silvia Wawarta', null, 'Forchheim', 8, true),
    (2017, null, 'kuratorisch', 'Kuration Christina Soler', null, 'Forchheim', 9, true),
    (2010, null, 'kuratorisch', 'Kuration Philip Baben der Erde', null, 'München', 10, true),
    (2009, null, 'kuratorisch', 'Kuration Haman Alimardani', null, 'München', 11, true),
    (2009, null, 'kuratorisch', 'Kuration Sasha Schwartz', null, 'München', 12, true),
    (2009, null, 'kuratorisch', 'Gründung Sturmfeder Projects', null, 'München', 13, true),
    (2019, null, 'ausstellung', 'Galerie Gromann', null, 'Weßling', 14, true),
    (2018, null, 'ausstellung', 'Schloss Pörnbach', null, null, 15, true),
    (2018, null, 'ausstellung', 'Tragic Hero, Stadtwerke Erlangen', null, null, 16, true),
    (2017, null, 'ausstellung', 'Tragic Hero, Hearthouse München', null, null, 17, true),
    (2017, null, 'ausstellung', 'Gruppenausstellung Wawarta – Soler – Bentzel', null, 'Forchheim', 18, true),
    (2017, null, 'ausstellung', 'Tragic Hero, PopUp Gallery Forchheim', null, null, 19, true),
    (2016, null, 'ausstellung', 'Blood and Opium', null, 'München', 20, true),
    (2016, null, 'ausstellung', 'Open Studio', null, 'Landkreis Forchheim', 21, true),
    (2016, null, 'ausstellung', 'Gruppenausstellung Kreul Colors', null, 'Hallerndorf', 22, true),
    (2015, null, 'ausstellung', 'Galerie Box32, Friedrichshain', null, 'Berlin', 23, true),
    (2015, null, 'ausstellung', 'International Art Colony', null, 'Počitelj, Bosnien und Herzegowina', 24, true),
    (2015, null, 'ausstellung', 'Nationale und internationale Kunstausstellung', null, 'Jägersburg', 25, true),
    (2015, null, 'ausstellung', 'Weingut Sturmfeder, Künstleretikett', null, null, 26, true),
    (2014, null, 'ausstellung', 'Conzil, Galerie Weber', null, 'München', 27, true),
    (2014, null, 'ausstellung', 'Gruppenausstellung Longing, Mainzeit Carée', null, 'München', 28, true),
    (2014, null, 'ausstellung', 'WienOne, Brick 5', null, 'Wien', 29, true),
    (2014, null, 'ausstellung', 'Microturbine', null, 'München', 30, true),
    (2014, null, 'ausstellung', 'Open Studio', null, 'Landkreis Forchheim', 31, true),
    (2013, null, 'ausstellung', 'Galerie Robert Weber', null, 'München', 32, true),
    (2013, null, 'ausstellung', 'Gruppenausstellung StuttgartOne', null, 'Stuttgart', 33, true),
    (2013, null, 'ausstellung', 'Zammerhof', null, 'Erding', 34, true),
    (2013, null, 'ausstellung', 'Kao Ono, Neumarkter', null, 'München', 35, true),
    (2012, null, 'ausstellung', 'Gruppenausstellung „Bleiben ist nirgends“', null, 'Jägersburg', 36, true),
    (2011, null, 'ausstellung', 'Kunstauktion Weisser Ring', null, 'Nürnberg', 37, true),
    (2010, null, 'ausstellung', 'Artothek Forchheim', null, null, 38, true),
    (2008, null, 'ausstellung', 'Order of Malta, Galerie Reygers', null, 'München', 39, true),
    (2007, null, 'ausstellung', 'Gerhard Mair', null, 'München', 40, true),
    (2001, null, 'ausstellung', 'Gruppenausstellung Paint Explosion', null, 'London', 41, true),
    (1998, null, 'ausstellung', 'Gruppenausstellung Blocherer Akademie', null, 'München', 42, true),
    (1995, null, 'ausstellung', 'Schloss Thurn', null, 'Heroldsbach', 43, true),
    (1994, null, 'ausstellung', 'Gruppenausstellung Weingut Sturmfeder', null, null, 44, true);
  end if;
end $$;

insert into public.posts (slug, title_de, excerpt_de, content_de, cover_image_url, cover_thumb_url, cover_image_width, cover_image_height, published_at, status, sort_order) values
  ('warum-der-erste-strich-zaehlt', 'Warum der erste Strich zählt', 'Über Zögern, Entscheidung und die leere Leinwand. Anreißer folgt.', '<p>Platzhaltertext. Der Beitragstext folgt.</p><p>Platzhaltertext. Hier setzt der Beitrag fort.</p>', '/platzhalter/1600x1067.svg', '/platzhalter/1600x1067.svg', 1600, 1067, '2026-09-15T09:00:00+02:00', 'veroeffentlicht', 1),
  ('atelierblick-fliessen-und-fassen', 'Atelierblick: Fließen und Fassen', 'Ein Blick in den Arbeitsprozess. Anreißer folgt.', '<p>Der Beitragstext folgt.</p>', '/platzhalter/1600x1067.svg', '/platzhalter/1600x1067.svg', 1600, 1067, '2026-08-02T09:00:00+02:00', 'veroeffentlicht', 2)
on conflict (slug) do nothing;

insert into public.events (slug, sort_order, is_published, title_de, description_de, starts_at, ends_at, location_name, location_address, image_url, image_width, image_height, capacity, places_available, registration_open, status, recap_text_de, type_id) values
  ('atelierabend-kunst-denken-begegnung', 1, true, 'Atelierabend: Kunst. Denken. Begegnung.', 'Ein Abend im Atelier mit Vortrag, Gespräch und Werkbetrachtung. Beschreibung folgt.', '2026-11-14T18:30:00+01:00', '2026-11-14T21:30:00+01:00', 'Schloss Jägersburg', 'Fürstenweg 1, 91330 Bammersdorf', '/platzhalter/1600x1067.svg', 1600, 1067, 30, 9, true, 'anmeldung_moeglich', null, (select id from public.event_types where slug = 'event')),
  ('salon-kunstgeschichte-neu-erleben', 2, true, 'Salon: Kunstgeschichte neu erleben', 'Ein Salonabend mit persönlichen Zugängen zur Kunstgeschichte. Beschreibung folgt.', '2026-12-05T18:00:00+01:00', '2026-12-05T21:00:00+01:00', 'Schloss Jägersburg', 'Fürstenweg 1, 91330 Bammersdorf', '/platzhalter/1600x1067.svg', 1600, 1067, 20, 16, true, 'anmeldung_moeglich', null, (select id from public.event_types where slug = 'event')),
  ('vernissage-sommer-2026', 3, true, 'Kleine Vernissage im Sommer', 'Rückblick folgt.', '2026-06-20T18:00:00+02:00', '2026-06-20T21:00:00+02:00', 'Schloss Jägersburg', 'Fürstenweg 1, 91330 Bammersdorf', '/platzhalter/1600x1067.svg', 1600, 1067, 40, 40, false, 'beendet', 'Ein Rückblick auf den Abend folgt.', (select id from public.event_types where slug = 'event')),
  ('atelierbesuch-fruehling-2026', 4, true, 'Atelierbesuch im Frühling', 'Rückblick folgt.', '2026-04-18T17:00:00+02:00', '2026-04-18T20:00:00+02:00', 'Schloss Jägersburg', 'Fürstenweg 1, 91330 Bammersdorf', '/platzhalter/1600x1067.svg', 1600, 1067, 25, 25, false, 'beendet', null, (select id from public.event_types where slug = 'event')),
  ('malen-ohne-vorkenntnisse', 101, true, 'Malen ohne Vorkenntnisse', 'Ein Tag mit Leinwand, Farbe und Spachtel. Beschreibung folgt.', '2026-11-21T10:00:00+01:00', '2026-11-21T17:00:00+01:00', 'Schloss Jägersburg', null, null, null, null, 8, 8, true, 'anmeldung_moeglich', null, (select id from public.event_types where slug = 'gruppenkurs')),
  ('kohle-und-intuition', 102, true, 'Kohle und Intuition', 'Zeichnen mit Kohle als Weg zur eigenen Formensprache. Beschreibung folgt.', '2027-01-23T10:00:00+01:00', '2027-01-23T17:00:00+01:00', 'Schloss Jägersburg', null, null, null, null, 8, 8, true, 'anmeldung_moeglich', null, (select id from public.event_types where slug = 'gruppenkurs'))
on conflict (slug) do nothing;

do $$
begin
  if not exists (select 1 from public.press_items) then
  insert into public.press_items (sort_order, is_published, title_de, thumbnail_url, thumbnail_width, thumbnail_height, file_url, file_type, file_width, file_height, medium, medium_type, author, published_at, year, category, summary_de, description_de, external_url, is_highlight) values
    (1, true, 'Beispiel: Porträt über den Künstler', '/platzhalter/1200x1600.svg', 1200, 1600, '/platzhalter.pdf', 'pdf', null, null, 'Beispiel-Magazin', 'magazin', 'Beispiel Autor', '2024-05-10', null, 'portraet', 'Kurzbeschreibung folgt.', null, 'https://example.com/', true),
    (2, true, 'Beispiel: Interview zur Ausstellung', '/platzhalter/1600x1067.svg', 1600, 1067, '/platzhalter/1600x1067.svg', 'image', 1600, 1067, 'Beispiel-Zeitung', 'zeitung', null, '2023-11-02', null, 'interview', 'Kurzbeschreibung folgt.', null, null, true),
    (3, true, 'Beispiel: Bericht über die Vernissage', null, null, null, '/platzhalter.pdf', 'pdf', null, null, 'Beispiel-Portal', 'onlineportal', null, '2022-06-21', null, 'ausstellung', null, null, null, false),
    (4, true, null, '/platzhalter/1000x1400.svg', 1000, 1400, '/platzhalter/1000x1400.svg', 'image', 1000, 1400, null, null, null, null, null, null, null, null, null, false),
    (5, true, 'Beispiel: Beitrag zur Malerei', null, null, null, null, null, null, null, 'Beispiel-Magazin', null, null, null, 2021, 'kunst', null, null, 'https://example.com/beitrag', false),
    (6, true, 'Beispiel: Pressebericht', '/platzhalter/1600x1000.svg', 1600, 1000, '/platzhalter/1600x1000.svg', 'image', 1600, 1000, null, null, null, '2019-03-14', null, 'pressebericht', 'Kurzbeschreibung folgt.', null, null, false);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from public.curated_links) then
  insert into public.curated_links (sort_order, is_published, url, title_de, source, note_de, thumbnail_url, thumbnail_width, thumbnail_height) values
    (1, true, 'https://example.com/artikel-eins', 'Beispiel: Ein lesenswerter Artikel über Wahrnehmung', 'Beispiel-Magazin', 'Kurze persönliche Notiz folgt.', '/platzhalter/1600x1067.svg', 1600, 1067),
    (2, true, 'https://example.org/artikel-zwei', 'Beispiel: Kunst und Führung', null, null, null, null, null),
    (3, true, 'https://www.example.net/nur-ein-link', null, null, null, null, null, null);
  end if;
end $$;
