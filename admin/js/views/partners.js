import { html, raw, paint, eur, stat, allocText, $, LABELS } from '../ui.js';
import { chart } from '../charts.js';
import { periodSummary, monthlySeries, recurringMonthly, filterData, CLOSED_PROJECT } from '../lib/finance.js';
import { todayISO, addPeriod, addDays, monthStart, monthsBetween, monthLabel } from '../lib/dates.js';
import { sum, formatEuros } from '../lib/money.js';
import { periodState, resolvePeriod, periodFilter, periodLabel, bindFilters, clientOptions, projectOptions, clientName } from './common.js';

const state = { who: 'ruben', client: '', project: '', kind: '', ...periodState('anio') };
const WHO = { ruben: 'Rubén', ines: 'Inés', total: 'Ambos' };

export async function render({ el, data: all }) {
    const today = todayISO();
    const [from, to] = resolvePeriod(state, today);
    const data = filterData(all, { clientId: state.client || null, projectId: state.project || null });
    const k = state.who;
    const s = periodSummary(data, from, to, today);
    const mrr = recurringMonthly(data.recurring, today);
    const n12 = periodSummary(data, today, addDays(addPeriod(today, 12, Number(today.slice(8))), -1), today);
    const allTime = periodSummary(all, '0000-01-01', '9999-12-31', today);
    const showIncome = state.kind !== 'gastos';
    const showExpenses = state.kind !== 'ingresos';

    const single = monthsBetween(from, to).length === 1;
    const series = monthlySeries(data, single ? addPeriod(monthStart(from), -11, 1) : from, to);
    const labels = series.map((r) => monthLabel(r.key));

    const share = (row) => (k === 'total' ? row.ruben_cents + row.ines_cents : row[`${k}_cents`]);
    const projects = data.projects.filter((p) => share(p) > 0 || (p.price_cents === 0 && (k === 'total' || p.alloc_mode === k || p.alloc_mode === 'pct' || p.alloc_mode === 'fixed')));
    const shared = data.projects.filter((p) => p.ruben_cents > 0 && p.ines_cents > 0 && !CLOSED_PROJECT.includes(p.status));
    const obligations = data.obligations.filter((o) => !o.voided_at && share(o) > 0);
    const clientIds = new Set([...obligations.map((o) => o.client_id), ...projects.map((p) => p.client_id)]);
    const services = data.recurring.filter((r) => r.status !== 'cancelado' && share(r) > 0);

    // Compensación entre socios por gastos adelantados (histórico completo).
    const net = allTime.owed.ruben - allTime.owed.ines;

    paint(el, html`
        <div class="page-head">
            <div><h1>Reparto entre socios</h1><p>${periodLabel(from, to)}</p></div>
            <div class="tabs" role="group" aria-label="Ver datos de" id="who">
                ${Object.entries(WHO).map(([key, l]) => html`<button type="button" data-who="${key}" aria-pressed="${state.who === key}">${l}</button>`)}
            </div>
        </div>
        <div class="filters" id="filters">
            ${periodFilter(state)}
            <label class="field"><span>Cliente</span><select name="client">${clientOptions(all, state.client, { includeArchived: true, empty: 'Todos' })}</select></label>
            <label class="field"><span>Proyecto</span><select name="project">${projectOptions(all, state.client || null, state.project, { empty: 'Todos' })}</select></label>
            <label class="field"><span>Operaciones</span><select name="kind">
                <option value="" ${state.kind === '' ? raw('selected') : ''}>Ingresos y gastos</option>
                <option value="ingresos" ${state.kind === 'ingresos' ? raw('selected') : ''}>Solo ingresos</option>
                <option value="gastos" ${state.kind === 'gastos' ? raw('selected') : ''}>Solo gastos</option></select></label>
        </div>
        <div class="notice">Importes <strong>atribuidos internamente</strong> según el reparto registrado en cada operación. No equivalen necesariamente a dinero disponible en la cuenta de cada persona, a un salario ni a un beneficio repartible.</div>
        <p></p>
        <div class="stats">
            ${showIncome ? html`
                ${stat('Ingresos cobrados', eur(s.collected[k]), { tone: 'ok', hint: 'Dinero recibido en el periodo' })}
                ${stat('Pendiente de cobro', eur(s.pendingAll[k]), { hint: `Hoy · ${formatEuros(s.pendingInPeriod[k])} vence en el periodo` })}
                ${stat('Previsión mensual', eur(mrr[k]), { hint: 'Cuotas recurrentes activas' })}
                ${stat('Previsión 12 meses', eur(n12.expectedIncome[k]), { hint: 'Pendiente + cuotas + proyectos confirmados' })}` : ''}
            ${showExpenses ? html`
                ${stat('Gastos pagados asumidos', eur(s.expensesPaid[k]))}
                ${stat('Gastos pendientes asumidos', eur(s.expensesPending[k]), { hint: 'Con fecha en el periodo' })}` : ''}
            ${stat('Resultado simplificado de caja', eur(s.cash[k]), { tone: s.cash[k] < 0 ? 'bad' : '', hint: 'Cobrado − gastos pagados atribuidos' })}
        </div>

        ${showExpenses ? html`<section class="card"><h2>Gastos adelantados</h2>
            <div class="table-wrap"><table>
                <thead><tr><th></th><th class="num">En el periodo</th><th class="num">Histórico</th></tr></thead>
                <tbody>
                    <tr><td>Pagado por Rubén</td><td class="num">${eur(s.advanced.ruben)}</td><td class="num">${eur(allTime.advanced.ruben)}</td></tr>
                    <tr><td>Pagado por Inés</td><td class="num">${eur(s.advanced.ines)}</td><td class="num">${eur(allTime.advanced.ines)}</td></tr>
                    <tr><td>Pagado desde la cuenta de ZetaWeb</td><td class="num">${eur(s.advanced.empresa)}</td><td class="num">${eur(allTime.advanced.empresa)}</td></tr>
                    <tr><td>Rubén adelantó por la parte de Inés</td><td class="num">${eur(s.owed.ruben)}</td><td class="num">${eur(allTime.owed.ruben)}</td></tr>
                    <tr><td>Inés adelantó por la parte de Rubén</td><td class="num">${eur(s.owed.ines)}</td><td class="num">${eur(allTime.owed.ines)}</td></tr>
                </tbody></table></div>
            <p class="small">${net === 0 ? 'No hay importes de gastos pendientes de compensar entre socios.'
                : `Según los gastos registrados, ${net > 0 ? 'Inés' : 'Rubén'} debería compensar ${formatEuros(Math.abs(net))} a ${net > 0 ? 'Rubén' : 'Inés'} (cálculo informativo, sin tener en cuenta compensaciones hechas fuera de la aplicación).`}</p>
        </section><p></p>` : ''}

        <div class="grid-2">
            <section class="card"><h2>Ingresos cobrados: Rubén e Inés</h2>
                ${chart({ title: 'Comparativa de ingresos cobrados', labels, series: [
                    { name: 'Rubén', values: series.map((r) => r.collectedRuben), cls: 's1' },
                    { name: 'Inés', values: series.map((r) => r.collectedInes), cls: 's2' }] })}
            </section>
            <section class="card"><h2>Gastos asumidos: Rubén e Inés</h2>
                ${chart({ title: 'Comparativa de gastos asumidos', labels, series: [
                    { name: 'Rubén', values: series.map((r) => r.expensesRuben), cls: 's1' },
                    { name: 'Inés', values: series.map((r) => r.expensesInes), cls: 's2' }] })}
            </section>
            <section class="card"><h2>Evolución mensual · ${WHO[k]}</h2>
                ${chart({ title: `Cobrado y gastos mensuales de ${WHO[k]}`, type: 'line', labels, series: [
                    { name: 'Cobrado', values: series.map((r) => (k === 'total' ? r.collected : k === 'ruben' ? r.collectedRuben : r.collectedInes)), cls: 's1' },
                    { name: 'Gastos', values: series.map((r) => (k === 'total' ? r.expenses : k === 'ruben' ? r.expensesRuben : r.expensesInes)), cls: 's2' }] })}
            </section>
            <section class="card"><h2>Proyectos repartidos entre ambos</h2>
                ${shared.length ? html`<ul class="m0">${shared.map((p) => html`<li><a href="#/proyectos/${p.id}">${p.name}</a> · ${allocText(p)}</li>`)}</ul>`
                : html`<p class="muted">No hay proyectos abiertos repartidos entre los dos.</p>`}
            </section>
        </div>
        <p></p>
        <div class="grid-3">
            <section class="card"><h2>Clientes relacionados (${clientIds.size})</h2>
                ${clientIds.size ? html`<ul class="m0">${[...clientIds].map((id) => html`<li><a href="#/clientes/${id}">${clientName(all, id)}</a></li>`)}</ul>` : html`<p class="muted">Ninguno.</p>`}
            </section>
            <section class="card"><h2>Proyectos relacionados (${projects.length})</h2>
                ${projects.length ? html`<ul class="m0">${projects.map((p) => html`<li><a href="#/proyectos/${p.id}">${p.name}</a> · ${LABELS.project_status[p.status]}</li>`)}</ul>` : html`<p class="muted">Ninguno.</p>`}
            </section>
            <section class="card"><h2>Cuotas recurrentes (${services.length})</h2>
                ${services.length ? html`<ul class="m0">${services.map((r) => html`<li><a href="#/cuotas/${r.id}">${r.name}</a> · ${eur(share(r))} ${LABELS.period_months[r.period_months].toLowerCase()}</li>`)}</ul>
                    <p class="small">Total mensual equivalente: ${eur(mrr[k])} · anual: ${eur(mrr[k] * 12)}</p>` : html`<p class="muted">Ninguna.</p>`}
            </section>
        </div>
        <p class="muted small">Pendiente total atribuido: ${eur(sum(obligations, (o) => (k === 'total' ? o.pending_cents : o[`pending_${k}_cents`])))} en ${obligations.filter((o) => o.pending_cents > 0).length} obligaciones.</p>`);

    bindFilters($('#filters', el), state, () => {
        if (state.project && state.client && all.byId.projects.get(state.project)?.client_id !== state.client) state.project = '';
        render({ el, data: all });
    });
    $('#who', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-who]');
        if (b) { state.who = b.dataset.who; render({ el, data: all }); }
    });
}
