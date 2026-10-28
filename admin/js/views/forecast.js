import { html, paint, eur, date, $ } from '../ui.js';
import { chart } from '../charts.js';
import { periodSummary } from '../lib/finance.js';
import { todayISO, monthsBetween, monthLabel, monthEnd } from '../lib/dates.js';
import { sum } from '../lib/money.js';
import { periodState, resolvePeriod, periodFilter, periodLabel, bindFilters, clientName } from './common.js';

const state = periodState('mes');
const PRESETS = ['mes', 'mes_siguiente', 'anio', 'doce', 'mes_concreto', 'anio_concreto', 'rango'];

export async function render({ el, data }) {
    const today = todayISO();
    const [from, to] = resolvePeriod(state, today);
    const s = periodSummary(data, from, to, today);
    const months = monthsBetween(from, to).slice(0, 36);
    const perMonth = months.map((k) => {
        const mFrom = `${k}-01` < from ? from : `${k}-01`;
        const mTo = monthEnd(`${k}-01`) > to ? to : monthEnd(`${k}-01`);
        const m = periodSummary(data, mFrom, mTo, today);
        return {
            key: k,
            income: m.expectedIncome.total,
            expenses: m.expensesPaid.total + m.expensesPending.total + m.expensesForecast.total,
        };
    });
    const noData = !data.obligations.length && !data.recurring.length && !data.projects.length && !data.expenses.length;
    const future = to >= today;

    const row = (label, v, { hint, strong, sign = '' } = {}) => html`<tr class="${strong ? 'strong' : ''}">
        <td>${strong ? html`<strong>${label}</strong>` : label}${hint ? html`<div class="muted small">${hint}</div>` : ''}</td>
        <td class="num">${sign}${eur(v.ruben)}</td><td class="num">${sign}${eur(v.ines)}</td><td class="num">${sign}${eur(v.total)}</td></tr>`;

    paint(el, html`
        <div class="page-head">
            <div><h1>Previsión económica</h1><p>${periodLabel(from, to)}</p></div>
            <div class="filters m0" id="filters">${periodFilter(state, PRESETS)}</div>
        </div>
        ${noData ? html`<div class="notice warn">No hay datos suficientes para calcular una previsión: registra obligaciones de pago, cuotas recurrentes, proyectos o gastos.</div><p></p>` : ''}
        <section class="card">
            <h2>Resumen del periodo</h2>
            <div class="table-wrap"><table class="responsive">
                <thead><tr><th>Concepto</th><th class="num"><span class="swatch s1"></span>Rubén</th><th class="num"><span class="swatch s2"></span>Inés</th><th class="num">Total</th></tr></thead>
                <tbody>
                    <tr><td colspan="4" class="muted small"><strong>INGRESOS</strong></td></tr>
                    ${row('Ingresos cobrados', s.collected, { hint: 'Dinero recibido realmente en el periodo' })}
                    ${row('Cobros pendientes', s.pendingInPeriod, { hint: 'Obligaciones con vencimiento (o emisión) en el periodo aún no cobradas' })}
                    ${row('Cuotas recurrentes previstas', s.recurringForecast, { hint: 'Periodos de cuotas activas aún no convertidos en obligación' })}
                    ${row('Proyectos confirmados', s.confirmed, { hint: 'Parte del precio sin obligación registrada, con fecha de fin en el periodo' })}
                    ${row('Total de ingresos esperados', s.expectedIncome, { strong: true })}
                    <tr><td colspan="4" class="muted small"><strong>GASTOS</strong></td></tr>
                    ${row('Gastos pagados', s.expensesPaid)}
                    ${row('Gastos pendientes', s.expensesPending, { hint: 'Registrados como pendientes con fecha en el periodo' })}
                    ${row('Gastos recurrentes previstos', s.expensesForecast, { hint: 'Próximos periodos de gastos recurrentes aún sin registrar' })}
                    <tr><td colspan="4" class="muted small"><strong>RESULTADO</strong></td></tr>
                    ${row('Resultado de caja observado', s.cash, { strong: true, hint: 'Cobrado − gastos pagados. No es beneficio contable ni neto de impuestos.' })}
                    ${future ? row('Resultado estimado del periodo', s.estimated, { strong: true, hint: 'Caja observada + ingresos esperados pendientes − gastos pendientes y previstos. Excluye oportunidades potenciales.' }) : ''}
                </tbody>
            </table></div>
        </section>
        <p></p>
        <div class="grid-2">
            <section class="card"><h2>Fuera del cálculo (informativo)</h2>
                <div class="table-wrap"><table class="responsive">
                    <thead><tr><th></th><th class="num">Rubén</th><th class="num">Inés</th><th class="num">Total</th></tr></thead>
                    <tbody>
                        ${row('Oportunidades potenciales', s.potential, { hint: 'Presupuestos no aceptados (sin fecha concreta)' })}
                        ${row('Proyectos confirmados sin fecha', s.confirmedUndated, { hint: 'Indica una fecha prevista de fin para situarlos en la previsión' })}
                        ${row('Total vencido hoy', s.overdue, { hint: 'Cobros vencidos acumulados de cualquier fecha' })}
                        ${row('Total pendiente de cobro hoy', s.pendingAll)}
                    </tbody></table></div>
            </section>
            <section class="card"><h2>Ingresos esperados y gastos por mes</h2>
                ${chart({ title: 'Ingresos esperados y gastos por mes', labels: perMonth.map((m) => monthLabel(m.key)), series: [
                    { name: 'Ingresos esperados', values: perMonth.map((m) => m.income), cls: 's1' },
                    { name: 'Gastos', values: perMonth.map((m) => m.expenses), cls: 's2' }] })}
                <p class="muted small">Incluye cobrado, pendiente y previsto en cada mes; los gastos incluyen pagados, pendientes y recurrentes previstos.</p>
            </section>
        </div>
        <p></p>
        <div class="grid-2">
            <section class="card"><h2>Cuotas previstas en el periodo</h2>
                ${s.recurringItems.length ? html`<div class="table-wrap"><table class="responsive"><thead><tr><th>Fecha</th><th>Cuota</th><th class="num">Importe</th></tr></thead><tbody>
                    ${s.recurringItems.slice(0, 50).map((i) => html`<tr><td>${date(i.date)}</td><td data-label="Cuota"><a href="#/cuotas/${i.service.id}">${i.service.name}</a> · ${clientName(data, i.service.client_id)}</td><td data-label="Importe" class="num">${eur(i.total)}</td></tr>`)}
                    </tbody><tfoot><tr><td colspan="2">Total</td><td class="num">${eur(sum(s.recurringItems, (i) => i.total))}</td></tr></tfoot></table></div>`
                : html`<p class="muted">No hay cuotas previstas sin generar en este periodo.</p>`}
            </section>
            <section class="card"><h2>Gastos recurrentes previstos</h2>
                ${s.expenseItems.length ? html`<div class="table-wrap"><table class="responsive"><thead><tr><th>Fecha</th><th>Gasto</th><th class="num">Importe</th></tr></thead><tbody>
                    ${s.expenseItems.slice(0, 50).map((i) => html`<tr><td>${date(i.date)}</td><td data-label="Gasto">${i.expense.concept}</td><td data-label="Importe" class="num">${eur(i.total)}</td></tr>`)}
                    </tbody></table></div>`
                : html`<p class="muted">No hay gastos recurrentes previstos en este periodo.</p>`}
            </section>
        </div>`);

    bindFilters($('#filters', el), state, () => render({ el, data }));
}
