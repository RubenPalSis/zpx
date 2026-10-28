-- Alta privada de Rubén e Inés como socios del panel.
--
-- 1. Crea antes las dos cuentas en Supabase → Authentication → Users →
--    "Add user" → "Create new user" (correo + contraseña, marcando
--    "Auto Confirm User").
-- 2. Sustituye los dos correos de abajo y ejecuta este script en
--    Supabase → SQL Editor.
--
-- Solo las cuentas vinculadas aquí pueden ver o modificar datos. Cualquier
-- otra cuenta que llegara a existir no tendría acceso a nada.

insert into public.profiles (id, partner, display_name)
select id, 'ruben', 'Rubén' from auth.users where email = 'rubenpalsis11@gmail.com'
on conflict (partner) do update set id = excluded.id;

insert into public.profiles (id, partner, display_name)
select id, 'ines', 'Inés' from auth.users where email = 'inescapdevilagarcia@gmail.com'
on conflict (partner) do update set id = excluded.id;

-- Comprobación: deben salir exactamente dos filas.
select p.partner, p.display_name, u.email from public.profiles p join auth.users u on u.id = p.id;
