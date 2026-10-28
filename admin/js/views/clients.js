import { html, paint, eur, date, badge, LABELS, emptyState, stat, allocText, splitBar, confirmDialog, toast, norm, $ } from '../ui.js';
import { formDialog, withToast } from '../forms.js';
import { save, store, auditFor } from '../api.js';
import { recurringMonthly, projectsUndocumented } from '../lib/finance.js';
import { todayISO, formatDateTime } from '../lib/dates.js';
import { sum } from '../lib/money.js';
import { bindFilters, sortBy, projectName, userName } from './common.js';
import { openProjectForm } from './projects.js';
import { openObligationForm, openPaymentForm } from './income.js';
import { openRecurringForm } from './recurring.js';

const state = { q: '', status: '', archived: false, sort: 'name' };

export async function render({ el, params, data }) {
    if (params[0]) return renderDetail(el, data, params[0]);
    return renderList(el, data);
}

function clientTotals(data, id) {
    const obs = data.obligations.filter((o) => o.client_id === id && !o.voided_at);
    return { paid: sum(obs, (o) => o.paid_cents), pending: sum(obs, (o) => o.pending_cents) };
}

function renderList(el, data) {
    const q = norm(state.q);
    let list = data.clients.filter((c) => (state.archived ? c.archived_at : !c.archived_at)
        && (!state.status || c.status === state.status)
        && (!q || norm([c.name, c.contact_name, c.email].join(' ')).includes(q)));
    list = state.sort === 'name' ? sortBy(list, 'name')
        : state.sort === 'signup' ? sortBy(list, 'signup_date', 'desc')
            : sortBy(list, 'created_at', 'desc');

    paint(el, html`
        <div class="page-head">
            <div><h1>Clientes</h1><p>${data.clients.filter((c) => !c.archived_at).length} clientes · ${data.clients.filter((c) => c.archived_at).length} archivados</p></div>
            <div class="actions"><button class="btn btn-primary" data-act="new" data-online>Añadir cliente</button></div>
        </div>
        <div class="filters" id="filters">
            <label class="field grow"><span>Buscar</span><input type="search" name="q" value="${state.q}" placeholder="Nombre, empresa, correo o contacto"></label>
            <label class="field"><span>Estado</span><select name="status"><option value="">Todos</option>${Object.entries(LABELS.client_status).map(([k, l]) => html`<option value="${k}" ${state.status === k ? 'selected' : ''}>${l}</option>`)}</select></label>
            <label class="field"><span>Ordenar por</span><select name="sort">
                <option value="name" ${state.sort === 'name' ? 'selected' : ''}>Nombre</option>
                <option value="signup" ${state.sort === 'signup' ? 'selected' : ''}>Fecha de alta</option>
                <option value="created" ${state.sort === 'created' ? 'selected' : ''}>Fecha de creación</option></select></label>
            <label class="check"><input type="checkbox" name="archived" ${state.archived ? 'checked' : ''}> Ver archivados</label>
        </div>
        <section class="card">
            ${list.length ? html`<div class="table-wrap"><table class="responsive">
                <thead><tr><th>Cliente</th><th>Contacto</th><th>Tipo</th><th>Estado</th><th>Alta</th><th class="num">Cobrado</th><th class="num">Pendiente</th></tr></thead>
                <tbody>${list.map((c) => {
                    const t = clientTotals(data, c.id);
                    return html`<tr class="${c.archived_at ? 'is-archived' : ''}">
                        <td><a class="row-link" href="#/clientes/${c.id}">${c.name}</a></td>
                        <td data-label="Contacto">${c.contact_name ?? ''}${c.email ? html`<div class="muted small">${c.email}</div>` : ''}</td>
                        <td data-label="Tipo">${LABELS.client_type[c.client_type]}</td>
                        <td data-label="Estado">${badge('client_status', c.status)}</td>
                        <td data-label="Alta">${date(c.signup_date)}</td>
                        <td data-label="Cobrado" class="num">${eur(t.paid)}</td>
                        <td data-label="Pendiente" class="num">${eur(t.pending)}</td></tr>`;
                })}</tbody></table></div>`
            : emptyState(data.clients.length ? 'Ningún cliente coincide con los filtros.' : 'Aún no hay clientes.',
                data.clients.length ? '' : html`<button class="btn btn-primary" data-act="new" data-online>Añadir el primer cliente</button>`)}
        </section>`);
    bindFilters($('#filters', el), state, () => renderList(el, data));
    for (const b of el.querySelectorAll('[data-act="new"]')) b.addEventListener('click', () => openClientForm());
}

