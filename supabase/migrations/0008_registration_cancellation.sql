-- Stornierung und Nachrücken von der Warteliste (task-25)
--
-- Einspielen: Supabase Dashboard > SQL Editor > Inhalt dieser Datei einfügen > Run
-- (nach 0001 bis 0007). Details: docs/SUPABASE_SETUP.md
--
-- Die Stornierung kommt über den persönlichen Link aus der E-Mail (Edge Function
-- cancel-registration). Der Status wird „storniert“, freie Plätze werden nachgeführt und
-- Personen von der Warteliste rücken in der Reihenfolge ihrer Anmeldung nach, solange ihre
-- Personenzahl (mit Begleitung) in die freien Plätze passt. Wer nicht passt, bleibt auf der
-- Warteliste, die Nächsten rücken trotzdem nach.

create or replace function public.cancel_registration(p_cancel_key uuid)
returns table (
  outcome text,
  event_id uuid,
  cancelled_name text,
  cancelled_email text,
  cancelled_status text,
  promoted_id uuid,
  promoted_name text,
  promoted_email text,
  promoted_guests integer,
  promoted_cancel_key uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.registrations%rowtype;
  v_event public.events%rowtype;
  v_free integer;
  v_next public.registrations%rowtype;
  v_found boolean := false;
begin
  select * into v_reg from public.registrations r where r.cancel_key = p_cancel_key;
  if not found then
    outcome := 'unknown';
    return next;
    return;
  end if;
  if v_reg.status = 'storniert' then
    outcome := 'already_cancelled';
    event_id := v_reg.event_id;
    return next;
    return;
  end if;

  select * into v_event from public.events e where e.id = v_reg.event_id for update;

  update public.registrations
  set status = 'storniert', cancelled_at = now()
  where id = v_reg.id;

  outcome := 'cancelled';
  event_id := v_reg.event_id;
  cancelled_name := v_reg.name;
  cancelled_email := v_reg.email;
  cancelled_status := v_reg.status;

  -- Nur ein Platz in „angemeldet“ wird frei, von der Warteliste rückt niemand für eine Warteliste nach
  if v_reg.status = 'angemeldet' and v_event.capacity is not null then
    loop
      v_free := v_event.capacity - public.event_seats_taken(v_reg.event_id);
      select * into v_next
      from public.registrations r
      where r.event_id = v_reg.event_id and r.status = 'warteliste' and 1 + r.guests <= v_free
      order by r.created_at, r.id
      limit 1;
      exit when not found;
      update public.registrations set status = 'angemeldet' where id = v_next.id;
      v_found := true;
      promoted_id := v_next.id;
      promoted_name := v_next.name;
      promoted_email := v_next.email;
      promoted_guests := v_next.guests;
      promoted_cancel_key := v_next.cancel_key;
      return next;
    end loop;
  end if;

  perform public.sync_event_seats(v_reg.event_id);

  if not v_found then
    promoted_id := null;
    promoted_name := null;
    promoted_email := null;
    promoted_guests := null;
    promoted_cancel_key := null;
    return next;
  end if;
end;
$$;

revoke all on function public.cancel_registration(uuid) from public, anon, authenticated;
grant execute on function public.cancel_registration(uuid) to service_role;
