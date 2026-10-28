import { html, raw, paint, eur, date, badge, LABELS, emptyState, stat, allocText, splitBar, confirmDialog, toast, norm, $, options } from '../ui.js';
import { formDialog, withToast } from '../forms.js';
import { save, remove, rpc, store, AppError } from '../api.js';
import { inheritAlloc, paymentAllocations } from '../lib/alloc.js';
import { todayISO, inRange, formatDateTime, formatDate } from '../lib/dates.js';
import { sum, formatEuros, formatPct } from '../lib/money.js';
import { bindFilters, sortBy, clientName, projectName, clientOptions, projectOptions, userName, periodFilter, periodState, resolvePeriod, periodLabel } from './common.js';
import { renderAudit } from './clients.js';

const state = { tab: 'obligaciones', q: '', status: 'abiertas', client: '', method: '', ...periodState('ultimos_doce') };
const OPEN = ['pendiente', 'parcial', 'vencido'];

export async function render({ el, params, data }) {
    if (params[0]) return renderDetail(el, data, params[0]);
    return renderList(el, data);
}

function renderList(el, data) {
    const [from, to] = resolvePeriod(state);
    const q = norm(state.q);
    const obligations = sortBy(data.obligations.filter((o) => {
        if (state.status === 'abiertas' ? !OPEN.includes(o.status) : state.status && o.status !== state.status) return false;
        if (state.client && o.client_id !== state.client) return false;
        return !q || norm(`${o.concept} ${o.reference ?? ''} ${clientName(data, o.client_id)}`).includes(q);
    }), 'issue_date', 'desc');
    const payments = data.payments.filter((p) => inRange(p.paid_on, from, to)
        && (!state.client || p.client_id === state.client) && (!state.method || p.method === state.method)
        && (!q || norm(`${clientName(data, p.client_id)} ${data.byId.obligations.get(p.obligation_id)?.concept ?? ''} ${p.reference ?? ''}`).includes(q)))
        .sort((a, b) => b.paid_on.localeCompare(a.paid_on));

    const pendingAll = sum(data.obligations, (o) => o.pending_cents);
    const overdue = sum(data.obligations.filter((o) => o.status === 'vencido'), (o) => o.pending_cents);

    paint(el, html`
        <div class="page-head">
            <div><h1>Ingresos y cobros</h1><p>Obligaciones de pago (lo que nos deben) y cobros (dinero recibido).</p></div>
            <div class="actions">
                <button class="btn" data-act="new-ob" data-online>Nueva obligación de pago</button>
                <button class="btn btn-primary" data-act="new-pay" data-online>Registrar cobro</button>
            </div>
        </div>
        <div class="stats">
            ${stat('Pendiente de cobro', eur(pendingAll))}
            ${stat('Vencido', eur(overdue), { tone: overdue ? 'bad' : '' })}
            ${stat('Cobrado en el periodo', eur(sum(payments, (p) => p.amount_cents)), { tone: 'ok', hint: periodLabel(from, to) })}
        </div>
        <div class="filters" id="filters">
            <div class="tabs" role="group" aria-label="Vista">
                <button type="button" data-tab="obligaciones" aria-pressed="${state.tab === 'obligaciones'}">Obligaciones de pago</button>
                <button type="button" data-tab="cobros" aria-pressed="${state.tab === 'cobros'}">Cobros recibidos</button>
            </div>
        </div>
        <div class="filters" id="filters2">
            <label class="field grow"><span>Buscar</span><input type="search" name="q" value="${state.q}" placeholder="Concepto, referencia o cliente"></label>
            <label class="field"><span>Cliente</span><select name="client">${clientOptions(data, state.client, { includeArchived: true })}</select></label>
            ${state.tab === 'obligaciones'
                ? html`<label class="field"><span>Estado</span><select name="status">
                    <option value="abiertas" ${state.status === 'abiertas' ? raw('selected') : ''}>Pendientes de cobro</option>
                    <option value="" ${state.status === '' ? raw('selected') : ''}>Todas</option>${options(LABELS.obligation_status, state.status)}</select></label>`
                : html`${periodFilter(state)}<label class="field"><span>Método</span><select name="method">${options(LABELS.payment_method, state.method, { empty: 'Todos' })}</select></label>`}
        </div>
        <section class="card">${state.tab === 'obligaciones' ? obligationsTable(data, obligations) : paymentsTable(data, payments)}</section>`);

    bindFilters($('#filters2', el), state, () => renderList(el, data));
    $('#filters', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-tab]');
        if (b) { state.tab = b.dataset.tab; renderList(el, data); }
    });
    el.querySelector('[data-act="new-ob"]').addEventListener('click', () => openObligationForm());
    el.querySelector('[data-act="new-pay"]').addEventListener('click', () => openPaymentForm({ client_id: state.client || undefined }));
    for (const b of el.querySelectorAll('[data-del-payment]')) b.addEventListener('click', () => deletePayment(data.payments.find((p) => p.id === b.dataset.delPayment)));
}