async function renderDetail(el, data, id) {
    const c = data.byId.clients.get(id);
    if (!c) return paint(el, html`<div class="notice bad">Cliente no encontrado.</div><p><a href="#/clientes">Volver a clientes</a></p>`);
    const today = todayISO();
    const projects = data.projects.filter((p) => p.client_id === id);
    const obligations = data.obligations.filter((o) => o.client_id === id);
    const live = obligations.filter((o) => !o.voided_at);
    const payments = data.payments.filter((p) => p.client_id === id).sort((a, b) => b.paid_on.localeCompare(a.paid_on));
    const services = data.recurring.filter((r) => r.client_id === id);
    const expenses = data.expenses.filter((e) => e.client_id === id);
    const mrr = recurringMonthly(services, today);
    const undocumented = projectsUndocumented(projects, live);

    const priceTotal = sum(projects.filter((p) => p.status !== 'cancelado'), (p) => p.price_cents);
    const paid = { total: sum(payments, (p) => p.amount_cents), ruben: sum(payments, (p) => p.ruben_cents), ines: sum(payments, (p) => p.ines_cents) };
    const pending = { total: sum(live, (o) => o.pending_cents), ruben: sum(live, (o) => o.pending_ruben_cents), ines: sum(live, (o) => o.pending_ines_cents) };
    const exp = { total: sum(expenses, (e) => e.amount_cents), ruben: sum(expenses, (e) => e.ruben_cents), ines: sum(expenses, (e) => e.ines_cents) };

    paint(el, html`
        <div class="breadcrumb"><a href="#/clientes">← Clientes</a></div>
        <div class="page-head">
            <div><h1>${c.name}</h1><p>${badge('client_status', c.status)} ${LABELS.client_type[c.client_type]}${c.archived_at ? ' · Archivado' : ''}</p></div>
            <div class="actions">
                <button class="btn" data-act="edit" data-online>Editar</button>
                <button class="btn" data-act="project" data-online>+ Proyecto</button>
                <button class="btn" data-act="obligation" data-online>+ Obligación de pago</button>
                <button class="btn" data-act="payment" data-online>+ Cobro</button>
                <button class="btn" data-act="recurring" data-online>+ Cuota</button>
                <button class="btn ${c.archived_at ? '' : 'btn-danger'}" data-act="archive" data-online>${c.archived_at ? 'Desarchivar' : 'Archivar'}</button>
            </div>
        </div>

        <div class="stats">
            ${stat('Precio total de proyectos', eur(priceTotal), { hint: 'Acordado, no cobrado' })}
            ${stat('Cobrado', eur(paid.total), { tone: 'ok' })}
            ${stat('Pendiente de cobro', eur(pending.total), { tone: pending.total ? 'bad' : '', hint: 'De obligaciones registradas' })}
            ${stat('Sin documentar', eur(sum(undocumented, (u) => u.total)), { hint: 'Precio de proyectos aún sin obligación' })}
            ${stat('Cuotas activas', eur(mrr.total), { hint: 'Equivalente mensual' })}
            ${stat('Gastos relacionados', eur(exp.total))}
        </div>

        <div class="grid-2">
            <section class="card"><h2>Datos de contacto</h2>
                <dl class="kv">
                    <dt>Contacto</dt><dd>${c.contact_name ?? '—'}</dd>
                    <dt>Correo</dt><dd>${c.email ? html`<a href="mailto:${c.email}">${c.email}</a>` : '—'}</dd>
                    <dt>Teléfono</dt><dd>${c.phone ? html`<a href="tel:${c.phone.replace(/\s/g, '')}">${c.phone}</a>` : '—'}</dd>
                    <dt>Fecha de alta</dt><dd>${date(c.signup_date)}</dd>
                    <dt>Servicios</dt><dd>${c.services.length ? c.services.map((s) => LABELS.service_type[s]).join(', ') : '—'}</dd>
                    <dt>Responsable</dt><dd>${c.responsible ? LABELS.partner[c.responsible] : '—'}</dd>
                    <dt>Creado</dt><dd>${formatDateTime(c.created_at)} · ${userName(data, c.created_by)}</dd>
                    <dt>Modificado</dt><dd>${formatDateTime(c.updated_at)} · ${userName(data, c.updated_by)}</dd>
                </dl>
                ${c.notes ? html`<h3>Notas internas</h3><p class="m0">${c.notes}</p>` : ''}
            </section>
            <section class="card"><h2>Reparto entre Rubén e Inés</h2>
                <div class="table-wrap"><table>
                    <thead><tr><th></th><th class="num"><span class="swatch s1"></span>Rubén</th><th class="num"><span class="swatch s2"></span>Inés</th><th class="num">Total</th></tr></thead>
                    <tbody>
                        <tr><td>Cobrado</td><td class="num">${eur(paid.ruben)}</td><td class="num">${eur(paid.ines)}</td><td class="num">${eur(paid.total)}</td></tr>
                        <tr><td>Pendiente</td><td class="num">${eur(pending.ruben)}</td><td class="num">${eur(pending.ines)}</td><td class="num">${eur(pending.total)}</td></tr>
                        <tr><td>Cuotas (mes)</td><td class="num">${eur(mrr.ruben)}</td><td class="num">${eur(mrr.ines)}</td><td class="num">${eur(mrr.total)}</td></tr>
                        <tr><td>Gastos asumidos</td><td class="num">${eur(exp.ruben)}</td><td class="num">${eur(exp.ines)}</td><td class="num">${eur(exp.total)}</td></tr>
                    </tbody></table></div>
                ${splitBar(paid.ruben + pending.ruben, paid.ines + pending.ines)}
            </section>
        </div>
        <p></p>
        <div class="stack">
            <section class="card"><h2>Proyectos</h2>
                ${projects.length ? html`<div class="table-wrap"><table class="responsive">
                    <thead><tr><th>Proyecto</th><th>Estado</th><th>Inicio</th><th class="num">Precio</th><th>Reparto</th></tr></thead>
                    <tbody>${projects.map((p) => html`<tr><td><a class="row-link" href="#/proyectos/${p.id}">${p.name}</a><div class="muted small">${LABELS.service_type[p.service_type]}</div></td>
                        <td data-label="Estado">${badge('project_status', p.status)}${p.accepted ? '' : html` <span class="badge info">Presupuesto</span>`}</td>
                        <td data-label="Inicio">${date(p.start_date)}</td><td data-label="Precio" class="num">${eur(p.price_cents)}</td>
                        <td data-label="Reparto" class="small">${allocText(p)}</td></tr>`)}</tbody></table></div>`
                : html`<p class="muted">Sin proyectos.</p>`}
            </section>
            <section class="card"><h2>Obligaciones de pago</h2>
                ${obligations.length ? html`<div class="table-wrap"><table class="responsive">
                    <thead><tr><th>Concepto</th><th>Vence</th><th>Estado</th><th class="num">Importe</th><th class="num">Cobrado</th><th class="num">Pendiente</th></tr></thead>
                    <tbody>${sortBy(obligations, 'issue_date', 'desc').map((o) => html`<tr class="${o.voided_at ? 'is-archived' : ''}"><td><a class="row-link" href="#/cobros/${o.id}">${o.concept}</a>${o.reference ? html`<div class="muted small">${o.reference}</div>` : ''}</td>
                        <td data-label="Vence">${date(o.due_date)}</td><td data-label="Estado">${badge('obligation_status', o.status)}</td>
                        <td data-label="Importe" class="num">${eur(o.amount_cents)}</td><td data-label="Cobrado" class="num">${eur(o.paid_cents)}</td><td data-label="Pendiente" class="num">${eur(o.pending_cents)}</td></tr>`)}</tbody></table></div>`
                : html`<p class="muted">Sin obligaciones de pago.</p>`}
            </section>
            <section class="card"><h2>Cuotas recurrentes</h2>
                ${services.length ? html`<div class="table-wrap"><table class="responsive">
                    <thead><tr><th>Servicio</th><th>Frecuencia</th><th>Estado</th><th>Próximo cobro</th><th class="num">Importe</th></tr></thead>
                    <tbody>${services.map((s) => html`<tr><td><a class="row-link" href="#/cuotas/${s.id}">${s.name}</a></td><td data-label="Frecuencia">${LABELS.period_months[s.period_months]}</td>
                        <td data-label="Estado">${badge('recurring_status', s.status)}</td><td data-label="Próximo cobro">${s.status === 'activo' ? date(s.next_due_date) : '—'}</td><td data-label="Importe" class="num">${eur(s.amount_cents)}</td></tr>`)}</tbody></table></div>`
                : html`<p class="muted">Sin cuotas recurrentes.</p>`}
            </section>
            <section class="card"><h2>Historial de cobros</h2>
                ${payments.length ? html`<div class="table-wrap"><table class="responsive">
                    <thead><tr><th>Fecha</th><th>Obligación</th><th>Método</th><th class="num">Rubén</th><th class="num">Inés</th><th class="num">Importe</th></tr></thead>
                    <tbody>${payments.map((p) => html`<tr><td>${date(p.paid_on)}</td><td data-label="Obligación"><a href="#/cobros/${p.obligation_id}">${data.byId.obligations.get(p.obligation_id)?.concept ?? '—'}</a></td>
                        <td data-label="Método">${LABELS.payment_method[p.method]}</td><td data-label="Rubén" class="num">${eur(p.ruben_cents)}</td><td data-label="Inés" class="num">${eur(p.ines_cents)}</td><td data-label="Importe" class="num">${eur(p.amount_cents)}</td></tr>`)}</tbody>
                    <tfoot><tr><td colspan="3">Total cobrado</td><td class="num">${eur(paid.ruben)}</td><td class="num">${eur(paid.ines)}</td><td class="num">${eur(paid.total)}</td></tr></tfoot></table></div>`
                : html`<p class="muted">Sin cobros registrados.</p>`}
            </section>
            <section class="card"><h2>Gastos relacionados</h2>
                ${expenses.length ? html`<div class="table-wrap"><table class="responsive">
                    <thead><tr><th>Concepto</th><th>Fecha</th><th>Proyecto</th><th>Estado</th><th class="num">Importe</th></tr></thead>
                    <tbody>${expenses.map((e) => html`<tr><td>${e.concept}</td><td data-label="Fecha">${date(e.expense_date)}</td><td data-label="Proyecto">${projectName(data, e.project_id)}</td>
                        <td data-label="Estado">${badge('expense_status', e.status)}</td><td data-label="Importe" class="num">${eur(e.amount_cents)}</td></tr>`)}</tbody></table></div>`
                : html`<p class="muted">Sin gastos asociados.</p>`}
            </section>
            <section class="card"><h2>Últimos cambios</h2><div id="audit" class="muted small">Cargando…</div></section>
        </div>`);

    const on = (act, fn) => el.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
    on('edit', () => openClientForm(c));
    on('project', () => openProjectForm(null, { client_id: id }));
    on('obligation', () => openObligationForm(null, { client_id: id }));
    on('payment', () => openPaymentForm({ client_id: id }));
    on('recurring', () => openRecurringForm(null, { client_id: id }));
    on('archive', () => toggleArchive(c));
    renderAudit($('#audit', el), data, [id, ...projects.map((p) => p.id), ...obligations.map((o) => o.id)]);
}

