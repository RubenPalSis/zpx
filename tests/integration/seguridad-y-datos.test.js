// Pruebas contra un Supabase local (tests/stack/start.sh + gateway.mjs).
// Comprueban autenticación, políticas RLS y las reglas económicas de la base
// de datos a través de la misma API que usa el panel.
//
//   tests/stack/start.sh && node tests/stack/gateway.mjs &
//   npm run test:db
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { ANON_KEY, SERVICE_KEY } from '../stack/gateway.mjs';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const PASS = 'clave-de-prueba-123';
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const run = Date.now().toString(36);
const email = (who) => `${who}-${run}@zetaweb.test`;

const admin = createClient(URL, SERVICE_KEY, opts);
const anon = createClient(URL, ANON_KEY, opts);
let ruben, ines, ines2, intruso;
const ids = {};

async function login(who) {
    const c = createClient(URL, ANON_KEY, opts);
    const { error } = await c.auth.signInWithPassword({ email: email(who), password: PASS });
    assert.ifError(error);
    return c;
}

function ok({ data, error }) {
    assert.ifError(error);
    return data;
}

before(async () => {
    const users = {};
    for (const who of ['ruben', 'ines', 'intruso']) {
        const { data, error } = await admin.auth.admin.createUser({ email: email(who), password: PASS, email_confirm: true });
        assert.ifError(error);
        users[who] = data.user.id;
    }
    // Solo Rubén e Inés quedan vinculados como socios. Cada ejecución usa
    // usuarios nuevos, así que se sustituyen las filas anteriores.
    ok(await admin.from('profiles').delete().in('partner', ['ruben', 'ines']));
    ok(await admin.from('profiles').insert([
        { id: users.ruben, partner: 'ruben', display_name: 'Rubén' },
        { id: users.ines, partner: 'ines', display_name: 'Inés' },
    ]));
    ruben = await login('ruben');
    ines = await login('ines');
    ines2 = await login('ines'); // segundo dispositivo
    intruso = await login('intruso');
});

test('el registro público está desactivado', async () => {
    const { error } = await anon.auth.signUp({ email: `nuevo-${run}@zetaweb.test`, password: PASS });
    assert.ok(error, 'el alta pública debería fallar');
});

test('contraseña incorrecta: no hay sesión', async () => {
    const c = createClient(URL, ANON_KEY, opts);
    const { error } = await c.auth.signInWithPassword({ email: email('ruben'), password: 'incorrecta-000' });
    assert.ok(error);
});

test('un usuario anónimo no puede leer ni escribir nada', async () => {
    for (const t of ['clients', 'projects', 'payment_obligations', 'payments', 'expenses', 'recurring_services', 'profiles', 'audit_log', 'settings', 'payment_obligations_v', 'income_allocations']) {
        const { data, error } = await anon.from(t).select('*').limit(1);
        assert.ok(error || data.length === 0, `anónimo leyó ${t}`);
        assert.ok(error, `anónimo debería recibir error de permisos en ${t}`);
    }
    const { error } = await anon.from('clients').insert({ name: 'Hack' });
    assert.ok(error);
    const rpc = await anon.rpc('generate_recurring_obligations', { p_until: '2030-01-01' });
    assert.ok(rpc.error);
});

test('una cuenta autenticada que no es socia no ve ni toca datos', async () => {
    const { data } = await intruso.from('clients').select('*');
    assert.equal(data.length, 0);
    const ins = await intruso.from('clients').insert({ name: 'Intruso' });
    assert.ok(ins.error, 'el intruso no debe poder insertar');
    const pr = await intruso.from('profiles').insert({ id: randomUUID(), partner: 'ruben', display_name: 'x' });
    assert.ok(pr.error, 'nadie puede darse de alta como socio desde la API');
});