function obligationsTable(data, list) {
    if (!list.length) {
        return emptyState(data.obligations.length ? 'No hay obligaciones con estos filtros.' : 'Aún no hay obligaciones de pago. Regístralas cuando acuerdes un pago o emitas una factura.',
            html`<button class="btn btn-primary" data-act="new-ob" data-online>Nueva obligación de pago</button>`);
    }
    return html`<div class="table-wrap"><table class="responsive">
        <thead><tr><th>Concepto</th><th>Cliente</th><th>Emisión</th><th>Vence</th><th>Estado</th><th class="num">Importe</th><th class="num">Cobrado</th><th class="num">Pendiente</th></tr></thead>
        <tbody>${list.map((o) => html`<tr class="${o.voided_at ? 'is-archived' : ''}">
            <td><a class="row-link" href="#/cobros/${o.id}">${o.concept}</a>${o.reference ? html`<div class="muted small">${o.reference}</div>` : ''}</td>
            <td data-label="Cliente">${clientName(data, o.client_id)}</td>
            <td data-label="Emisión">${date(o.issue_date)}</td><td data-label="Vence">${date(o.due_date)}</td>
            <td data-label="Estado">${badge('obligation_status', o.status)}</td>
            <td data-label="Importe" class="num">${eur(o.amount_cents)}</td><td data-label="Cobrado" class="num">${eur(o.paid_cents)}</td><td data-label="Pendiente" class="num">${eur(o.pending_cents)}</td></tr>`)}</tbody>
        <tfoot><tr><td colspan="5">Total (${list.length})</td><td class="num">${eur(sum(list.filter((o) => !o.voided_at), (o) => o.amount_cents))}</td>
            <td class="num">${eur(sum(list, (o) => o.paid_cents))}</td><td class="num">${eur(sum(list, (o) => o.pending_cents))}</td></tr></tfoot>
    </table></div>`;
}

function paymentsTable(data, list) {
    if (!list.length) return emptyState('No hay cobros en este periodo.');
    return html`<div class="table-wrap"><table class="responsive">
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Obligación</th><th>Método</th><th class="num">Rubén</th><th class="num">Inés</th><th class="num">Importe</th><th></th></tr></thead>
        <tbody>${list.map((p) => html`<tr>
            <td>${date(p.paid_on)}<div class="muted small">por ${userName(data, p.created_by)}</div></td>
            <td data-label="Cliente">${clientName(data, p.client_id)}</td>
            <td data-label="Obligación"><a href="#/cobros/${p.obligation_id}">${data.byId.obligations.get(p.obligation_id)?.concept ?? '—'}</a></td>
            <td data-label="Método">${LABELS.payment_method[p.method]}${p.reference ? html`<div class="muted small">${p.reference}</div>` : ''}</td>
            <td data-label="Rubén" class="num">${eur(p.ruben_cents)}</td><td data-label="Inés" class="num">${eur(p.ines_cents)}</td>
            <td data-label="Importe" class="num">${eur(p.amount_cents)}</td>
            <td><button class="btn btn-sm btn-danger" data-del-payment="${p.id}" data-online>Eliminar</button></td></tr>`)}</tbody>
        <tfoot><tr><td colspan="4">Total (${list.length})</td><td class="num">${eur(sum(list, (p) => p.ruben_cents))}</td><td class="num">${eur(sum(list, (p) => p.ines_cents))}</td><td class="num">${eur(sum(list, (p) => p.amount_cents))}</td><td></td></tr></tfoot>
    </table></div>`;
}

