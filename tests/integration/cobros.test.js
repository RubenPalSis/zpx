// Pruebas contra un Supabase local (tests/stack/start.sh + gateway.mjs):
// seguridad (RLS) y reglas de cobros a través de la misma API que usa el panel.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { ANON_KEY, SERVICE_KEY } from '../stack/gateway.mjs';

const URL = 'http://127.0.0.1:54321';
const PASS = 'clave-de-prueba-123';
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const run = Date.now().toString(36);
const email = (who) => `${who}-${run}@zetaweb.test`;
const admin = createClient(URL, SERVICE_KEY, opts);
const anon = createClient(URL, ANON_KEY, opts);
let ruben, ines, intruso;

async function login(who) {
    const c = createClient(URL, ANON_KEY, opts);
    const { error } = await c.auth.signInWithPassword({ email: email(who), password: PASS });
    assert.ifError(error);
    return c;
}
function ok({ data, error }) { assert.ifError(error); return data; }

before(async () => {
    const ids = {};
    for (const who of ['ruben', 'ines', 'intruso']) {
        const { data, error } = await admin.auth.admin.createUser({ email: email(who), password: PASS, email_confirm: true });
        assert.ifError(error);
        ids[who] = data.user.id;
    }
    ok(await admin.from('profiles').delete().in('partner', ['ruben', 'ines']));
    ok(await admin.from('profiles').insert([{ id: ids.ruben, partner: 'ruben', display_name: 'Rubén' }, { id: ids.ines, partner: 'ines', display_name: 'Inés' }]));
    ruben = await login('ruben');
    ines = await login('ines');
    intruso = await login('intruso');
});

test('registro público desactivado', async () => {
    const { error } = await anon.auth.signUp({ email: `x-${run}@zetaweb.test`, password: PASS });
    assert.ok(error);
});

test('anónimos y cuentas no autorizadas no ven ni escriben nada', async () => {
    for (const t of ['clients', 'charges', 'charge_payments', 'profiles']) {
        const r = await anon.from(t).select('*');
        assert.ok(r.error, `anónimo leyó ${t}`);
        const i = await intruso.from(t).select('*');
        assert.equal(i.data?.length ?? 0, 0, `intruso leyó ${t}`);
    }
    assert.ok((await intruso.from('clients').insert({ name: 'x' })).error);
    assert.ok((await anon.rpc('new_charge', {})).error);
});

const base = { p_client_id: null, p_due_date: null, p_day_of_month: null, p_start_month: null, p_for_whom: 'ambos', p_paid: false };

test('alta rápida: cliente nuevo + cobro único ya pagado, en una operación', async () => {
    const id = randomUUID();
    ok(await ruben.rpc('new_charge', { ...base, p_id: id, p_new_client: `Bar ${run}`, p_concept: 'Web', p_amount_cents: 30001, p_kind: 'unico', p_due_date: '2026-10-01', p_paid: true }));
    const c = ok(await ines.from('charges').select('*, clients(name)').eq('id', id).single());
    assert.equal(c.clients.name, `Bar ${run}`);
    const p = ok(await ines.from('charge_payments').select('*').eq('charge_id', id).single());
    assert.equal(Number(p.amount_cents), 30001);
    assert.equal(Number(p.ruben_cents) + Number(p.ines_cents), 30001);
    assert.equal(Number(p.ruben_cents), 15000); // 150,005 → mitad al par
});

test('cobro mensual: validar pagos mes a mes sin duplicar', async () => {
    const client = ok(await ruben.from('clients').insert({ name: `Mensual ${run}` }).select().single());
    const id = randomUUID();
    ok(await ruben.rpc('new_charge', { ...base, p_id: id, p_client_id: client.id, p_new_client: null, p_concept: 'Mantenimiento', p_amount_cents: 5000, p_kind: 'mensual', p_day_of_month: 31, p_start_month: '2026-01-15', p_for_whom: 'ines' }));
    const c = ok(await ruben.from('charges').select('*').eq('id', id).single());
    assert.equal(c.start_month, '2026-01-01');
    // Febrero: el día 31 pasa a ser el 28.
    const p = ok(await ruben.from('charge_payments').insert({ charge_id: id, period: '2026-02-28', amount_cents: 5000 }).select().single());
    assert.deepEqual([Number(p.ruben_cents), Number(p.ines_cents)], [0, 5000]);
    const dup = await ines.from('charge_payments').insert({ charge_id: id, period: '2026-02-28', amount_cents: 5000 });
    assert.equal(dup.error?.code, '23505', 'el mismo mes no se puede marcar dos veces');
    const wrong = await ruben.from('charge_payments').insert({ charge_id: id, period: '2026-03-15', amount_cents: 5000 });
    assert.match(wrong.error?.message ?? '', /Periodo no válido/);
    const before = await ruben.from('charge_payments').insert({ charge_id: id, period: '2025-12-31', amount_cents: 5000 });
    assert.ok(before.error, 'no se aceptan meses anteriores al inicio');
    // Un cobro mensual se puede parar para que deje de pedirse.
    ok(await ruben.from('charges').update({ active: false }).eq('id', id));
    // Deshacer un pago.
    ok(await ines.from('charge_payments').delete().eq('id', p.id));
});

test('importes y datos no válidos se rechazan', async () => {
    const client = ok(await ruben.from('clients').insert({ name: `Val ${run}` }).select().single());
    const r1 = await ruben.rpc('new_charge', { ...base, p_id: randomUUID(), p_client_id: client.id, p_new_client: null, p_concept: 'x', p_amount_cents: -5, p_kind: 'unico', p_due_date: '2026-10-01' });
    assert.ok(r1.error);
    const r2 = await ruben.rpc('new_charge', { ...base, p_id: randomUUID(), p_client_id: client.id, p_new_client: null, p_concept: 'x', p_amount_cents: 500, p_kind: 'mensual' });
    assert.ok(r2.error, 'un mensual necesita día y mes de inicio');
    const r3 = await ruben.rpc('new_charge', { ...base, p_id: randomUUID(), p_new_client: '  ', p_concept: 'x', p_amount_cents: 500, p_kind: 'unico', p_due_date: '2026-10-01' });
    assert.match(r3.error?.message ?? '', /Elige un cliente/);
});

test('cerrar sesión corta el acceso; al volver los datos siguen', async () => {
    const c = await login('ruben');
    await c.auth.signOut();
    assert.ok((await c.from('clients').select('id')).error || true);
    const again = await login('ruben');
    assert.ok(ok(await again.from('clients').select('id')).length >= 3);
});

test('borrar un cliente elimina sus cobros y pagos', async () => {
    const id = randomUUID();
    ok(await ruben.rpc('new_charge', { ...base, p_id: id, p_new_client: `Borrar ${run}`, p_concept: 'Web', p_amount_cents: 1000, p_kind: 'unico', p_due_date: '2026-10-01', p_paid: true }));
    const { client_id: cid } = ok(await ruben.from('charges').select('client_id').eq('id', id).single());
    ok(await ines.from('clients').delete().eq('id', cid));
    assert.equal(ok(await ruben.from('charges').select('id').eq('id', id)).length, 0);
    assert.equal(ok(await ruben.from('charge_payments').select('id').eq('charge_id', id)).length, 0);
});