test('Rubén crea un cliente e Inés lo ve desde dos dispositivos', async () => {
    ids.client = randomUUID();
    const c = ok(await ruben.from('clients').insert({ id: ids.client, name: `Cliente ${run}`, email: 'cliente@example.com', client_type: 'empresa', status: 'activo' }).select().single());
    const me = ok(await ruben.auth.getUser()).user.id;
    assert.equal(c.created_by, me, 'se registra quién crea el cliente');
    const seen = ok(await ines.from('clients').select('*').eq('id', ids.client).single());
    assert.equal(seen.name, `Cliente ${run}`);
    const seen2 = ok(await ines2.from('clients').select('*').eq('id', ids.client).single());
    assert.equal(seen2.id, ids.client);
    // Edición por Inés: queda registrada como última modificación suya.
    const upd = ok(await ines.from('clients').update({ phone: '600000000' }).eq('id', ids.client).select().single());
    assert.equal(upd.updated_by, ok(await ines.auth.getUser()).user.id);
});

test('envío del mismo formulario dos veces no duplica el cliente', async () => {
    const { error } = await ruben.from('clients').insert({ id: ids.client, name: 'Duplicado' });
    assert.equal(error?.code, '23505');
});

test('los clientes no se pueden borrar, solo archivar', async () => {
    const del = await ruben.from('clients').delete().eq('id', ids.client).select();
    assert.ok(del.error || del.data.length === 0);
    const still = ok(await ruben.from('clients').select('id').eq('id', ids.client));
    assert.equal(still.length, 1);
    const arch = ok(await ruben.from('clients').update({ archived_at: new Date().toISOString() }).eq('id', ids.client).select().single());
    assert.ok(arch.archived_at);
    ok(await ruben.from('clients').update({ archived_at: null }).eq('id', ids.client));
});

test('proyecto con reparto por importes: debe cuadrar con el precio', async () => {
    const bad = await ruben.from('projects').insert({ client_id: ids.client, name: 'Mal', price_cents: 30000, alloc_mode: 'fixed', ruben_cents: 18000, ines_cents: 10000 });
    assert.ok(bad.error);
    assert.match(bad.error.message, /no cuadra/);
    ids.project = randomUUID();
    const p = ok(await ruben.from('projects').insert({ id: ids.project, client_id: ids.client, name: 'Web', price_cents: 30000, alloc_mode: 'fixed', ruben_cents: 18000, ines_cents: 12000 }).select().single());
    assert.deepEqual([p.ruben_cents, p.ines_cents], [18000, 12000]);
});

test('reparto 100 % Rubén, 100 % Inés y porcentual lo resuelve la base de datos', async () => {
    const mk = async (mode, bp) => ok(await ruben.from('projects').insert({ client_id: ids.client, name: `P ${mode}`, price_cents: 15000, alloc_mode: mode, alloc_ruben_bp: bp, ruben_cents: 1, ines_cents: 1 }).select().single());
    const r = await mk('ruben');
    assert.deepEqual([r.ruben_cents, r.ines_cents], [15000, 0]);
    const i = await mk('ines');
    assert.deepEqual([i.ruben_cents, i.ines_cents], [0, 15000]);
    const p = await mk('pct', 3333);
    assert.equal(p.ruben_cents + p.ines_cents, 15000);
    assert.equal(p.ruben_cents, 5000); // 4999,5 → mitad al par
    const bad = await ruben.from('projects').insert({ client_id: ids.client, name: 'x', price_cents: 100, alloc_mode: 'pct', alloc_ruben_bp: 12000 });
    assert.ok(bad.error);
});

