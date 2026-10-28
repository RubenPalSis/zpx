// Reparto entre Rubén e Inés. Replica exactamente las reglas de la base de
// datos (public.round_ratio y public.resolve_alloc) para poder mostrar una
// vista previa; la base de datos es la que manda al guardar.

export const PARTNERS = ['ruben', 'ines'];
export const PARTNER_LABEL = { ruben: 'Rubén', ines: 'Inés' };
export const ALLOC_MODES = {
    ruben: 'Solo Rubén',
    ines: 'Solo Inés',
    pct: 'Repartido por porcentaje',
    fixed: 'Repartido por importes',
};

// a * num / den redondeado al entero más cercano; mitades al par.
export function roundRatio(a, num, den) {
    if (!(den > 0) || a < 0 || num < 0) throw new Error('roundRatio: argumentos no válidos');
    const p = BigInt(a) * BigInt(num);
    const d = BigInt(den);
    let q = p / d;
    const r = p - q * d;
    if (r * 2n > d || (r * 2n === d && q % 2n === 1n)) q += 1n;
    return Number(q);
}

// Devuelve { ok, ruben, ines, bp, error }.
export function resolveAlloc(amount, mode, rubenBp, rubenIn, inesIn) {
    if (!Number.isInteger(amount) || amount < 0) return { ok: false, error: 'Importe no válido' };
    switch (mode) {
        case 'ruben': return { ok: true, ruben: amount, ines: 0, bp: 10000 };
        case 'ines': return { ok: true, ruben: 0, ines: amount, bp: 0 };
        case 'pct': {
            if (!Number.isInteger(rubenBp) || rubenBp < 0 || rubenBp > 10000) {
                return { ok: false, error: 'El porcentaje debe estar entre 0 y 100, y los dos deben sumar 100 %' };
            }
            const ruben = roundRatio(amount, rubenBp, 10000);
            return { ok: true, ruben, ines: amount - ruben, bp: rubenBp };
        }
        case 'fixed': {
            if (!Number.isInteger(rubenIn) || !Number.isInteger(inesIn) || rubenIn < 0 || inesIn < 0) {
                return { ok: false, error: 'Indica un importe válido para cada socio' };
            }
            if (rubenIn + inesIn !== amount) {
                return { ok: false, error: 'La suma de los dos importes debe coincidir con el total' };
            }
            return { ok: true, ruben: rubenIn, ines: inesIn, bp: null };
        }
        default: return { ok: false, error: 'Elige cómo se reparte el importe' };
    }
}

// Adapta el reparto de un proyecto (predeterminado) a otro importe, p. ej.
// una obligación por una parte del precio. Un reparto por importes fijos se
// convierte proporcionalmente para que siga cuadrando.
export function inheritAlloc(source, amount) {
    if (!source) return null;
    const { alloc_mode: mode, alloc_ruben_bp: bp, ruben_cents: r, ines_cents: i } = source;
    if (mode !== 'fixed') return { alloc_mode: mode, alloc_ruben_bp: bp, ...pick(resolveAlloc(amount, mode, bp)) };
    const total = (r || 0) + (i || 0);
    if (total === amount) return { alloc_mode: 'fixed', alloc_ruben_bp: null, ruben_cents: r, ines_cents: i };
    if (total === 0) return { alloc_mode: 'pct', alloc_ruben_bp: 5000, ...pick(resolveAlloc(amount, 'pct', 5000)) };
    const ruben = roundRatio(amount, r, total);
    return { alloc_mode: 'fixed', alloc_ruben_bp: null, ruben_cents: ruben, ines_cents: amount - ruben };
}

function pick(res) {
    return res.ok ? { ruben_cents: res.ruben, ines_cents: res.ines } : {};
}

// Reparto de cada cobro de una obligación, acumulado: tras cada cobro, la
// parte acumulada de Rubén es roundRatio(cobrado, ruben, total). Así, al
// saldar la obligación, los cobros suman exactamente el reparto acordado.
export function paymentAllocations(obligation, payments) {
    const sorted = [...payments].sort((a, b) =>
        a.paid_on.localeCompare(b.paid_on) || String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')) || String(a.id).localeCompare(String(b.id)));
    let cum = 0;
    let prev = 0;
    return sorted.map((p) => {
        cum += p.amount_cents;
        const cur = roundRatio(cum, obligation.ruben_cents, obligation.amount_cents);
        const ruben = cur - prev;
        prev = cur;
        return { id: p.id, ruben_cents: ruben, ines_cents: p.amount_cents - ruben };
    });
}

export function describeAlloc(row) {
    if (!row) return '';
    if (row.alloc_mode === 'ruben') return 'Rubén 100 %';
    if (row.alloc_mode === 'ines') return 'Inés 100 %';
    return null; // repartido: quien llame muestra los importes
}
