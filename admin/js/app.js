// Arranque del panel: sesión, navegación y estructura común.

import { sb, configured, currentProfile, store, friendlyError } from './api.js';
import { html, raw, paint, $, $$, toast } from './ui.js';
import { syncOnline } from './forms.js';
import { pruneCharts } from './charts.js';
import { PARTNER_LABEL } from './lib/alloc.js';

import * as dashboard from './views/dashboard.js';
import * as clients from './views/clients.js';
import * as projects from './views/projects.js';
import * as income from './views/income.js';
import * as recurring from './views/recurring.js';
import * as expenses from './views/expenses.js';
import * as forecast from './views/forecast.js';
import * as stats from './views/stats.js';
import * as partners from './views/partners.js';
import * as settings from './views/settings.js';

const app = document.getElementById('app');

const ICONS = {
    dashboard: '<path d="M3 13h8V3H3zm10 8h8V11h-8zM3 21h8v-6H3zm10-18v6h8V3z"/>',
    clientes: '<path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.7 0-8 1.3-8 4v3h8v-3c0-1 .4-2 1.2-2.8A13 13 0 0 0 8 13zm8 0c-2.7 0-8 1.3-8 4v3h16v-3c0-2.7-5.3-4-8-4z"/>',
    proyectos: '<path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z"/>',
    cobros: '<path d="M2 6h20v12H2zm10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3z"/>',
    cuotas: '<path d="M12 4V1L8 5l4 4V6a6 6 0 0 1 6 6 6 6 0 0 1-.7 2.8l1.5 1.5A8 8 0 0 0 12 4zm0 14a6 6 0 0 1-6-6 6 6 0 0 1 .7-2.8L5.2 7.7A8 8 0 0 0 12 20v3l4-4-4-4z"/>',
    gastos: '<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4H4V6h16z"/>',
    prevision: '<path d="M3 17l6-6 4 4 8-8v4h2V3h-8v2h4l-6 6-4-4-8 8z"/>',
    estadisticas: '<path d="M5 9h3v11H5zm5.5-5h3v16h-3zM16 13h3v7h-3z"/>',
    socios: '<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/>',
    configuracion: '<path d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a7 7 0 0 0-1.7-1L15 3h-4l-.4 2.6a7 7 0 0 0-1.7 1l-2.5-1-2 3.4L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a7 7 0 0 0 1.7 1L11 21h4l.4-2.6a7 7 0 0 0 1.7-1l2.5 1 2-3.4zM13 15.5A3.5 3.5 0 1 1 16.5 12 3.5 3.5 0 0 1 13 15.5z"/>',
};

const ROUTES = [
    { path: '', label: 'Dashboard', icon: 'dashboard', view: dashboard },
    { path: 'clientes', label: 'Clientes', icon: 'clientes', view: clients },
    { path: 'proyectos', label: 'Proyectos', icon: 'proyectos', view: projects },
    { path: 'cobros', label: 'Ingresos y cobros', icon: 'cobros', view: income },
    { path: 'cuotas', label: 'Cuotas recurrentes', icon: 'cuotas', view: recurring },
    { path: 'gastos', label: 'Gastos', icon: 'gastos', view: expenses },
    { path: 'prevision', label: 'Previsión económica', icon: 'prevision', view: forecast },
    { path: 'estadisticas', label: 'Estadísticas', icon: 'estadisticas', view: stats },
    { path: 'socios', label: 'Reparto entre socios', icon: 'socios', view: partners },
    { path: 'configuracion', label: 'Configuración', icon: 'configuracion', view: settings },
];

const LOGO = raw('<svg viewBox="0 0 100 100" width="32" height="32" aria-hidden="true"><rect width="100" height="100" rx="22" fill="#3b6fe0"/><path d="M14 8 H86 V26 L48 74 H86 V92 H14 V74 L52 26 H14 Z" fill="#fff"/></svg>');

let session = null; // { user, profile }

// ---------- Pantallas de acceso ----------
function authCard(content) {
    paint(app, html`<main class="auth"><div class="auth-card">
        <div class="brand">${LOGO}<div><strong>ZetaWeb</strong><div class="muted small">Panel de gestión</div></div></div>
        ${content}
    </div></main>`);
}

function showNotConfigured() {
    authCard(html`<h1>Configuración pendiente</h1>
        <p class="muted">El panel todavía no está conectado a su base de datos. Hay que crear el proyecto en Supabase
        y rellenar <code>admin/config.js</code> con la URL y la clave pública (ver <code>docs/admin.md</code>).</p>`);
}

