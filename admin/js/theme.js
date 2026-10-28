// Se ejecuta antes de pintar para evitar el parpadeo en modo oscuro.
// Comparte preferencia con la web pública.
(function () {
    var d = document.documentElement;
    try {
        var stored = localStorage.getItem('zetaweb-theme');
        d.dataset.theme = (stored === 'light' || stored === 'dark')
            ? stored
            : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch (e) { /* localStorage bloqueado: nos quedamos en claro */ }
})();
