// Formularios en diálogo a partir de una lista de campos.
//
// Tipos de campo: text, email, tel, textarea, select, date, number, money,
// checkbox, choice (botones de opción), html.
// Los importes se leen y devuelven en céntimos; las fechas en ISO.

import { html, raw, openDialog, toast, options, $, $$ } from './ui.js';
import { parseEuros, centsToInput } from './lib/money.js';
import { friendlyError, AppError } from './api.js';

let seq = 0;

function fieldHtml(f, v) {
    const id = `f${++seq}-${f.name}`;
    const req = f.required ? raw('required') : '';
    const cls = `field ${f.full ? 'full' : ''}`;
    const label = html`<label for="${id}">${f.label}${f.required ? ' *' : ''}</label>`;
    // Ayuda y error se enlazan al control para no mezclarse con su nombre.
    const describedBy = raw(`aria-describedby="${id}-help ${id}-err"`);
    const help = f.help ? html`<small class="help" id="${id}-help">${f.help}</small>` : '';
    const err = html`<small class="error" id="${id}-err" data-error="${f.name}" hidden></small>`;
    switch (f.type) {
        case 'html':
            return html`<div class="${cls}" data-field="${f.name}">${f.html}</div>`;
        case 'textarea':
            return html`<div class="${cls}" data-field="${f.name}">${label}<textarea id="${id}" name="${f.name}" ${req} ${describedBy} maxlength="5000">${v ?? ''}</textarea>${help}${err}</div>`;
        case 'select':
            return html`<div class="${cls}" data-field="${f.name}">${label}<select id="${id}" name="${f.name}" ${req} ${describedBy}>${f.optionsHtml ?? options(f.options, v, { empty: f.empty })}</select>${help}${err}</div>`;
        case 'checkbox':
            return html`<div class="${cls}" data-field="${f.name}"><label class="check"><input type="checkbox" name="${f.name}" ${describedBy} ${v ? raw('checked') : ''}> ${f.label}</label>${help}${err}</div>`;
        case 'choice':
            return html`<fieldset class="${cls}" data-field="${f.name}"><legend>${f.label}</legend><div class="choice">${Object.entries(f.options).map(([k, l]) =>
                html`<label><input type="radio" name="${f.name}" value="${k}" ${String(v) === k ? raw('checked') : ''}><span>${l}</span></label>`)}</div>${help}${err}</fieldset>`;
        case 'money':
            return html`<div class="${cls}" data-field="${f.name}">${label}<input id="${id}" name="${f.name}" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${centsToInput(v)}" ${req} ${describedBy}>${help}${err}</div>`;
        default:
            return html`<div class="${cls}" data-field="${f.name}">${label}<input id="${id}" name="${f.name}" type="${f.type ?? 'text'}" value="${v ?? ''}" ${req} ${describedBy}
                ${f.min !== undefined ? raw(`min="${Number(f.min)}"`) : ''} ${f.max !== undefined ? raw(`max="${Number(f.max)}"`) : ''}
                ${f.type === 'number' ? raw('inputmode="numeric"') : ''}
                ${f.maxlength ? raw(`maxlength="${Number(f.maxlength)}"`) : raw('maxlength="300"')} ${f.autocomplete ? raw(`autocomplete="${f.autocomplete}"`) : ''}>${help}${err}</div>`;
    }
}

function readValues(form, fields) {
    const values = {};
    const errors = {};
    const fd = new FormData(form);
    for (const f of fields) {
        if (f.type === 'html') continue;
        if ($(`[data-field="${f.name}"]`, form)?.hidden) { values[f.name] = null; continue; } // no aplica
        const rawv = fd.get(f.name);
        let v;
        if (f.type === 'checkbox') {
            v = form.elements[f.name].checked;
        } else if (f.type === 'money') {
            v = String(rawv ?? '').trim() === '' ? null : parseEuros(rawv);
            if (v === null && String(rawv ?? '').trim() !== '') errors[f.name] = 'Importe no válido. Ejemplo: 50 o 1250,50';
            else if (v !== null && v <= 0) errors[f.name] = 'El importe debe ser mayor que cero';
        } else {
            v = f.type === 'password' ? String(rawv ?? '') : String(rawv ?? '').trim();
            if (v === '') v = null;
        }
        if (f.required && (v === null || v === '')) errors[f.name] ??= 'Campo obligatorio';
        values[f.name] = v;
    }
    return { values, errors };
}

