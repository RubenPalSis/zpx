// Prueba de extremo a extremo del panel en un navegador real (Chromium).
// Requiere el Supabase local y la pasarela (ver tests/stack/).
//   npm run test:e2e
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { SERVICE_KEY } from '../stack/gateway.mjs';

const BASE = 'http://127.0.0.1:8080/admin/';
const PASS = 'clave-e2e-segura-1';
const run = Date.now().toString(36);
const EMAIL = { ruben: `ruben-e2e-${run}@zetaweb.test`, ines: `ines-e2e-${run}@zetaweb.test` };
const SHOTS = process.env.SHOTS_DIR;

let browser;
let page;
const problems = [];

async function login(p, who) {
    await p.goto(BASE);
    await p.getByLabel('Correo electrónico').fill(EMAIL[who]);
    await p.getByLabel('Contraseña').fill(PASS);
    await p.getByRole('button', { name: 'Entrar' }).click();
    await p.getByRole('heading', { name: 'Resumen de ZetaWeb' }).waitFor();
}

function watch(p) {
    p.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
    p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    p.on('response', (r) => { if (r.status() >= 400) problems.push(`http ${r.status()} ${r.request().method()} ${r.url()}`); });
}

async function shot(p, name) {
    if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

// Rellena un campo de formulario por su etiqueta dentro del diálogo abierto.
const dlg = () => page.locator('dialog[open]');
async function fill(label, value) { await dlg().getByLabel(label, { exact: true }).fill(value); }
async function choose(label, value) { await dlg().getByLabel(label, { exact: true }).selectOption({ label: value }); }

before(async () => {
    const admin = createClient('http://127.0.0.1:54321', SERVICE_KEY, { auth: { persistSession: false } });
    const ids = {};
    for (const who of ['ruben', 'ines']) {
        const { data, error } = await admin.auth.admin.createUser({ email: EMAIL[who], password: PASS, email_confirm: true });
        assert.ifError(error);
        ids[who] = data.user.id;
    }
    await admin.from('profiles').delete().in('partner', ['ruben', 'ines']);
    const { error } = await admin.from('profiles').insert([
        { id: ids.ruben, partner: 'ruben', display_name: 'Rubén' },
        { id: ids.ines, partner: 'ines', display_name: 'Inés' },
    ]);
    assert.ifError(error);
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    watch(page);
});

after(async () => { await browser?.close(); });

test('sin sesión se muestra el acceso y no hay datos', async () => {
    await page.goto(`${BASE}#/clientes`);
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
    await page.getByLabel('Correo electrónico').fill(EMAIL.ruben);
    await page.getByLabel('Contraseña').fill('incorrecta-123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.getByText('Correo o contraseña incorrectos.').waitFor();
});

test('Rubén inicia sesión y ve el dashboard', async () => {
    await login(page, 'ruben');
    await page.getByText('Sesión:').waitFor();
    await shot(page, '01-dashboard-vacio');
});

test('crear cliente desde el acceso rápido', async () => {
    await page.getByRole('button', { name: '+ Cliente' }).click();
    await fill('Nombre comercial o del cliente *', `Panadería E2E ${run}`);
    await fill('Persona de contacto', 'Ana <script>alert(1)</script>');
    await fill('Correo electrónico', 'ana@example.com');
    await dlg().getByRole('button', { name: 'Guardar' }).click();
    await page.getByRole('heading', { name: `Panadería E2E ${run}` }).waitFor();
    // El texto con etiquetas se muestra literal, no se ejecuta.
    await page.getByText('Ana <script>alert(1)</script>').waitFor();
});

test('crear proyecto con reparto por importes que debe cuadrar', async () => {
    await page.locator('#view').getByRole('button', { name: '+ Proyecto' }).click();
    await choose('Cliente *', `Panadería E2E ${run}`);
    await fill('Nombre del proyecto *', 'Web corporativa');
    await fill('Precio acordado (€) *', '300');
    await dlg().getByText('Repartido por importes').click();
    await fill('Importe para Rubén', '180');
    await fill('Importe para Inés', '100');
    await dlg().getByText(/La suma de los dos importes debe coincidir/).first().waitFor();
    await dlg().getByRole('button', { name: 'Guardar' }).click();
    await dlg().getByText(/Reparto: La suma/).waitFor();
    await fill('Importe para Inés', '120');
    await dlg().getByText('Rubén: 180,00 € · Inés: 120,00 €').waitFor();
    await choose('Estado *', 'En curso');
    await dlg().getByRole('button', { name: 'Guardar' }).click();
    await page.getByRole('heading', { name: 'Web corporativa' }).waitFor();
});

test('obligación heredando el reparto y cobros parciales', async () => {
    await page.getByRole('button', { name: /Registrar lo pendiente de documentar/ }).click();
    await assert.doesNotReject(dlg().getByText('Rubén: 180,00 € · Inés: 120,00 €').waitFor());
    await dlg().getByRole('button', { name: 'Guardar' }).click();
    await page.getByRole('button', { name: 'Registrar cobro' }).waitFor();

    await page.getByRole('button', { name: 'Registrar cobro' }).click();
    await fill('Importe recibido (€) *', '100');
    await dlg().getByText('Reparto de este cobro: Rubén 60,00 € · Inés 40,00 €', { exact: false }).waitFor();
    await dlg().getByRole('button', { name: 'Registrar cobro' }).click();
    await page.getByText('Cobro registrado.').waitFor();
    await page.locator('.stat', { hasText: 'Saldo pendiente' }).getByText('200,00 €').waitFor();
    await page.locator('.stat', { hasText: 'Cobrado' }).getByText('100,00 €').first().waitFor();

    // Cobro superior al pendiente: exige decidir qué hacer con el exceso.
    await page.getByRole('button', { name: 'Registrar cobro' }).click();
    await fill('Importe recibido (€) *', '250');
    await dlg().getByRole('button', { name: 'Registrar cobro' }).click();
    await dlg().getByText(/supera el pendiente/).first().waitFor();
    await dlg().getByLabel(/hacemos con el exceso/).selectOption('a_cuenta');
    await dlg().getByRole('button', { name: 'Registrar cobro' }).click();
    await page.getByText(/El exceso se ha guardado como pago a cuenta/).waitFor();
    await page.locator('.stat', { hasText: 'Saldo pendiente' }).getByText('0,00 €').waitFor();
    await page.getByText('Pagado', { exact: true }).first().waitFor();
    await shot(page, '02-obligacion-pagada');
});

test('gasto pagado por Rubén y asumido al 50 %', async () => {
    await page.getByRole('button', { name: '+ Gasto' }).click();
    await fill('Concepto *', `Hosting anual ${run}`);
    await choose('Categoría *', 'Hosting');
    await fill('Importe total (€) *', '20');
    await choose('¿Quién ha adelantado el dinero?', 'Rubén');
    await dlg().getByRole('button', { name: 'Guardar' }).click();
    await page.getByText('Gasto registrado.').waitFor();
    await page.goto(`${BASE}#/socios`);
    await page.getByRole('heading', { name: 'Gastos adelantados' }).waitFor();
    await page.getByText('debería compensar', { exact: false }).waitFor();
    await page.goto(`${BASE}#/gastos`);
    const row = page.locator('tr', { hasText: `Hosting anual ${run}` });
    await row.locator('td[data-label="Pagado por"]').getByText('Rubén').waitFor();
    await row.locator('td[data-label="Asume"]').getByText('10,00 €').first().waitFor();
    await row.locator('td[data-label="Importe"]').getByText('20,00 €').waitFor();
});

test('cuota recurrente y generación de obligaciones', async () => {
    await page.goto(`${BASE}#/cuotas`);
    await page.getByRole('button', { name: 'Nueva cuota' }).first().click();
    await choose('Cliente *', `Panadería E2E ${run}`);
    await fill('Nombre del servicio *', 'Mantenimiento');
    await fill('Importe por periodo (€) *', '50');
    await dlg().getByText('Solo Inés').click();
    await dlg().getByRole('button', { name: 'Guardar' }).click();
    await page.getByRole('heading', { name: 'Mantenimiento' }).waitFor();
    await page.locator('.stat', { hasText: 'Equivalente mensual' }).getByText('Inés 50,00 €').waitFor();
    await page.getByRole('button', { name: 'Generar hasta hoy' }).click();
    await page.getByText(/Se han generado 1 obligaciones/).waitFor();
});

test('todas las secciones se cargan sin errores', async () => {
    for (const r of ['', 'clientes', 'proyectos', 'cobros', 'cuotas', 'gastos', 'prevision', 'estadisticas', 'socios', 'configuracion']) {
        await page.goto(`${BASE}#/${r}`);
        await page.locator('#view h1').first().waitFor();
        assert.equal(await page.locator('#view .notice.bad').count(), 0, `error al cargar #/${r}`);
        await shot(page, `10-${r || 'dashboard'}`);
    }
});

test('Inés ve los mismos datos desde otro dispositivo', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    watch(p);
    await login(p, 'ines');
    await p.goto(`${BASE}#/clientes`);
    await p.getByRole('link', { name: `Panadería E2E ${run}` }).waitFor();
    await p.goto(BASE);
    await p.getByRole('heading', { name: 'Resumen de ZetaWeb' }).waitFor();
    await shot(p, '20-movil-dashboard');
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `la página se desborda en horizontal ${overflow}px en móvil`);
    await p.getByRole('button', { name: 'Abrir menú' }).click();
    await shot(p, '21-movil-menu');
    await p.locator('#sidebar').getByRole('link', { name: 'Gastos', exact: true }).click();
    await p.getByRole('heading', { name: 'Gastos', exact: true }).waitFor();
    await p.getByRole('button', { name: 'Añadir', exact: true }).click();
    await p.getByRole('button', { name: 'Registrar cobro' }).click();
    await shot(p, '22-movil-formulario');
    await ctx.close();
});