function renderDetail(el, data, id) {
    const o = data.byId.obligations.get(id);
    if (!o) return paint(el, html`<div class="notice bad">Obligación no encontrada.</div><p><a href="#/cobros">Volver</a></p>`);
    const payments = data.payments.filter((p) => p.obligation_id === id).sort((a, b) => a.paid_on.localeCompare(b.paid_on));
    const service = o.recurring_service_id ? data.byId.recurring.get(o.recurring_service_id) : null;

    paint(el, html`
        <div class="breadcrumb"><a href="#/cobros">← Ingresos y cobros</a></div>
        <div class="page-head">
            <div><h1>${o.concept}</h1><p>${badge('obligation_status', o.status)} <a href="#/clientes/${o.client_id}">${clientName(data, o.client_id)}</a>
                ${o.project_id ? html` · <a href="#/proyectos/${o.project_id}">${projectName(data, o.project_id)}</a>` : ''}
                ${service ? html` · Cuota <a href="#/cuotas/${service.id}">${service.name}</a>` : ''}</p></div>
            <div class="actions">
                ${o.pending_cents > 0 ? html`<button class="btn btn-primary" data-act="pay" data-online>Registrar cobro</button>` : ''}
                ${!o.voided_at ? html`<button class="btn" data-act="edit" data-online>Editar</button>` : ''}
                ${!payments.length && !o.voided_at ? html`<button class="btn btn-danger" data-act="void" data-online>Anular</button>` : ''}
                ${!payments.length ? html`<button class="btn btn-danger" data-act="delete" data-online>Eliminar</button>` : ''}
            </div>
        </div>
        ${o.voided_at ? html`<div class="notice">Obligación anulada el ${formatDateTime(o.voided_at)}${o.void_reason ? `: ${o.void_reason}` : ''}. No cuenta como pendiente.</div><p></p>` : ''}
        <div class="stats">
            ${stat('Importe total', eur(o.amount_cents))}
            ${stat('Cobrado', eur(o.paid_cents), { tone: 'ok', hint: `${formatPct(o.paid_pct)} del total` })}
            ${stat('Saldo pendiente', eur(o.pending_cents), { tone: o.status === 'vencido' ? 'bad' : '' })}
            ${stat('Vencimiento', date(o.due_date), { tone: o.status === 'vencido' ? 'bad' : '' })}
        </div>
        <div class="grid-2">
            <section class="card"><h2>Reparto entre Rubén e Inés</h2>
                <p class="small m0">${allocText(o)}</p><p></p>
                <div class="table-wrap"><table>
                    <thead><tr><th></th><th class="num"><span class="swatch s1"></span>Rubén</th><th class="num"><span class="swatch s2"></span>Inés</th><th class="num">Total</th></tr></thead>
                    <tbody>
                        <tr><td>Acordado</td><td class="num">${eur(o.ruben_cents)}</td><td class="num">${eur(o.ines_cents)}</td><td class="num">${eur(o.amount_cents)}</td></tr>
                        <tr><td>Cobrado</td><td class="num">${eur(o.paid_ruben_cents)}</td><td class="num">${eur(o.paid_ines_cents)}</td><td class="num">${eur(o.paid_cents)}</td></tr>
                        <tr><td>Pendiente</td><td class="num">${eur(o.pending_ruben_cents)}</td><td class="num">${eur(o.pending_ines_cents)}</td><td class="num">${eur(o.pending_cents)}</td></tr>
                    </tbody></table></div>
                ${splitBar(o.ruben_cents, o.ines_cents)}
            </section>
            <section class="card"><h2>Datos</h2>
                <dl class="kv">
                    <dt>Referencia / factura</dt><dd>${o.reference ?? '—'}</dd>
                    <dt>Fecha de emisión</dt><dd>${date(o.issue_date)}</dd>
                    <dt>Vencimiento</dt><dd>${date(o.due_date)}</dd>
                    ${o.period_start ? html`<dt>Periodo de cuota</dt><dd>${date(o.period_start)}</dd>` : ''}
                    <dt>Registrada</dt><dd>${formatDateTime(o.created_at)} · ${userName(data, o.created_by)}</dd>
                    <dt>Modificada</dt><dd>${formatDateTime(o.updated_at)} · ${userName(data, o.updated_by)}</dd>
                </dl>
                ${o.notes ? html`<h3>Notas</h3><p class="m0">${o.notes}</p>` : ''}
            </section>
        </div>
        <p></p>
        <section class="card"><h2>Cobros de esta obligación</h2>
            ${payments.length ? html`<div class="table-wrap"><table class="responsive">
                <thead><tr><th>Fecha</th><th>Método</th><th>Referencia</th><th>Registrado por</th><th class="num">Rubén</th><th class="num">Inés</th><th class="num">Importe</th><th></th></tr></thead>
                <tbody>${payments.map((p) => html`<tr><td>${date(p.paid_on)}</td><td data-label="Método">${LABELS.payment_method[p.method]}</td><td data-label="Referencia">${p.reference ?? '—'}</td>
                    <td data-label="Registrado por">${userName(data, p.created_by)}</td>
                    <td data-label="Rubén" class="num">${eur(p.ruben_cents)}</td><td data-label="Inés" class="num">${eur(p.ines_cents)}</td><td data-label="Importe" class="num">${eur(p.amount_cents)}</td>
                    <td><button class="btn btn-sm btn-danger" data-del-payment="${p.id}" data-online>Eliminar</button></td></tr>`)}</tbody>
                <tfoot><tr><td colspan="4">Total cobrado</td><td class="num">${eur(o.paid_ruben_cents)}</td><td class="num">${eur(o.paid_ines_cents)}</td><td class="num">${eur(o.paid_cents)}</td><td></td></tr></tfoot>
            </table></div>` : html`<p class="muted">Todavía no se ha cobrado nada.</p>`}
        </section>
        <p></p>
        <section class="card"><h2>Últimos cambios</h2><div id="audit" class="muted small">Cargando…</div></section>`);

    const on = (act, fn) => el.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
    on('pay', () => openPaymentForm({ client_id: o.client_id, obligation_id: o.id }));
    on('edit', () => openObligationForm(o));
    on('void', () => voidObligation(o));
    on('delete', async () => {
        const ok = await confirmDialog({ title: 'Eliminar obligación', message: `Se eliminará «${o.concept}» (${formatEuros(o.amount_cents)}). No tiene cobros. Si es una cuota generada, su periodo podrá volver a generarse.`, confirmLabel: 'Eliminar', danger: true });
        if (!ok) return;
        await withToast(async () => {
            await remove('obligations', o.id);
            // Si era el último periodo generado de una cuota, la próxima fecha vuelve atrás.
            if (service && service.next_due_date > o.period_start) {
                const later = data.obligations.some((x) => x.recurring_service_id === service.id && x.id !== o.id && x.period_start > o.period_start);
                if (!later) await save('recurring', { next_due_date: o.period_start }, service);
            }
            location.hash = '#/cobros';
            await store.refresh();
        }, 'Obligación eliminada.');
    });
    for (const b of el.querySelectorAll('[data-del-payment]')) b.addEventListener('click', () => deletePayment(payments.find((p) => p.id === b.dataset.delPayment)));
    renderAudit($('#audit', el), data, [id, ...payments.map((p) => p.id)]);
}

