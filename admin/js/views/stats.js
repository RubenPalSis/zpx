import { html, paint, eur, stat, LABELS, $ } from '../ui.js';
import { periodSummary, groupSum, recurringMonthly } from '../lib/finance.js';
import { todayISO, inRange } from '../lib/dates.js';
import { sum } from '../lib/money.js';
import { periodState, resolvePeriod, periodFilter, periodLabel, bindFilters, clientName } from './common.js';

const state = periodState('anio');

export async function render({ el, data }) {
    const today = todayISO();
    const [from, to] = resolvePeriod(state, today);
    const s = periodSummary(data, from, to, today);
    const mrr = recurringMonthly(data.recurring, today);
    const payments = data.payments.filter((p) => inRange(p.paid_on, from, to));
    const paidExpenses = data.expenses.filter((e) => e.status === 'pagado' && inRange(e.paid_on, from, to));

    const obOf = (p) => data.byId.obligations.get(p.obligation_id);
    const byClient = groupSum(payments, (p) => p.client_id, (p) => p.amount_cents);
    const byProject = groupSum(payments, (p) => obOf(p)?.project_id ?? '', (p) => p.amount_cents);
    const byType = groupSum(payments, (p) => {
        const o = obOf(p);
        const proj = o?.project_id ? data.byId.projects.get(o.project_id) : null;
        if (proj) return LABELS.service_type[proj.service_type];
        return o?.recurring_service_id ? 'Cuotas recurrentes (sin proyecto)' : 'Sin proyecto';
    }, (p) => p.amount_cents);
    const byCategory = groupSum(paidExpenses, (e) => e.category, (e) => e.amount_cents);
    const total = sum(payments, (p) => p.amount_cents);
    const pct = (v, t) => (t ? `${Math.round((v / t) * 100)} %` : '—');

    const table = (title, rows, labelFn, t) => html`<section class="card"><h2>${title}</h2>
        ${rows.length ? html`<div class="table-wrap"><table><tbody>${rows.map((r) => html`<tr><td>${labelFn(r.key)}</td><td class="num muted">${pct(r.value, t)}</td><td class="num">${eur(r.value)}</td></tr>`)}</tbody>
            <tfoot><tr><td>Total</td><td></td><td class="num">${eur(t)}</td></tr></tfoot></table></div>`
        : html`<p class="muted">Sin datos en el periodo.</p>`}</section>`;

    paint(el, html`
        <div class="page-head">
            <div><h1>Estadísticas</h1><p>${periodLabel(from, to)}</p></div>
            <div class="filters m0" id="filters">${periodFilter(state)}</div>
        </div>
        <div class="notice">El <strong>resultado de caja</strong> es lo cobrado menos lo pagado en el periodo. No es un beneficio contable oficial ni un importe neto de impuestos.
            La <strong>facturación registrada</strong> son las obligaciones de pago emitidas en el periodo, se hayan cobrado o no.</div><p></p>
        <div class="stats">
            ${stat('Facturación registrada', eur(s.invoiced.total), { hint: 'Obligaciones emitidas en el periodo' })}
            ${stat('Cobros reales', eur(s.collected.total), { tone: 'ok' })}
            ${stat('Cobros pendientes', eur(s.pendingInPeriod.total), { hint: 'Con vencimiento en el periodo' })}
            ${stat('Cobros vencidos (hoy)', eur(s.overdue.total), { tone: s.overdue.total ? 'bad' : '' })}
            ${stat('Gastos pagados', eur(s.expensesPaid.total))}
            ${stat('Gastos pendientes', eur(s.expensesPending.total))}
            ${stat('Resultado simplificado de caja', eur(s.cash.total), { tone: s.cash.total < 0 ? 'bad' : 'ok' })}
            ${stat('Ingresos recurrentes mensuales', eur(mrr.total))}
            ${stat('Previsión anual recurrente', eur(mrr.total * 12), { hint: 'Cuotas activas × 12 meses' })}
        </div>
        <section class="card"><h2>Importes atribuidos a cada socio</h2>
            <div class="table-wrap"><table class="responsive">
                <thead><tr><th></th><th class="num"><span class="swatch s1"></span>Rubén</th><th class="num"><span class="swatch s2"></span>Inés</th><th class="num">Total</th></tr></thead>
                <tbody>
                    ${[['Facturación registrada', s.invoiced], ['Cobrado', s.collected], ['Pendiente (vence en el periodo)', s.pendingInPeriod], ['Gastos pagados asumidos', s.expensesPaid], ['Resultado de caja', s.cash]].map(([l, v]) =>
                        html`<tr><td>${l}</td><td data-label="Rubén" class="num">${eur(v.ruben)}</td><td data-label="Inés" class="num">${eur(v.ines)}</td><td data-label="Total" class="num">${eur(v.total)}</td></tr>`)}
                </tbody></table></div>
        </section>
        <p></p>
        <div class="grid-2">
            ${table('Ingresos cobrados por cliente', byClient, (k) => clientName(data, k), total)}
            ${table('Ingresos cobrados por proyecto', byProject, (k) => (k ? data.byId.projects.get(k)?.name ?? '—' : 'Sin proyecto'), total)}
            ${table('Ingresos cobrados por tipo de servicio', byType, (k) => k, total)}
            ${table('Gastos pagados por categoría', byCategory, (k) => LABELS.expense_category[k], sum(paidExpenses, (e) => e.amount_cents))}
        </div>`);

    bindFilters($('#filters', el), state, () => render({ el, data }));
}
