-- Fase 5: leer una reserva pública a partir de su token de cancelación. Solo suma una función.
-- La usa la página /cancelar/[token] (para mostrar el turno) y el envío de mails.
-- El token es un uuid aleatorio: quien lo tiene es quien reservó. No devuelve el teléfono.
-- Es security definer porque el público no puede leer la tabla reservas.
create function public.reserva_por_token(p_token uuid)
returns table (
  negocio_id uuid,
  negocio_slug text,
  negocio_nombre text,
  negocio_email text,
  timezone text,
  servicio_nombre text,
  profesional_nombre text,
  cliente_nombre text,
  cliente_email text,
  inicio timestamptz,
  fin timestamptz,
  estado text,
  puede_cancelar boolean
)
language sql
stable
security definer
set search_path = ''
as $f$
  select n.id,
         n.slug::text,
         n.nombre::text,
         n.email::text,
         n.timezone::text,
         s.nombre::text,
         p.nombre::text,
         r.cliente_nombre::text,
         r.cliente_email::text,
         lower(r.rango),
         upper(r.rango),
         r.estado::text,
         (r.estado = 'confirmada' and lower(r.rango) > now())
  from public.reservas r
  join public.negocios n on n.id = r.negocio_id
  join public.profesionales p on p.id = r.profesional_id
  left join public.servicios s on s.id = r.servicio_id
  where r.token_cancelacion = p_token
    and r.origen = 'publico'
$f$;

revoke execute on function public.reserva_por_token(uuid) from public;
grant execute on function public.reserva_por_token(uuid) to anon, authenticated;