async function voidObligation(o) {
    formDialog({
        title: 'Anular obligación de pago',
        intro: `«${o.concept}» dejará de contar como pendiente de cobro. Se conserva en el historial.`,
        submitLabel: 'Anular',
        danger: true,
        fields: [{ name: 'void_reason', label: 'Motivo', required: true, full: true }],
        async onSubmit(v) {
            await save('obligations', { voided_at: new Date().toISOString(), void_reason: v.void_reason }, o);
            await store.refresh();
            toast('Obligación anulada.');
        },
    });
}

async function deletePayment(p) {
    if (!p) return;
    const ok = await confirmDialog({
        title: 'Eliminar cobro',
        message: `Se eliminará el cobro de ${formatEuros(p.amount_cents)} del ${formatDate(p.paid_on)}. La obligación volverá a tener ese importe pendiente. El cambio queda registrado en el historial.`,
        confirmLabel: 'Eliminar cobro',
        danger: true,
    });
    if (!ok) return;
    await withToast(async () => { await remove('payments', p.id); await store.refresh(); }, 'Cobro eliminado.');
}

// ---------- Formularios ----------

export function openObligationForm(existing = null, preset = {}) {
    const data = store.data;
    const s = data.settings;
    const base = { issue_date: todayISO(), alloc_mode: s.default_alloc_mode, alloc_ruben_bp: s.default_alloc_ruben_bp, ...preset };
    if (!existing && preset.project_id) {
        const p = data.byId.projects.get(preset.project_id);
        Object.assign(base, inheritAlloc(p, preset.amount_cents ?? p.price_cents) ?? {});
    }
    const v = existing ?? base;
    const hasPayments = existing && existing.paid_cents > 0;
    let allocTouched = Boolean(existing);
    const newId = crypto.randomUUID();
    formDialog({
        title: existing ? 'Editar obligación de pago' : 'Nueva obligación de pago',
        intro: hasPayments
            ? 'Esta obligación ya tiene cobros: si cambias el importe o el reparto, el reparto de sus cobros se recalcula para respetar el nuevo acuerdo. El importe no puede quedar por debajo de lo cobrado.'
            : 'Registrar una obligación no significa haber cobrado: el dinero cuenta como ingreso cuando registres el cobro.',
        values: v,
        fields: [
            { name: 'client_id', label: 'Cliente', type: 'select', required: true, optionsHtml: clientOptions(data, v.client_id) },
            { name: 'project_id', label: 'Proyecto (opcional)', type: 'select', optionsHtml: projectOptions(data, v.client_id, v.project_id) },
            { name: 'concept', label: 'Concepto', required: true, full: true },
            { name: 'reference', label: 'Nº de factura o referencia (opcional)' },
            { name: 'amount_cents', label: 'Importe total (€)', type: 'money', required: true, positive: true },
            { name: 'issue_date', label: 'Fecha de emisión o registro', type: 'date', required: true },
            { name: 'due_date', label: 'Fecha de vencimiento (opcional)', type: 'date' },
            { name: 'alloc', type: 'alloc', amountField: 'amount_cents', label: 'Beneficiario económico y reparto', help: 'Se hereda del proyecto, pero puedes cambiarlo solo para esta obligación.' },
            { name: 'notes', label: 'Notas', type: 'textarea', full: true },
        ],
        validate(values) {
            const e = {};
            if (values.due_date && values.issue_date && values.due_date < values.issue_date) e.due_date = 'No puede ser anterior a la emisión';
            if (existing && values.amount_cents < existing.paid_cents) e.amount_cents = `No puede ser inferior a lo ya cobrado (${formatEuros(existing.paid_cents)})`;
            if (values.reference && data.obligations.some((o) => o.id !== existing?.id && (o.reference ?? '').trim().toLowerCase() === values.reference.trim().toLowerCase())) {
                e.reference = 'Ya existe otra obligación con esta referencia';
            }
            return e;
        },
        onChange(name, api) {
            if (name === '__init') {
                api.form.addEventListener('input', (e) => { if (e.target.name?.startsWith('alloc__')) allocTouched = true; });
                return;
            }
            if (name === 'client_id') {
                api.setOptions('project_id', projectOptions(data, api.get('client_id'), api.get('project_id')));
            }
            if ((name === 'project_id' || name === 'amount_cents' || name === 'client_id') && !allocTouched) {
                const p = data.byId.projects.get(api.get('project_id'));
                const amount = api.get('amount_cents');
                if (p && amount) api.setAlloc('alloc', inheritAlloc(p, amount));
            }
        },
        async onSubmit(values) {
            const row = { ...values };
            if (!row.project_id) row.project_id = null;
            const saved = await save('obligations', existing ? row : { id: newId, ...row }, existing);
            await store.refresh();
            toast(existing ? 'Obligación actualizada.' : 'Obligación de pago registrada.');
            if (!existing) location.hash = `#/cobros/${saved.id}`;
        },
    });
}

