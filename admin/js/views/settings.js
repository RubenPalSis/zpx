import { html, paint, toast, LABELS } from '../ui.js';
import { formDialog, withToast } from '../forms.js';
import { sb, store, exportAll, updateSettings, friendlyError } from '../api.js';
import { ALLOC_MODES } from '../lib/alloc.js';
import { formatPct } from '../lib/money.js';
import { formatDateTime } from '../lib/dates.js';
import { logout } from '../app.js';

export async function render({ el, data, session }) {
    const s = data.settings;
    paint(el, html`
        <div class="page-head"><div><h1>Configuración</h1></div></div>
        <div class="grid-2">
            <section class="card"><h2>Tu cuenta</h2>
                <dl class="kv">
                    <dt>Nombre</dt><dd>${session.profile.display_name}</dd>
                    <dt>Socio</dt><dd>${LABELS.partner[session.profile.partner]}</dd>
                    <dt>Correo</dt><dd>${session.user.email}</dd>
                    <dt>Último acceso</dt><dd>${formatDateTime(session.user.last_sign_in_at)}</dd>
                </dl>
                <p></p>
                <div class="actions">
                    <button class="btn" data-act="password" data-online>Cambiar contraseña</button>
                    <button class="btn" data-act="logout">Cerrar sesión</button>
                    <button class="btn btn-danger" data-act="logout-all" data-online>Cerrar sesión en todos los dispositivos</button>
                </div>
            </section>
            <section class="card"><h2>Reparto predeterminado</h2>
                <p class="m0">Reparto propuesto al crear proyectos, obligaciones, cuotas y gastos nuevos:
                    <strong>${s.default_alloc_mode === 'pct' ? `Rubén ${formatPct(s.default_alloc_ruben_bp)} · Inés ${formatPct(10000 - s.default_alloc_ruben_bp)}` : ALLOC_MODES[s.default_alloc_mode]}</strong>.</p>
                <p class="muted small">Cambiarlo no modifica ninguna operación ya registrada.</p>
                <button class="btn" data-act="alloc" data-online>Cambiar</button>
            </section>
            <section class="card"><h2>Copia de seguridad y exportación</h2>
                <p class="m0">Descarga todos los datos (clientes, proyectos, obligaciones, cobros, cuotas, gastos e historial de cambios).</p>
                <p class="muted small">El archivo contiene datos de clientes y económicos: guárdalo en un lugar privado.</p>
                <div class="actions">
                    <button class="btn" data-act="json" data-online>Exportar todo (JSON)</button>
                    <button class="btn" data-act="csv" data-online>Exportar cobros y gastos (CSV)</button>
                </div>
            </section>
            <section class="card"><h2>Acerca del panel</h2>
                <dl class="kv">
                    <dt>Datos cargados</dt><dd>${formatDateTime(store.loadedAt)}</dd>
                    <dt>Registros</dt><dd>${data.clients.length} clientes · ${data.projects.length} proyectos · ${data.obligations.length} obligaciones · ${data.payments.length} cobros · ${data.recurring.length} cuotas · ${data.expenses.length} gastos</dd>
                </dl>
                <p class="muted small">Los datos se guardan en la base de datos compartida (Supabase). Sin conexión no se puede guardar nada.</p>
                <button class="btn" data-act="reload" data-online>Recargar datos</button>
            </section>
        </div>`);

    const on = (act, fn) => el.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
    on('logout', logout);
    on('logout-all', async () => {
        await sb.auth.signOut({ scope: 'global' });
        await logout();
    });
    on('password', changePassword);
    on('alloc', () => formDialog({
        title: 'Reparto predeterminado',
        values: { amount: 10000, alloc_mode: s.default_alloc_mode, alloc_ruben_bp: s.default_alloc_ruben_bp },
        fields: [
            { name: 'amount', type: 'money', label: 'Importe de ejemplo para la vista previa (€)' },
            { name: 'alloc', type: 'alloc', amountField: 'amount', label: 'Reparto' },
        ],
        validate(v) {
            return v.alloc_mode === 'fixed' ? { alloc: 'El predeterminado debe ser Rubén, Inés o un porcentaje' } : {};
        },
        async onSubmit(v) {
            await updateSettings({ default_alloc_mode: v.alloc_mode, default_alloc_ruben_bp: v.alloc_ruben_bp ?? 5000 });
            await store.refresh();
            toast('Reparto predeterminado actualizado.');
        },
    }));
    on('json', () => withToast(async () => {
        const dump = await exportAll();
        download(`zetaweb-copia-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(dump, null, 2), 'application/json');
    }, 'Exportación descargada.'));
    on('csv', () => {
        const d = store.data;
        const cents = (c) => (Number(c) / 100).toFixed(2).replace('.', ',');
        const rows = [['tipo', 'fecha', 'cliente', 'concepto', 'importe', 'ruben', 'ines', 'metodo_o_categoria', 'pagado_por', 'estado']];
        for (const p of d.payments) {
            const o = d.byId.obligations.get(p.obligation_id);
            rows.push(['cobro', p.paid_on, d.byId.clients.get(p.client_id)?.name ?? '', o?.concept ?? '', cents(p.amount_cents), cents(p.ruben_cents), cents(p.ines_cents), p.method, '', '']);
        }
        for (const e of d.expenses) {
            rows.push(['gasto', e.status === 'pagado' ? e.paid_on : e.expense_date, d.byId.clients.get(e.client_id)?.name ?? '', e.concept, cents(e.amount_cents), cents(e.ruben_cents), cents(e.ines_cents), e.category, e.paid_by ?? '', e.status]);
        }
        const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n');
        download(`zetaweb-cobros-gastos-${new Date().toISOString().slice(0, 10)}.csv`, `﻿${csv}`, 'text/csv');
        toast('CSV descargado.');
    });
    on('reload', () => withToast(() => store.refresh(), 'Datos recargados.'));
}

function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function changePassword() {
    formDialog({
        title: 'Cambiar contraseña',
        fields: [
            { name: 'p1', label: 'Nueva contraseña (mínimo 10 caracteres)', type: 'password', required: true, full: true, autocomplete: 'new-password' },
            { name: 'p2', label: 'Repite la contraseña', type: 'password', required: true, full: true, autocomplete: 'new-password' },
        ],
        validate(v) {
            const e = {};
            if ((v.p1 ?? '').length < 10) e.p1 = 'Mínimo 10 caracteres';
            if (v.p1 !== v.p2) e.p2 = 'Las contraseñas no coinciden';
            return e;
        },
        async onSubmit(v) {
            const { error } = await sb.auth.updateUser({ password: v.p1 });
            if (error) throw new Error(friendlyError(error));
            toast('Contraseña actualizada.');
        },
    });
}
