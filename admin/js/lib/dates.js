// Fechas como texto ISO "AAAA-MM-DD" (igual que el tipo date de Postgres).
// Se trabaja en UTC para que la zona horaria no mueva los días.

export function todayISO(now = new Date()) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function formatDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = String(iso).slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
}

export function formatDateTime(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return `${formatDate(todayISO(d))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// "DD/MM/AAAA" → ISO o null.
export function parseDate(input) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(input ?? '').trim());
    if (!m) return null;
    const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return isValidISO(iso) ? iso : null;
}

export function isValidISO(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const [y, m, d] = iso.split('-').map(Number);
    return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

export function daysInMonth(y, m) {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function parts(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return { y, m, d };
}

function make(y, m, d) {
    return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Suma meses manteniendo el día de referencia; si el mes destino es más
// corto, usa su último día. Igual que public.add_period en la base de datos.
export function addPeriod(iso, months, anchorDay) {
    const { y, m } = parts(iso);
    const idx = y * 12 + (m - 1) + months;
    const ny = Math.floor(idx / 12);
    const nm = (idx % 12) + 1;
    return make(ny, nm, Math.min(anchorDay, daysInMonth(ny, nm)));
}

export function addDays(iso, days) {
    const { y, m, d } = parts(iso);
    const t = new Date(Date.UTC(y, m - 1, d + days));
    return make(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function dayOf(iso) {
    return parts(iso).d;
}

export function monthKey(iso) {
    return String(iso).slice(0, 7);
}

export function monthStart(iso) {
    return `${monthKey(iso)}-01`;
}

export function monthEnd(iso) {
    const { y, m } = parts(iso);
    return make(y, m, daysInMonth(y, m));
}

export function yearStart(iso) {
    return `${String(iso).slice(0, 4)}-01-01`;
}

export function yearEnd(iso) {
    return `${String(iso).slice(0, 4)}-12-31`;
}

// Lista de claves "AAAA-MM" entre dos fechas, ambas incluidas.
export function monthsBetween(fromIso, toIso) {
    const out = [];
    let cur = monthStart(fromIso);
    const last = monthStart(toIso);
    while (cur <= last) {
        out.push(monthKey(cur));
        cur = addPeriod(cur, 1, 1);
    }
    return out;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function monthLabel(key, long = false) {
    const [y, m] = key.split('-').map(Number);
    return long ? `${MONTHS_LONG[m - 1]} de ${y}` : `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

export function inRange(iso, from, to) {
    return !!iso && (!from || iso >= from) && (!to || iso <= to);
}
