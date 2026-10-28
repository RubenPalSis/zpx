// Utilidades de interfaz. Todo el HTML se construye con la plantilla `html`,
// que escapa cualquier valor interpolado: los datos de clientes nunca se
// insertan como HTML.

import { formatEuros } from './lib/money.js';
import { formatDate } from './lib/dates.js';

class Safe {
    constructor(s) { this.s = s; }
    toString() { return this.s; }
}

export function raw(s) {
    return new Safe(String(s));
}

function esc(v) {
    if (v instanceof Safe) return v.s;
    if (Array.isArray(v)) return v.map(esc).join('');
    if (v === null || v === undefined || v === false) return '';
    return String(v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) out += esc(values[i]) + strings[i + 1];
    return new Safe(out);
}

export function paint(el, content) {
    el.innerHTML = String(content);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---------- Formato ----------
export const eur = (c) => raw(`<span class="num">${esc(formatEuros(c))}</span>`);
export const date = (d) => formatDate(d);

export const FOR_WHOM = { ambos: 'Ambos', ruben: 'Rubén', ines: 'Inés' };

export function options(map, selected, { empty } = {}) {
    const list = Object.entries(map);
    return html`${empty !== undefined ? html`<option value="">${empty}</option>` : ''}${list.map(([v, l]) =>
        html`<option value="${v}" ${String(selected ?? '') === String(v) ? raw('selected') : ''}>${l}</option>`)}`;
}

export function stat(label, value, { hint, tone, href } = {}) {
    const body = html`<div class="label">${label}</div><div class="value">${value}</div>${hint ? html`<div class="hint">${hint}</div>` : ''}`;
    return html`<div class="stat ${tone ? `is-${tone}` : ''}">${href ? html`<a href="${href}">${body}</a>` : body}</div>`;
}

export function emptyState(text, actions = '') {
    return html`<div class="empty"><p>${text}</p>${actions ? html`<div class="actions">${actions}</div>` : ''}</div>`;
}

// ---------- Avisos ----------
export function toast(message, type = 'ok') {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast ${type === 'error' ? 'error' : ''}`;
    el.textContent = message;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    box.append(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => el.remove(), type === 'error' ? 7000 : 3500);
}

// ---------- Diálogos ----------
// Abre un <dialog> con el contenido dado. Devuelve el elemento.
export function openDialog(content, { small = false } = {}) {
    const dlg = document.createElement('dialog');
    if (small) dlg.classList.add('small');
    dlg.innerHTML = String(content);
    document.body.append(dlg);
    dlg.addEventListener('close', () => dlg.remove());
    dlg.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) dlg.close();
    });
    dlg.showModal();
    return dlg;
}

// Confirmación dentro de la página. Resuelve true/false.
export function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
    return new Promise((resolve) => {
        const dlg = openDialog(html`<form method="dialog">
            <div class="dlg-head"><h2>${title}</h2></div>
            <div class="dlg-body"><p class="m0">${message}</p></div>
            <div class="dlg-foot">
                <button class="btn" value="no" data-close>Cancelar</button>
                <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="yes">${confirmLabel}</button>
            </div></form>`, { small: true });
        dlg.addEventListener('close', () => resolve(dlg.returnValue === 'yes'));
    });
}

// ---------- Utilidades varias ----------
export function debounce(fn, ms = 200) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function norm(s) {
    return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
