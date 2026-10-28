import { html, paint, eur, stat, $ } from '../ui.js';
import { chart } from '../charts.js';
import { withToast } from '../forms.js';
import { exportAll } from '../api.js';
import { unpaid, sumUnpaid, collected, monthlyTotal, byMonth } from '../lib/cobros.js';
import { todayISO, monthStart, monthEnd, addPeriod, monthsBetween, monthLabel } from '../lib/dates.js';

const PERIODS = { mes: 'Este mes', anio: 'Este año', doce: 'Últimos 12 meses' };
const state = { period: 'anio' };

function range(today) {
    if (state.period === 'mes') return [monthStart(today), monthEnd(today)];
    if (state.period === 'anio') return [`${today.slice(0, 4)}-01-01`, `${today.slice(0, 4)}-12-31`];
    return [addPeriod(monthStart(today), -11, 1), monthEnd(today)];
}

export async function render({ el, data }) {
    const today = todayISO();
    const [from, to] = range(today);
    const got = collected(data.payments, from, to);
    const due = sumUnpaid(unpaid(data.charges, data.payments, '0000-01-01', today));
    const mrr = monthlyTotal(data.charges);
    const keys = monthsBetween(state.period === 'mes' ? addPeriod(monthStart(today), -11, 1) : from, state.period === 'anio' ? monthEnd(today) : to);
    const series = byMonth(data.payments, keys);

    const byClient = new Map();
    for (const p of data.payments) {
        if (p.paid_on < from || p.paid_on > to) continue;
        const cid = data.byId.charges.get(p.charge_id)?.client_id;
        byClient.set(cid, (byClient.get(cid) ?? 0) + p.amount_cents);
    }
    const top = [...byClient.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    paint(el, html`
        <div class="page-head">
            <h1>Estadísticas</h1>
            <div class="tabs" role="group" aria-label="Periodo" id="period">
                ${Object.entries(PERIODS).map(([k, l]) => html`<button type="button" data-p="${k}" aria-pressed="${state.period === k}">${l}</button>`)}
            </div>
        </div>
        <div class="stats">
            ${stat(`Cobrado (${PERIODS[state.period].toLowerCase()})`, eur(got.total), { tone: 'ok' })}
            ${stat('Por cobrar hoy', eur(due.total), { tone: due.total ? 'bad' : '' })}
            ${stat('Cobros mensuales', eur(mrr.total), { hint: 'Cobros «cada mes» activos' })}
            ${stat('Previsión anual mensuales', eur(mrr.total * 12), { hint: 'Mensuales × 12' })}
        </div>
        <section class="card"><h2>Rubén e Inés</h2>
            <div class="table-wrap"><table>
                <thead><tr><th></th><th class="num"><span class="swatch s1"></span>Rubén</th><th class="num"><span class="swatch s2"></span>Inés</th><th class="num">Total</th></tr></thead>
                <tbody>
                    <tr><td>Cobrado</td><td class="num">${eur(got.ruben)}</td><td class="num">${eur(got.ines)}</td><td class="num">${eur(got.total)}</td></tr>
                    <tr><td>Por cobrar</td><td class="num">${eur(due.ruben)}</td><td class="num">${eur(due.ines)}</td><td class="num">${eur(due.total)}</td></tr>
                    <tr><td>Cada mes</td><td class="num">${eur(mrr.ruben)}</td><td class="num">${eur(mrr.ines)}</td><td class="num">${eur(mrr.total)}</td></tr>
                </tbody></table></div>
            <p class="muted small m0">Reparto interno según el «Para» de cada cobro. «Ambos» se divide a medias.</p>
        </section>
        <section class="card"><h2>Cobrado por mes</h2>
            ${chart({ title: 'Cobrado por mes, Rubén e Inés', labels: series.map((r) => monthLabel(r.key)), series: [
                { name: 'Rubén', values: series.map((r) => r.ruben), cls: 's1' },
                { name: 'Inés', values: series.map((r) => r.ines), cls: 's2' }] })}
        </section>
        <section class="card"><h2>Mejores clientes</h2>
            ${top.length ? html`<ul class="rows">${top.map(([cid, v]) => html`<li><div class="who"><a class="row-link" href="#/clientes/${cid}"><strong>${data.byId.clients.get(cid)?.name ?? '—'}</strong></a></div><div class="amount">${eur(v)}</div></li>`)}</ul>`
                : html`<p class="muted m0">Sin cobros en este periodo.</p>`}
        </section>
        <p><button class="btn btn-sm" data-act="export" data-online>Descargar copia de seguridad (JSON)</button></p>`);

    $('#period', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-p]');
        if (b) { state.period = b.dataset.p; render({ el, data }); }
    });
    el.querySelector('[data-act="export"]').addEventListener('click', () => withToast(async () => {
        const dump = await exportAll();
        const url = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `zetaweb-copia-${today}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'Copia descargada.'));
}