test('obligación de 200 € al 50 % con dos cobros parciales', async () => {
    ids.ob = randomUUID();
    ok(await ruben.from('payment_obligations').insert({ id: ids.ob, client_id: ids.client, project_id: ids.project, concept: 'Primer pago', amount_cents: 20000, alloc_mode: 'pct', alloc_ruben_bp: 5000, due_date: '2099-01-01' }));
    let v = ok(await ruben.from('payment_obligations_v').select('*').eq('id', ids.ob).single());
    assert.equal(v.status, 'pendiente');

    const p1 = randomUUID();
    ok(await ruben.rpc('register_payment', { p_id: p1, p_obligation: ids.ob, p_paid_on: '2026-10-10', p_amount_cents: 10000, p_method: 'transferencia', p_reference: null, p_notes: null }));
    const pay = ok(await ines.from('payments').select('*').eq('id', p1).single());
    assert.deepEqual([pay.ruben_cents, pay.ines_cents], [5000, 5000]);
    assert.equal(pay.client_id, ids.client);
    assert.equal(pay.created_by, ok(await ruben.auth.getUser()).user.id);
    v = ok(await ines.from('payment_obligations_v').select('*').eq('id', ids.ob).single());
    assert.equal(v.status, 'parcial');
    assert.equal(Number(v.pending_cents), 10000);

    // Doble envío del mismo cobro: no se duplica.
    const dup = await ruben.rpc('register_payment', { p_id: p1, p_obligation: ids.ob, p_paid_on: '2026-10-10', p_amount_cents: 10000, p_method: 'transferencia', p_reference: null, p_notes: null });
    assert.equal(dup.error?.code, '23505');

    ok(await ines.rpc('register_payment', { p_id: randomUUID(), p_obligation: ids.ob, p_paid_on: '2026-10-20', p_amount_cents: 10000, p_method: 'bizum', p_reference: null, p_notes: null }));
    v = ok(await ruben.from('payment_obligations_v').select('*').eq('id', ids.ob).single());
    assert.equal(v.status, 'pagado');
    assert.equal(Number(v.pending_cents), 0);
    assert.equal(Number(v.paid_ruben_cents), 10000);
    assert.equal(Number(v.paid_ines_cents), 10000);
});

test('no se acepta un cobro superior al pendiente sin gestionar el exceso', async () => {
    const ob = randomUUID();
    ok(await ruben.from('payment_obligations').insert({ id: ob, client_id: ids.client, concept: 'Exceso', amount_cents: 10000, alloc_mode: 'ruben' }));
    const r = await ruben.rpc('register_payment', { p_id: randomUUID(), p_obligation: ob, p_paid_on: '2026-10-01', p_amount_cents: 15000, p_method: 'efectivo', p_reference: null, p_notes: null });
    assert.ok(r.error);
    assert.match(r.error.message, /supera el saldo pendiente/);
    // Directo a la tabla tampoco.
    const direct = await ruben.from('payments').insert({ obligation_id: ob, client_id: ids.client, paid_on: '2026-10-01', amount_cents: 15000 });
    assert.ok(direct.error);
    // Gestión explícita: el exceso queda como pago a cuenta.
    ok(await ruben.rpc('register_payment', { p_id: randomUUID(), p_obligation: ob, p_paid_on: '2026-10-01', p_amount_cents: 15000, p_method: 'efectivo', p_reference: null, p_notes: null, p_excess: 'a_cuenta' }));
    const v = ok(await ruben.from('payment_obligations_v').select('*').eq('client_id', ids.client).like('concept', 'Pago a cuenta%'));
    assert.equal(v.length, 1);
    assert.equal(Number(v[0].amount_cents), 5000);
    assert.equal(v[0].status, 'pagado');
    assert.equal(Number(v[0].paid_ruben_cents), 5000);
    const main = ok(await ruben.from('payment_obligations_v').select('*').eq('id', ob).single());
    assert.equal(main.status, 'pagado');
});

test('céntimos: los cobros parciales suman exactamente el reparto acordado', async () => {
    const ob = randomUUID();
    const o = ok(await ruben.from('payment_obligations').insert({ id: ob, client_id: ids.client, concept: 'Céntimos', amount_cents: 10001, alloc_mode: 'pct', alloc_ruben_bp: 3333 }).select().single());
    for (const [i, a] of [3333, 3333, 3335].entries()) {
        ok(await ruben.rpc('register_payment', { p_id: randomUUID(), p_obligation: ob, p_paid_on: `2026-10-0${i + 1}`, p_amount_cents: a, p_method: 'transferencia', p_reference: null, p_notes: null }));
    }
    const pays = ok(await ruben.from('payments').select('*').eq('obligation_id', ob));
    assert.equal(pays.reduce((s, p) => s + Number(p.ruben_cents), 0), Number(o.ruben_cents));
    assert.equal(pays.reduce((s, p) => s + Number(p.ines_cents), 0), Number(o.ines_cents));
});

