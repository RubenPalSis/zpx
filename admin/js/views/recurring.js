import { html, paint, eur, date, badge, LABELS, emptyState, stat, allocText, confirmDialog, toast, norm, $, options } from '../ui.js';
import { formDialog, withToast } from '../forms.js';
import { save, rpc, store } from '../api.js';
import { recurringMonthly, recurringContracted, recurringForecastItems, monthlyEquivalent, isServiceRunning } from '../lib/finance.js';
import { todayISO, yearStart, yearEnd, addDays, addPeriod, monthEnd, formatDateTime } from '../lib/dates.js';
import { sum, formatEuros } from '../lib/money.js';
import { bindFilters, sortBy, clientName, clientOptions, projectOptions, userName } from './common.js';
import { renderAudit } from './clients.js';

const state = { q: '', status: 'activo', client: '' };

export async function render({ el, params, data }) {
    if (params[0]) return renderDetail(el, data, params[0]);
    return renderList(el, data);
}

function next12(today) {
    return [today, addDays(addPeriod(today, 12, Number(today.slice(8))), -1)];
}

function renderList(el, data) {
    const today = todayISO();
    const mrr = recurringMonthly(data.recurring, today);
    const year = recurringContracted(data.recurring, yearStart(today), yearEnd(today));
    const [f12, t12] = next12(today);
    const forecast12 = recurringForecastItems(data.recurring, f12, t12);
    const pendingFromServices = data.obligations.filter((o) => o.recurring_service_id && o.pending_cents > 0);
    const upcoming = recurringForecastItems(data.recurring, '0000-01-01', addDays(today, 60)).slice(0, 10);
    const activeClients = new Set(data.recurring.filter((r) => isServiceRunning(r, today)).map((r) => r.client_id));
    const collectedYear = data.payments.filter((p) => p.paid_on >= yearStart(today) && data.byId.obligations.get(p.obligation_id)?.recurring_service_id);
    const due = data.recurring.filter((r) => r.status === 'activo' && r.next_due_date <= today && (!r.end_date || r.next_due_date <= r.end_date));

    const q = norm(state.q);
    const list = sortBy(data.recurring.filter((r) => (!state.status || r.status === state.status)
        && (!state.client || r.client_id === state.client)
        && (!q || norm(`${r.name} ${clientName(data, r.client_id)}`).includes(q))), 'next_due_date');

    paint(el, html`
        <div class="page-head">
            <div><h1>Cuotas recurrentes</h1><p>Mantenimiento, hosting, soporte y otros servicios periódicos. Las cuotas generan previsiones, no ingresos cobrados.</p></div>
            <div class="actions">
                <button class="btn" data-act="generate" data-online>Generar obligaciones hasta hoy${due.length ? ` (${due.length})` : ''}</button>
                <button class="btn" data-act="generate-month" data-online>…hasta fin de mes</button>
                <button class="btn btn-primary" data-act="new" data-online>Nueva cuota</button>
            </div>
        </div>
        <div class="stats">
            ${stat('Recurrente mensual contratado', eur(mrr.total), { hint: `Rubén ${formatEuros(mrr.ruben)} · Inés ${formatEuros(mrr.ines)}` })}
            ${stat('Previsión anual (12 meses)', eur(mrr.total * 12), { hint: `Rubén ${formatEuros(mrr.ruben * 12)} · Inés ${formatEuros(mrr.ines * 12)}` })}
            ${stat(`Contratado en ${today.slice(0, 4)}`, eur(year.total), { hint: 'Según fechas reales de cada cuota' })}
            ${stat('Previsto próximos 12 meses', eur(sum(forecast12, (i) => i.total)), { hint: 'Periodos aún no generados' })}
            ${stat('Cuotas pendientes de cobro', eur(sum(pendingFromServices, (o) => o.pending_cents)), { tone: pendingFromServices.some((o) => o.status === 'vencido') ? 'bad' : '', hint: `${pendingFromServices.length} obligaciones` })}
            ${stat(`Cobrado de cuotas en ${today.slice(0, 4)}`, eur(sum(collectedYear, (p) => p.amount_cents)), { tone: 'ok' })}
            ${stat('Clientes con servicios activos', activeClients.size)}
        </div>
        <div class="filters" id="filters">
            <label class="field grow"><span>Buscar</span><input type="search" name="q" value="${state.q}" placeholder="Servicio o cliente"></label>
            <label class="field"><span>Estado</span><select name="status">${options(LABELS.recurring_status, state.status, { empty: 'Todos' })}</select></label>
            <label class="field"><span>Cliente</span><select name="client">${clientOptions(data, state.client, { includeArchived: true })}</select></label>
        </div>
        <section class="card">
            ${list.length ? html`<div class="table-wrap"><table class="responsive">
                <thead><tr><th>Servicio</th><th>Cliente</th><th>Frecuencia</th><th>Estado</th><th>Próximo cobro</th><th class="num">Importe</th><th class="num">Equiv. mensual</th><th>Reparto</th></tr></thead>
                <tbody>${list.map((r) => html`<tr>
                    <td><a class="row-link" href="#/cuotas/${r.id}">${r.name}</a></td>
                    <td data-label="Cliente">${clientName(data, r.client_id)}</td>
                    <td data-label="Frecuencia">${LABELS.period_months[r.period_months]}</td>
                    <td data-label="Estado">${badge('recurring_status', r.status)}</td>
                    <td data-label="Próximo cobro">${r.status === 'activo' && (!r.end_date || r.next_due_date <= r.end_date) ? date(r.next_due_date) : '—'}</td>
                    <td data-label="Importe" class="num">${eur(r.amount_cents)}</td>
                    <td data-label="Equiv. mensual" class="num">${eur(monthlyEquivalent(r).total)}</td>
                    <td data-label="Reparto" class="small">${allocText(r)}</td></tr>`)}</tbody></table></div>`
            : emptyState(data.recurring.length ? 'No hay cuotas con estos filtros.' : 'Aún no hay cuotas recurrentes.',
                html`<button class="btn btn-primary" data-act="new" data-online>Nueva cuota</button>`)}
        </section>
        <p></p>
        <section class="card"><h2>Próximos cobros previstos (60 días)</h2>
            ${upcoming.length ? html`<div class="table-wrap"><table class="responsive"><thead><tr><th>Fecha</th><th>Servicio</th><th>Cliente</th><th class="num">Importe</th></tr></thead>
                <tbody>${upcoming.map((i) => html`<tr><td>${date(i.date)}${i.date <= today ? html` <span class="badge warn">por generar</span>` : ''}</td>
                    <td data-label="Servicio"><a href="#/cuotas/${i.service.id}">${i.service.name}</a></td><td data-label="Cliente">${clientName(data, i.service.client_id)}</td>
                    <td data-label="Importe" class="num">${eur(i.total)}</td></tr>`)}</tbody></table></div>`
            : html`<p class="muted">No hay cobros de cuotas previstos en los próximos 60 días.</p>`}
            <p class="muted small">Los periodos ya generados aparecen en <a href="#/cobros">Ingresos y cobros</a> como obligaciones de pago.</p>
        </section>`);

    bindFilters($('#filters', el), state, () => renderList(el, data));
    for (const b of el.querySelectorAll('[data-act="new"]')) b.addEventListener('click', () => openRecurringForm());
    el.querySelector('[data-act="generate"]').addEventListener('click', () => generateDue());
    el.querySelector('[data-act="generate-month"]').addEventListener('click', () => generateDue(monthEnd(today)));
}

