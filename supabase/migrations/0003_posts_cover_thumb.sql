-- Vorschaubild (800 px) für das Titelbild von Journalbeiträgen (task-18)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach 0001 und 0002). Details: docs/SUPABASE_SETUP.md

alter table public.posts add column if not exists cover_thumb_url text;