test('PWA: manifest y service worker', async () => {
    await page.goto(BASE);
    const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
    assert.equal(manifest.short_name, 'ZetaWeb');
    assert.equal(manifest.start_url, '/admin/');
    assert.equal(manifest.display, 'standalone');
    const sw = await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.ready;
        return reg.scope;
    });
    assert.equal(sw, 'http://127.0.0.1:8080/admin/');
});

test('sin conexión: aviso y botones de guardado desactivados', async () => {
    await page.goto(`${BASE}#/clientes`);
    await page.getByRole('heading', { name: 'Clientes' }).waitFor();
    await page.context().setOffline(true);
    await page.getByText('Sin conexión: puedes consultar').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Añadir cliente' }).first().isDisabled(), true);
    await page.context().setOffline(false);
    await page.getByText('Sin conexión: puedes consultar').waitFor({ state: 'hidden' });
});

test('cerrar sesión protege de nuevo el panel', async () => {
    await page.goto(`${BASE}#/configuracion`);
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).last().click();
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
    await page.goto(`${BASE}#/cobros`);
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
    // Tras volver a entrar, los datos siguen ahí.
    await login(page, 'ruben');
    await page.goto(`${BASE}#/clientes`);
    await page.getByRole('link', { name: `Panadería E2E ${run}` }).waitFor();
});

test('ningún error de JavaScript ni de CSP durante la prueba', () => {
    // El único 400 esperado es el intento de acceso con contraseña incorrecta.
    const expected = /auth\/v1\/token\?grant_type=password|status of 400 \(Bad Request\)|ERR_INTERNET_DISCONNECTED|fonts\.(googleapis|gstatic)/;
    const badLogins = problems.filter((p) => /http 400 POST .*grant_type=password/.test(p)).length;
    assert.equal(badLogins, 1, 'solo debe fallar el login con contraseña incorrecta');
    assert.deepEqual(problems.filter((p) => !expected.test(p)), []);
});