function renderDetail(el, data, id) {
    const r = data.byId.recurring.get(id);
    if (!r) return paint(el, html`<div class="notice bad">Cuota no encontrada.</div><p><a href="#/cuotas">Volver</a></p>`);
    const today = todayISO();
    const obligations = sortBy(data.obligations.filter((o) => o.recurring_service_id === id), 'period_start', 'desc');
    const obIds = new Set(obligations.map((o) => o.id));
    const payments = data.payments.filter((p) => obIds.has(p.obligation_id));
    const m = monthlyEquivalent(r);
    const yearC = recurringContracted([r], yearStart(today), yearEnd(today));
    const [f12, t12] = next12(today);
    const next = recurringForecastItems([r], f12, t12);

    paint(el, html`
        <div class="breadcrumb"><a href="#/cuotas">← Cuotas recurrentes</a></div>
        <div class="page-head">
            <div><h1>${r.name}</h1><p>${badge('recurring_status', r.status)} ${LABELS.period_months[r.period_months]} · <a href="#/clientes/${r.client_id}">${clientName(data, r.client_id)}</a></p></div>
            <div class="actions">
                ${r.status === 'activo' ? html`<button class="btn" data-act="generate" data-online>Generar hasta hoy</button>` : ''}
                <button class="btn" data-act="edit" data-online>Editar</button>
                ${r.status === 'activo' ? html`<button class="btn" data-act="pause" data-online>Pausar</button>` : ''}
                ${r.status === 'pausado' ? html`<button class="btn" data-act="resume" data-online>Reactivar</button>` : ''}
                ${r.status !== 'cancelado' ? html`<button class="btn btn-danger" data-act="cancel" data-online>Cancelar cuota</button>` : ''}
            </div>
        </div>
        <div class="stats">
            ${stat('Importe por periodo', eur(r.amount_cents))}
            ${stat('Equivalente mensual', eur(m.total), { hint: `Rubén ${formatEuros(m.ruben)} · Inés ${formatEuros(m.ines)}` })}
            ${stat(`Contratado en ${today.slice(0, 4)}`, eur(yearC.total), { hint: `Rubén ${formatEuros(yearC.ruben)} · Inés ${formatEuros(yearC.ines)}` })}
            ${stat('Previsto 12 meses (sin generar)', eur(sum(next, (i) => i.total)), { hint: `Rubén ${formatEuros(sum(next, (i) => i.ruben))} · Inés ${formatEuros(sum(next, (i) => i.ines))}` })}
            ${stat('Cobrado de esta cuota', eur(sum(payments, (p) => p.amount_cents)), { tone: 'ok' })}
            ${stat('Pendiente de cobro', eur(sum(obligations, (o) => o.pending_cents)))}
        </div>
        <div class="grid-2">
            <section class="card"><h2>Datos</h2>
                <dl class="kv">
                    <dt>Inicio</dt><dd>${date(r.start_date)}</dd>
                    <dt>Próximo periodo por generar</dt><dd>${r.status === 'activo' ? date(r.next_due_date) : '—'}</dd>
                    <dt>Finalización</dt><dd>${date(r.end_date)}</dd>
                    <dt>Reparto</dt><dd>${allocText(r)}</dd>
                    <dt>Creada</dt><dd>${formatDateTime(r.created_at)} · ${userName(data, r.created_by)}</dd>
                </dl>
                ${r.description ? html`<h3>Descripción</h3><p>${r.description}</p>` : ''}
                ${r.notes ? html`<h3>Notas</h3><p class="m0">${r.notes}</p>` : ''}
            </section>
            <section class="card"><h2>Últimos cambios</h2><div id="audit" class="muted small">Cargando…</div></section>
        </div>
        <p></p>
        <section class="card"><h2>Periodos generados</h2>
            ${obligations.length ? html`<div class="table-wrap"><table class="responsive"><thead><tr><th>Periodo</th><th>Estado</th><th class="num">Importe</th><th class="num">Cobrado</th><th class="num">Pendiente</th></tr></thead>
                <tbody>${obligations.map((o) => html`<tr><td><a class="row-link" href="#/cobros/${o.id}">${date(o.period_start)}</a></td><td data-label="Estado">${badge('obligation_status', o.status)}</td>
                    <td data-label="Importe" class="num">${eur(o.amount_cents)}</td><td data-label="Cobrado" class="num">${eur(o.paid_cents)}</td><td data-label="Pendiente" class="num">${eur(o.pending_cents)}</td></tr>`)}</tbody></table></div>`
            : html`<p class="muted">Todavía no se ha generado ningún periodo.</p>`}
        </section>`);

    const on = (act, fn) => el.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
    on('generate', () => generateDue(today, id));
    on('edit', () => openRecurringForm(r));
    on('pause', () => withToast(async () => { await save('recurring', { status: 'pausado' }, r); await store.refresh(); }, 'Cuota pausada: no genera previsiones ni obligaciones.'));
    on('resume', () => withToast(async () => { await save('recurring', { status: 'activo' }, r); await store.refresh(); }, 'Cuota reactivada.'));
    on('cancel', async () => {
        const ok = await confirmDialog({ title: 'Cancelar cuota', message: `«${r.name}» dejará de generar previsiones y obligaciones. Los periodos ya generados y sus cobros se conservan.`, confirmLabel: 'Cancelar cuota', danger: true });
        if (!ok) return;
        await withToast(async () => {
            await save('recurring', { status: 'cancelado', end_date: r.end_date ?? (today >= r.start_date ? today : r.start_date) }, r);
            await store.refresh();
        }, 'Cuota cancelada.');
    });
    renderAudit($('#audit', el), data, [id]);
}