function showLogin(message) {
    authCard(html`<h1>Iniciar sesión</h1>
        <form id="login" novalidate>
            ${message ? html`<div class="notice">${message}</div>` : ''}
            <div class="notice bad" data-err role="alert" hidden></div>
            <label class="field"><span>Correo electrónico</span><input name="email" type="email" autocomplete="username" required></label>
            <label class="field"><span>Contraseña</span><input name="password" type="password" autocomplete="current-password" required></label>
            <button class="btn btn-primary" data-online>Entrar</button>
            <button type="button" class="btn-link" id="forgot">¿Has olvidado la contraseña?</button>
        </form>`);
    syncOnline(app);
    const form = $('#login');
    form.email.focus();
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('[data-err]', form);
        err.hidden = true;
        const btn = $('button.btn-primary', form);
        btn.disabled = true;
        const { error } = await sb.auth.signInWithPassword({ email: form.email.value.trim(), password: form.password.value });
        btn.disabled = false;
        if (error) { err.textContent = friendlyError(error); err.hidden = false; return; }
        await boot();
    });
    $('#forgot').addEventListener('click', showForgot);
}

function showForgot() {
    authCard(html`<h1>Recuperar contraseña</h1>
        <form id="forgot-form" novalidate>
            <p class="muted small m0">Te enviaremos un enlace para crear una contraseña nueva. Ábrelo en este mismo navegador.</p>
            <div class="notice bad" data-err role="alert" hidden></div>
            <label class="field"><span>Correo electrónico</span><input name="email" type="email" autocomplete="username" required></label>
            <button class="btn btn-primary" data-online>Enviar enlace</button>
            <button type="button" class="btn-link" id="back">Volver</button>
        </form>`);
    syncOnline(app);
    const form = $('#forgot-form');
    $('#back').addEventListener('click', () => showLogin());
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('[data-err]', form);
        const { error } = await sb.auth.resetPasswordForEmail(form.email.value.trim(), {
            redirectTo: `${location.origin}/admin/?recuperar=1`,
        });
        if (error) { err.textContent = friendlyError(error); err.hidden = false; return; }
        // Mismo mensaje exista o no la cuenta, para no revelar qué correos hay.
        showLogin('Si el correo corresponde a una cuenta, recibirás un enlace en unos minutos.');
    });
}

function showNewPassword() {
    authCard(html`<h1>Nueva contraseña</h1>
        <form id="newpass" novalidate>
            <div class="notice bad" data-err role="alert" hidden></div>
            <label class="field"><span>Nueva contraseña (mínimo 10 caracteres)</span><input name="p1" type="password" autocomplete="new-password" minlength="10" required></label>
            <label class="field"><span>Repite la contraseña</span><input name="p2" type="password" autocomplete="new-password" required></label>
            <button class="btn btn-primary" data-online>Guardar contraseña</button>
        </form>`);
    syncOnline(app);
    const form = $('#newpass');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = $('[data-err]', form);
        err.hidden = true;
        if (form.p1.value.length < 10) { err.textContent = 'La contraseña debe tener al menos 10 caracteres.'; err.hidden = false; return; }
        if (form.p1.value !== form.p2.value) { err.textContent = 'Las contraseñas no coinciden.'; err.hidden = false; return; }
        const { error } = await sb.auth.updateUser({ password: form.p1.value });
        if (error) { err.textContent = friendlyError(error); err.hidden = false; return; }
        history.replaceState(null, '', '/admin/');
        toast('Contraseña actualizada.');
        await boot();
    });
}

function showNoAccess(email) {
    authCard(html`<h1>Sin acceso</h1>
        <p class="muted">La cuenta <strong>${email}</strong> no está autorizada para usar el panel de ZetaWeb.</p>
        <button class="btn" id="out">Cerrar sesión</button>`);
    $('#out').addEventListener('click', logout);
}

export async function logout() {
    await sb.auth.signOut();
    store.clear();
    session = null;
    location.hash = '';
    showLogin('Has cerrado la sesión.');
}