function showErrors(form, errors) {
    for (const el of $$('[data-error]', form)) { el.hidden = true; el.closest('.field')?.classList.remove('invalid'); }
    for (const [name, msg] of Object.entries(errors)) {
        const el = $(`[data-error="${name}"]`, form);
        if (el) { el.textContent = msg; el.hidden = false; el.closest('.field')?.classList.add('invalid'); }
    }
    const first = Object.keys(errors)[0];
    if (first) $(`[data-field="${first}"] :is(input, select, textarea)`, form)?.focus();
}

// Abre un formulario. onSubmit(values) debe guardar y puede lanzar errores;
// el diálogo solo se cierra cuando el servidor ha confirmado el guardado.
// onChange(nombre, api) se llama al cambiar un campo y una vez al abrir ('__init').
export function formDialog({ title, intro, fields, values = {}, submitLabel = 'Guardar', validate, onSubmit, onChange, danger }) {
    const dlg = openDialog(html`<form novalidate>
        <div class="dlg-head"><h2>${title}</h2><button type="button" class="icon-btn" data-close aria-label="Cerrar">✕</button></div>
        <div class="dlg-body">
            ${intro ? html`<div class="notice">${intro}</div>` : ''}
            <div class="notice bad" data-form-error role="alert" hidden></div>
            <div class="form-grid">${fields.map((f) => fieldHtml(f, values[f.name]))}</div>
        </div>
        <div class="dlg-foot">
            <button type="button" class="btn" data-close>Cancelar</button>
            <button type="submit" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-online>${submitLabel}</button>
        </div>
    </form>`);
    const form = $('form', dlg);
    const formError = $('[data-form-error]', form);
    syncOnline(dlg);

    const api = {
        dlg,
        form,
        get: (name) => readValues(form, fields).values[name],
        show(name, visible) {
            const box = $(`[data-field="${name}"]`, form);
            if (box) box.hidden = !visible;
        },
        close: () => dlg.close(),
    };
    const changed = (e) => { if (e.target.name && onChange) onChange(e.target.name, api); };
    form.addEventListener('input', changed);
    form.addEventListener('change', changed);

    let busy = false;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (busy) return;
        formError.hidden = true;
        const { values: v, errors } = readValues(form, fields);
        Object.assign(errors, validate?.(v, api) ?? {});
        if (Object.keys(errors).length) {
            showErrors(form, errors);
            formError.textContent = 'Revisa los campos marcados.';
            formError.hidden = false;
            return;
        }
        showErrors(form, {});
        const btn = $('button[type="submit"]', form);
        busy = true;
        btn.disabled = true;
        const label = btn.textContent;
        btn.textContent = 'Guardando…';
        try {
            const result = await onSubmit(v, api);
            if (result !== false) dlg.close();
        } catch (err) {
            formError.textContent = friendlyError(err);
            formError.hidden = false;
            formError.scrollIntoView({ block: 'nearest' });
            if (!(err instanceof AppError)) console.error(err);
        } finally {
            busy = false;
            btn.disabled = !navigator.onLine;
            btn.textContent = label;
        }
    });
    if (onChange) onChange('__init', api);
    return api;
}

// Desactiva los botones que necesitan conexión.
export function syncOnline(root = document) {
    for (const b of $$('[data-online]', root)) b.disabled = !navigator.onLine;
}

export async function withToast(fn, okMessage) {
    try {
        const r = await fn();
        if (okMessage) toast(okMessage);
        return r;
    } catch (err) {
        toast(friendlyError(err), 'error');
        if (!(err instanceof AppError)) console.error(err);
        return undefined;
    }
}