export async function renderAudit(box, data, ids) {
    const rows = await auditFor(ids).catch(() => null);
    if (!box.isConnected) return;
    if (!rows) { box.textContent = 'No se ha podido cargar el historial.'; return; }
    const what = { clients: 'cliente', projects: 'proyecto', payment_obligations: 'obligación', payments: 'cobro', recurring_services: 'cuota', expenses: 'gasto' };
    const act = { insert: 'creó', update: 'modificó', delete: 'eliminó' };
    paint(box, rows.length ? html`<ul class="m0">${rows.slice(0, 15).map((r) => html`<li>${formatDateTime(r.changed_at)} · ${userName(data, r.changed_by)} ${act[r.action]} ${what[r.table_name] ?? r.table_name}</li>`)}</ul>` : 'Sin cambios registrados.');
}

async function toggleArchive(c) {
    const archiving = !c.archived_at;
    const ok = await confirmDialog({
        title: archiving ? 'Archivar cliente' : 'Desarchivar cliente',
        message: archiving
            ? `«${c.name}» dejará de aparecer en los listados, pero se conservan sus proyectos, cobros y todo su historial económico.`
            : `«${c.name}» volverá a aparecer en los listados.`,
        confirmLabel: archiving ? 'Archivar' : 'Desarchivar',
        danger: archiving,
    });
    if (!ok) return;
    await withToast(async () => {
        await save('clients', { archived_at: archiving ? new Date().toISOString() : null }, c);
        await store.refresh();
    }, archiving ? 'Cliente archivado.' : 'Cliente desarchivado.');
}

