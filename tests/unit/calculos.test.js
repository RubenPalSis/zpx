// Pruebas de los cálculos económicos. Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatEuros, parseEuros, parsePct, centsToInput } from '../../admin/js/lib/money.js';
import { roundRatio, resolveAlloc, paymentAllocations, inheritAlloc } from '../../admin/js/lib/alloc.js';
import { addPeriod, formatDate, parseDate, monthsBetween } from '../../admin/js/lib/dates.js';
import {
    enrichObligations, recurringMonthly, recurringContracted, recurringForecastItems,
    periodSummary, projectsUndocumented, expenseForecastItems, monthlySeries,
} from '../../admin/js/lib/finance.js';

const TODAY = '2026-10-28';
const nbsp = (s) => s.replace(/ /g, ' ');

test('formato de euros español', () => {
    assert.equal(nbsp(formatEuros(125000)), '1.250,00 €');
    assert.equal(nbsp(formatEuros(5)), '0,05 €');
    assert.equal(nbsp(formatEuros(100000000)), '1.000.000,00 €');
});

test('lectura de importes escritos a mano', () => {
    assert.equal(parseEuros('1.250,50'), 125050);
    assert.equal(parseEuros('1250,5'), 125050);
    assert.equal(parseEuros('1250.50'), 125050);
    assert.equal(parseEuros('1.250'), 125000);
    assert.equal(parseEuros('50 €'), 5000);
    assert.equal(parseEuros('0,1'), 10);
    assert.equal(parseEuros('abc'), null);
    assert.equal(parseEuros('1,234'), null);
    assert.equal(centsToInput(125050), '1250,50');
    assert.equal(parsePct('33,33'), 3333);
    assert.equal(parsePct('101'), null);
});

test('fechas en formato DD/MM/AAAA', () => {
    assert.equal(formatDate('2026-03-07'), '07/03/2026');
    assert.equal(parseDate('7/3/2026'), '2026-03-07');
    assert.equal(parseDate('31/02/2026'), null);
});

test('periodos mensuales sin deriva a fin de mes', () => {
    assert.equal(addPeriod('2026-01-31', 1, 31), '2026-02-28');
    assert.equal(addPeriod('2026-02-28', 1, 31), '2026-03-31');
    assert.equal(addPeriod('2028-01-31', 1, 31), '2028-02-29');
    assert.equal(addPeriod('2026-11-15', 3, 15), '2027-02-15');
    assert.deepEqual(monthsBetween('2026-11-10', '2027-02-01'), ['2026-11', '2026-12', '2027-01', '2027-02']);
});

test('redondeo mitad al par', () => {
    assert.equal(roundRatio(101, 5000, 10000), 50); // 50,5 → 50
    assert.equal(roundRatio(103, 5000, 10000), 52); // 51,5 → 52
    assert.equal(roundRatio(100, 3333, 10000), 33);
});

test('reparto 100 % Rubén, 100 % Inés y 50 %', () => {
    assert.deepEqual(resolveAlloc(10000, 'ruben'), { ok: true, ruben: 10000, ines: 0, bp: 10000 });
    assert.deepEqual(resolveAlloc(15000, 'ines'), { ok: true, ruben: 0, ines: 15000, bp: 0 });
    assert.deepEqual(resolveAlloc(20000, 'pct', 5000), { ok: true, ruben: 10000, ines: 10000, bp: 5000 });
});

test('reparto porcentual personalizado y por importes fijos', () => {
    const pct = resolveAlloc(30000, 'pct', 6000); // 300 €: 60 % / 40 %
    assert.equal(pct.ruben, 18000);
    assert.equal(pct.ines, 12000);
    const fixed = resolveAlloc(20000, 'fixed', null, 8000, 12000); // 80 € + 120 €
    assert.deepEqual([fixed.ruben, fixed.ines], [8000, 12000]);
});

test('el reparto debe cuadrar con el total', () => {
    assert.equal(resolveAlloc(20000, 'fixed', null, 8000, 11000).ok, false);
    assert.equal(resolveAlloc(20000, 'pct', 10001).ok, false);
    assert.equal(resolveAlloc(20000, 'pct', null).ok, false);
});

