import { html, paint, eur, date, badge, LABELS, emptyState, stat, allocText, confirmDialog, toast, norm, $, options } from '../ui.js';
import { formDialog, withToast } from '../forms.js';
import { save, remove, rpc, store } from '../api.js';
import { groupSum, expenseForecastItems } from '../lib/finance.js';
import { todayISO, inRange, addPeriod, dayOf, formatDate } from '../lib/dates.js';
import { sum, formatEuros } from '../lib/money.js';
import { bindFilters, sortBy, clientName, projectName, clientOptions, projectOptions, periodFilter, periodState, resolvePeriod, periodLabel } from './common.js';

const state = { q: '', status: '', category: '', paid_by: '', ...periodState('anio') };

export async function render({ el, data }) {
    return renderList(el, data);
}

function renderList(el, data) {
    const today = todayISO();
    const [from, to] = resolvePeriod(state, today);
    const q = norm(state.q);
    const list = sortBy(data.expenses.filter((e) => inRange(e.status === 'pagado' ? e.paid_on : e.expense_date, from, to)
        && (!state.status || e.status === state.status)
        && (!state.category || e.category === state.category)
        && (!state.paid_by || e.paid_by === state.paid_by)
        && (!q || norm(`${e.concept} ${e.supplier ?? ''} ${e.notes ?? ''}`).includes(q))), 'expense_date', 'desc');
    const paid = list.filter((e) => e.status === 'pagado');
    const pending = data.expenses.filter((e) => e.status === 'pendiente');
    const byCat = groupSum(paid, (e) => e.category, (e) => e.amount_cents);
    const templates = data.expenses.filter((e) => e.recurrence_months);
    const nextItems = expenseForecastItems(data.expenses, '0000-01-01', addPeriod(today, 1, dayOf(today)));

    paint(el, html`
        <div class="page-head">
            <div><h1>Gastos</h1><p>Quién adelanta el dinero y a quién corresponde asumirlo se registran por separado, sin duplicar el gasto.</p></div>
            <div class="actions"><button class="btn btn-primary" data-act="new" data-online>Añadir gasto</button></div>
        </div>
        <div class="stats">
            ${stat('Pagado en el periodo', eur(sum(paid, (e) => e.amount_cents)), { hint: periodLabel(from, to) })}
            ${stat('Asumido por Rubén', eur(sum(paid, (e) => e.ruben_cents)), { hint: 'Gastos pagados del periodo' })}
            ${stat('Asumido por Inés', eur(sum(paid, (e) => e.ines_cents)), { hint: 'Gastos pagados del periodo' })}
            ${stat('Pendiente de pagar', eur(sum(pending, (e) => e.amount_cents)), { tone: pending.length ? 'bad' : '', hint: `${pending.length} gastos (todas las fechas)` })}
            ${stat('Adelantado por Rubén', eur(sum(paid.filter((e) => e.paid_by === 'ruben'), (e) => e.amount_cents)))}
            ${stat('Adelantado por Inés', eur(sum(paid.filter((e) => e.paid_by === 'ines'), (e) => e.amount_cents)))}
        </div>
        <div class="filters" id="filters">
            <label class="field grow"><span>Buscar</span><input type="search" name="q" value="${state.q}" placeholder="Concepto o proveedor"></label>
            ${periodFilter(state)}
            <label class="field"><span>Estado</span><select name="status">${options(LABELS.expense_status, state.status, { empty: 'Todos' })}</select></label>
            <label class="field"><span>Categoría</span><select name="category">${options(LABELS.expense_category, state.category, { empty: 'Todas' })}</select></label>
            <label class="field"><span>Pagado por</span><select name="paid_by">${options(LABELS.payer, state.paid_by, { empty: 'Cualquiera' })}</select></label>
        </div>
        ${nextItems.length ? html`<div class="notice warn">Gastos recurrentes con periodo próximo o vencido sin registrar:
            ${nextItems.slice(0, 5).map((i) => html` <button class="btn btn-sm" data-next="${i.expense.id}" data-date="${i.date}" data-online>${i.expense.concept} · ${formatDate(i.date)}</button>`)}</div><p></p>` : ''}
        <section class="card">
            ${list.length ? html`<div class="table-wrap"><table class="responsive">
                <thead><tr><th>Concepto</th><th>Categoría</th><th>Fecha</th><th>Estado</th><th>Pagado por</th><th>Asume</th><th class="num">Importe</th><th></th></tr></thead>
                <tbody>${list.map((e) => html`<tr>
                    <td><strong>${e.concept}</strong>${e.recurrence_months ? html` <span class="badge info">${LABELS.period_months[e.recurrence_months]}</span>` : ''}${e.recurring_parent_id ? html` <span class="badge">recurrente</span>` : ''}
                        <div class="muted small">${[e.supplier, e.client_id && clientName(data, e.client_id), e.project_id && projectName(data, e.project_id)].filter(Boolean).join(' · ')}</div></td>
                    <td data-label="Categoría">${LABELS.expense_category[e.category]}</td>
                    <td data-label="Fecha">${date(e.expense_date)}${e.paid_on && e.paid_on !== e.expense_date ? html`<div class="muted small">pagado ${date(e.paid_on)}</div>` : ''}</td>
                    <td data-label="Estado">${badge('expense_status', e.status)}</td>
                    <td data-label="Pagado por">${e.paid_by ? LABELS.payer[e.paid_by] : '—'}</td>
                    <td data-label="Asume" class="small">${allocText(e)}</td>
                    <td data-label="Importe" class="num">${eur(e.amount_cents)}</td>
                    <td class="nowrap"><button class="btn btn-sm" data-edit="${e.id}" data-online>Editar</button>
                        ${e.status === 'pendiente' ? html`<button class="btn btn-sm" data-pay="${e.id}" data-online>Marcar pagado</button>` : ''}
                        <button class="btn btn-sm btn-danger" data-del="${e.id}" data-online>Eliminar</button></td></tr>`)}</tbody>
                <tfoot><tr><td colspan="6">Total (${list.length})</td><td class="num">${eur(sum(list, (e) => e.amount_cents))}</td><td></td></tr></tfoot>
            </table></div>`
            : emptyState(data.expenses.length ? 'No hay gastos con estos filtros.' : 'Aún no hay gastos registrados.',
                html`<button class="btn btn-primary" data-act="new" data-online>Añadir gasto</button>`)}
        </section>
        <p></p>
        <div class="grid-2">
            <section class="card"><h2>Gastos pagados por categoría</h2>
                ${byCat.length ? html`<div class="table-wrap"><table><tbody>${byCat.map((c) => html`<tr><td>${LABELS.expense_category[c.key]}</td><td class="num">${eur(c.value)}</td></tr>`)}</tbody></table></div>`
                : html`<p class="muted">Sin gastos pagados en el periodo.</p>`}
            </section>
            <section class="card"><h2>Gastos recurrentes</h2>
                ${templates.length ? html`<div class="table-wrap"><table class="responsive"><thead><tr><th>Concepto</th><th>Frecuencia</th><th>Estado</th><th class="num">Importe</th></tr></thead><tbody>
                    ${templates.map((t) => html`<tr><td>${t.concept}</td><td data-label="Frecuencia">${LABELS.period_months[t.recurrence_months]}</td>
                        <td data-label="Estado">${t.recurrence_active && (!t.recurrence_end || t.recurrence_end >= today) ? html`<span class="badge ok">Activo</span>` : html`<span class="badge">Finalizado</span>`}</td>
                        <td data-label="Importe" class="num">${eur(t.amount_cents)}</td></tr>`)}</tbody></table></div>`
                : html`<p class="muted">Marca un gasto como recurrente para incluirlo en la previsión.</p>`}
            </section>
        </div>`);

    bindFilters($('#filters', el), state, () => renderList(el, data));
    for (const b of el.querySelectorAll('[data-act="new"]')) b.addEventListener('click', () => openExpenseForm());
    for (const b of el.querySelectorAll('[data-edit]')) b.addEventListener('click', () => openExpenseForm(data.byId.expenses.get(b.dataset.edit)));
    for (const b of el.querySelectorAll('[data-pay]')) b.addEventListener('click', () => markPaid(data.byId.expenses.get(b.dataset.pay)));
    for (const b of el.querySelectorAll('[data-del]')) b.addEventListener('click', () => deleteExpense(data, data.byId.expenses.get(b.dataset.del)));
    for (const b of el.querySelectorAll('[data-next]')) b.addEventListener('click', () => registerNext(data.byId.expenses.get(b.dataset.next), b.dataset.date));
}

