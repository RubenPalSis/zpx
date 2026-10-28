// Importes: siempre en céntimos enteros. Solo se convierte a euros para mostrar.

const eurFormat = new Intl.NumberFormat('es-ES', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always',
});
const pctFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2, useGrouping: 'always' });

export function formatEuros(cents) {
    return eurFormat.format((Number(cents) || 0) / 100);
}

export function formatPct(bp) {
    return `${pctFormat.format((Number(bp) || 0) / 100)} %`;
}

// Acepta "1.250,50", "1250,5", "1250.50", "1 250 €"… Devuelve céntimos o null.
export function parseEuros(input) {
    if (typeof input === 'number') return Number.isFinite(input) ? Math.round(input * 100) : null;
    let s = String(input ?? '').replace(/[€\s ]/g, '').trim();
    if (!s) return null;
    const neg = s.startsWith('-');
    if (neg) s = s.slice(1);
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
        // El último separador es el decimal; el otro, de miles.
        const dec = lastComma > lastDot ? ',' : '.';
        s = s.split(dec === ',' ? '.' : ',').join('').replace(dec, '.');
    } else if (lastComma >= 0) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (lastDot >= 0 && /^\d{1,3}(\.\d{3})+$/.test(s)) {
        s = s.replace(/\./g, ''); // "1.250" = mil doscientos cincuenta
    }
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
    const [ent, dec = ''] = s.split('.');
    const cents = Number(ent) * 100 + Number(dec.padEnd(2, '0'));
    return neg ? -cents : cents;
}

// Céntimos → texto para un <input>, p. ej. 125050 → "1250,50".
export function centsToInput(cents) {
    if (cents === null || cents === undefined || cents === '') return '';
    const n = Number(cents);
    const abs = Math.abs(n);
    return `${n < 0 ? '-' : ''}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

// "50" o "33,33" (porcentaje) → puntos básicos (0..10000) o null.
export function parsePct(input) {
    const s = String(input ?? '').replace('%', '').replace(/\s/g, '').replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
    const [ent, dec = ''] = s.split('.');
    const bp = Number(ent) * 100 + Number(dec.padEnd(2, '0'));
    return bp <= 10000 ? bp : null;
}

export function bpToInput(bp) {
    if (bp === null || bp === undefined) return '';
    return pctFormat.format(bp / 100).replace(/\./g, '');
}

export function sum(list, fn = (x) => x) {
    let total = 0;
    for (const item of list) total += Number(fn(item)) || 0;
    return total;
}
