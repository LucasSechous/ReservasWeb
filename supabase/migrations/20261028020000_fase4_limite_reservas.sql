-- Fase 4: límite de reservas activas por teléfono y por mail (contra reservas falsas).
-- Solo suma un trigger; no cambia nada existente. Cuenta las reservas públicas confirmadas
-- y futuras del mismo negocio; a la cuarta, reservar() falla con DEMASIADAS_RESERVAS.
-- Los bloqueos y las reservas manuales del negocio no cuentan.
create function private.limitar_reservas_activas()
returns trigger
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_tel     text := regexp_replace(coalesce(new.cliente_telefono, ''), '\D', '', 'g');
  v_email   text := lower(coalesce(new.cliente_email, ''));
  v_activas int;
begin
  select count(*) into v_activas
  from public.reservas r
  where r.negocio_id = new.negocio_id
    and r.origen = 'publico'
    and r.estado = 'confirmada'
    and upper(r.rango) > now()
    and (
      (v_tel <> '' and regexp_replace(coalesce(r.cliente_telefono, ''), '\D', '', 'g') = v_tel)
      or (v_email <> '' and lower(coalesce(r.cliente_email, '')) = v_email)
    );

  if v_activas >= 3 then
    raise exception 'DEMASIADAS_RESERVAS' using errcode = 'P0001';
  end if;

  return new;
end;
$f$;

revoke execute on function private.limitar_reservas_activas() from public, anon, authenticated;

create trigger trg_limitar_reservas_activas
  before insert on public.reservas
  for each row
  when (new.origen = 'publico' and new.estado = 'confirmada')
  execute function private.limitar_reservas_activas();
