// Piezas compartidas por varias vistas: selector de periodo y utilidades.

import { html, raw, $ } from '../ui.js';
import { todayISO, monthStart, monthEnd, yearStart, yearEnd, addPeriod, addDays, formatDate, isValidISO, monthLabel, monthKey } from '../lib/dates.js';

export const PRESETS = {
    mes: 'Mes actual',
    mes_anterior: 'Mes anterior',
    mes_siguiente: 'Mes siguiente',
    anio: 'Año actual',
    doce: 'Próximos 12 meses',
    ultimos_doce: 'Últimos 12 meses',
    mes_concreto: 'Mes concreto',
    anio_concreto: 'Año concreto',
    rango: 'Rango personalizado',
};

export function periodState(preset = 'mes') {
    const t = todayISO();
    return { preset, month: monthKey(t), year: t.slice(0, 4), from: monthStart(t), to: monthEnd(t) };
}

export function resolvePeriod(s, today = todayISO()) {
    switch (s.preset) {
        case 'mes': return [monthStart(today), monthEnd(today)];
        case 'mes_anterior': { const d = addPeriod(monthStart(today), -1, 1); return [d, monthEnd(d)]; }
        case 'mes_siguiente': { const d = addPeriod(monthStart(today), 1, 1); return [d, monthEnd(d)]; }
        case 'anio': return [yearStart(today), yearEnd(today)];
        case 'doce': return [today, addDays(addPeriod(today, 12, Number(today.slice(8))), -1)];
        case 'ultimos_doce': return [addPeriod(monthStart(today), -11, 1), monthEnd(today)];
        case 'mes_concreto': return [`${s.month}-01`, monthEnd(`${s.month}-01`)];
        case 'anio_concreto': return [`${s.year}-01-01`, `${s.year}-12-31`];
        default: {
            const from = isValidISO(s.from ?? '') ? s.from : monthStart(today);
            const to = isValidISO(s.to ?? '') && s.to >= from ? s.to : monthEnd(from);
            return [from, to];
        }
    }
}

export function periodLabel(from, to) {
    if (from.slice(0, 7) === to.slice(0, 7) && from.endsWith('-01') && to === monthEnd(from)) {
        const l = monthLabel(monthKey(from), true);
        return l[0].toUpperCase() + l.slice(1);
    }
    if (from.endsWith('-01-01') && to === `${from.slice(0, 4)}-12-31`) return `Año ${from.slice(0, 4)}`;
    return `${formatDate(from)} – ${formatDate(to)}`;
}

export function periodFilter(s, presets = Object.keys(PRESETS)) {
    const years = [];
    const y = Number(todayISO().slice(0, 4));
    for (let i = y + 1; i >= y - 6; i--) years.push(String(i));
    return html`<label class="field"><span>Periodo</span><select name="preset">
            ${presets.map((k) => html`<option value="${k}" ${s.preset === k ? raw('selected') : ''}>${PRESETS[k]}</option>`)}
        </select></label>
        ${s.preset === 'mes_concreto' ? html`<label class="field"><span>Mes</span><input type="month" name="month" value="${s.month}"></label>` : ''}
        ${s.preset === 'anio_concreto' ? html`<label class="field"><span>Año</span><select name="year">${years.map((v) => html`<option ${v === s.year ? raw('selected') : ''}>${v}</option>`)}</select></label>` : ''}
        ${s.preset === 'rango' ? html`<label class="field"><span>Desde</span><input type="date" name="from" value="${s.from}"></label>
            <label class="field"><span>Hasta</span><input type="date" name="to" value="${s.to}"></label>` : ''}`;
}

// Enlaza los controles de filtro de un contenedor con un objeto de estado.
export function bindFilters(root, state, rerender) {
    root.addEventListener('change', (e) => {
        const t = e.target;
        if (!t.name || !(t.name in state)) return;
        state[t.name] = t.type === 'checkbox' ? t.checked : t.value;
        rerender();
    });
    root.addEventListener('input', (e) => {
        const t = e.target;
        if (t.type !== 'search' || !(t.name in state)) return;
        state[t.name] = t.value;
        clearTimeout(t._deb);
        t._deb = setTimeout(() => {
            rerender();
            const again = $(`[name="${t.name}"]`, root.ownerDocument);
            if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
        }, 250);
    });
}

export function clientName(data, id) {
    return data.byId.clients.get(id)?.name ?? '—';
}

export function projectName(data, id) {
    return id ? (data.byId.projects.get(id)?.name ?? '—') : '—';
}

export function userName(data, id) {
    if (!id) return '—';
    const p = data.byId.profiles.get(id);
    return p ? (p.display_name || p.partner) : 'Otro usuario';
}

export function clientOptions(data, selected, { includeArchived = false, empty = 'Elige un cliente…' } = {}) {
    const list = data.clients
        .filter((c) => includeArchived || !c.archived_at || c.id === selected)
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return html`<option value="">${empty}</option>${list.map((c) =>
        html`<option value="${c.id}" ${c.id === selected ? raw('selected') : ''}>${c.name}${c.archived_at ? ' (archivado)' : ''}</option>`)}`;
}

export function projectOptions(data, clientId, selected, { empty = 'Sin proyecto' } = {}) {
    const list = data.projects
        .filter((p) => (!clientId || p.client_id === clientId) && (p.status !== 'archivado' || p.id === selected))
        .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return html`<option value="">${empty}</option>${list.map((p) =>
        html`<option value="${p.id}" ${p.id === selected ? raw('selected') : ''}>${p.name}${clientId ? '' : ` · ${clientName(data, p.client_id)}`}</option>`)}`;
}

export function sortBy(list, key, dir = 'asc') {
    const m = dir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => {
        const x = a[key] ?? '';
        const y = b[key] ?? '';
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')) * m;
    });
}
