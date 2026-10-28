import { html, paint, stat, eur, date, emptyState, $, badge } from '../ui.js';
import { chart } from '../charts.js';
import { periodSummary, monthlySeries, recurringMonthly } from '../lib/finance.js';
import { todayISO, monthLabel, addPeriod, monthStart, monthsBetween } from '../lib/dates.js';
import { formatEuros } from '../lib/money.js';
import { periodState, resolvePeriod, periodFilter, periodLabel, bindFilters, clientName } from './common.js';
import { generateDue } from './recurring.js';
import { openClientForm } from './clients.js';
import { openExpenseForm } from './expenses.js';

const state = periodState('mes');

export { renderView as render };

async function renderView({ el, data }) {
    const today = todayISO();
    const [from, to] = resolvePeriod(state, today);
    const s = periodSummary(data, from, to, today);
    const mrr = recurringMonthly(data.recurring, today);

    const clientsLive = data.clients.filter((c) => !c.archived_at);
    const nothing = !data.clients.length && !data.expenses.length;
    const dueServices = data.recurring.filter((r) => r.status === 'activo' && r.next_due_date <= today && (!r.end_date || r.next_due_date <= r.end_date));

    // Si se mira un solo mes, los gráficos muestran los 12 meses hasta él.
    const single = monthsBetween(from, to).length === 1;
    const cFrom = single ? addPeriod(monthStart(from), -11, 1) : from;
    const series = monthlySeries(data, cFrom, to);
    const labels = series.map((r) => monthLabel(r.key));

    const overdue = data.obligations.filter((o) => o.status === 'vencido').sort((a, b) => a.due_date.localeCompare(b.due_date));
    const upcoming = data.obligations
        .filter((o) => o.pending_cents > 0 && o.status !== 'vencido')
        .sort((a, b) => (a.due_date ?? a.issue_date).localeCompare(b.due_date ?? b.issue_date))
        .slice(0, 6);

    paint(el, html`
        <div class="page-head">
            <div><h1>Resumen de ZetaWeb</h1><p>${periodLabel(from, to)}</p></div>
            <div class="filters m0" id="filters">${periodFilter(state)}</div>
        </div>

        ${nothing ? html`<div class="card">${emptyState('Todavía no hay datos registrados. Empieza añadiendo un cliente; después podrás crear proyectos, registrar cobros y gastos.',
            html`<button class="btn btn-primary" data-act="client" data-online>Añadir cliente</button>
                 <button class="btn" data-act="expense" data-online>Añadir gasto</button>`)}</div>` : ''}

        ${dueServices.length ? html`<div class="notice warn" role="status">
            Hay ${dueServices.length} ${dueServices.length === 1 ? 'cuota recurrente' : 'cuotas recurrentes'} con periodos por generar hasta hoy.
            <button class="btn btn-sm" data-act="generate" data-online>Generar obligaciones de pago</button>
        </div><p></p>` : ''}

        <div class="stats">
            ${stat('Clientes', clientsLive.length, { hint: `${data.clients.length - clientsLive.length} archivados`, href: '#/clientes' })}
            ${stat('Clientes activos', clientsLive.filter((c) => c.status === 'activo').length, { href: '#/clientes' })}
            ${stat('Proyectos en curso', data.projects.filter((p) => p.status === 'en_curso').length, { href: '#/proyectos' })}
            ${stat('Cobrado en el periodo', eur(s.collected.total), { tone: 'ok', hint: 'Dinero recibido realmente', href: '#/cobros' })}
            ${stat('Pendiente de cobro', eur(s.pendingAll.total), { hint: 'Total que nos deben hoy', href: '#/cobros' })}
            ${stat('Cobros vencidos', eur(s.overdue.total), { tone: s.overdue.total ? 'bad' : '', hint: `${overdue.length} obligaciones`, href: '#/cobros' })}
            ${stat('Recurrente mensual', eur(mrr.total), { hint: 'Cuotas activas contratadas', href: '#/cuotas' })}
            ${stat('Previsión de ingresos', eur(s.expectedIncome.total), { hint: 'Cobrado + pendiente + cuotas + proyectos del periodo', href: '#/prevision' })}
            ${stat('Gastos pagados', eur(s.expensesPaid.total), { href: '#/gastos' })}
            ${stat('Resultado de caja', eur(s.cash.total), { tone: s.cash.total < 0 ? 'bad' : 'ok', hint: 'Cobrado − gastos pagados' })}
            ${stat('Atribuido a Rubén', eur(s.cash.ruben), { hint: `Cobrado ${formatEuros(s.collected.ruben)} − gastos ${formatEuros(s.expensesPaid.ruben)}`, href: '#/socios' })}
            ${stat('Atribuido a Inés', eur(s.cash.ines), { hint: `Cobrado ${formatEuros(s.collected.ines)} − gastos ${formatEuros(s.expensesPaid.ines)}`, href: '#/socios' })}
        </div>

        <div class="grid-2">
            <section class="card"><h2>Ingresos cobrados y gastos pagados</h2>
                ${chart({ title: 'Ingresos cobrados y gastos pagados por mes', labels, series: [
                    { name: 'Cobrado', values: series.map((r) => r.collected), cls: 's1' },
                    { name: 'Gastos', values: series.map((r) => r.expenses), cls: 's2' }] })}
            </section>
            <section class="card"><h2>Resultado neto mensual de caja</h2>
                ${chart({ title: 'Resultado neto mensual', labels, series: [{ name: 'Resultado', values: series.map((r) => r.net), cls: 's1' }] })}
            </section>
            <section class="card"><h2>Previsto frente a cobrado</h2>
                ${chart({ title: 'Ingresos previstos frente a cobrados', labels, series: [
                    { name: 'Previsto (vencimientos y cuotas)', values: series.map((r) => r.expected), cls: 's1' },
                    { name: 'Cobrado', values: series.map((r) => r.collected), cls: 's2' }] })}
            </section>
            <section class="card"><h2>Ingresos cobrados por socio</h2>
                ${chart({ title: 'Ingresos atribuidos a Rubén e Inés', labels, series: [
                    { name: 'Rubén', values: series.map((r) => r.collectedRuben), cls: 's1' },
                    { name: 'Inés', values: series.map((r) => r.collectedInes), cls: 's2' }] })}
            </section>
            <section class="card"><h2>Evolución del número de clientes</h2>
                ${chart({ title: 'Clientes acumulados por fecha de alta', type: 'line', unit: 'count', labels, series: [
                    { name: 'Clientes', values: series.map((r) => r.clients), cls: 's1' }] })}
                <p class="muted small">Clientes (no potenciales) acumulados según su fecha de alta.</p>
            </section>
            <section class="card">
                <div class="card-head"><h2>Cobros vencidos</h2><a href="#/cobros" class="small">Ver todos</a></div>
                ${overdue.length ? obligationsList(data, overdue.slice(0, 6)) : html`<p class="muted">No hay cobros vencidos.</p>`}
                <div class="card-head"><h2>Próximos cobros</h2></div>
                ${upcoming.length ? obligationsList(data, upcoming) : html`<p class="muted">No hay cobros pendientes registrados.</p>`}
            </section>
        </div>`);

    bindFilters($('#filters', el), state, () => renderView({ el, data }));
    el.querySelector('[data-act="client"]')?.addEventListener('click', () => openClientForm());
    el.querySelector('[data-act="expense"]')?.addEventListener('click', () => openExpenseForm());
    el.querySelector('[data-act="generate"]')?.addEventListener('click', () => generateDue());
}

function obligationsList(data, list) {
    return html`<div class="table-wrap"><table class="responsive"><tbody>${list.map((o) => html`<tr>
        <td><a class="row-link" href="#/cobros/${o.id}">${o.concept}</a><div class="muted small">${clientName(data, o.client_id)}</div></td>
        <td data-label="Vence">${date(o.due_date ?? o.issue_date)}</td>
        <td data-label="Estado">${badge('obligation_status', o.status)}</td>
        <td data-label="Pendiente" class="num">${eur(o.pending_cents)}</td></tr>`)}</tbody></table></div>`;
}
