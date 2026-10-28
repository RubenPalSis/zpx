// Formularios en diálogo a partir de una lista de campos.
//
// Tipos de campo: text, email, tel, textarea, select, date, money, pct,
// checkbox, checks (varias opciones), alloc (reparto Rubén/Inés), html.
// Los importes se leen y devuelven en céntimos; las fechas en ISO.

import { html, raw, openDialog, toast, options, $, $$ } from './ui.js';
import { parseEuros, centsToInput, parsePct, bpToInput, formatEuros, formatPct } from './lib/money.js';
import { resolveAlloc, ALLOC_MODES } from './lib/alloc.js';
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
        case 'checks':
            return html`<fieldset class="${cls}" data-field="${f.name}"><legend>${f.label}</legend><div class="checks">${Object.entries(f.options).map(([k, l]) =>
                html`<label><input type="checkbox" name="${f.name}" value="${k}" ${(v ?? []).includes(k) ? raw('checked') : ''}> ${l}</label>`)}</div>${help}${err}</fieldset>`;
        case 'money':
            return html`<div class="${cls}" data-field="${f.name}">${label}<input id="${id}" name="${f.name}" type="text" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${centsToInput(v)}" ${req} ${describedBy}>${help}${err}</div>`;
        case 'pct':
            return html`<div class="${cls}" data-field="${f.name}">${label}<input id="${id}" name="${f.name}" type="text" inputmode="decimal" autocomplete="off" value="${bpToInput(v)}" ${req} ${describedBy}>${help}${err}</div>`;
        case 'alloc':
            return allocHtml(f, v ?? {});
        default:
            return html`<div class="${cls}" data-field="${f.name}">${label}<input id="${id}" name="${f.name}" type="${f.type ?? 'text'}" value="${v ?? ''}" ${req} ${describedBy}
                ${f.maxlength ? raw(`maxlength="${Number(f.maxlength)}"`) : raw('maxlength="300"')} ${f.autocomplete ? raw(`autocomplete="${f.autocomplete}"`) : ''}>${help}${err}</div>`;
    }
}

// ---------- Reparto entre socios ----------
function allocHtml(f, v) {
    const mode = v.alloc_mode ?? 'pct';
    const bp = v.alloc_ruben_bp ?? 5000;
    return html`<fieldset class="field full" data-field="${f.name}" data-alloc data-amount-field="${f.amountField}">
        <legend>${f.label ?? 'Reparto entre Rubén e Inés'} *</legend>
        <div class="alloc">
            <div class="modes" role="radiogroup">
                ${Object.entries(ALLOC_MODES).map(([k, l]) => html`<label><input type="radio" name="${f.name}__mode" value="${k}" ${k === mode ? raw('checked') : ''}> ${l}</label>`)}
            </div>
            <div class="inputs" data-alloc-pct ${mode === 'pct' ? '' : raw('hidden')}>
                <label class="field"><span>% para Rubén</span><input name="${f.name}__bp" type="text" inputmode="decimal" value="${bpToInput(bp)}"></label>
                <label class="field"><span>% para Inés</span><input data-alloc-ines-pct type="text" value="${bpToInput(10000 - bp)}" readonly tabindex="-1"></label>
            </div>
            <div class="inputs" data-alloc-fixed ${mode === 'fixed' ? '' : raw('hidden')}>
                <label class="field"><span>Importe para Rubén</span><input name="${f.name}__ruben" type="text" inputmode="decimal" placeholder="0,00" value="${centsToInput(v.ruben_cents)}"></label>
                <label class="field"><span>Importe para Inés</span><input name="${f.name}__ines" type="text" inputmode="decimal" placeholder="0,00" value="${centsToInput(v.ines_cents)}"></label>
            </div>
            <div class="preview" data-alloc-preview aria-live="polite"></div>
        </div>
        ${f.help ? html`<small class="help">${f.help}</small>` : ''}
    </fieldset>`;
}