async function deleteExpense(data, e) {
    if (data.expenses.some((x) => x.recurring_parent_id === e.id)) {
        toast('Este gasto recurrente tiene periodos registrados. Edítalo y desactiva la recurrencia en lugar de eliminarlo.', 'error');
        return;
    }
    const ok = await confirmDialog({ title: 'Eliminar gasto', message: `Se eliminará «${e.concept}» (${formatEuros(e.amount_cents)}). El cambio queda en el historial.`, confirmLabel: 'Eliminar', danger: true });
    if (!ok) return;
    await withToast(async () => { await remove('expenses', e.id); await store.refresh(); }, 'Gasto eliminado.');
}

function markPaid(e) {
    formDialog({
        title: `Marcar como pagado: ${e.concept}`,
        values: { paid_on: todayISO(), paid_by: e.paid_by ?? '' },
        submitLabel: 'Marcar pagado',
        fields: [
            { name: 'paid_on', label: 'Fecha de pago', type: 'date', required: true },
            { name: 'paid_by', label: '¿Quién ha pagado?', type: 'select', options: LABELS.payer, required: true, empty: 'Elige…' },
        ],
        async onSubmit(v) {
            await save('expenses', { status: 'pagado', paid_on: v.paid_on, paid_by: v.paid_by }, e);
            await store.refresh();
            toast('Gasto marcado como pagado.');
        },
    });
}

