// Prueba del panel en un navegador real (Chromium) contra el Supabase local.
//   npm run test:e2e   (con tests/stack/start.sh y gateway.mjs en marcha)
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
const CLIENT = `Panadería ${run}`;

let browser;
let page;
const problems = [];
const dlg = () => page.locator('dialog[open]');

function watch(p) {
    p.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
    p.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    p.on('response', async (r) => { if (r.status() >= 400 && r.url().includes(':54321')) problems.push(`http ${r.status()} ${r.request().method()} ${r.url().split('?')[0]} ${await r.text().catch(() => '')}`); });
}
async function shot(p, name) { if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); }
async function login(p, who) {
    await p.goto(BASE);
    await p.getByLabel('Correo electrónico').fill(EMAIL[who]);
    await p.getByLabel('Contraseña').fill(PASS);
    await p.getByRole('button', { name: 'Entrar' }).click();
    await p.getByRole('heading', { name: 'Cobros', exact: true }).waitFor();
}

before(async () => {
    const admin = createClient('http://127.0.0.1:54321', SERVICE_KEY, { auth: { persistSession: false } });
    const ids = {};
    for (const who of ['ruben', 'ines']) {
        const { data, error } = await admin.auth.admin.createUser({ email: EMAIL[who], password: PASS, email_confirm: true });
        assert.ifError(error);
        ids[who] = data.user.id;
    }
    // Base de pruebas vacía para poder comprobar cifras exactas.
    for (const t of ['charge_payments', 'charges', 'clients']) assert.ifError((await admin.from(t).delete().not('id', 'is', null)).error);
    await admin.from('profiles').delete().in('partner', ['ruben', 'ines']);
    assert.ifError((await admin.from('profiles').insert([
        { id: ids.ruben, partner: 'ruben', display_name: 'Rubén' }, { id: ids.ines, partner: 'ines', display_name: 'Inés' }])).error);
    browser = await chromium.launch();
    page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    watch(page);
});
after(async () => { await browser?.close(); });

test('sin sesión solo se ve el acceso', async () => {
    await page.goto(`${BASE}#/clientes`);
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
    await page.getByLabel('Correo electrónico').fill(EMAIL.ruben);
    await page.getByLabel('Contraseña').fill('incorrecta-123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.getByText('Correo o contraseña incorrectos.').waitFor();
});

test('entrar y crear un cobro único con cliente nuevo, ya pagado', async () => {
    await login(page, 'ruben');
    await page.getByRole('button', { name: '+ Nuevo cobro' }).click();
    await dlg().getByLabel('Cliente *').selectOption('__new');
    await dlg().getByLabel('Nombre del cliente nuevo *').fill(CLIENT);
    await dlg().getByLabel('Concepto *').fill('Página web');
    await dlg().getByLabel('Importe (€) *').fill('300');
    await dlg().getByText('Ya está pagado').click();
    await dlg().getByRole('button', { name: 'Crear cobro' }).click();
    await page.getByText('Cobro creado.').waitFor();
    await page.locator('.stat', { hasText: 'Cobrado este mes' }).getByText('300,00 €').waitFor();
});

test('cobro mensual: aparece por cobrar y se valida con un toque', async () => {
    const day = new Date().getDate();
    await page.getByRole('button', { name: '+ Nuevo cobro' }).click();
    await dlg().getByLabel('Cliente *').selectOption({ label: CLIENT });
    await dlg().getByLabel('Concepto *').fill('Mantenimiento');
    await dlg().getByLabel('Importe (€) *').fill('50');
    await dlg().getByRole('radio', { name: 'Cada mes' }).check();
    await dlg().getByLabel('Día del mes *').fill(String(day));
    await dlg().getByRole('radio', { name: 'Rubén' }).check();
    await dlg().getByRole('button', { name: 'Crear cobro' }).click();
    await page.getByText('Cobro creado.').waitFor();
    const row = page.locator('.pending li', { hasText: 'Mantenimiento' });
    await row.waitFor();
    await shot(page, '01-por-cobrar');
    await row.getByRole('button', { name: /pagado/i }).click();
    await page.getByText('Cobrado: Mantenimiento', { exact: false }).waitFor();
    await page.getByText('Todo cobrado. ✓').waitFor();
    await page.locator('.stat', { hasText: 'Cobros mensuales' }).getByText('50,00 €').waitFor();
    // Deshacer lo devuelve a pendiente.
    await page.locator('section', { hasText: 'Últimos pagos marcados' }).getByRole('button', { name: 'Deshacer' }).first().click();
    await page.locator('.pending li', { hasText: 'Mantenimiento' }).waitFor();
});

test('ficha de cliente y estadísticas', async () => {
    await page.getByRole('link', { name: 'Clientes' }).click();
    await page.getByRole('link', { name: CLIENT }).click();
    await page.getByRole('heading', { name: CLIENT }).waitFor();
    await page.locator('.stat', { hasText: 'Debe' }).getByText('50,00 €').waitFor();
    await page.locator('.pending li').getByRole('button', { name: /pagado/i }).click();
    await page.locator('.stat', { hasText: 'Debe' }).getByText('0,00 €').waitFor();
    await page.getByRole('link', { name: 'Estadísticas' }).click();
    await page.getByRole('heading', { name: 'Estadísticas' }).waitFor();
    await page.locator('tr', { hasText: 'Cobrado' }).getByText('350,00 €').waitFor();
    await shot(page, '02-estadisticas');
});

test('Inés lo ve en el móvil y la página no se desborda', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    watch(p);
    await login(p, 'ines');
    await p.getByRole('link', { name: 'Clientes' }).click();
    await p.getByRole('link', { name: CLIENT }).waitFor();
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 1, `desbordamiento horizontal de ${overflow}px`);
    await p.getByRole('link', { name: 'Cobros' }).click();
    await shot(p, '03-movil');
    await p.getByRole('button', { name: '+ Nuevo cobro' }).click();
    await shot(p, '04-movil-form');
    await ctx.close();
});

test('PWA, modo sin conexión y salir', async () => {
    await page.goto(BASE);
    const manifest = await page.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
    assert.equal(manifest.start_url, '/admin/');
    assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.ready).scope), BASE);
    await page.context().setOffline(true);
    await page.getByText('Sin conexión').waitFor();
    assert.equal(await page.getByRole('button', { name: '+ Nuevo cobro' }).isDisabled(), true);
    await page.context().setOffline(false);
    await page.getByRole('button', { name: 'Salir' }).click();
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
});

test('sin errores de JavaScript ni de CSP', () => {
    assert.deepEqual(problems.filter((p) => !/ERR_INTERNET_DISCONNECTED|fonts\.g|invalid_credentials|status of 400/.test(p)), []);
});