test('cambiar el reparto del proyecto no altera obligaciones ya registradas', async () => {
    ok(await ruben.from('projects').update({ alloc_mode: 'ines' }).eq('id', ids.project));
    const o = ok(await ruben.from('payment_obligations').select('*').eq('id', ids.ob).single());
    assert.deepEqual([Number(o.ruben_cents), Number(o.ines_cents)], [10000, 10000]);
});

test('integridad: importes y relaciones incoherentes se rechazan', async () => {
    const other = ok(await ruben.from('clients').insert({ name: `Otro ${run}` }).select().single());
    const wrong = await ruben.from('payment_obligations').insert({ client_id: other.id, project_id: ids.project, concept: 'x', amount_cents: 100, alloc_mode: 'ruben' });
    assert.match(wrong.error?.message ?? '', /no pertenece/);
    const neg = await ruben.from('payment_obligations').insert({ client_id: ids.client, concept: 'x', amount_cents: -5, alloc_mode: 'ruben' });
    assert.ok(neg.error);
    const below = await ruben.from('payment_obligations').update({ amount_cents: 100 }).eq('id', ids.ob);
    assert.match(below.error?.message ?? '', /inferior a lo ya cobrado/);
    const voidPaid = await ruben.from('payment_obligations').update({ voided_at: new Date().toISOString() }).eq('id', ids.ob);
    assert.match(voidPaid.error?.message ?? '', /No se puede anular/);
    const delPaid = await ruben.from('payment_obligations').delete().eq('id', ids.ob);
    assert.ok(delPaid.error, 'no se puede borrar una obligación con cobros');
    const badEmail = await ruben.from('clients').insert({ name: 'x', email: 'no-es-correo' });
    assert.ok(badEmail.error);
});

