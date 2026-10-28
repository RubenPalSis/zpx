import { html, paint, eur, date, badge, LABELS, emptyState, stat, allocText, confirmDialog, toast, norm, $, options } from '../ui.js';
import { formDialog, withToast } from '../forms.js';
import { save, store } from '../api.js';
import { projectFinance, CLOSED_PROJECT } from '../lib/finance.js';
import { todayISO, formatDateTime } from '../lib/dates.js';
import { sum } from '../lib/money.js';
import { bindFilters, sortBy, clientName, clientOptions, userName } from './common.js';
import { openObligationForm } from './income.js';
import { renderAudit } from './clients.js';

const state = { q: '', status: 'abiertos', client: '', type: '', sort: 'start' };

export async function render({ el, params, data }) {
    if (params[0]) return renderDetail(el, data, params[0]);
    return renderList(el, data);
}

function renderList(el, data) {
    const q = norm(state.q);
    let list = data.projects.filter((p) => {
        if (state.status === 'abiertos' && CLOSED_PROJECT.includes(p.status)) return false;
        if (state.status && state.status !== 'abiertos' && p.status !== state.status) return false;
        if (state.client && p.client_id !== state.client) return false;
        if (state.type && p.service_type !== state.type) return false;
        return !q || norm(`${p.name} ${clientName(data, p.client_id)} ${p.description ?? ''}`).includes(q);
    });
    list = state.sort === 'name' ? sortBy(list, 'name') : state.sort === 'price' ? sortBy(list, 'price_cents', 'desc') : sortBy(list, 'start_date', 'desc');

    paint(el, html`
        <div class="page-head">
            <div><h1>Proyectos</h1><p>${data.projects.filter((p) => p.status === 'en_curso').length} en curso · ${data.projects.length} en total</p></div>
            <div class="actions"><button class="btn btn-primary" data-act="new" data-online>Crear proyecto</button></div>
        </div>
        <div class="filters" id="filters">
            <label class="field grow"><span>Buscar</span><input type="search" name="q" value="${state.q}" placeholder="Proyecto o cliente"></label>
            <label class="field"><span>Estado</span><select name="status">
                <option value="abiertos" ${state.status === 'abiertos' ? 'selected' : ''}>Abiertos (sin cancelados ni archivados)</option>
                <option value="" ${state.status === '' ? 'selected' : ''}>Todos</option>
                ${options(LABELS.project_status, state.status)}</select></label>
            <label class="field"><span>Cliente</span><select name="client">${clientOptions(data, state.client, { includeArchived: true })}</select></label>
            <label class="field"><span>Tipo</span><select name="type">${options(LABELS.service_type, state.type, { empty: 'Todos' })}</select></label>
            <label class="field"><span>Ordenar por</span><select name="sort">
                <option value="start" ${state.sort === 'start' ? 'selected' : ''}>Fecha de inicio</option>
                <option value="name" ${state.sort === 'name' ? 'selected' : ''}>Nombre</option>
                <option value="price" ${state.sort === 'price' ? 'selected' : ''}>Precio</option></select></label>
        </div>
        <section class="card">
            ${list.length ? html`<div class="table-wrap"><table class="responsive">
                <thead><tr><th>Proyecto</th><th>Cliente</th><th>Estado</th><th>Inicio</th><th class="num">Precio</th><th class="num">Cobrado</th><th class="num">Pendiente</th></tr></thead>
                <tbody>${list.map((p) => {
                    const f = projectFinance(p, data.obligations);
                    return html`<tr class="${p.status === 'archivado' ? 'is-archived' : ''}">
                        <td><a class="row-link" href="#/proyectos/${p.id}">${p.name}</a><div class="muted small">${LABELS.service_type[p.service_type]}</div></td>
                        <td data-label="Cliente"><a href="#/clientes/${p.client_id}">${clientName(data, p.client_id)}</a></td>
                        <td data-label="Estado">${badge('project_status', p.status)}${p.accepted ? '' : html` <span class="badge info">Presupuesto</span>`}</td>
                        <td data-label="Inicio">${date(p.start_date)}</td>
                        <td data-label="Precio" class="num">${eur(p.price_cents)}</td>
                        <td data-label="Cobrado" class="num">${eur(f.paid)}</td>
                        <td data-label="Pendiente" class="num">${eur(CLOSED_PROJECT.includes(p.status) ? f.pendingDocumented : f.pendingTotal)}</td></tr>`;
                })}</tbody></table></div>`
            : emptyState(data.projects.length ? 'Ningún proyecto coincide con los filtros.' : 'Aún no hay proyectos.',
                html`<button class="btn btn-primary" data-act="new" data-online>Crear proyecto</button>`)}
        </section>`);
    bindFilters($('#filters', el), state, () => renderList(el, data));
    for (const b of el.querySelectorAll('[data-act="new"]')) b.addEventListener('click', () => openProjectForm());
}

