// Arranque del panel: sesión, navegación y estructura común.

import { sb, configured, currentProfile, store, friendlyError } from './api.js';
import { html, raw, paint, $, $$, toast } from './ui.js';
import { syncOnline } from './forms.js';
import { pruneCharts } from './charts.js';

import * as cobros from './views/cobros.js';
import * as clients from './views/clients.js';
import * as stats from './views/stats.js';

const app = document.getElementById('app');

const ROUTES = [
    { path: '', label: 'Cobros', view: cobros, icon: '<path d="M2 6h20v12H2zm10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3z"/>' },
    { path: 'clientes', label: 'Clientes', view: clients, icon: '<path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.7 0-8 1.3-8 4v3h8v-3c0-1 .4-2 1.2-2.8A13 13 0 0 0 8 13zm8 0c-2.7 0-8 1.3-8 4v3h16v-3c0-2.7-5.3-4-8-4z"/>' },
    { path: 'estadisticas', label: 'Estadísticas', view: stats, icon: '<path d="M5 9h3v11H5zm5.5-5h3v16h-3zM16 13h3v7h-3z"/>' },
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
    paint(app, html`<div class="app">
        <header class="topbar">
            <a href="#/" class="brand">${LOGO}<span>ZetaWeb</span></a>
            <nav class="tabbar" aria-label="Secciones">${ROUTES.map((r) => html`<a href="#/${r.path}" data-path="${r.path}">
                ${raw(`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${r.icon}</svg>`)}<span>${r.label}</span></a>`)}</nav>
            <span class="spacer"></span>
            <button class="icon-btn" id="theme" aria-label="Cambiar tema claro u oscuro">${raw('<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.4A5.5 5.5 0 0 1 12.4 3.1 9 9 0 0 0 12 3z"/></svg>')}</button>
            <button class="btn btn-sm" id="logout">Salir</button>
        </header>
        <div class="offline-banner" id="offline" hidden>Sin conexión: no se pueden guardar cambios.</div>
        <main class="content" id="view"></main>
    </div>`);
    $('#logout').addEventListener('click', logout);
    $('#theme').addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('zetaweb-theme', next); } catch { /* sin almacenamiento */ }
    });
    updateOnline();
}

let renderSeq = 0;
async function renderRoute() {
    if (!session) return;
    const { route, params } = currentRoute();
    for (const a of $$('.tabbar a')) {
        if (a.dataset.path === route.path) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    }
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