function registerNext(t, isoDate) {
    formDialog({
        title: `Registrar periodo de «${t.concept}»`,
        intro: `Se registrará un gasto de ${formatEuros(t.amount_cents)} con el mismo reparto que el original.`,
        values: { expense_date: isoDate, status: 'pagado', paid_on: isoDate <= todayISO() ? isoDate : todayISO(), paid_by: t.paid_by ?? '' },
        submitLabel: 'Registrar',
        fields: [
            { name: 'expense_date', label: 'Fecha del periodo', type: 'date', required: true },
            { name: 'status', label: 'Estado', type: 'select', options: LABELS.expense_status, required: true },
            { name: 'paid_on', label: 'Fecha de pago', type: 'date' },
            { name: 'paid_by', label: '¿Quién ha pagado?', type: 'select', options: LABELS.payer, empty: 'Elige…' },
        ],
        validate(v) {
            const e = {};
            if (v.status === 'pagado' && !v.paid_on) e.paid_on = 'Indica la fecha de pago';
            if (v.status === 'pagado' && !v.paid_by) e.paid_by = 'Indica quién ha pagado';
            return e;
        },
        async onSubmit(v) {
            await rpc('register_recurring_expense', { p_template: t.id, p_date: v.expense_date, p_status: v.status, p_paid_on: v.status === 'pagado' ? v.paid_on : null, p_paid_by: v.status === 'pagado' ? v.paid_by : null });
            await store.refresh();
            toast('Periodo registrado.');
        },
    });
}