function renderDetail(el, data, id) {
    const p = data.byId.projects.get(id);
    if (!p) return paint(el, html`<div class="notice bad">Proyecto no encontrado.</div><p><a href="#/proyectos">Volver a proyectos</a></p>`);
    const f = projectFinance(p, data.obligations);
    const obligations = sortBy(data.obligations.filter((o) => o.project_id === id), 'issue_date', 'desc');
    const obIds = new Set(obligations.map((o) => o.id));
    const payments = data.payments.filter((x) => obIds.has(x.obligation_id)).sort((a, b) => b.paid_on.localeCompare(a.paid_on));
    const expenses = data.expenses.filter((e) => e.project_id === id);
    const services = data.recurring.filter((r) => r.project_id === id);

    paint(el, html`
        <div class="breadcrumb"><a href="#/proyectos">← Proyectos</a></div>
        <div class="page-head">
            <div><h1>${p.name}</h1><p>${badge('project_status', p.status)} ${LABELS.service_type[p.service_type]} · <a href="#/clientes/${p.client_id}">${clientName(data, p.client_id)}</a>
                ${p.accepted ? '' : html` · <span class="badge info">Presupuesto no aceptado</span>`}</p></div>
            <div class="actions">
                <button class="btn" data-act="edit" data-online>Editar</button>
                <button class="btn" data-act="obligation" data-online>+ Obligación de pago</button>
                ${f.undocumented > 0 && p.accepted && !CLOSED_PROJECT.includes(p.status) ? html`<button class="btn" data-act="obligation-rest" data-online>Registrar lo pendiente de documentar (${eur(f.undocumented)})</button>` : ''}
                ${p.status !== 'archivado' ? html`<button class="btn btn-danger" data-act="archive" data-online>Archivar</button>` : ''}
            </div>
        </div>
        <div class="stats">
            ${stat('Precio acordado', eur(p.price_cents), { hint: 'No es dinero cobrado' })}
            ${stat('Obligaciones registradas', eur(f.documented), { hint: 'Facturado o documentado' })}
            ${stat('Sin documentar', eur(f.undocumented))}
            ${stat('Cobrado', eur(f.paid), { tone: 'ok' })}
            ${stat('Pendiente de cobro', eur(f.pendingDocumented), { hint: 'De obligaciones registradas' })}
            ${stat('Pendiente total', eur(f.pendingTotal), { hint: 'Precio − cobrado' })}
        </div>
        <div class="grid-2">
            <section class="card"><h2>Datos del proyecto</h2>
                <dl class="kv">
                    <dt>Inicio</dt><dd>${date(p.start_date)}</dd>
                    <dt>Fin previsto</dt><dd>${date(p.due_date)}</dd>
                    <dt>Reparto predeterminado</dt><dd>${allocText(p)}</dd>
                    <dt>Cobrado por socio</dt><dd>Rubén ${eur(f.paidRuben)} · Inés ${eur(f.paidInes)}</dd>
                    <dt>Creado</dt><dd>${formatDateTime(p.created_at)} · ${userName(data, p.created_by)}</dd>
                    <dt>Modificado</dt><dd>${formatDateTime(p.updated_at)} · ${userName(data, p.updated_by)}</dd>
                </dl>
                ${p.description ? html`<h3>Descripción</h3><p>${p.description}</p>` : ''}
                ${p.notes ? html`<h3>Notas internas</h3><p class="m0">${p.notes}</p>` : ''}
            </section>
            <section class="card"><h2>Últimos cambios</h2><div id="audit" class="muted small">Cargando…</div></section>
        </div>
        <p></p>
        <div class="stack">
            <section class="card"><h2>Obligaciones de pago</h2>
                ${obligations.length ? html`<div class="table-wrap"><table class="responsive">
                    <thead><tr><th>Concepto</th><th>Vence</th><th>Estado</th><th>Reparto</th><th class="num">Importe</th><th class="num">Pendiente</th></tr></thead>
                    <tbody>${obligations.map((o) => html`<tr class="${o.voided_at ? 'is-archived' : ''}"><td><a class="row-link" href="#/cobros/${o.id}">${o.concept}</a></td><td data-label="Vence">${date(o.due_date)}</td>
                        <td data-label="Estado">${badge('obligation_status', o.status)}</td><td data-label="Reparto" class="small">${allocText(o)}</td>
                        <td data-label="Importe" class="num">${eur(o.amount_cents)}</td><td data-label="Pendiente" class="num">${eur(o.pending_cents)}</td></tr>`)}</tbody></table></div>`
                : html`<p class="muted">Aún no se ha registrado ninguna obligación de pago. El precio acordado no cuenta como ingreso hasta que se cobra.</p>`}
            </section>
            <section class="card"><h2>Cobros</h2>
                ${payments.length ? html`<div class="table-wrap"><table class="responsive">
                    <thead><tr><th>Fecha</th><th>Método</th><th class="num">Rubén</th><th class="num">Inés</th><th class="num">Importe</th></tr></thead>
                    <tbody>${payments.map((x) => html`<tr><td>${date(x.paid_on)}</td><td data-label="Método">${LABELS.payment_method[x.method]}</td>
                        <td data-label="Rubén" class="num">${eur(x.ruben_cents)}</td><td data-label="Inés" class="num">${eur(x.ines_cents)}</td><td data-label="Importe" class="num">${eur(x.amount_cents)}</td></tr>`)}</tbody></table></div>`
                : html`<p class="muted">Sin cobros.</p>`}
            </section>
            ${services.length ? html`<section class="card"><h2>Cuotas asociadas</h2><ul>${services.map((s) => html`<li><a href="#/cuotas/${s.id}">${s.name}</a> · ${eur(s.amount_cents)} ${LABELS.period_months[s.period_months].toLowerCase()}</li>`)}</ul></section>` : ''}
            <section class="card"><h2>Gastos del proyecto</h2>
                ${expenses.length ? html`<div class="table-wrap"><table class="responsive"><thead><tr><th>Concepto</th><th>Fecha</th><th>Estado</th><th class="num">Importe</th></tr></thead>
                    <tbody>${expenses.map((e) => html`<tr><td>${e.concept}</td><td data-label="Fecha">${date(e.expense_date)}</td><td data-label="Estado">${badge('expense_status', e.status)}</td><td data-label="Importe" class="num">${eur(e.amount_cents)}</td></tr>`)}</tbody>
                    <tfoot><tr><td colspan="3">Total</td><td class="num">${eur(sum(expenses, (e) => e.amount_cents))}</td></tr></tfoot></table></div>`
                : html`<p class="muted">Sin gastos asociados.</p>`}
            </section>
        </div>`);

    const on = (act, fn) => el.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
    on('edit', () => openProjectForm(p));
    on('obligation', () => openObligationForm(null, { client_id: p.client_id, project_id: p.id }));
    on('obligation-rest', () => openObligationForm(null, { client_id: p.client_id, project_id: p.id, amount_cents: f.undocumented, concept: p.name }));
    on('archive', async () => {
        const ok = await confirmDialog({ title: 'Archivar proyecto', message: `«${p.name}» se archivará. Sus obligaciones y cobros se conservan y siguen contando en las estadísticas.`, confirmLabel: 'Archivar', danger: true });
        if (!ok) return;
        await withToast(async () => { await save('projects', { status: 'archivado' }, p); await store.refresh(); }, 'Proyecto archivado.');
    });
    renderAudit($('#audit', el), data, [id, ...obligations.map((o) => o.id)]);
}

