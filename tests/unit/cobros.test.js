// Pruebas de los cálculos de cobros. Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { formatEuros, parseEuros } from '../../admin/js/lib/money.js';
import { formatDate } from '../../admin/js/lib/dates.js';
import { dueDateFor, periods, unpaid, split, monthlyTotal, collected, sumUnpaid, byMonth } from '../../admin/js/lib/cobros.js';

const nbsp = (s) => s.replace(/ /g, ' ');
const mensual = (over) => ({ id: 'm', kind: 'mensual', amount_cents: 5000, day_of_month: 5, start_month: '2026-08-01', end_month: null, active: true, for_whom: 'ambos', ...over });
const unico = (over) => ({ id: 'u', kind: 'unico', amount_cents: 30000, due_date: '2026-10-15', for_whom: 'ruben', ...over });

test('formato español de euros y fechas', () => {
    assert.equal(nbsp(formatEuros(125000)), '1.250,00 €');
    assert.equal(parseEuros('1.250,50'), 125050);
    assert.equal(parseEuros('50'), 5000);
    assert.equal(formatDate('2026-03-07'), '07/03/2026');
});

test('día de cobro en meses cortos', () => {
    assert.equal(dueDateFor(31, '2026-02-01'), '2026-02-28');
    assert.equal(dueDateFor(31, '2028-02-01'), '2028-02-29');
    assert.equal(dueDateFor(5, '2026-11-20'), '2026-11-05');
});

test('periodos de un cobro mensual', () => {
    assert.deepEqual(periods(mensual(), '2026-01-01', '2026-10-28'), ['2026-08-05', '2026-09-05', '2026-10-05']);
    assert.deepEqual(periods(mensual({ end_month: '2026-09-01' }), '2026-01-01', '2026-12-31'), ['2026-08-05', '2026-09-05']);
    assert.deepEqual(periods(mensual(), '2026-10-06', '2026-11-30'), ['2026-11-05']);
});

test('pendientes: mensual sin validar y único sin pagar', () => {
    const charges = [mensual(), unico()];
    const payments = [{ charge_id: 'm', period: '2026-09-05' }];
    const items = unpaid(charges, payments, '0000-01-01', '2026-10-28');
    assert.deepEqual(items.map((i) => `${i.charge.id} ${i.period}`), ['m 2026-08-05', 'm 2026-10-05', 'u 2026-10-15']);
    assert.equal(sumUnpaid(items).total, 40000);
});

test('un cobro mensual parado no genera pendientes', () => {
    assert.equal(unpaid([mensual({ active: false })], [], '0000-01-01', '2026-10-28').length, 0);
});

test('reparto: ambos a medias, céntimo impar con mitad al par', () => {
    assert.deepEqual(split(5000, 'ambos'), { ruben: 2500, ines: 2500 });
    assert.deepEqual(split(101, 'ambos'), { ruben: 50, ines: 51 });
    assert.deepEqual(split(103, 'ambos'), { ruben: 52, ines: 51 });
    assert.deepEqual(split(700, 'ines'), { ruben: 0, ines: 700 });
});

test('ingreso mensual recurrente: solo cobros mensuales activos', () => {
    const m = monthlyTotal([mensual(), mensual({ id: 'x', active: false }), unico()]);
    assert.deepEqual(m, { total: 5000, ruben: 2500, ines: 2500 });
});

test('cobrado por periodo y por mes', () => {
    const pays = [
        { paid_on: '2026-09-06', amount_cents: 5000, ruben_cents: 2500, ines_cents: 2500 },
        { paid_on: '2026-10-15', amount_cents: 30000, ruben_cents: 30000, ines_cents: 0 },
    ];
    assert.deepEqual(collected(pays, '2026-10-01', '2026-10-31'), { total: 30000, ruben: 30000, ines: 0 });
    assert.deepEqual(byMonth(pays, ['2026-09', '2026-10']).map((r) => r.total), [5000, 30000]);
});