test('los céntimos fraccionarios siempre suman el total', () => {
    for (let amount = 1; amount < 400; amount += 7) {
        for (const bp of [1, 3333, 5000, 6667, 9999]) {
            const r = resolveAlloc(amount, 'pct', bp);
            assert.equal(r.ruben + r.ines, amount);
        }
    }
});

test('cobros parciales: 200 € al 50 %, dos cobros de 100 €', () => {
    const ob = { id: 'o1', amount_cents: 20000, ruben_cents: 10000, ines_cents: 10000, due_date: '2026-11-30', issue_date: '2026-10-01' };
    const p1 = { id: 'p1', obligation_id: 'o1', paid_on: '2026-10-10', amount_cents: 10000 };
    let [a1] = paymentAllocations(ob, [p1]);
    assert.deepEqual([a1.ruben_cents, a1.ines_cents], [5000, 5000]);
    let [e] = enrichObligations([ob], [{ ...p1, ...a1 }], TODAY);
    assert.equal(e.paid_cents, 10000);
    assert.equal(e.pending_cents, 10000);
    assert.equal(e.pending_ruben_cents, 5000);
    assert.equal(e.pending_ines_cents, 5000);
    assert.equal(e.status, 'parcial');

    const p2 = { id: 'p2', obligation_id: 'o1', paid_on: '2026-10-20', amount_cents: 10000 };
    const allocs = paymentAllocations(ob, [p1, p2]);
    const pays = [p1, p2].map((p, i) => ({ ...p, ...allocs[i] }));
    [e] = enrichObligations([ob], pays, TODAY);
    assert.equal(e.pending_cents, 0);
    assert.equal(e.paid_ruben_cents, 10000);
    assert.equal(e.paid_ines_cents, 10000);
    assert.equal(e.status, 'pagado');
});

test('cobros parciales con céntimos: los cobros suman exactamente el reparto acordado', () => {
    // 100,01 € con un tercio para Rubén, pagado en tres plazos irregulares.
    const r = resolveAlloc(10001, 'pct', 3333);
    const ob = { id: 'o', amount_cents: 10001, ruben_cents: r.ruben, ines_cents: r.ines };
    const pays = [3333, 3333, 3335].map((a, i) => ({ id: `p${i}`, paid_on: `2026-10-0${i + 1}`, amount_cents: a }));
    const allocs = paymentAllocations(ob, pays);
    assert.equal(allocs.reduce((s, a) => s + a.ruben_cents, 0), ob.ruben_cents);
    assert.equal(allocs.reduce((s, a) => s + a.ines_cents, 0), ob.ines_cents);
    for (let i = 0; i < pays.length; i++) assert.equal(allocs[i].ruben_cents + allocs[i].ines_cents, pays[i].amount_cents);
});

test('estado vencido y anulado', () => {
    const base = { amount_cents: 1000, ruben_cents: 1000, ines_cents: 0, issue_date: '2026-09-01' };
    const [v, n, a] = enrichObligations([
        { ...base, id: 'a', due_date: '2026-10-01' },
        { ...base, id: 'b', due_date: null },
        { ...base, id: 'c', due_date: '2026-10-01', voided_at: '2026-10-02' },
    ], [], TODAY);
    assert.equal(v.status, 'vencido');
    assert.equal(n.status, 'pendiente');
    assert.equal(a.status, 'anulada');
    assert.equal(a.pending_cents, 0);
});

test('heredar el reparto del proyecto para una obligación parcial', () => {
    const project = { alloc_mode: 'fixed', alloc_ruben_bp: null, ruben_cents: 18000, ines_cents: 12000 }; // 300 €
    assert.deepEqual(inheritAlloc(project, 30000), { alloc_mode: 'fixed', alloc_ruben_bp: null, ruben_cents: 18000, ines_cents: 12000 });
    const half = inheritAlloc(project, 15000);
    assert.deepEqual([half.ruben_cents, half.ines_cents], [9000, 6000]);
    const pct = inheritAlloc({ alloc_mode: 'pct', alloc_ruben_bp: 5000 }, 10001);
    assert.equal(pct.ruben_cents + pct.ines_cents, 10001);
});

