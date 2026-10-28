// Gráficos SVG sencillos: barras agrupadas y líneas. Una sola escala Y,
// tooltip al pasar por cada mes, leyenda si hay más de una serie y tabla
// equivalente para lectores de pantalla o para consultar las cifras.

import { html, raw } from './ui.js';
import { formatEuros } from './lib/money.js';

const W = 640;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 58 };
const registry = new Map();
let nextId = 0;

const compact = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });
const euroAxis = (cents) => `${compact.format(cents / 100)} €`;
const countFmt = (n) => String(n);

function niceTicks(min, max, count = 4) {
    if (min === max) { max = min + (min === 0 ? 100 : Math.abs(min) * 0.5); }
    const span = max - min;
    const step0 = span / count;
    const mag = 10 ** Math.floor(Math.log10(step0));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0);
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v));
    return ticks;
}

// Barra con las esquinas del extremo de datos redondeadas (4px) y la base recta.
function barPath(x, w, y0, y1) {
    const r = Math.min(4, w / 2, Math.abs(y1 - y0));
    if (y1 < y0) {
        return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
    }
    return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
}

/**
 * @param {object} o
 * @param {string[]} o.labels       etiquetas del eje X
 * @param {{name:string, values:number[], cls:string}[]} o.series
 * @param {'bar'|'line'} [o.type]
 * @param {'euros'|'count'} [o.unit]
 * @param {string} o.title          título accesible
 */
export function chart({ labels, series, type = 'bar', unit = 'euros', title }) {
    const fmt = unit === 'euros' ? (v) => formatEuros(v) : countFmt;
    const axisFmt = unit === 'euros' ? euroAxis : countFmt;
    const all = series.flatMap((s) => s.values);
    if (!labels.length || all.every((v) => !v)) {
        return html`<div class="chart-empty">Sin datos en este periodo.</div>`;
    }
    const ticks = niceTicks(Math.min(0, ...all), Math.max(0, ...all));
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const y = (v) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
    const band = innerW / labels.length;
    const cx = (i) => PAD.left + band * i + band / 2;
    const every = Math.ceil(labels.length / 12);

    const grid = ticks.map((t) => raw(`<line class="${t === 0 ? 'zero' : 'gridline'}" x1="${PAD.left}" x2="${W - PAD.right}" y1="${y(t)}" y2="${y(t)}"/>`
        + `<text x="${PAD.left - 6}" y="${y(t) + 4}" text-anchor="end">${axisFmt(t)}</text>`));
    const xLabels = labels.map((l, i) => (i % every === 0
        ? html`<text x="${cx(i)}" y="${H - 8}" text-anchor="middle">${l}</text>` : ''));

    let marks = '';
    if (type === 'bar') {
        const groupW = Math.min(band * 0.72, 44);
        const gap = 2;
        const bw = (groupW - gap * (series.length - 1)) / series.length;
        marks = series.map((s, si) => s.values.map((v, i) => {
            if (!v) return '';
            const x = cx(i) - groupW / 2 + si * (bw + gap);
            return raw(`<path class="bar ${s.cls}" d="${barPath(x, bw, y(0), y(v))}"/>`);
        }));
    } else {
        marks = series.map((s) => {
            const pts = s.values.map((v, i) => `${cx(i)},${y(v)}`).join(' ');
            const dots = labels.length <= 24 ? s.values.map((v, i) => raw(`<circle class="dot ${s.cls}" cx="${cx(i)}" cy="${y(v)}" r="4"/>`)) : '';
            return html`${raw(`<polyline class="line ${s.cls}" points="${pts}"/>`)}${dots}`;
        });
    }

    const id = `c${++nextId}`;
    registry.set(id, { labels, series, fmt });
    const hits = labels.map((_, i) => raw(`<rect class="hit" data-i="${i}" x="${PAD.left + band * i}" y="${PAD.top}" width="${band}" height="${innerH}"/>`
        + `<rect class="hover-band" x="${PAD.left + band * i}" y="${PAD.top}" width="${band}" height="${innerH}"/>`));

    const legend = series.length > 1
        ? html`<div class="chart-legend">${series.map((s) => html`<span><span class="swatch ${s.cls}"></span>${s.name}</span>`)}</div>`
        : '';
    const table = html`<details class="table-view"><summary>Ver como tabla</summary><div class="table-wrap"><table>
        <thead><tr><th>Periodo</th>${series.map((s) => html`<th class="num">${s.name}</th>`)}</tr></thead>
        <tbody>${labels.map((l, i) => html`<tr><td>${l}</td>${series.map((s) => html`<td class="num">${fmt(s.values[i])}</td>`)}</tr>`)}</tbody>
    </table></div></details>`;

    return html`${legend}<div class="chart" data-chart="${id}">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">
            <g class="axis">${grid}${xLabels}</g>
            <g>${marks}</g>
            <g>${hits}</g>
        </svg>
        <div class="chart-tip" hidden></div>
    </div>${table}`;
}

// Tooltip compartido por todos los gráficos (delegación de eventos).
function onMove(e) {
    const hit = e.target.closest?.('.chart .hit');
    for (const b of document.querySelectorAll('.chart .hover-band.on')) b.classList.remove('on');
    for (const t of document.querySelectorAll('.chart .chart-tip:not([hidden])')) if (!hit || !t.parentElement.contains(hit)) t.hidden = true;
    if (!hit) return;
    const box = hit.closest('.chart');
    const data = registry.get(box.dataset.chart);
    if (!data) return;
    const i = Number(hit.dataset.i);
    hit.nextElementSibling?.classList.add('on');
    const tip = box.querySelector('.chart-tip');
    tip.innerHTML = String(html`<strong>${data.labels[i]}</strong>${data.series.map((s) =>
        html`<div><span><span class="swatch ${s.cls}"></span>${s.name}</span><span>${data.fmt(s.values[i])}</span></div>`)}`);
    tip.hidden = false;
    const rect = box.getBoundingClientRect();
    const hr = hit.getBoundingClientRect();
    const left = Math.min(Math.max(0, hr.left - rect.left + hr.width / 2 - tip.offsetWidth / 2), rect.width - tip.offsetWidth);
    tip.style.left = `${left}px`;
    tip.style.top = '0px';
}

document.addEventListener('pointermove', onMove);
document.addEventListener('pointerdown', onMove);

// Se liberan los datos de gráficos que ya no están en pantalla.
export function pruneCharts() {
    for (const id of registry.keys()) if (!document.querySelector(`[data-chart="${id}"]`)) registry.delete(id);
}