// Crea las obligaciones de pago de las cuotas activas cuyo periodo ya ha llegado.
export async function generateDue(until = todayISO(), serviceId = null) {
    await withToast(async () => {
        const n = await rpc('generate_recurring_obligations', { p_until: until, p_service: serviceId });
        await store.refresh();
        toast(n ? `Se han generado ${n} obligaciones de pago.` : 'No había periodos pendientes de generar.');
    });
}

export function openRecurringForm(existing = null, preset = {}) {
    const data = store.data;
    const s = data.settings;
    const today = todayISO();
    const v = existing ?? { period_months: 1, start_date: today, status: 'activo', alloc_mode: s.default_alloc_mode, alloc_ruben_bp: s.default_alloc_ruben_bp, ...preset };
    const newId = crypto.randomUUID();
    const periodOpts = Object.fromEntries(Object.entries(LABELS.period_months));
    formDialog({
        title: existing ? 'Editar cuota recurrente' : 'Nueva cuota recurrente',
        intro: existing ? 'Los cambios de importe o reparto se aplican a los periodos que se generen a partir de ahora; los ya generados no cambian.' : null,
        values: v,
        fields: [
            { name: 'client_id', label: 'Cliente', type: 'select', required: true, optionsHtml: clientOptions(data, v.client_id) },
            { name: 'project_id', label: 'Proyecto (opcional)', type: 'select', optionsHtml: projectOptions(data, v.client_id, v.project_id) },
            { name: 'name', label: 'Nombre del servicio', required: true, full: true },
            { name: 'amount_cents', label: 'Importe por periodo (€)', type: 'money', required: true, positive: true },
            { name: 'period_months', label: 'Frecuencia', type: 'select', options: periodOpts, required: true },
            { name: 'start_date', label: 'Fecha de inicio', type: 'date', required: true },
            existing
                ? { name: 'next_due_date', label: 'Próxima fecha de cobro por generar', type: 'date', required: true, help: 'Normalmente avanza sola al generar periodos' }
                : { name: 'end_date', label: 'Fecha de finalización (opcional)', type: 'date' },
            ...(existing ? [{ name: 'end_date', label: 'Fecha de finalización (opcional)', type: 'date' }] : []),
            { name: 'status', label: 'Estado', type: 'select', options: LABELS.recurring_status, required: true },
            { name: 'alloc', type: 'alloc', amountField: 'amount_cents', label: 'Beneficiario económico y reparto' },
            { name: 'description', label: 'Descripción', type: 'textarea', full: true },
            { name: 'notes', label: 'Notas', type: 'textarea', full: true },
        ],
        validate(values) {
            const e = {};
            if (values.end_date && values.end_date < values.start_date) e.end_date = 'No puede ser anterior al inicio';
            if (values.next_due_date && values.next_due_date < values.start_date) e.next_due_date = 'No puede ser anterior al inicio';
            return e;
        },
        onChange(name, api) {
            if (name === 'client_id') api.setOptions('project_id', projectOptions(data, api.get('client_id'), api.get('project_id')));
        },
        async onSubmit(values) {
            const row = { ...values, period_months: Number(values.period_months), project_id: values.project_id || null };
            if (!existing) row.next_due_date = row.start_date;
            const saved = await save('recurring', existing ? row : { id: newId, ...row }, existing);
            await store.refresh();
            toast(existing ? 'Cuota actualizada.' : 'Cuota creada. Genera sus obligaciones de pago cuando llegue cada periodo.');
            if (!existing) location.hash = `#/cuotas/${saved.id}`;
        },
    });
}