const svc = (over) => ({
    id: 's', status: 'activo', amount_cents: 5000, period_months: 1, start_date: '2026-01-01',
    next_due_date: '2026-01-01', end_date: null, ruben_cents: 5000, ines_cents: 0, ...over,
});

test('cuota de 50 €/mes: 50 € mensuales y 600 € anuales', () => {
    const m = recurringMonthly([svc()], TODAY);
    assert.equal(m.total, 5000);
    assert.equal(m.ruben, 5000);
    const year = recurringContracted([svc()], '2026-01-01', '2026-12-31');
    assert.equal(year.total, 60000);
    assert.equal(year.ruben, 60000);
});

test('cuota de 50 €/mes de Inés y repartida al 50 %', () => {
    const ines = recurringContracted([svc({ ruben_cents: 0, ines_cents: 5000 })], '2026-01-01', '2026-12-31');
    assert.equal(ines.ines, 60000);
    const half = svc({ ruben_cents: 2500, ines_cents: 2500 });
    assert.deepEqual(recurringMonthly([half], TODAY), { total: 5000, ruben: 2500, ines: 2500 });
    const y = recurringContracted([half], '2026-01-01', '2026-12-31');
    assert.deepEqual([y.ruben, y.ines], [30000, 30000]);
});

test('la previsión respeta inicio y fin del servicio', () => {
    const s = svc({ start_date: '2026-04-15', next_due_date: '2026-04-15', end_date: '2026-09-30' });
    // Abril a septiembre: 6 cuotas, no 12.
    assert.equal(recurringContracted([s], '2026-01-01', '2026-12-31').total, 30000);
    const quarterly = svc({ period_months: 3, amount_cents: 15000, ruben_cents: 15000 });
    assert.equal(recurringContracted([quarterly], '2026-01-01', '2026-12-31').total, 60000);
    assert.equal(recurringMonthly([quarterly], TODAY).total, 5000);
});

test('cuotas canceladas o pausadas no generan previsión', () => {
    assert.equal(recurringForecastItems([svc({ status: 'cancelado' })], '2026-11-01', '2027-10-31').length, 0);
    assert.equal(recurringForecastItems([svc({ status: 'pausado' })], '2026-11-01', '2027-10-31').length, 0);
    assert.equal(recurringMonthly([svc({ status: 'cancelado' })], TODAY).total, 0);
});

test('una cuota generada no se cuenta a la vez como prevista y pendiente', () => {
    // Ya se generó la obligación de noviembre: la próxima fecha es diciembre.
    const s = svc({ next_due_date: '2026-12-01' });
    const ob = {
        id: 'o', client_id: 'c', recurring_service_id: 's', amount_cents: 5000, ruben_cents: 5000, ines_cents: 0,
        issue_date: '2026-11-01', due_date: '2026-11-01',
    };
    const data = { clients: [], projects: [], recurring: [s], expenses: [], payments: [], obligations: enrichObligations([ob], [], TODAY) };
    const nov = periodSummary(data, '2026-11-01', '2026-11-30', TODAY);
    assert.equal(nov.recurringForecast.total, 0);
    assert.equal(nov.pendingInPeriod.total, 5000);
    assert.equal(nov.expectedIncome.total, 5000);
    // Una vez cobrada, pasa a cobrado y deja de estar pendiente.
    const pay = { id: 'p', obligation_id: 'o', paid_on: '2026-11-02', amount_cents: 5000, ruben_cents: 5000, ines_cents: 0 };
    const data2 = { ...data, payments: [pay], obligations: enrichObligations([ob], [pay], TODAY) };
    const nov2 = periodSummary(data2, '2026-11-01', '2026-11-30', TODAY);
    assert.equal(nov2.collected.total, 5000);
    assert.equal(nov2.pendingInPeriod.total, 0);
    assert.equal(nov2.expectedIncome.total, 5000);
});

test('gasto adelantado por Rubén y repartido al 50 %', () => {
    const e = {
        id: 'e', status: 'pagado', paid_on: '2026-10-05', expense_date: '2026-10-05', paid_by: 'ruben',
        amount_cents: 2000, ruben_cents: 1000, ines_cents: 1000,
    };
    const data = { clients: [], projects: [], recurring: [], payments: [], obligations: [], expenses: [e] };
    const s = periodSummary(data, '2026-10-01', '2026-10-31', TODAY);
    assert.equal(s.expensesPaid.total, 2000); // no se duplica
    assert.equal(s.expensesPaid.ruben, 1000);
    assert.equal(s.expensesPaid.ines, 1000);
    assert.equal(s.advanced.ruben, 2000);
    assert.equal(s.owed.ruben, 1000); // Inés debería compensar 10 € a Rubén
    assert.equal(s.cash.total, -2000);
});

