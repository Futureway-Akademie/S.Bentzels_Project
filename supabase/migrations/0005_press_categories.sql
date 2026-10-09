-- Verwaltbare Kategorien für das Pressearchiv (task-38)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach 0001 bis 0004). Details: docs/SUPABASE_SETUP.md
--
-- Bisher stand die Kategorie eines Presseeintrags als feste Liste im Schema. Jetzt gibt es eine
-- Tabelle, die im Dashboard ergänzt, umbenannt und gelöscht werden kann. Presseeinträge
-- verweisen über die Adresse (slug) auf die Kategorie. Wird eine Kategorie gelöscht, behalten
-- die Einträge ihre Daten und haben danach keine Kategorie.

create table public.press_categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_published boolean not null default true,
  slug text not null unique,
  name_de text not null check (char_length(btrim(name_de)) > 0),
  name_en text
);

alter table public.press_categories enable row level security;

create policy "press_categories: öffentlich lesen" on public.press_categories
  for select to anon, authenticated
  using (is_published);

create policy "press_categories: Admin" on public.press_categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create trigger press_categories_updated_at before update on public.press_categories
  for each row execute function public.set_updated_at();

insert into public.press_categories (slug, name_de, name_en, sort_order) values
  ('pressebericht', 'Pressebericht', 'Press report', 10),
  ('interview', 'Interview', 'Interview', 20),
  ('portraet', 'Porträt', 'Portrait', 30),
  ('ausstellung', 'Ausstellung', 'Exhibition', 40),
  ('kunst', 'Kunst', 'Art', 50)
on conflict (slug) do nothing;

alter table public.press_items drop constraint if exists press_items_category_check;
alter table public.press_items
  add constraint press_items_category_fkey
  foreign key (category) references public.press_categories (slug)
  on update cascade on delete set null;
