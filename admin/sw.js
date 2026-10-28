// Service worker del panel. Solo guarda en caché los archivos de la propia
// aplicación (HTML, CSS, JS, iconos). Las peticiones a Supabase (datos
// económicos y sesión) no pasan nunca por la caché.
const VERSION = 'zw-admin-v1';
const SHELL = [
    '/admin/',
    '/admin/index.html',
    '/admin/config.js',
    '/admin/css/admin.css',
    '/admin/lib/supabase-2.117.3.js',
    '/admin/js/theme.js',
    '/admin/js/app.js',
    '/admin/js/api.js',
    '/admin/js/ui.js',
    '/admin/js/charts.js',
    '/admin/js/forms.js',
    '/admin/js/lib/money.js',
    '/admin/js/lib/dates.js',
    '/admin/js/lib/alloc.js',
    '/admin/js/lib/finance.js',
    '/admin/js/views/common.js',
    '/admin/js/views/dashboard.js',
    '/admin/js/views/clients.js',
    '/admin/js/views/projects.js',
    '/admin/js/views/income.js',
    '/admin/js/views/recurring.js',
    '/admin/js/views/expenses.js',
    '/admin/js/views/forecast.js',
    '/admin/js/views/stats.js',
    '/admin/js/views/partners.js',
    '/admin/js/views/settings.js',
    '/admin/manifest.webmanifest',
    '/favicon.svg',
    '/icon-192.png',
    '/icon-512.png',
    '/admin/icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k.startsWith('zw-admin-') && k !== VERSION).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

// Red primero para el código propio (así los cambios publicados llegan en
// cuanto hay conexión) y caché como respaldo sin conexión.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin || !isShell(url.pathname)) return;
    event.respondWith(
        fetch(event.request)
            .then((res) => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(VERSION).then((c) => c.put(event.request, copy));
                }
                return res;
            })
            .catch(() => caches.match(event.request, { ignoreSearch: true })
                .then((hit) => hit || (event.request.mode === 'navigate' ? caches.match('/admin/') : Response.error()))),
    );
});

function isShell(path) {
    return path.startsWith('/admin/') || SHELL.includes(path);
}
