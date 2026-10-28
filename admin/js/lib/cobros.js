// Cálculos de cobros. Funciones puras sobre las filas de la base de datos.
//
// Un cobro «único» tiene un periodo: su fecha. Uno «mensual» tiene un
// periodo cada mes, el día elegido (o el último día si el mes es más corto),
// desde su mes de inicio. Un periodo está pagado si hay un pago con ese
// cobro y esa fecha.

import { daysInMonth, monthKey, addPeriod } from './dates.js';

export function dueDateFor(day, iso) {
    const [y, m] = iso.split('-').map(Number);
    return `${iso.slice(0, 7)}-${String(Math.min(day, daysInMonth(y, m))).padStart(2, '0')}`;
}

// Fechas de cobro de un cobro entre from y to (ambas incluidas).
export function periods(charge, from, to) {
    if (charge.kind === 'unico') return charge.due_date >= from && charge.due_date <= to ? [charge.due_date] : [];
    const out = [];
    let month = charge.start_month < `${from.slice(0, 7)}-01` ? `${from.slice(0, 7)}-01` : charge.start_month;
    const last = charge.end_month && charge.end_month < `${to.slice(0, 7)}-01` ? charge.end_month : `${to.slice(0, 7)}-01`;
    while (month <= last) {
        const d = dueDateFor(charge.day_of_month, month);
        if (d >= from && d <= to) out.push(d);
        month = addPeriod(month, 1, 1);
    }
    return out;
}

function paidSet(payments) {
    return new Set(payments.map((p) => `${p.charge_id}|${p.period}`));
}

// Periodos sin pagar con fecha entre from y to. Los cobros mensuales
// parados no generan periodos nuevos; los únicos siempre cuentan.
export function unpaid(charges, payments, from, to) {
    const paid = paidSet(payments);
    const out = [];
    for (const c of charges) {
        if (c.kind === 'mensual' && !c.active) continue;
        for (const d of periods(c, from, to)) {
            if (!paid.has(`${c.id}|${d}`)) out.push({ charge: c, period: d, amount: c.amount_cents });
        }
    }
    return out.sort((a, b) => a.period.localeCompare(b.period));
}

// Reparto de un importe según «para quién» (igual que en la base de datos).
export function split(amount, forWhom) {
    if (forWhom === 'ruben') return { ruben: amount, ines: 0 };
    if (forWhom === 'ines') return { ruben: 0, ines: amount };
    let half = Math.floor(amount / 2);
    if (amount % 2 === 1 && half % 2 === 1) half += 1;
    return { ruben: half, ines: amount - half };
}

export function monthlyTotal(charges) {
    const acc = { total: 0, ruben: 0, ines: 0 };
    for (const c of charges) {
        if (c.kind !== 'mensual' || !c.active) continue;
        const s = split(c.amount_cents, c.for_whom);
        acc.total += c.amount_cents; acc.ruben += s.ruben; acc.ines += s.ines;
    }
    return acc;
}

export function collected(payments, from, to) {
    const acc = { total: 0, ruben: 0, ines: 0 };
    for (const p of payments) {
        if (p.paid_on < from || p.paid_on > to) continue;
        acc.total += p.amount_cents; acc.ruben += p.ruben_cents; acc.ines += p.ines_cents;
    }
    return acc;
}

export function sumUnpaid(items) {
    const acc = { total: 0, ruben: 0, ines: 0 };
    for (const it of items) {
        const s = split(it.amount, it.charge.for_whom);
        acc.total += it.amount; acc.ruben += s.ruben; acc.ines += s.ines;
    }
    return acc;
}

// Cobrado por mes (claves AAAA-MM).
export function byMonth(payments, keys) {
    const map = new Map(keys.map((k) => [k, { total: 0, ruben: 0, ines: 0 }]));
    for (const p of payments) {
        const r = map.get(monthKey(p.paid_on));
        if (r) { r.total += p.amount_cents; r.ruben += p.ruben_cents; r.ines += p.ines_cents; }
    }
    return keys.map((k) => ({ key: k, ...map.get(k) }));
}
