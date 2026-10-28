-- Fase 6: vincular a cada persona que entra con link mágico con su fila de `usuarios`. Solo suma una función.
--
-- completar_perfil() se llama al entrar al panel y devuelve el rol y el negocio de quien está logueado:
--   1. Si su cuenta ya está vinculada a un usuario activo, devuelve ese usuario.
--   2. Si el operador lo invitó (hay un usuario con su mail y sin cuenta vinculada), lo vincula.
--   3. Si es el mail del operador y todavía no hay ningún operador, lo crea como admin_plataforma.
--   4. Si no, no devuelve nada: esa cuenta no tiene acceso a ningún panel.
-- El mail sale del token de la sesión, que Supabase solo emite después de abrir el link enviado a ese mail.
create function public.completar_perfil()
returns table (rol text, negocio_id uuid)
language plpgsql
security definer
set search_path = ''
as $f$
declare
  v_uid   uuid := (select auth.uid());
  v_email text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  v_operador constant text := 'sechouslucasuy@gmail.com';
begin
  if v_uid is null or v_email = '' then
    return;
  end if;

  if not exists (
    select 1 from public.usuarios u where u.auth_user_id = v_uid and u.activo
  ) then
    -- Invitado por el operador: se vincula su cuenta.
    update public.usuarios u
       set auth_user_id = v_uid
     where u.auth_user_id is null
       and lower(u.email) = v_email
       and u.activo;

    if not found
       and v_email = v_operador
       and not exists (select 1 from public.usuarios u where u.rol = 'admin_plataforma') then
      insert into public.usuarios (negocio_id, auth_user_id, email, nombre, rol)
      values (null, v_uid, v_email, 'Operador', 'admin_plataforma');
    end if;
  end if;

  return query
    select u.rol::text, u.negocio_id
    from public.usuarios u
    where u.auth_user_id = v_uid and u.activo;
end;
$f$;

revoke execute on function public.completar_perfil() from public, anon;
grant execute on function public.completar_perfil() to authenticated;