test('gastos pendientes y previsión de gastos recurrentes sin duplicar', () => {
    const tpl = {
        id: 't', status: 'pagado', paid_on: '2026-09-10', paid_by: 'empresa', expense_date: '2026-09-10',
        recurrence_months: 1, recurrence_active: true, recurrence_end: null,
        amount_cents: 1000, ruben_cents: 500, ines_cents: 500,
    };
    const child = { ...tpl, id: 'h', recurrence_months: null, recurring_parent_id: 't', expense_date: '2026-10-10', paid_on: '2026-10-10' };
    const items = expenseForecastItems([tpl, child], '2026-10-01', '2026-12-31');
    assert.deepEqual(items.map((i) => i.date), ['2026-11-10', '2026-12-10']);
    const pending = { id: 'x', status: 'pendiente', expense_date: '2026-11-03', amount_cents: 700, ruben_cents: 700, ines_cents: 0 };
    const data = { clients: [], projects: [], recurring: [], payments: [], obligations: [], expenses: [tpl, child, pending] };
    const s = periodSummary(data, '2026-11-01', '2026-11-30', TODAY);
    assert.equal(s.expensesPending.total, 700);
    assert.equal(s.expensesForecast.total, 1000);
    assert.equal(s.expensesPaid.total, 0);
});

test('el precio acordado no cuenta como cobrado; presupuestos aparte', () => {
    const projects = [
        { id: 'a', status: 'en_curso', accepted: true, price_cents: 30000, due_date: '2026-11-20', alloc_mode: 'ruben', ruben_cents: 30000, ines_cents: 0 },
        { id: 'b', status: 'pendiente', accepted: false, price_cents: 50000, due_date: null, alloc_mode: 'pct', alloc_ruben_bp: 5000, ruben_cents: 25000, ines_cents: 25000 },
        { id: 'c', status: 'cancelado', accepted: true, price_cents: 9900, due_date: null, alloc_mode: 'ruben', ruben_cents: 9900, ines_cents: 0 },
    ];
    const ob = { id: 'o', project_id: 'a', amount_cents: 10000, ruben_cents: 10000, ines_cents: 0, issue_date: '2026-10-01', due_date: '2026-11-01' };
    const obligations = enrichObligations([ob], [], TODAY);
    assert.deepEqual(projectsUndocumented(projects, obligations).map((x) => [x.project.id, x.total]), [['a', 20000], ['b', 50000]]);
    const data = { clients: [], projects, recurring: [], expenses: [], payments: [], obligations };
    const s = periodSummary(data, '2026-11-01', '2026-11-30', TODAY);
    assert.equal(s.collected.total, 0);
    assert.equal(s.pendingInPeriod.total, 10000);
    assert.equal(s.confirmed.total, 20000);
    assert.equal(s.potential.total, 50000);
    assert.equal(s.estimated.total, 30000); // el presupuesto potencial no entra
});

test('series mensuales y clientes acumulados', () => {
    const data = {
        clients: [
            { id: '1', status: 'activo', signup_date: '2026-01-10' },
            { id: '2', status: 'activo', signup_date: '2026-03-02' },
            { id: '3', status: 'potencial', signup_date: '2026-02-02' },
        ],
        projects: [], recurring: [], obligations: [],
        payments: [{ obligation_id: 'o', paid_on: '2026-02-03', amount_cents: 500, ruben_cents: 500, ines_cents: 0 }],
        expenses: [{ status: 'pagado', paid_on: '2026-02-20', amount_cents: 200, ruben_cents: 100, ines_cents: 100 }],
    };
    const s = monthlySeries(data, '2026-01-01', '2026-03-31');
    assert.deepEqual(s.map((r) => r.clients), [1, 1, 2]);
    assert.equal(s[1].net, 300);
});
