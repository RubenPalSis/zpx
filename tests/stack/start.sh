#!/usr/bin/env bash
# Levanta un Supabase mínimo y desechable para pruebas (Postgres + Auth +
# API REST + correo de pruebas) con red de host, aplica las migraciones y
# arranca una pasarela en http://127.0.0.1:54321.
#
# Es una alternativa a `supabase start` para entornos donde el DNS interno de
# Docker no funciona (p. ej. algunos Codespaces). Solo para desarrollo local:
# las claves de aquí son de prueba y no sirven para nada fuera de esta máquina.
set -euo pipefail
cd "$(dirname "$0")/../.."

PG_IMAGE=public.ecr.aws/supabase/postgres:17.11.0.004
AUTH_IMAGE=public.ecr.aws/supabase/gotrue:v2.197.0
REST_IMAGE=public.ecr.aws/supabase/postgrest:v16.4
MAIL_IMAGE=public.ecr.aws/supabase/mailpit:v1.31.3
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
PGPASS=postgres
SITE=http://127.0.0.1:8080/admin/

docker rm -f zw-db zw-auth zw-rest zw-mail >/dev/null 2>&1 || true

docker run -d --name zw-db --network host \
    -e POSTGRES_PASSWORD=$PGPASS -e JWT_SECRET=$JWT_SECRET -e JWT_EXP=3600 \
    $PG_IMAGE postgres -D /etc/postgresql -c port=54322 >/dev/null

echo -n "Esperando a Postgres"
until docker exec zw-db pg_isready -U postgres -h 127.0.0.1 -p 54322 >/dev/null 2>&1; do echo -n .; sleep 1; done
# El script de arranque de la imagen reinicia el servidor una vez.
sleep 4
until docker exec zw-db psql -U postgres -h 127.0.0.1 -p 54322 -tAc 'select 1' >/dev/null 2>&1; do echo -n .; sleep 1; done
echo " listo"

docker run -d --name zw-mail --network host $MAIL_IMAGE >/dev/null

docker run -d --name zw-auth --network host \
    -e GOTRUE_API_HOST=127.0.0.1 -e PORT=9999 \
    -e API_EXTERNAL_URL=http://127.0.0.1:54321/auth/v1 \
    -e GOTRUE_DB_DRIVER=postgres \
    -e GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:$PGPASS@127.0.0.1:54322/postgres" \
    -e GOTRUE_SITE_URL=$SITE \
    -e GOTRUE_URI_ALLOW_LIST="$SITE,$SITE**" \
    -e GOTRUE_DISABLE_SIGNUP=true \
    -e GOTRUE_JWT_SECRET=$JWT_SECRET -e GOTRUE_JWT_EXP=3600 -e GOTRUE_JWT_AUD=authenticated \
    -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated -e GOTRUE_JWT_ADMIN_ROLES=service_role \
    -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true -e GOTRUE_MAILER_AUTOCONFIRM=true \
    -e GOTRUE_PASSWORD_MIN_LENGTH=10 \
    -e GOTRUE_SMTP_HOST=127.0.0.1 -e GOTRUE_SMTP_PORT=1025 -e GOTRUE_SMTP_ADMIN_EMAIL=admin@zetaweb.test \
    -e GOTRUE_SMTP_USER=x -e GOTRUE_SMTP_PASS=x \
    -e GOTRUE_MAILER_URLPATHS_RECOVERY=/auth/v1/verify \
    -e GOTRUE_RATE_LIMIT_EMAIL_SENT=1000 \
    $AUTH_IMAGE >/dev/null

echo -n "Esperando a Auth (migraciones)"
until curl -sf http://127.0.0.1:9999/health >/dev/null; do echo -n .; sleep 1; done
echo " listo"

echo "Aplicando migraciones…"
for f in supabase/migrations/*.sql; do
    docker exec -i zw-db psql -v ON_ERROR_STOP=1 -q -U postgres -h 127.0.0.1 -p 54322 -d postgres < "$f"
done

docker run -d --name zw-rest --network host \
    -e PGRST_DB_URI="postgres://authenticator:$PGPASS@127.0.0.1:54322/postgres" \
    -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
    -e PGRST_JWT_SECRET=$JWT_SECRET -e PGRST_SERVER_PORT=54330 \
    -e PGRST_DB_USE_LEGACY_GUCS=false \
    $REST_IMAGE >/dev/null

echo -n "Esperando a la API REST"
until curl -s -o /dev/null http://127.0.0.1:54330/ ; do echo -n .; sleep 1; done
echo " listo"
echo "Arranca la pasarela con: node tests/stack/gateway.mjs"
