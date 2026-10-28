#!/usr/bin/env bash
# Borra el esquema public de la base de pruebas y vuelve a aplicar las migraciones.
set -euo pipefail
cd "$(dirname "$0")/../.."
PSQL="docker exec -i zw-db psql -v ON_ERROR_STOP=1 -q -U postgres -h 127.0.0.1 -p 54322 -d postgres"
$PSQL <<'SQL'
drop schema public cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
-- Mismos privilegios por defecto que un proyecto Supabase recién creado:
-- la migración es la que debe retirarlos.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
SQL
for f in supabase/migrations/*.sql; do $PSQL < "$f"; done
# Que la API REST recargue el esquema.
$PSQL -c "notify pgrst, 'reload schema';"
echo "Base de pruebas reiniciada."
