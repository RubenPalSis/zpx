// Acceso a Supabase. La base de datos es la única fuente de verdad: aquí no
// se guarda nada en el navegador salvo la sesión que gestiona supabase-js.

import { enrichObligations } from './lib/finance.js';
import { todayISO } from './lib/dates.js';

const cfg = window.ZW_CONFIG ?? {};
export const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);

export const sb = configured
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'zw-admin-auth' },
    })
    : null;

// ---------- Errores ----------
export class AppError extends Error {}

export function friendlyError(err) {
    if (!err) return 'Error desconocido';
    if (err instanceof AppError) return err.message;
    if (!navigator.onLine) return 'No hay conexión. La operación no se ha guardado.';
    const msg = err.message ?? String(err);
    switch (err.code) {
        case '23505': return 'Este registro ya existía (posible envío duplicado). No se ha creado otra vez.';
        case '23503': return 'No se puede completar: hay otros registros relacionados.';
        case '23514': return 'Los datos no cumplen las reglas (importes, fechas o reparto incoherentes).';
        case '42501': return 'No tienes permiso para esta operación.';
        case 'PGRST301': case 'PGRST303': return 'La sesión ha caducado. Vuelve a iniciar sesión.';
        default: break;
    }
    if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'No se ha podido conectar con el servidor. La operación no se ha guardado.';
    if (/Invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
    if (/Email not confirmed/i.test(msg)) return 'El correo de esta cuenta no está confirmado.';
    if (/rate limit|too many/i.test(msg)) return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
    if (/should be at least|weak password/i.test(msg)) return 'La contraseña es demasiado corta o débil (mínimo 10 caracteres).';
    if (/same.*password|different from the old/i.test(msg)) return 'La nueva contraseña debe ser distinta de la anterior.';
    return msg; // Los errores de las reglas de la base de datos ya vienen en español.
}

function check({ data, error }) {
    if (error) throw error;
    return data;
}

function requireOnline() {
    if (!navigator.onLine) throw new AppError('No hay conexión. Conéctate a internet para guardar cambios.');
}

// ---------- Sesión ----------
export async function currentProfile() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (error) throw error;
    return { user: session.user, profile: data };
}

// ---------- Datos ----------
const TABLES = {
    clients: 'clients',
    projects: 'projects',
    obligations: 'payment_obligations',
    payments: 'payments',
    recurring: 'recurring_services',
    expenses: 'expenses',
    profiles: 'profiles',
    settings: 'settings',
};

// Supabase devuelve como máximo 1000 filas por petición: se pagina.
async function fetchAll(table) {
    const page = 1000;
    let from = 0;
    const out = [];
    for (;;) {
        const rows = check(await sb.from(table).select('*').order('id').range(from, from + page - 1));
        out.push(...rows);
        if (rows.length < page) return out;
        from += page;
    }
}

const NUMERIC = ['price_cents', 'amount_cents', 'ruben_cents', 'ines_cents', 'alloc_ruben_bp', 'period_months', 'recurrence_months', 'default_alloc_ruben_bp'];
function normalize(row) {
    for (const k of NUMERIC) if (row[k] !== null && row[k] !== undefined) row[k] = Number(row[k]);
    return row;
}

export const store = {
    data: null,
    loadedAt: 0,
    listeners: new Set(),

    async load() {
        const entries = await Promise.all(Object.entries(TABLES).map(async ([key, table]) => [key, (await fetchAll(table)).map(normalize)]));
        const d = Object.fromEntries(entries);
        d.settings = d.settings[0] ?? { default_alloc_mode: 'pct', default_alloc_ruben_bp: 5000 };
        d.obligations = enrichObligations(d.obligations, d.payments, todayISO());
        d.byId = {
            clients: new Map(d.clients.map((x) => [x.id, x])),
            projects: new Map(d.projects.map((x) => [x.id, x])),
            obligations: new Map(d.obligations.map((x) => [x.id, x])),
            recurring: new Map(d.recurring.map((x) => [x.id, x])),
            expenses: new Map(d.expenses.map((x) => [x.id, x])),
            profiles: new Map(d.profiles.map((x) => [x.id, x])),
        };
        this.data = d;
        this.loadedAt = Date.now();
        return d;
    },

    async ensure() {
        return this.data ?? this.load();
    },

    async refresh() {
        await this.load();
        for (const fn of this.listeners) fn();
    },

    clear() {
        this.data = null;
    },
};

// Inserta (si la fila es nueva) o actualiza comprobando que nadie la ha
// modificado entretanto. `original` es la fila tal como se cargó.
export async function save(key, values, original) {
    requireOnline();
    const table = TABLES[key];
    if (!original) {
        return normalize(check(await sb.from(table).insert(values).select().single()));
    }
    const rows = check(await sb.from(table).update(values).eq('id', original.id).eq('updated_at', original.updated_at).select());
    if (!rows.length) {
        store.refresh().catch(() => {});
        throw new AppError('Otra persona ha modificado este registro mientras lo editabas. No se ha guardado nada: cierra el formulario y vuelve a abrirlo para ver los datos actuales.');
    }
    return normalize(rows[0]);
}

export async function remove(key, id) {
    requireOnline();
    const rows = check(await sb.from(TABLES[key]).delete().eq('id', id).select('id'));
    if (!rows.length) throw new AppError('No se ha podido eliminar el registro.');
}

export async function rpc(name, args) {
    requireOnline();
    return check(await sb.rpc(name, args));
}

export async function updateSettings(values) {
    requireOnline();
    return check(await sb.from('settings').update({ ...values, updated_at: new Date().toISOString() }).eq('id', 1).select().single());
}

export async function auditFor(rowIds) {
    if (!rowIds.length) return [];
    return check(await sb.from('audit_log').select('id, table_name, row_id, action, changed_by, changed_at').in('row_id', rowIds).order('changed_at', { ascending: false }).limit(50));
}

export async function exportAll() {
    const out = { exportado: new Date().toISOString() };
    for (const table of [...Object.values(TABLES), 'audit_log']) out[table] = await fetchAll(table);
    return out;
}