function readAlloc(form, name, amount) {
    const fd = new FormData(form);
    const mode = fd.get(`${name}__mode`);
    const bp = parsePct(fd.get(`${name}__bp`));
    const r = parseEuros(fd.get(`${name}__ruben`));
    const i = parseEuros(fd.get(`${name}__ines`));
    if (amount === null || amount === undefined) return { ok: false, error: 'Indica primero el importe total', mode };
    const res = resolveAlloc(amount, mode, bp, r, i);
    return { ...res, mode, values: res.ok ? { alloc_mode: mode, alloc_ruben_bp: res.bp, ruben_cents: res.ruben, ines_cents: res.ines } : null };
}

function updateAlloc(form, box) {
    const name = box.dataset.field;
    const amountField = box.dataset.amountField;
    const amount = parseEuros(form.elements[amountField]?.value);
    const mode = new FormData(form).get(`${name}__mode`);
    $('[data-alloc-pct]', box).hidden = mode !== 'pct';
    $('[data-alloc-fixed]', box).hidden = mode !== 'fixed';
    const bp = parsePct(form.elements[`${name}__bp`].value);
    $('[data-alloc-ines-pct]', box).value = bp === null ? '' : bpToInput(10000 - bp);
    const res = readAlloc(form, name, amount);
    const preview = $('[data-alloc-preview]', box);
    preview.classList.toggle('error', !res.ok && amount !== null);
    if (amount === null) {
        preview.textContent = 'El reparto se calculará cuando indiques el importe.';
    } else if (!res.ok) {
        const diff = mode === 'fixed' ? (parseEuros(form.elements[`${name}__ruben`].value) ?? 0) + (parseEuros(form.elements[`${name}__ines`].value) ?? 0) - amount : 0;
        preview.textContent = res.error + (mode === 'fixed' && diff ? ` (diferencia: ${formatEuros(diff)})` : '');
    } else {
        preview.textContent = `Rubén: ${formatEuros(res.ruben)} · Inés: ${formatEuros(res.ines)}`
            + (mode === 'pct' ? ` (${formatPct(res.bp)} / ${formatPct(10000 - res.bp)})` : '');
    }
}

// Establece el reparto mostrado (p. ej. heredado del proyecto).
export function setAlloc(form, name, v) {
    const box = $(`[data-field="${name}"][data-alloc]`, form);
    if (!box || !v) return;
    for (const r of $$(`input[name="${name}__mode"]`, box)) r.checked = r.value === v.alloc_mode;
    if (v.alloc_mode === 'pct') form.elements[`${name}__bp`].value = bpToInput(v.alloc_ruben_bp);
    if (v.alloc_mode === 'fixed') {
        form.elements[`${name}__ruben`].value = centsToInput(v.ruben_cents);
        form.elements[`${name}__ines`].value = centsToInput(v.ines_cents);
    }
    updateAlloc(form, box);
}