// ---------- Estructura y navegación ----------
function currentRoute() {
    const [path = '', ...rest] = location.hash.replace(/^#\/?/, '').split('/');
    const route = ROUTES.find((r) => r.path === path) ?? ROUTES[0];
    return { route, params: rest.map(decodeURIComponent) };
}

function shell() {
    const name = session.profile.display_name || PARTNER_LABEL[session.profile.partner];
    paint(app, html`<div class="layout" id="layout">
        <aside class="sidebar" id="sidebar" aria-label="Menú principal">
            <div class="brand">${LOGO}<div>ZetaWeb<small>Panel de gestión</small></div></div>
            <nav class="nav">${ROUTES.map((r) => html`<a href="#/${r.path}" data-path="${r.path}">
                ${raw(`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[r.icon]}</svg>`)}${r.label}</a>`)}</nav>
            <div class="sidebar-foot">
                <span>Sesión: <strong>${name}</strong></span>
                <button type="button" id="logout">Cerrar sesión</button>
            </div>
        </aside>
        <div class="scrim" id="scrim"></div>
        <div class="main">
            <div class="offline-banner" id="offline" hidden>Sin conexión: puedes consultar la pantalla actual, pero no se pueden guardar cambios.</div>
            <header class="topbar">
                <button class="icon-btn menu-btn" id="menu" aria-label="Abrir menú" aria-controls="sidebar" aria-expanded="false">☰</button>
                <strong id="page-title"></strong>
                <span class="spacer"></span>
                <div class="actions quick">
                    <button class="btn btn-sm" data-quick="client" data-online>+ Cliente</button>
                    <button class="btn btn-sm" data-quick="project" data-online>+ Proyecto</button>
                    <button class="btn btn-sm" data-quick="payment" data-online>+ Cobro</button>
                    <button class="btn btn-sm" data-quick="expense" data-online>+ Gasto</button>
                </div>
                <button class="icon-btn" id="theme" aria-label="Cambiar tema claro u oscuro">◐</button>
            </header>
            <main class="content" id="view"></main>
        </div>
        <button class="fab" id="fab" aria-label="Añadir" aria-expanded="false" data-online>+</button>
        <div class="quick-menu" id="quick-menu" hidden>
            <button class="btn" data-quick="client">Añadir cliente</button>
            <button class="btn" data-quick="project">Crear proyecto</button>
            <button class="btn" data-quick="payment">Registrar cobro</button>
            <button class="btn" data-quick="expense">Añadir gasto</button>
        </div>
    </div>`);

    const layout = $('#layout');
    const toggleNav = (open) => {
        layout.classList.toggle('nav-open', open);
        $('#menu').setAttribute('aria-expanded', String(open));
    };
    $('#menu').addEventListener('click', () => toggleNav(!layout.classList.contains('nav-open')));
    $('#scrim').addEventListener('click', () => toggleNav(false));
    $('#sidebar').addEventListener('click', (e) => { if (e.target.closest('a')) toggleNav(false); });
    $('#logout').addEventListener('click', logout);
    $('#theme').addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('zetaweb-theme', next); } catch { /* sin almacenamiento */ }
    });
    const quickMenu = $('#quick-menu');
    $('#fab').addEventListener('click', () => {
        quickMenu.hidden = !quickMenu.hidden;
        $('#fab').setAttribute('aria-expanded', String(!quickMenu.hidden));
    });
    layout.addEventListener('click', (e) => {
        const q = e.target.closest('[data-quick]');
        if (!q) return;
        quickMenu.hidden = true;
        quick(q.dataset.quick);
    });
    updateOnline();
}

function quick(kind) {
    if (!navigator.onLine) return toast('Sin conexión: no se pueden añadir datos.', 'error');
    if (kind === 'client') clients.openClientForm();
    if (kind === 'project') projects.openProjectForm();
    if (kind === 'payment') income.openPaymentForm();
    if (kind === 'expense') expenses.openExpenseForm();
}

let renderSeq = 0;
async function renderRoute() {
    if (!session) return;
    const { route, params } = currentRoute();
    for (const a of $$('.nav a')) {
        if (a.dataset.path === route.path) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    }
    $('#page-title').textContent = route.label;
    document.title = `${route.label} · ZetaWeb`;
    const el = $('#view');
    const seq = ++renderSeq;
    try {
        const data = await store.ensure();
        if (seq !== renderSeq) return;
        await route.view.render({ el, params, data, session });
        syncOnline(el);
        pruneCharts();
    } catch (err) {
        console.error(err);
        paint(el, html`<div class="notice bad">No se han podido cargar los datos: ${friendlyError(err)}</div>
            <p><button class="btn" id="retry" data-online>Reintentar</button></p>`);
        $('#retry')?.addEventListener('click', () => store.refresh().catch((e) => toast(friendlyError(e), 'error')));
    }
}

function updateOnline() {
    const banner = $('#offline');
    if (banner) banner.hidden = navigator.onLine;
    syncOnline(document);
}

// ---------- Arranque ----------
async function boot() {
    if (!configured) return showNotConfigured();
    let info;
    try {
        info = await currentProfile();
    } catch (err) {
        authCard(html`<h1>Sin conexión</h1><p class="muted">${friendlyError(err)}</p><button class="btn" id="retry">Reintentar</button>`);
        $('#retry').addEventListener('click', boot);
        return;
    }
    if (!info) return showLogin();
    if (new URLSearchParams(location.search).has('recuperar')) return showNewPassword();
    if (!info.profile) return showNoAccess(info.user.email);
    session = info;
    shell();
    await renderRoute();
}

store.listeners.add(renderRoute);
window.addEventListener('hashchange', () => { window.scrollTo(0, 0); renderRoute(); });
window.addEventListener('online', updateOnline);
window.addEventListener('offline', updateOnline);
// Al volver a la pestaña (o desde otro dispositivo) se recargan los datos.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && session && navigator.onLine && Date.now() - store.loadedAt > 30_000 && !document.querySelector('dialog[open]')) {
        store.refresh().catch(() => {});
    }
});

if (sb) {
    sb.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') showNewPassword();
        if (event === 'SIGNED_OUT' && session) { session = null; store.clear(); showLogin('La sesión ha terminado.'); }
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' }).catch(() => {});
}

boot();