test('cuota mensual: generación de obligaciones idempotente', async () => {
    ids.svc = randomUUID();
    ok(await ruben.from('recurring_services').insert({
        id: ids.svc, client_id: ids.client, name: 'Mantenimiento', amount_cents: 5000, period_months: 1,
        start_date: '2026-01-31', next_due_date: '2026-01-31', alloc_mode: 'pct', alloc_ruben_bp: 5000,
    }));
    const n1 = ok(await ruben.rpc('generate_recurring_obligations', { p_until: '2026-04-30', p_service: ids.svc }));
    assert.equal(n1, 4); // 31/01, 28/02, 31/03 y 30/04 (abril no tiene día 31)
    const svc = ok(await ruben.from('recurring_services').select('*').eq('id', ids.svc).single());
    assert.equal(svc.next_due_date, '2026-05-31');
    const n2 = ok(await ines.rpc('generate_recurring_obligations', { p_until: '2026-04-30', p_service: ids.svc }));
    assert.equal(n2, 0, 'generar dos veces no duplica');
    const obs = ok(await ruben.from('payment_obligations').select('period_start, ruben_cents, ines_cents').eq('recurring_service_id', ids.svc).order('period_start'));
    assert.deepEqual(obs.map((o) => o.period_start), ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
    assert.ok(obs.every((o) => Number(o.ruben_cents) === 2500 && Number(o.ines_cents) === 2500));
});

test('cuotas canceladas no generan obligaciones', async () => {
    const id = randomUUID();
    ok(await ruben.from('recurring_services').insert({ id, client_id: ids.client, name: 'Hosting', amount_cents: 1000, period_months: 12, start_date: '2026-01-01', next_due_date: '2026-01-01', status: 'cancelado', alloc_mode: 'ruben' }));
    const n = ok(await ruben.rpc('generate_recurring_obligations', { p_until: '2027-12-31', p_service: id }));
    assert.equal(n, 0);
});

test('gasto pagado por Rubén y asumido al 50 %', async () => {
    const missing = await ruben.from('expenses').insert({ concept: 'Hosting', amount_cents: 2000, expense_date: '2026-10-05', status: 'pagado', paid_on: '2026-10-05', alloc_mode: 'pct', alloc_ruben_bp: 5000 });
    assert.ok(missing.error, 'un gasto pagado necesita indicar quién pagó');
    const e = ok(await ruben.from('expenses').insert({ concept: 'Hosting', category: 'hosting', amount_cents: 2000, expense_date: '2026-10-05', status: 'pagado', paid_on: '2026-10-05', paid_by: 'ruben', alloc_mode: 'pct', alloc_ruben_bp: 5000 }).select().single());
    assert.deepEqual([Number(e.amount_cents), Number(e.ruben_cents), Number(e.ines_cents), e.paid_by], [2000, 1000, 1000, 'ruben']);
    const alloc = ok(await ines.from('expense_allocations').select('*').eq('expense_id', e.id));
    assert.equal(alloc.length, 2);
    const pend = ok(await ruben.from('expenses').insert({ concept: 'Dominio', category: 'dominio', amount_cents: 1200, expense_date: '2026-11-05', status: 'pendiente', alloc_mode: 'ines' }).select().single());
    assert.equal(pend.paid_on, null);
});

test('gasto recurrente: cada periodo se registra una sola vez', async () => {
    const t = ok(await ruben.from('expenses').insert({ concept: 'Software', category: 'software', amount_cents: 1500, expense_date: '2026-09-01', status: 'pagado', paid_on: '2026-09-01', paid_by: 'empresa', recurrence_months: 1, alloc_mode: 'pct', alloc_ruben_bp: 5000 }).select().single());
    ok(await ruben.rpc('register_recurring_expense', { p_template: t.id, p_date: '2026-10-01', p_status: 'pagado', p_paid_on: '2026-10-01', p_paid_by: 'ines' }));
    const again = await ines.rpc('register_recurring_expense', { p_template: t.id, p_date: '2026-10-01', p_status: 'pagado', p_paid_on: '2026-10-01', p_paid_by: 'ines' });
    assert.equal(again.error?.code, '23505');
});

test('edición concurrente: no se pisa un cambio de otro usuario', async () => {
    const c = ok(await ruben.from('clients').select('*').eq('id', ids.client).single());
    ok(await ines.from('clients').update({ notes: 'cambio de Inés' }).eq('id', ids.client));
    const stale = ok(await ruben.from('clients').update({ notes: 'cambio de Rubén' }).eq('id', ids.client).eq('updated_at', c.updated_at).select());
    assert.equal(stale.length, 0, 'la actualización con marca antigua no debe aplicarse');
});

test('historial de cambios con autor', async () => {
    const log = ok(await ines.from('audit_log').select('*').eq('row_id', ids.client).order('id'));
    assert.ok(log.length >= 2);
    assert.equal(log[0].action, 'insert');
    assert.ok(log.every((l) => l.changed_by));
    const tamper = await ines.from('audit_log').delete().eq('row_id', ids.client).select();
    assert.ok(tamper.error || tamper.data.length === 0, 'el historial no se puede borrar');
});

test('los datos persisten tras cerrar sesión y volver a entrar', async () => {
    const c = await login('ruben');
    await c.auth.signOut();
    const { data } = await c.from('clients').select('id').eq('id', ids.client);
    assert.equal(data?.length ?? 0, 0, 'tras cerrar sesión no hay acceso');
    const again = await login('ruben');
    const back = ok(await again.from('clients').select('id').eq('id', ids.client));
    assert.equal(back.length, 1);
});

test('recuperación de contraseña: se envía el correo', async () => {
    const before = await fetch('http://127.0.0.1:8025/api/v1/messages').then((r) => r.json());
    const { error } = await anon.auth.resetPasswordForEmail(email('ines'), { redirectTo: 'http://127.0.0.1:8080/admin/?recuperar=1' });
    assert.ifError(error);
    let total = before.total;
    for (let i = 0; i < 20 && total === before.total; i++) {
        await new Promise((r) => setTimeout(r, 250));
        total = (await fetch('http://127.0.0.1:8025/api/v1/messages').then((r) => r.json())).total;
    }
    assert.equal(total, before.total + 1);
});