export function openProjectForm(existing = null, preset = {}) {
    const data = store.data;
    const s = data.settings;
    const v = existing ?? {
        status: 'pendiente', accepted: true, service_type: 'web', start_date: todayISO(),
        alloc_mode: s.default_alloc_mode, alloc_ruben_bp: s.default_alloc_ruben_bp, ...preset,
    };
    const newId = crypto.randomUUID();
    formDialog({
        title: existing ? 'Editar proyecto' : 'Nuevo proyecto',
        intro: existing ? 'Cambiar el reparto del proyecto solo afecta a las obligaciones que se creen a partir de ahora; las ya registradas conservan su reparto.' : null,
        values: v,
        fields: [
            { name: 'client_id', label: 'Cliente', type: 'select', required: true, optionsHtml: clientOptions(data, v.client_id), full: true },
            { name: 'name', label: 'Nombre del proyecto', required: true, full: true },
            { name: 'service_type', label: 'Tipo de servicio', type: 'select', options: LABELS.service_type, required: true },
            { name: 'status', label: 'Estado', type: 'select', options: LABELS.project_status, required: true },
            { name: 'start_date', label: 'Fecha de inicio', type: 'date' },
            { name: 'due_date', label: 'Fecha prevista de finalización', type: 'date', help: 'Se usa para situar en la previsión lo que falte por documentar' },
            { name: 'price_cents', label: 'Precio acordado (€)', type: 'money', required: true, help: 'No se contabiliza como cobrado' },
            { name: 'accepted', label: 'Presupuesto aceptado por el cliente', type: 'checkbox', help: 'Si no está aceptado, cuenta como oportunidad potencial' },
            { name: 'alloc', type: 'alloc', amountField: 'price_cents', label: 'Reparto predeterminado del proyecto' },
            { name: 'description', label: 'Descripción', type: 'textarea', full: true },
            { name: 'notes', label: 'Notas internas', type: 'textarea', full: true },
        ],
        validate(values) {
            const e = {};
            if (values.due_date && values.start_date && values.due_date < values.start_date) e.due_date = 'No puede ser anterior al inicio';
            return e;
        },
        async onSubmit(values) {
            const saved = await save('projects', existing ? values : { id: newId, ...values }, existing);
            await store.refresh();
            toast(existing ? 'Proyecto actualizado.' : 'Proyecto creado.');
            if (!existing) location.hash = `#/proyectos/${saved.id}`;
        },
    });
}
