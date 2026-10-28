// Cálculos económicos del panel. Funciones puras: reciben las filas tal y
// como vienen de la base de datos y devuelven cifras en céntimos.
//
// Categorías que nunca se mezclan:
//   cobrado    → dinero recibido (tabla payments)
//   pendiente  → obligaciones registradas que aún no se han cobrado
//   previsto   → cuotas recurrentes futuras aún no convertidas en obligación
//                y parte de proyectos confirmados aún sin obligación
//   potencial  → presupuestos no aceptados
// Una cuota, al generarse su obligación, deja de contarse como prevista
// (la próxima fecha de la cuota avanza) y pasa a pendiente; al cobrarse,
// pasa a cobrado. Así ninguna cantidad cuenta dos veces.

import { roundRatio, inheritAlloc } from './alloc.js';
import { addPeriod, dayOf, inRange, monthKey, monthsBetween } from './dates.js';
import { sum } from './money.js';

export const CLOSED_PROJECT = ['cancelado', 'archivado'];

const zero = () => ({ total: 0, ruben: 0, ines: 0 });
function add(acc, total, ruben, ines) {
    acc.total += total; acc.ruben += ruben; acc.ines += ines;
    return acc;
}

// ---------- Obligaciones ----------

export function obligationStatus(o, paid, today) {
    if (o.voided_at) return 'anulada';
    if (paid >= o.amount_cents) return 'pagado';
    if (o.due_date && o.due_date < today) return 'vencido';
    if (paid > 0) return 'parcial';
    return 'pendiente';
}

// Añade a cada obligación lo cobrado, lo pendiente y su reparto.
export function enrichObligations(obligations, payments, today) {
    const byOb = new Map();
    for (const p of payments) {
        const acc = byOb.get(p.obligation_id) ?? zero();
        add(acc, p.amount_cents, p.ruben_cents, p.ines_cents);
        byOb.set(p.obligation_id, acc);
    }
    return obligations.map((o) => {
        const paid = byOb.get(o.id) ?? zero();
        const voided = !!o.voided_at;
        return {
            ...o,
            paid_cents: paid.total,
            paid_ruben_cents: paid.ruben,
            paid_ines_cents: paid.ines,
            pending_cents: voided ? 0 : o.amount_cents - paid.total,
            pending_ruben_cents: voided ? 0 : o.ruben_cents - paid.ruben,
            pending_ines_cents: voided ? 0 : o.ines_cents - paid.ines,
            paid_pct: o.amount_cents > 0 ? roundRatio(paid.total, 10000, o.amount_cents) : 0,
            status: obligationStatus(o, paid.total, today),
        };
    });
}

// ---------- Cuotas recurrentes ----------

// Fechas de cobro de una cuota dentro de [from, to]. Con fromNext=true solo
// cuenta los periodos que todavía no tienen obligación generada.
export function serviceDates(svc, from, to, { fromNext = true } = {}) {
    const out = [];
    const anchor = dayOf(svc.start_date);
    let d = fromNext ? svc.next_due_date : svc.start_date;
    let guard = 0;
    while (d <= to && (!svc.end_date || d <= svc.end_date) && guard++ < 1000) {
        if (d >= from && d >= svc.start_date) out.push(d);
        d = addPeriod(d, svc.period_months, anchor);
    }
    return out;
}

export function isServiceRunning(svc, today) {
    return svc.status === 'activo' && svc.start_date <= today && (!svc.end_date || svc.end_date >= today);
}

// Ingreso recurrente mensual equivalente de una cuota (céntimos).
export function monthlyEquivalent(svc) {
    return {
        total: roundRatio(svc.amount_cents, 1, svc.period_months),
        ruben: roundRatio(svc.ruben_cents, 1, svc.period_months),
        ines: roundRatio(svc.ines_cents, 1, svc.period_months),
    };
}

// Ingresos recurrentes mensuales contratados (cuotas activas y vigentes hoy).
export function recurringMonthly(services, today) {
    const acc = zero();
    for (const s of services) {
        if (!isServiceRunning(s, today)) continue;
        const m = monthlyEquivalent(s);
        add(acc, m.total, m.ruben, m.ines);
    }
    return acc;
}

// Importe contratado de las cuotas activas en un rango, según sus fechas
// reales (no cuenta meses anteriores al inicio ni posteriores al fin).
// Incluye periodos ya generados o cobrados: es la cifra «contratada».
export function recurringContracted(services, from, to) {
    const acc = zero();
    for (const s of services) {
        if (s.status !== 'activo') continue;
        const n = serviceDates(s, from, to, { fromNext: false }).length;
        add(acc, n * s.amount_cents, n * s.ruben_cents, n * s.ines_cents);
    }
    return acc;
}

