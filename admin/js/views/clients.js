import { html, paint, eur, date, emptyState, confirmDialog, toast, norm, $, FOR_WHOM } from '../ui.js';
import { formDialog, withToast } from '../forms.js';
import { insert, update, remove, store } from '../api.js';
import { unpaid, sumUnpaid } from '../lib/cobros.js';
import { todayISO } from '../lib/dates.js';
import { sum } from '../lib/money.js';
import { pendingList, bindPay, openChargeForm, chargeWhen } from './cobros.js';

const state = { q: '' };

export async function render({ el, params, data }) {
    if (params[0]) return renderDetail(el, data, params[0]);
    const today = todayISO();
    const q = norm(state.q);
    const list = data.clients
        .filter((c) => !q || norm(`${c.name} ${c.phone ?? ''} ${c.email ?? ''}`).includes(q))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));

    paint(el, html`
        <div class="page-head">
            <h1>Clientes</h1>
            <button class="btn btn-primary btn-lg" data-act="new" data-online>+ Cliente</button>
        </div>
        <div class="field m-b"><input type="search" name="q" value="${state.q}" placeholder="Buscar por nombre, teléfono o correo" aria-label="Buscar cliente"></div>
        <section class="card">
            ${list.length ? html`<ul class="rows">${list.map((c) => {
                const charges = data.charges.filter((x) => x.client_id === c.id);
                const owes = sumUnpaid(unpaid(charges, data.payments, '0000-01-01', today)).total;
                const ids = new Set(charges.map((x) => x.id));
                const paid = sum(data.payments.filter((p) => ids.has(p.charge_id)), (p) => p.amount_cents);
                return html`<li><div class="who"><a class="row-link" href="#/clientes/${c.id}"><strong>${c.name}</strong></a>
                        <small class="muted">${[c.phone, c.email].filter(Boolean).join(' · ') || `${charges.length} cobros`}</small></div>
                    <div class="amount">${owes ? html`<span class="bad">Debe ${eur(owes)}</span>` : html`<span class="muted small">Al día</span>`}
                        <small class="muted">Cobrado ${eur(paid)}</small></div></li>`;
            })}</ul>` : emptyState(data.clients.length ? 'Ningún cliente coincide.' : 'Aún no hay clientes. También puedes crearlos al añadir un cobro.')}
        </section>`);

    el.querySelector('[data-act="new"]').addEventListener('click', () => openClientForm());
    const search = el.querySelector('input[name="q"]');
    search.addEventListener('input', () => {
        state.q = search.value;
        clearTimeout(search._t);
        search._t = setTimeout(async () => {
            await render({ el, params, data });
            const s = el.querySelector('input[name="q"]');
            s.focus();
            s.setSelectionRange(s.value.length, s.value.length);
        }, 250);
    });
}

function renderDetail(el, data, id) {
    const c = data.byId.clients.get(id);
    if (!c) return paint(el, html`<div class="notice bad">Cliente no encontrado.</div><p><a href="#/clientes">Volver</a></p>`);
    const today = todayISO();
    const charges = data.charges.filter((x) => x.client_id === id);
    const ids = new Set(charges.map((x) => x.id));
    const payments = data.payments.filter((p) => ids.has(p.charge_id)).sort((a, b) => b.paid_on.localeCompare(a.paid_on));
    const pending = unpaid(charges, data.payments, '0000-01-01', today);

    paint(el, html`
        <div class="breadcrumb"><a href="#/clientes">← Clientes</a></div>
        <div class="page-head">
            <div><h1>${c.name}</h1><p class="muted m0">${[c.phone, c.email].filter(Boolean).join(' · ')}</p></div>
            <div class="actions">
                <button class="btn btn-primary" data-act="charge" data-online>+ Cobro</button>
                <button class="btn" data-act="edit" data-online>Editar</button>
                <button class="btn btn-danger" data-act="delete" data-online>Borrar cliente</button>
            </div>
        </div>
        <div class="stats">
            <div class="stat ${pending.length ? 'is-bad' : 'is-ok'}"><div class="label">Debe</div><div class="value">${eur(sumUnpaid(pending).total)}</div></div>
            <div class="stat is-ok"><div class="label">Cobrado en total</div><div class="value">${eur(sum(payments, (p) => p.amount_cents))}</div></div>
        </div>
        ${pending.length ? html`<section class="card"><h2>Por cobrar</h2>${pendingList(data, pending, today, { showClient: false })}</section>` : ''}
        <section class="card"><h2>Cobros</h2>
            ${charges.length ? html`<ul class="rows">${charges.map((x) => html`<li><div class="who"><strong>${x.concept}</strong>
                <small class="muted">${chargeWhen(x)} · Para: ${FOR_WHOM[x.for_whom]}${x.kind === 'mensual' && !x.active ? ' · Parado' : ''}</small></div>
                <div class="amount">${eur(x.amount_cents)}</div></li>`)}</ul>` : html`<p class="muted m0">Sin cobros.</p>`}
        </section>
        ${payments.length ? html`<section class="card"><h2>Historial de pagos</h2><ul class="rows">${payments.map((p) => html`<li>
            <div class="who"><span>${data.byId.charges.get(p.charge_id)?.concept}</span><small class="muted">Cobrado ${date(p.paid_on)} · periodo ${date(p.period)}</small></div>
            <div class="amount">${eur(p.amount_cents)}</div></li>`)}</ul></section>` : ''}
        ${c.notes ? html`<section class="card"><h2>Notas</h2><p class="m0">${c.notes}</p></section>` : ''}`);

    bindPay(el);
    const on = (act, fn) => el.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
    on('charge', () => openChargeForm(null, { client_id: id }));
    on('edit', () => openClientForm(c));
    on('delete', async () => {
        const extra = charges.length
            ? ` Se borrarán también sus ${charges.length} ${charges.length === 1 ? 'cobro' : 'cobros'} y ${payments.length} ${payments.length === 1 ? 'pago registrado' : 'pagos registrados'}, que dejarán de contar en las estadísticas. No se puede deshacer.`
            : '';
        const ok = await confirmDialog({ title: 'Borrar cliente', message: `¿Borrar a «${c.name}»?${extra}`, confirmLabel: 'Borrar todo', danger: true });
        if (!ok) return;
        await withToast(async () => { await remove('clients', id); location.hash = '#/clientes'; await store.refresh(); }, 'Cliente borrado.');
    });
}

export function openClientForm(existing = null) {
    const newId = crypto.randomUUID();
    formDialog({
        title: existing ? 'Editar cliente' : 'Nuevo cliente',
        values: existing ?? {},
        fields: [
            { name: 'name', label: 'Nombre', required: true, full: true },
            { name: 'phone', label: 'Teléfono', type: 'tel' },
            { name: 'email', label: 'Correo', type: 'email' },
            { name: 'notes', label: 'Notas', type: 'textarea', full: true },
        ],
        validate(v) {
            const e = {};
            if (!existing && store.data.clients.some((c) => c.name.trim().toLowerCase() === (v.name ?? '').toLowerCase())) e.name = 'Ya existe un cliente con ese nombre';
            return e;
        },
        async onSubmit(v) {
            if (existing) await update('clients', existing.id, v);
            else await insert('clients', { id: newId, ...v });
            await store.refresh();
            toast(existing ? 'Cliente actualizado.' : 'Cliente creado.');
            if (!existing) location.hash = `#/clientes/${newId}`;
        },
    });
}
