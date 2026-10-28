import { html, paint, eur, date, stat, emptyState, confirmDialog, toast, norm, $, FOR_WHOM, raw } from '../ui.js';
import { formDialog, withToast } from '../forms.js';
import { insert, update, remove, rpc, store } from '../api.js';
import { unpaid, sumUnpaid, collected, monthlyTotal } from '../lib/cobros.js';
import { todayISO, addDays, monthStart, monthEnd, formatDate } from '../lib/dates.js';
import { formatEuros } from '../lib/money.js';

const state = { kind: '', q: '' };
const KIND = { unico: 'Una vez', mensual: 'Cada mes' };

export function chargeWhen(c) {
    return c.kind === 'mensual' ? `Cada mes, día ${c.day_of_month}` : `Una vez · ${formatDate(c.due_date)}`;
}

function daysLate(period, today) {
    const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${period}T00:00:00Z`);
    return Math.round(ms / 86400000);
}

// Filas de cobros pendientes con el botón ✓ (también se usan en la ficha de cliente).
export function pendingList(data, items, today, { showClient = true } = {}) {
    return html`<ul class="pending">${items.map((it) => {
        const late = daysLate(it.period, today);
        return html`<li class="${late > 0 ? 'late' : ''}">
            <div class="who">
                ${showClient ? html`<strong>${data.byId.clients.get(it.charge.client_id)?.name ?? '—'}</strong>` : ''}
                <span>${it.charge.concept}</span>
                <small class="${late > 0 ? 'bad' : 'muted'}">${formatDate(it.period)}${late > 0 ? ` · hace ${late} ${late === 1 ? 'día' : 'días'}` : late === 0 ? ' · hoy' : ''}</small>
            </div>
            <div class="amount">${eur(it.amount)}</div>
            <button class="btn btn-ok" data-pay="${it.charge.id}" data-period="${it.period}" data-online aria-label="Marcar como pagado: ${it.charge.concept} ${formatDate(it.period)}">✓ Pagado</button>
        </li>`;
    })}</ul>`;
}

export function bindPay(root) {
    for (const b of root.querySelectorAll('[data-pay]')) {
        b.addEventListener('click', () => markPaid(store.data.byId.charges.get(b.dataset.pay), b.dataset.period, b));
    }
}

async function markPaid(charge, period, btn) {
    btn.disabled = true;
    await withToast(async () => {
        await insert('payments', { charge_id: charge.id, period, paid_on: todayISO(), amount_cents: charge.amount_cents });
        await store.refresh();
    }, `Cobrado: ${charge.concept} · ${formatEuros(charge.amount_cents)}`);
    btn.disabled = false;
}

export async function render({ el, data }) {
    const today = todayISO();
    const pending = unpaid(data.charges, data.payments, '0000-01-01', today);
    const soon = unpaid(data.charges, data.payments, addDays(today, 1), addDays(today, 30));
    const due = sumUnpaid(pending);
    const month = collected(data.payments, monthStart(today), monthEnd(today));
    const mrr = monthlyTotal(data.charges);
    const recent = [...data.payments].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

    const q = norm(state.q);
    const list = data.charges
        .filter((c) => (!state.kind || c.kind === state.kind)
            && (!q || norm(`${c.concept} ${data.byId.clients.get(c.client_id)?.name}`).includes(q)))
        .sort((a, b) => (data.byId.clients.get(a.client_id)?.name ?? '').localeCompare(data.byId.clients.get(b.client_id)?.name ?? '', 'es'));
    const paidKeys = new Set(data.payments.map((p) => `${p.charge_id}|${p.period}`));

    paint(el, html`
        <div class="page-head">
            <h1>Cobros</h1>
            <button class="btn btn-primary btn-lg" data-act="new" data-online>+ Nuevo cobro</button>
        </div>
        <div class="stats">
            ${stat('Por cobrar', eur(due.total), { tone: due.total ? 'bad' : 'ok', hint: pending.length === 1 ? '1 pendiente' : `${pending.length} pendientes` })}
            ${stat('Cobrado este mes', eur(month.total), { tone: 'ok' })}
            ${stat('Cobros mensuales', eur(mrr.total), { hint: 'Lo que entra cada mes' })}
        </div>

        <section class="card">
            <h2>Por cobrar ${pending.length ? html`<span class="count">${pending.length}</span>` : ''}</h2>
            ${pending.length ? pendingList(data, pending, today)
                : html`<p class="muted m0">${data.charges.length ? 'Todo cobrado. ✓' : 'Aún no hay cobros. Pulsa «+ Nuevo cobro» para empezar.'}</p>`}
        </section>

        ${soon.length ? html`<section class="card"><h2>Próximos 30 días</h2>${pendingList(data, soon, today)}</section>` : ''}

        <section class="card">
            <div class="card-head">
                <h2>Todos los cobros</h2>
                <div class="tabs" role="group" aria-label="Tipo" id="kind">
                    ${[['', 'Todos'], ['unico', 'Una vez'], ['mensual', 'Cada mes']].map(([k, l]) => html`<button type="button" data-kind="${k}" aria-pressed="${state.kind === k}">${l}</button>`)}
                </div>
            </div>
            <div class="field m-b"><input type="search" name="q" value="${state.q}" placeholder="Buscar cliente o concepto" aria-label="Buscar cobro"></div>
            ${list.length ? html`<ul class="rows">${list.map((c) => {
                const paidOnce = c.kind === 'unico' && paidKeys.has(`${c.id}|${c.due_date}`);
                const status = c.kind === 'unico' ? (paidOnce ? ['ok', 'Pagado'] : ['warn', 'Pendiente']) : (c.active ? ['ok', 'Activo'] : ['', 'Parado']);
                return html`<li>
                    <div class="who"><strong>${data.byId.clients.get(c.client_id)?.name ?? '—'}</strong><span>${c.concept}</span>
                        <small class="muted">${chargeWhen(c)} · Para: ${FOR_WHOM[c.for_whom]}</small></div>
                    <div class="amount">${eur(c.amount_cents)}<span class="badge ${status[0]}">${status[1]}</span></div>
                    <div class="row-actions">
                        <button class="btn btn-sm" data-edit="${c.id}" data-online>Editar</button>
                        ${c.kind === 'mensual' ? html`<button class="btn btn-sm" data-toggle="${c.id}" data-online>${c.active ? 'Parar' : 'Reanudar'}</button>` : ''}
                        <button class="btn btn-sm btn-danger" data-del="${c.id}" data-online aria-label="Borrar ${c.concept}">Borrar</button>
                    </div></li>`;
            })}</ul>` : emptyState(data.charges.length ? 'Ningún cobro coincide.' : 'Sin cobros todavía.')}
        </section>

        ${recent.length ? html`<section class="card"><h2>Últimos pagos marcados</h2><ul class="rows">${recent.map((p) => {
            const c = data.byId.charges.get(p.charge_id);
            return html`<li><div class="who"><strong>${data.byId.clients.get(c?.client_id)?.name ?? '—'}</strong><span>${c?.concept}</span>
                <small class="muted">Periodo ${date(p.period)} · cobrado ${date(p.paid_on)}</small></div>
                <div class="amount">${eur(p.amount_cents)}</div>
                <div class="row-actions"><button class="btn btn-sm" data-undo="${p.id}" data-online>Deshacer</button></div></li>`;
        })}</ul></section>` : ''}`);

    bindPay(el);
    el.querySelector('[data-act="new"]').addEventListener('click', () => openChargeForm());
    $('#kind', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-kind]');
        if (b) { state.kind = b.dataset.kind; render({ el, data }); }
    });
    const search = el.querySelector('input[name="q"]');
    search.addEventListener('input', () => {
        state.q = search.value;
        clearTimeout(search._t);
        search._t = setTimeout(async () => {
            await render({ el, data });
            const s = el.querySelector('input[name="q"]');
            s.focus();
            s.setSelectionRange(s.value.length, s.value.length);
        }, 250);
    });
    for (const b of el.querySelectorAll('[data-edit]')) b.addEventListener('click', () => openChargeForm(data.byId.charges.get(b.dataset.edit)));
    for (const b of el.querySelectorAll('[data-toggle]')) {
        b.addEventListener('click', () => {
            const c = data.byId.charges.get(b.dataset.toggle);
            withToast(async () => { await update('charges', c.id, { active: !c.active }); await store.refresh(); }, c.active ? 'Cobro mensual parado.' : 'Cobro mensual reanudado.');
        });
    }
    for (const b of el.querySelectorAll('[data-del]')) b.addEventListener('click', () => deleteCharge(data, data.byId.charges.get(b.dataset.del)));
    for (const b of el.querySelectorAll('[data-undo]')) {
        b.addEventListener('click', () => withToast(async () => { await remove('payments', b.dataset.undo); await store.refresh(); }, 'Pago deshecho: vuelve a estar pendiente.'));
    }
}

async function deleteCharge(data, c) {
    const pays = data.payments.filter((p) => p.charge_id === c.id);
    if (pays.length) {
        const msg = c.kind === 'mensual'
            ? 'Este cobro ya tiene pagos registrados, así que no se borra para no perder las estadísticas. Usa «Parar» para que deje de pedirse.'
            : 'Este cobro ya está pagado; no se borra para no perder las estadísticas.';
        toast(msg, 'error');
        return;
    }
    const ok = await confirmDialog({ title: 'Borrar cobro', message: `¿Borrar «${c.concept}» (${formatEuros(c.amount_cents)})?`, confirmLabel: 'Borrar', danger: true });
    if (!ok) return;
    await withToast(async () => { await remove('charges', c.id); await store.refresh(); }, 'Cobro borrado.');
}

export function openChargeForm(existing = null, preset = {}) {
    const data = store.data;
    const today = todayISO();
    const clients = [...data.clients].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    const v = existing
        ? { ...existing, start_month: existing.start_month?.slice(0, 7) }
        : { client_id: preset.client_id ?? (clients.length ? '' : '__new'), kind: 'unico', due_date: today, day_of_month: Number(today.slice(8)), start_month: today.slice(0, 7), for_whom: 'ambos' };
    const newId = crypto.randomUUID();
    const clientOpts = html`${existing ? '' : html`<option value="__new" ${v.client_id === '__new' ? raw('selected') : ''}>+ Cliente nuevo…</option>`}
        ${clients.length && !existing ? html`<option value="" ${v.client_id === '' ? raw('selected') : ''} disabled>Elige un cliente…</option>` : ''}
        ${clients.map((c) => html`<option value="${c.id}" ${c.id === v.client_id ? raw('selected') : ''}>${c.name}</option>`)}`;

    formDialog({
        title: existing ? 'Editar cobro' : 'Nuevo cobro',
        values: v,
        submitLabel: existing ? 'Guardar' : 'Crear cobro',
        fields: [
            { name: 'client_id', label: 'Cliente', type: 'select', required: true, optionsHtml: clientOpts, full: true },
            { name: 'new_client', label: 'Nombre del cliente nuevo', required: true, full: true },
            { name: 'concept', label: 'Concepto', required: true, full: true, help: 'Ej.: Página web, Mantenimiento, Hosting' },
            { name: 'amount_cents', label: 'Importe (€)', type: 'money', required: true },
            ...(existing ? [] : [{ name: 'kind', label: '¿Cómo se cobra?', type: 'choice', options: KIND, full: true }]),
            { name: 'due_date', label: 'Fecha de cobro', type: 'date', required: true },
            { name: 'paid', label: 'Ya está pagado', type: 'checkbox' },
            { name: 'day_of_month', label: 'Día del mes', type: 'number', min: 1, max: 31, required: true, help: 'Si el mes tiene menos días, el último día' },
            { name: 'start_month', label: 'Desde el mes', type: 'month', required: true },
            { name: 'for_whom', label: 'Para', type: 'choice', options: FOR_WHOM, full: true },
        ],
        onChange(name, api) {
            const kind = existing ? existing.kind : (api.form.elements.kind?.value || 'unico');
            api.show('new_client', !existing && api.form.elements.client_id.value === '__new');
            api.show('due_date', kind === 'unico');
            api.show('paid', kind === 'unico' && !existing);
            api.show('day_of_month', kind === 'mensual');
            api.show('start_month', kind === 'mensual');
            if (name === '__init' && preset.client_id) api.form.elements.concept.focus();
        },
        validate(values) {
            const e = {};
            if (!values.client_id) e.client_id = 'Elige un cliente';
            const day = Number(values.day_of_month);
            if (values.day_of_month !== null && !(Number.isInteger(day) && day >= 1 && day <= 31)) e.day_of_month = 'Un día entre 1 y 31';
            return e;
        },
        async onSubmit(values) {
            const kind = existing ? existing.kind : (values.kind || 'unico');
            const startMonth = values.start_month ? `${values.start_month}-01` : null;
            if (existing) {
                await update('charges', existing.id, {
                    concept: values.concept, amount_cents: values.amount_cents, for_whom: values.for_whom,
                    ...(kind === 'unico' ? { due_date: values.due_date } : { day_of_month: Number(values.day_of_month), start_month: startMonth }),
                });
            } else {
                await rpc('new_charge', {
                    p_id: newId,
                    p_client_id: values.client_id === '__new' ? null : values.client_id,
                    p_new_client: values.client_id === '__new' ? values.new_client : null,
                    p_concept: values.concept, p_amount_cents: values.amount_cents, p_kind: kind,
                    p_due_date: values.due_date, p_day_of_month: values.day_of_month ? Number(values.day_of_month) : null,
                    p_start_month: startMonth, p_for_whom: values.for_whom, p_paid: Boolean(values.paid),
                });
            }
            await store.refresh();
            toast(existing ? 'Cobro actualizado.' : 'Cobro creado.');
        },
    });
}