// Cuotas aún no generadas como obligación dentro del rango (previsión pura).
export function recurringForecastItems(services, from, to) {
    const items = [];
    for (const s of services) {
        if (s.status !== 'activo') continue;
        for (const d of serviceDates(s, from, to)) {
            items.push({ date: d, service: s, total: s.amount_cents, ruben: s.ruben_cents, ines: s.ines_cents });
        }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Proyectos ----------

// Parte del precio de un proyecto que aún no tiene obligación de pago.
export function projectsUndocumented(projects, obligations) {
    const documented = new Map();
    for (const o of obligations) {
        if (!o.project_id || o.voided_at) continue;
        documented.set(o.project_id, (documented.get(o.project_id) ?? 0) + o.amount_cents);
    }
    return projects
        .filter((p) => !CLOSED_PROJECT.includes(p.status) && p.price_cents > 0)
        .map((p) => {
            const remaining = Math.max(0, p.price_cents - (documented.get(p.id) ?? 0));
            const alloc = inheritAlloc(p, remaining);
            return { project: p, date: p.due_date, total: remaining, ruben: alloc?.ruben_cents ?? 0, ines: alloc?.ines_cents ?? 0 };
        })
        .filter((x) => x.total > 0);
}

export function projectFinance(project, obligations) {
    const own = obligations.filter((o) => o.project_id === project.id && !o.voided_at);
    const documented = sum(own, (o) => o.amount_cents);
    const paid = sum(own, (o) => o.paid_cents);
    return {
        documented,
        undocumented: Math.max(0, project.price_cents - documented),
        paid,
        pendingDocumented: sum(own, (o) => o.pending_cents),
        pendingTotal: Math.max(0, project.price_cents - paid),
        paidRuben: sum(own, (o) => o.paid_ruben_cents),
        paidInes: sum(own, (o) => o.paid_ines_cents),
    };
}

// ---------- Gastos ----------

// Próximas ocurrencias de los gastos recurrentes dentro del rango, a partir
// de la última ocurrencia registrada (plantilla o copias).
export function expenseForecastItems(expenses, from, to) {
    const latest = new Map();
    for (const e of expenses) {
        const key = e.recurring_parent_id ?? (e.recurrence_months ? e.id : null);
        if (!key) continue;
        if (!latest.has(key) || e.expense_date > latest.get(key)) latest.set(key, e.expense_date);
    }
    const items = [];
    for (const t of expenses) {
        if (!t.recurrence_months || !t.recurrence_active) continue;
        const anchor = dayOf(t.expense_date);
        let d = addPeriod(latest.get(t.id), t.recurrence_months, anchor);
        let guard = 0;
        while (d <= to && (!t.recurrence_end || d <= t.recurrence_end) && guard++ < 1000) {
            if (d >= from) items.push({ date: d, expense: t, total: t.amount_cents, ruben: t.ruben_cents, ines: t.ines_cents });
            d = addPeriod(d, t.recurrence_months, anchor);
        }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date));
}

// ---------- Resumen de un periodo ----------

export function filterData(data, { clientId, projectId } = {}) {
    if (!clientId && !projectId) return data;
    const okClient = (c) => !clientId || c === clientId;
    const okProject = (p) => !projectId || p === projectId;
    const obIds = new Set(data.obligations.filter((o) => okClient(o.client_id) && okProject(o.project_id)).map((o) => o.id));
    return {
        ...data,
        clients: data.clients.filter((c) => okClient(c.id)),
        projects: data.projects.filter((p) => okClient(p.client_id) && okProject(p.id)),
        obligations: data.obligations.filter((o) => obIds.has(o.id)),
        payments: data.payments.filter((p) => obIds.has(p.obligation_id)),
        recurring: data.recurring.filter((s) => okClient(s.client_id) && (!projectId || s.project_id === projectId)),
        expenses: data.expenses.filter((e) => (!clientId || e.client_id === clientId) && (!projectId || e.project_id === projectId)),
    };
}

// data.obligations debe venir enriquecida con enrichObligations().
export function periodSummary(data, from, to, today) {
    const collected = zero();
    for (const p of data.payments) if (inRange(p.paid_on, from, to)) add(collected, p.amount_cents, p.ruben_cents, p.ines_cents);

    const invoiced = zero();
    const pendingInPeriod = zero(); // pendiente con vencimiento (o emisión) dentro del periodo
    const pendingAll = zero(); // todo lo pendiente hoy
    const overdue = zero(); // vencido hoy
    for (const o of data.obligations) {
        if (o.voided_at) continue;
        if (inRange(o.issue_date, from, to)) add(invoiced, o.amount_cents, o.ruben_cents, o.ines_cents);
        if (o.pending_cents <= 0) continue;
        add(pendingAll, o.pending_cents, o.pending_ruben_cents, o.pending_ines_cents);
        if (o.due_date && o.due_date < today) add(overdue, o.pending_cents, o.pending_ruben_cents, o.pending_ines_cents);
        if (inRange(o.due_date ?? o.issue_date, from, to)) add(pendingInPeriod, o.pending_cents, o.pending_ruben_cents, o.pending_ines_cents);
    }

    const recurringItems = recurringForecastItems(data.recurring, from, to);
    const recurringForecast = zero();
    for (const it of recurringItems) add(recurringForecast, it.total, it.ruben, it.ines);

    const confirmed = zero();
    const confirmedUndated = zero();
    const potential = zero();
    for (const it of projectsUndocumented(data.projects, data.obligations)) {
        if (!it.project.accepted) {
            add(potential, it.total, it.ruben, it.ines);
        } else if (!it.date) {
            add(confirmedUndated, it.total, it.ruben, it.ines);
        } else if (inRange(it.date, from, to)) {
            add(confirmed, it.total, it.ruben, it.ines);
        }
    }

    const expensesPaid = zero();
    const expensesPending = zero();
    const expensesPendingAll = zero();
    const advanced = { ruben: 0, ines: 0, empresa: 0 };
    const owed = { ruben: 0, ines: 0 }; // lo que cada uno adelantó por la parte del otro
    for (const e of data.expenses) {
        if (e.status === 'pagado') {
            if (inRange(e.paid_on, from, to)) {
                add(expensesPaid, e.amount_cents, e.ruben_cents, e.ines_cents);
                advanced[e.paid_by] += e.amount_cents;
                if (e.paid_by === 'ruben') owed.ruben += e.ines_cents;
                if (e.paid_by === 'ines') owed.ines += e.ruben_cents;
            }
        } else {
            add(expensesPendingAll, e.amount_cents, e.ruben_cents, e.ines_cents);
            if (inRange(e.expense_date, from, to)) add(expensesPending, e.amount_cents, e.ruben_cents, e.ines_cents);
        }
    }
    const expenseItems = expenseForecastItems(data.expenses, from, to);
    const expensesForecast = zero();
    for (const it of expenseItems) add(expensesForecast, it.total, it.ruben, it.ines);

    const cash = {
        total: collected.total - expensesPaid.total,
        ruben: collected.ruben - expensesPaid.ruben,
        ines: collected.ines - expensesPaid.ines,
    };
    // Resultado estimado = caja observada + lo que se espera cobrar en el
    // periodo − lo que se espera pagar. Excluye los presupuestos potenciales.
    const estimated = {};
    for (const k of ['total', 'ruben', 'ines']) {
        estimated[k] = cash[k] + pendingInPeriod[k] + recurringForecast[k] + confirmed[k]
            - expensesPending[k] - expensesForecast[k];
    }
    const expectedIncome = {};
    for (const k of ['total', 'ruben', 'ines']) {
        expectedIncome[k] = collected[k] + pendingInPeriod[k] + recurringForecast[k] + confirmed[k];
    }

    return {
        from, to,
        collected, invoiced, pendingInPeriod, pendingAll, overdue,
        recurringForecast, recurringItems,
        confirmed, confirmedUndated, potential,
        expensesPaid, expensesPending, expensesPendingAll, expensesForecast, expenseItems,
        advanced, owed, cash, estimated, expectedIncome,
    };
}

// ---------- Series mensuales para gráficos ----------

export function monthlySeries(data, from, to) {
    const keys = monthsBetween(from, to);
    const row = () => ({ collected: 0, collectedRuben: 0, collectedInes: 0, expenses: 0, expensesRuben: 0, expensesInes: 0, expected: 0, clients: 0 });
    const map = new Map(keys.map((k) => [k, row()]));
    const at = (iso) => map.get(monthKey(iso));

    for (const p of data.payments) {
        const r = inRange(p.paid_on, from, to) && at(p.paid_on);
        if (r) { r.collected += p.amount_cents; r.collectedRuben += p.ruben_cents; r.collectedInes += p.ines_cents; }
    }
    for (const e of data.expenses) {
        const r = e.status === 'pagado' && inRange(e.paid_on, from, to) && at(e.paid_on);
        if (r) { r.expenses += e.amount_cents; r.expensesRuben += e.ruben_cents; r.expensesInes += e.ines_cents; }
    }
    // Previsto: obligaciones por fecha de vencimiento + cuotas aún no generadas.
    for (const o of data.obligations) {
        if (o.voided_at) continue;
        const d = o.due_date ?? o.issue_date;
        const r = inRange(d, from, to) && at(d);
        if (r) r.expected += o.amount_cents;
    }
    for (const it of recurringForecastItems(data.recurring, from, to)) at(it.date).expected += it.total;

    // Clientes acumulados (no potenciales) según su fecha de alta.
    const signups = data.clients.filter((c) => c.status !== 'potencial').map((c) => monthKey(c.signup_date));
    for (const k of keys) map.get(k).clients = signups.filter((m) => m <= k).length;
    return keys.map((k) => ({ key: k, ...map.get(k), net: map.get(k).collected - map.get(k).expenses }));
}

// ---------- Agrupaciones para estadísticas ----------

export function groupSum(items, keyFn, valueFn) {
    const map = new Map();
    for (const it of items) {
        const k = keyFn(it);
        map.set(k, (map.get(k) ?? 0) + valueFn(it));
    }
    return [...map.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value);
}