export function openPaymentForm(preset = {}) {
    const data = store.data;
    const pendingObs = (clientId) => data.obligations
        .filter((o) => o.pending_cents > 0 && (!clientId || o.client_id === clientId))
        .sort((a, b) => (a.due_date ?? a.issue_date).localeCompare(b.due_date ?? b.issue_date));
    const obOptions = (clientId, selected) => {
        const list = pendingObs(clientId);
        return html`<option value="">${list.length ? 'Elige la obligación de pago…' : 'No hay obligaciones pendientes'}</option>${list.map((o) =>
            html`<option value="${o.id}" ${o.id === selected ? raw('selected') : ''}>${o.concept} · pendiente ${formatEuros(o.pending_cents)}${clientId ? '' : ` · ${clientName(data, o.client_id)}`}</option>`)}`;
    };
    const ob0 = preset.obligation_id ? data.byId.obligations.get(preset.obligation_id) : null;
    const clientId = preset.client_id ?? ob0?.client_id ?? '';
    const v = { client_id: clientId, obligation_id: ob0?.id ?? '', paid_on: todayISO(), method: 'transferencia', amount_cents: ob0?.pending_cents ?? null, excess: '' };
    const newId = crypto.randomUUID();

    const noObs = !pendingObs(clientId || null).length;
    formDialog({
        title: 'Registrar cobro',
        intro: noObs ? html`No hay obligaciones de pago pendientes${clientId ? ' para este cliente' : ''}. Primero registra la obligación (lo que el cliente debe pagar) y después su cobro.
            <button type="button" class="btn btn-sm" data-new-ob>Nueva obligación de pago</button>` : null,
        values: v,
        submitLabel: 'Registrar cobro',
        fields: [
            { name: 'client_id', label: 'Cliente', type: 'select', optionsHtml: clientOptions(data, v.client_id) },
            { name: 'obligation_id', label: 'Obligación de pago', type: 'select', required: true, optionsHtml: obOptions(clientId || null, v.obligation_id) },
            { name: 'paid_on', label: 'Fecha de cobro', type: 'date', required: true },
            { name: 'amount_cents', label: 'Importe recibido (€)', type: 'money', required: true, positive: true },
            { name: 'method', label: 'Método de pago', type: 'select', options: LABELS.payment_method, required: true },
            { name: 'reference', label: 'Referencia (opcional)' },
            { name: 'preview', type: 'html', full: true, html: html`<div data-preview class="notice" hidden></div>` },
            { name: 'excess', label: 'El importe supera el saldo pendiente. ¿Qué hacemos con el exceso?', type: 'select', full: true,
                options: { solo_pendiente: 'Registrar solo el importe pendiente', a_cuenta: 'Registrar el exceso como pago a cuenta (nueva obligación ya cobrada)' }, empty: 'Elige una opción…' },
            { name: 'notes', label: 'Notas', type: 'textarea', full: true },
        ],
        validate(values) {
            const e = {};
            const o = data.byId.obligations.get(values.obligation_id);
            if (o && values.amount_cents > o.pending_cents && !values.excess) {
                e.excess = `El cobro (${formatEuros(values.amount_cents)}) supera el pendiente (${formatEuros(o.pending_cents)}). Elige cómo gestionar el exceso.`;
            }
            if (values.paid_on > todayISO()) e.paid_on = 'La fecha de cobro no puede ser futura';
            return e;
        },
        onChange(name, api) {
            if (name === '__init') {
                api.dlg.querySelector('[data-new-ob]')?.addEventListener('click', () => { api.close(); openObligationForm(null, { client_id: api.get('client_id') || undefined }); });
            }
            if (name === 'client_id') api.setOptions('obligation_id', obOptions(api.get('client_id') || null, api.get('obligation_id')));
            const o = data.byId.obligations.get(api.get('obligation_id'));
            if (name === 'obligation_id' && o) {
                if (!api.get('client_id')) api.set('client_id', o.client_id);
                api.set('amount_cents', o.pending_cents);
            }
            const amount = api.get('amount_cents');
            const box = api.dlg.querySelector('[data-preview]');
            const excessField = api.dlg.querySelector('[data-field="excess"]');
            const over = o && amount > o.pending_cents;
            excessField.hidden = !over;
            if (!o || !amount) { box.hidden = true; return; }
            const applied = over ? o.pending_cents : amount;
            const existing = data.payments.filter((p) => p.obligation_id === o.id);
            const alloc = applied > 0 ? paymentAllocations(o, [...existing, { id: 'zz-nuevo', paid_on: '9999-12-31', amount_cents: applied }]).find((a) => a.id === 'zz-nuevo') : { ruben_cents: 0, ines_cents: 0 };
            box.hidden = false;
            box.textContent = `Pendiente actual: ${formatEuros(o.pending_cents)} · Tras este cobro: ${formatEuros(Math.max(0, o.pending_cents - amount))}. `
                + `Reparto de este cobro: Rubén ${formatEuros(alloc.ruben_cents)} · Inés ${formatEuros(alloc.ines_cents)}`
                + (over ? `. Exceso: ${formatEuros(amount - o.pending_cents)}.` : '.');
        },
        async onSubmit(values) {
            const o = data.byId.obligations.get(values.obligation_id);
            if (!o) throw new AppError('Elige una obligación de pago.');
            let amount = values.amount_cents;
            let excess = 'rechazar';
            if (amount > o.pending_cents) {
                if (values.excess === 'solo_pendiente') amount = o.pending_cents;
                else excess = 'a_cuenta';
            }
            const dup = data.payments.find((p) => p.obligation_id === o.id && p.paid_on === values.paid_on && p.amount_cents === amount);
            if (dup) {
                const go = await confirmDialog({ title: '¿Cobro duplicado?', message: `Ya hay un cobro de ${formatEuros(amount)} el ${formatDate(values.paid_on)} en esta obligación. ¿Registrar otro igualmente?`, confirmLabel: 'Registrar otro' });
                if (!go) return false;
            }
            await rpc('register_payment', {
                p_id: newId, p_obligation: o.id, p_paid_on: values.paid_on, p_amount_cents: amount,
                p_method: values.method, p_reference: values.reference, p_notes: values.notes, p_excess: excess,
            });
            await store.refresh();
            toast(excess === 'a_cuenta' ? 'Cobro registrado. El exceso se ha guardado como pago a cuenta.' : 'Cobro registrado.');
        },
    });
}