export function openClientForm(existing = null) {
    const today = todayISO();
    const v = existing ?? { client_type: 'empresa', status: 'activo', signup_date: today, services: [] };
    const newId = crypto.randomUUID();
    formDialog({
        title: existing ? 'Editar cliente' : 'Nuevo cliente',
        values: v,
        fields: [
            { name: 'name', label: 'Nombre comercial o del cliente', required: true, full: true },
            { name: 'contact_name', label: 'Persona de contacto' },
            { name: 'email', label: 'Correo electrónico', type: 'email' },
            { name: 'phone', label: 'Teléfono', type: 'tel' },
            { name: 'client_type', label: 'Tipo de cliente', type: 'select', options: LABELS.client_type, required: true },
            { name: 'status', label: 'Estado', type: 'select', options: LABELS.client_status, required: true },
            { name: 'signup_date', label: 'Fecha de alta', type: 'date', required: true },
            { name: 'responsible', label: 'Responsable (opcional)', type: 'select', options: LABELS.partner, empty: 'Sin responsable' },
            { name: 'services', label: 'Servicios contratados', type: 'checks', options: LABELS.service_type, full: true },
            { name: 'notes', label: 'Notas internas', type: 'textarea', full: true },
        ],
        validate(values) {
            const e = {};
            if (values.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) e.email = 'Correo no válido';
            const dup = store.data.clients.find((c) => c.id !== existing?.id && c.name.trim().toLowerCase() === (values.name ?? '').trim().toLowerCase());
            if (dup && !existing) e.name = 'Ya existe un cliente con este nombre';
            return e;
        },
        async onSubmit(values) {
            const saved = await save('clients', existing ? values : { id: newId, ...values }, existing);
            await store.refresh();
            toast(existing ? 'Cliente actualizado.' : 'Cliente creado.');
            if (!existing) location.hash = `#/clientes/${saved.id}`;
        },
    });
}
