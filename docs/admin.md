# Panel de gestión de ZetaWeb (`/admin`)

Herramienta interna para Rubén e Inés: clientes, proyectos, obligaciones de pago y cobros, cuotas recurrentes, gastos, previsión, estadísticas y reparto entre socios.

## Arquitectura

| Pieza | Qué es | Dónde |
|---|---|---|
| Frontend | HTML + JS nativo (módulos ES), sin compilación, PWA | `admin/` → se publica en GitHub Pages junto a la web |
| Base de datos y autenticación | Supabase (Postgres + Auth), plan gratuito | `supabase/migrations/` |
| Seguridad | RLS en todas las tablas: solo las cuentas vinculadas en `profiles` acceden | migración |

- La web es estática (GitHub Pages, sin PHP ni backend), así que el backend es externo: Supabase.
- Todos los importes se guardan en **céntimos enteros**.
- Cada operación guarda **su propio reparto** (`ruben_cents` / `ines_cents`). La base de datos obliga a que sume exactamente el total.
- **Redondeo:** la parte de Rubén se redondea al céntimo con la regla "mitad al par" e Inés recibe el resto. Los cobros parciales se reparten de forma acumulada, así que al saldar una obligación la suma coincide exactamente con el reparto acordado.
- **Operaciones de varios pasos** (cobro con exceso, generación de cuotas, periodo de un gasto recurrente): son funciones SQL transaccionales.
- **Duplicados:**
  - Cada formulario envía un identificador único, así que pulsar dos veces no crea dos registros.
  - Una cuota no puede generar dos veces el mismo periodo.
  - Una referencia de factura no se puede repetir.
  - Avisa ante cobros o gastos idénticos.
- **Historial:** `audit_log` registra quién crea, modifica o elimina cada registro.
- **Borrado:** clientes, proyectos y cuotas no se borran, se archivan o cancelan. Una obligación con cobros no se puede borrar ni anular.
- **Ediciones simultáneas:** si los dos editáis el mismo registro a la vez, el segundo guardado se rechaza en lugar de sobrescribir el primero.
- **Visibilidad:** el panel lleva `noindex, nofollow` y no está enlazado desde la web ni en el sitemap. A propósito no aparece en `robots.txt`, que es público.

## Puesta en marcha (una sola vez)

1. **Crear el proyecto** en <https://supabase.com> (plan Free), región UE (p. ej. Frankfurt). No hace falta tarjeta.
2. **Crear el esquema:** en SQL Editor, pega y ejecuta `supabase/migrations/20261028100000_esquema_inicial.sql`.
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

- **Desde el panel:** en Configuración → *Exportar todo (JSON)* descargas todas las tablas y el historial. Hazlo periódicamente (p. ej. una vez al mes) y guárdalo en un sitio privado.
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
npm run test:db               # API real: login, RLS, cobros, cuotas, gastos, duplicados, auditoría
npx playwright install chromium
npm run test:e2e              # navegador: flujo completo, móvil, PWA, sin conexión
tests/stack/reset-db.sh       # vaciar la base de pruebas
```

`supabase start` (la CLI oficial) también vale donde funcione el DNS interno de Docker. Para ello están `supabase/config.toml` y los scripts `npm run db:*`.

## Pendiente o fuera de esta versión

- No hay facturación electrónica, IVA, IRPF, contabilidad oficial ni pasarela de pago.
- No hay edición sin conexión: sin red se puede consultar la pantalla abierta, pero no guardar.
- Las cuotas no generan sus obligaciones automáticamente: el panel avisa y se generan con un botón. Así no se crea nada sin que lo veáis.
- No se registra en qué cuenta entró cada cobro. La compensación entre socios por gastos adelantados se calcula de forma informativa.
- Los datos se refrescan al volver a la pestaña, no en tiempo real.