// ---------- Lectura y validación ----------
function readValues(form, fields) {
    const values = {};
    const errors = {};
    const fd = new FormData(form);
    for (const f of fields) {
        if (f.type === 'html' || f.type === 'alloc') continue;
        const rawv = f.type === 'checks' ? fd.getAll(f.name) : fd.get(f.name);
        let v;
        switch (f.type) {
            case 'checkbox': v = form.elements[f.name].checked; break;
            case 'checks': v = rawv; break;
            case 'money':
                v = String(rawv ?? '').trim() === '' ? null : parseEuros(rawv);
                if (v === null && String(rawv ?? '').trim() !== '') errors[f.name] = 'Importe no válido. Ejemplo: 1250,50';
                else if (v !== null && v < 0) errors[f.name] = 'El importe no puede ser negativo';
                else if (v !== null && f.positive && v <= 0) errors[f.name] = 'El importe debe ser mayor que cero';
                break;
            case 'pct':
                v = String(rawv ?? '').trim() === '' ? null : parsePct(rawv);
                if (v === null && String(rawv ?? '').trim() !== '') errors[f.name] = 'Porcentaje entre 0 y 100';
                break;
            default:
                v = f.type === 'password' ? String(rawv ?? '') : String(rawv ?? '').trim();
                if (v === '') v = null;
        }
        if (f.required && (v === null || v === '' || (Array.isArray(v) && !v.length))) errors[f.name] ??= 'Campo obligatorio';
        values[f.name] = v;
    }
    for (const f of fields.filter((x) => x.type === 'alloc')) {
        const res = readAlloc(form, f.name, values[f.amountField]);
        if (!res.ok) errors[f.name] = res.error;
        else Object.assign(values, res.values);
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
    if (first) {
        const target = form.elements[first] ?? $(`[data-field="${first}"]`, form);
        (target?.focus ? target : $(`[data-field="${first}"] input`, form))?.focus?.();
    }
}

// Abre un formulario. onSubmit(values) debe guardar y puede lanzar errores;
// el diálogo solo se cierra cuando el servidor ha confirmado el guardado.
export function formDialog({ title, intro, fields, values = {}, submitLabel = 'Guardar', validate, onSubmit, onChange, danger }) {
    const dlg = openDialog(html`<form novalidate>
        <div class="dlg-head"><h2>${title}</h2><button type="button" class="icon-btn" data-close aria-label="Cerrar">✕</button></div>
        <div class="dlg-body">
            ${intro ? html`<div class="notice">${intro}</div>` : ''}
            <div class="notice bad" data-form-error role="alert" hidden></div>
            <div class="form-grid">${fields.map((f) => fieldHtml(f, f.type === 'alloc' ? values : values[f.name]))}</div>
        </div>
        <div class="dlg-foot">
            <button type="button" class="btn" data-close>Cancelar</button>
            <button type="submit" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-online>${submitLabel}</button>
        </div>
    </form>`);
    const form = $('form', dlg);
    const formError = $('[data-form-error]', form);
    const allocBoxes = $$('[data-alloc]', form);
    const refreshAlloc = () => allocBoxes.forEach((b) => updateAlloc(form, b));
    refreshAlloc();
    syncOnline(dlg);

    form.addEventListener('input', (e) => {
        if (allocBoxes.length) refreshAlloc();
        const name = e.target.name;
        if (name && onChange && !name.includes('__')) onChange(name, api);
    });
    form.addEventListener('change', (e) => {
        if (allocBoxes.length) refreshAlloc();
        const name = e.target.name;
        if (name && onChange && (e.target.tagName === 'SELECT' || e.target.type === 'checkbox' || e.target.type === 'date') && !name.includes('__')) onChange(name, api);
    });

    const api = {
        dlg,
        form,
        get: (name) => readValues(form, fields).values[name],
        values: () => readValues(form, fields).values,
        set(name, value) {
            const el = form.elements[name];
            if (!el) return;
            const f = fields.find((x) => x.name === name);
            el.value = f?.type === 'money' ? centsToInput(value) : (value ?? '');
            refreshAlloc();
        },
        setOptions(name, optionsHtml) {
            const el = form.elements[name];
            const cur = el.value;
            el.innerHTML = String(optionsHtml);
            if ([...el.options].some((o) => o.value === cur)) el.value = cur;
        },
        setAlloc: (name, v) => setAlloc(form, name, v),
        refreshAlloc,
        close: () => dlg.close(),
    };

    let busy = false;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (busy) return;
        formError.hidden = true;
        const { values: v, errors } = readValues(form, fields);
        Object.assign(errors, validate?.(v, api) ?? {});
        if (Object.keys(errors).length) {
            showErrors(form, errors);
            const allocErr = fields.filter((f) => f.type === 'alloc' && errors[f.name]).map((f) => errors[f.name]);
            formError.textContent = allocErr.length ? `Reparto: ${allocErr[0]}` : 'Revisa los campos marcados.';
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
    if (onChange) queueMicrotask(() => onChange('__init', api));
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
