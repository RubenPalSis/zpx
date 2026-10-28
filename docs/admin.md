# Panel de gestión de ZetaWeb (`/admin`)

Herramienta interna para Rubén e Inés con tres apartados:

- **Cobros** (pantalla principal): lo que hay que cobrar hoy, con un botón **✓ Pagado** en cada uno; los próximos 30 días; la lista de cobros; y los últimos pagos con «Deshacer».
  - **Una vez:** importe y fecha. Al crearlo se puede marcar «Ya está pagado».
  - **Cada mes:** importe y día del mes. Cada mes aparece en «Por cobrar» al llegar ese día y se valida con ✓. Si no se paga, sigue ahí en rojo indicando los días de retraso. «Parar» hace que deje de pedirse.
  - **Para:** Ambos, Rubén o Inés. «Ambos» se reparte a medias.
- **Clientes:** lista con lo que debe cada uno y ficha con sus cobros y pagos. Los clientes también se pueden crear directamente desde «Nuevo cobro».
- **Estadísticas:** cobrado, por cobrar, ingreso mensual y previsión anual, el reparto Rubén/Inés, un gráfico por meses y los mejores clientes. Desde aquí se descarga también la copia de seguridad.

## Arquitectura

- **Frontend:** HTML y JS nativo, sin compilación, instalable como PWA, en `admin/`. GitHub Pages lo publica junto a la web.
- **Datos y acceso:** Supabase (Postgres y Auth, plan gratuito). El esquema está en `supabase/migrations/20261028100000_esquema.sql`.
- **Seguridad:** RLS en todas las tablas. Solo las cuentas vinculadas en `profiles` pueden leer o escribir, y el registro público está desactivado.
- **Importes y duplicados:** los importes se guardan en céntimos. Un mismo mes no se puede marcar como pagado dos veces, y un cobro con pagos no se puede borrar (solo parar).
- **Visibilidad:** el panel lleva `noindex, nofollow` y no tiene enlaces desde la web ni aparece en el sitemap ni en `robots.txt`.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto** en <https://supabase.com> (plan Free), región UE (p. ej. Frankfurt). No hace falta tarjeta.
2. **Crear el esquema:** en SQL Editor, pega y ejecuta `supabase/migrations/20261028100000_esquema.sql`. Si ya ejecutaste la versión anterior, ejecuta este igualmente: la sustituye y conserva las cuentas vinculadas.
3. **Ajustar la autenticación** en Authentication:
   - Sign In / Providers → Email: desactiva **"Allow new users to sign up"**.
   - URL Configuration → Site URL: `https://zetaweb.es/admin/`.
   - Redirect URLs: añade `https://zetaweb.es/admin/**`.
   - (Recomendado) Contraseña mínima de 10 caracteres.
4. **Crear las cuentas:** en Authentication → Users → Add user, crea las de Rubén e Inés con "Auto Confirm".
5. **Vincular las cuentas:** edita los dos correos en `supabase/alta-socios.sql` y ejecútalo en el SQL Editor. Debe devolver dos filas.
6. **Configurar el panel:** en Project Settings → API copia la *Project URL* y la clave *anon / publishable* en `admin/config.js`.
   - Esa clave es pública por diseño; los datos los protegen las políticas RLS.
   - **Nunca** pongas la clave `service_role` / secret.
7. **Publicar:** haz commit y push a `main`. GitHub Pages publica `https://zetaweb.es/admin/`.
8. **Instalar la app:** abre esa URL en el móvil o el ordenador e instálala desde el menú del navegador ("Instalar app" / "Añadir a pantalla de inicio").

### Recuperar la contraseña
Desde "¿Has olvidado la contraseña?" en el login. El enlace del correo hay que abrirlo en el mismo navegador donde se pidió.

El servidor de correo incluido en el plan gratuito de Supabase envía muy pocos correos por hora, pero para dos usuarios basta. Para más, se puede configurar un SMTP propio en Authentication → SMTP.

## Copias de seguridad

- **Desde el panel:** en Estadísticas → *Descargar copia de seguridad (JSON)* descargas todas las tablas y el historial. Hazlo periódicamente (p. ej. una vez al mes) y guárdalo en un sitio privado.
- **Copia completa de la base de datos** (requiere la contraseña de la base de datos):
  `npx supabase db dump --db-url "postgresql://…" -f copia.sql` (y `--data-only` para solo datos).
- **Restaurar:** en un proyecto nuevo, ejecuta la migración y después importa los datos con `psql` desde el volcado.
- El plan gratuito **no incluye copias descargables**, así que estas exportaciones manuales son la copia de seguridad real.

## Costes y límites (plan gratuito, sin garantía de que siga igual)

| Concepto | Límite aproximado | Uso previsto |
|---|---|---|
| Base de datos | 500 MB | Unos pocos MB en años |
| Usuarios de Auth | 50.000 activos al mes | 2 |
| Transferencia | 5 GB al mes | Muy bajo |
| Inactividad | El proyecto **se pausa tras 7 días sin uso** | Se reactiva desde el panel de Supabase; los datos no se pierden |
| GitHub Pages | Gratuito para repositorios públicos | — |

- El único riesgo real es la **pausa por inactividad**.
- Si se quisiera evitar, el plan Pro cuesta unos 25 $ al mes. **No se ha activado nada de pago.**
- El código del panel es público (como el resto del repositorio); eso no expone datos, que solo se sirven a las dos cuentas autorizadas.

## Pruebas

```bash
npm install
npm test                      # cálculos: repartos, redondeo, previsiones (sin servidor)

# Supabase local desechable (Docker) + pasarela + web en :8080
tests/stack/start.sh
node tests/stack/gateway.mjs &
npm run test:db               # API real: login, RLS, cobros únicos y mensuales, duplicados
npx playwright install chromium
npm run test:e2e              # navegador: flujo completo, móvil, PWA, sin conexión
tests/stack/reset-db.sh       # vaciar la base de pruebas
```

`supabase start` (la CLI oficial) también vale donde funcione el DNS interno de Docker. Para ello están `supabase/config.toml` y los scripts `npm run db:*`.

## Fuera de esta versión

- No hay facturación, impuestos, gastos ni pasarela de pago.
- No hay edición sin conexión: sin red se puede consultar la pantalla abierta, pero no guardar.