export function openExpenseForm(existing = null) {
    const data = store.data;
    const s = data.settings;
    const today = todayISO();
    const v = existing
        ? { ...existing, frequency: existing.recurrence_months ? 'recurrente' : 'puntual', recurrence_months: existing.recurrence_months ?? 1 }
        : { expense_date: today, status: 'pagado', paid_on: today, category: 'otros', frequency: 'puntual', recurrence_months: 1, alloc_mode: s.default_alloc_mode, alloc_ruben_bp: s.default_alloc_ruben_bp };
    const isChild = Boolean(existing?.recurring_parent_id);
    const newId = crypto.randomUUID();
    formDialog({
        title: existing ? 'Editar gasto' : 'Nuevo gasto',
        values: v,
        fields: [
            { name: 'concept', label: 'Concepto', required: true, full: true },
            { name: 'category', label: 'Categoría', type: 'select', options: LABELS.expense_category, required: true },
            { name: 'amount_cents', label: 'Importe total (€)', type: 'money', required: true, positive: true },
            { name: 'expense_date', label: 'Fecha del gasto', type: 'date', required: true },
            { name: 'status', label: 'Estado', type: 'select', options: LABELS.expense_status, required: true },
            { name: 'paid_on', label: 'Fecha de pago', type: 'date' },
            { name: 'paid_by', label: '¿Quién ha adelantado el dinero?', type: 'select', options: LABELS.payer, empty: 'Elige…', help: 'Persona o cuenta que ha pagado materialmente' },
            ...(isChild ? [] : [
                { name: 'frequency', label: 'Frecuencia', type: 'select', options: { puntual: 'Puntual', recurrente: 'Recurrente' }, required: true },
                { name: 'recurrence_months', label: 'Se repite', type: 'select', options: LABELS.period_months },
                { name: 'recurrence_end', label: 'Hasta (opcional)', type: 'date' },
                { name: 'recurrence_active', label: 'Recurrencia activa (se incluye en la previsión)', type: 'checkbox' },
            ]),
            { name: 'supplier', label: 'Proveedor (opcional)' },
            { name: 'client_id', label: 'Cliente asociado (opcional)', type: 'select', optionsHtml: clientOptions(data, v.client_id, { empty: 'Sin cliente' }) },
            { name: 'project_id', label: 'Proyecto asociado (opcional)', type: 'select', optionsHtml: projectOptions(data, v.client_id, v.project_id) },
            { name: 'alloc', type: 'alloc', amountField: 'amount_cents', label: '¿A quién corresponde asumir el gasto?', help: 'Independiente de quién lo haya pagado. Ej.: Rubén paga 20 € de hosting que se reparte al 50 %.' },
            { name: 'notes', label: 'Notas', type: 'textarea', full: true },
        ],
        validate(values) {
            const e = {};
            if (values.status === 'pagado' && !values.paid_on) e.paid_on = 'Indica la fecha de pago';
            if (values.status === 'pagado' && !values.paid_by) e.paid_by = 'Indica quién ha pagado';
            if (values.frequency === 'recurrente' && values.recurrence_end && values.recurrence_end < values.expense_date) e.recurrence_end = 'No puede ser anterior a la fecha del gasto';
            return e;
        },
        onChange(name, api) {
            const toggle = () => {
                const paid = api.get('status') === 'pagado';
                for (const f of ['paid_on', 'paid_by']) api.dlg.querySelector(`[data-field="${f}"]`).hidden = !paid;
                const rec = api.get('frequency') === 'recurrente';
                for (const f of ['recurrence_months', 'recurrence_end', 'recurrence_active']) {
                    const box = api.dlg.querySelector(`[data-field="${f}"]`);
                    if (box) box.hidden = !rec;
                }
            };
            if (name === '__init') {
                if (!existing && api.form.elements.recurrence_active) api.form.elements.recurrence_active.checked = true;
                toggle();
            }
            if (name === 'status' || name === 'frequency') toggle();
            if (name === 'status' && api.get('status') === 'pagado' && !api.get('paid_on')) api.set('paid_on', today);
            if (name === 'client_id') api.setOptions('project_id', projectOptions(data, api.get('client_id'), api.get('project_id')));
        },
        async onSubmit(values) {
            const row = {
                concept: values.concept, category: values.category, amount_cents: values.amount_cents,
                expense_date: values.expense_date, status: values.status,
                paid_on: values.status === 'pagado' ? values.paid_on : null,
                paid_by: values.status === 'pagado' ? values.paid_by : (values.paid_by || null),
                supplier: values.supplier, client_id: values.client_id || null, project_id: values.project_id || null,
                alloc_mode: values.alloc_mode, alloc_ruben_bp: values.alloc_ruben_bp, ruben_cents: values.ruben_cents, ines_cents: values.ines_cents,
                notes: values.notes,
            };
            if (!isChild) {
                const rec = values.frequency === 'recurrente';
                row.recurrence_months = rec ? Number(values.recurrence_months) : null;
                row.recurrence_end = rec ? values.recurrence_end : null;
                row.recurrence_active = rec ? values.recurrence_active : true;
            }
            if (!existing) {
                const dup = data.expenses.find((x) => x.concept.trim().toLowerCase() === row.concept.trim().toLowerCase() && x.amount_cents === row.amount_cents && x.expense_date === row.expense_date);
                if (dup) {
                    const go = await confirmDialog({ title: '¿Gasto duplicado?', message: `Ya existe «${dup.concept}» de ${formatEuros(dup.amount_cents)} con fecha ${formatDate(dup.expense_date)}. ¿Registrar otro igualmente?`, confirmLabel: 'Registrar otro' });
                    if (!go) return false;
                }
            }
            await save('expenses', existing ? row : { id: newId, ...row }, existing);
            await store.refresh();
            toast(existing ? 'Gasto actualizado.' : 'Gasto registrado.');
        },
    });
}

