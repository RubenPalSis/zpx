/* =========================================================
   ZetaWeb — logo animado
   Una Z que se parte por un corte diagonal: una hoja barre la
   pieza, las dos mitades se separan y vuelven a encajar.
   ========================================================= */

const Z_PATH = 'M14 8 H86 V26 L48 74 H86 V92 H14 V74 L52 26 H14 Z';

// Ángulo del corte, en grados. Cambiarlo aquí basta: el CSS lo lee
// de la variable --cut-angle y las mitades se recortan en consecuencia.
const CUT_ANGLE = -20;

const INTRO = true;                     // ponlo en false para quitar la cortinilla
const INTRO_KEY = 'zetaweb-intro-visto';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Safari antiguo no trae la Web Animations API: sin ella el logo se queda estático.
const canAnimate = (el) => typeof el.animate === 'function';

/* ---------- Construcción ---------- */
function svgZ() {
    return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="${Z_PATH}"/></svg>`;
}

/**
 * Sustituye la Z estática por dos mitades recortadas a cada lado del corte,
 * más la hoja que barre. Sin JS la Z de respaldo sigue viéndose entera.
 */
function buildMark(mount) {
    mount.replaceChildren();

    const halves = ['top', 'bottom'].map((side) => {
        const half = document.createElement('span');
        half.className = `logo-half logo-half-${side}`;
        half.innerHTML = svgZ();
        mount.appendChild(half);
        return half;
    });

    const blade = document.createElement('span');
    blade.className = 'logo-blade';
    mount.appendChild(blade);

    mount.classList.add('is-ready');
    return { halves, blade, mount };
}

/* ---------- La animación del corte ---------- */
function slice(mark, { gap = 1, duration = 640, delay = 0 } = {}) {
    const { halves: [top, bottom], blade } = mark;
    if (!canAnimate(blade)) return;

    blade.animate(
        [
            { transform: `rotate(${CUT_ANGLE}deg) translateX(-170%)`, opacity: 0 },
            { opacity: 1, offset: 0.25 },
            { opacity: 1, offset: 0.65 },
            { transform: `rotate(${CUT_ANGLE}deg) translateX(170%)`, opacity: 0 }
        ],
        { duration: duration * 0.62, delay, easing: 'cubic-bezier(0.35, 0, 0.2, 1)' }
    );

    // Las mitades se apartan perpendicularmente al corte y vuelven con un
    // rebote corto, de modo que la Z "encaja" otra vez.
    const separate = (el, dx, dy) => {
        el.animate(
            [
                { transform: 'translate(0, 0)' },
                { transform: `translate(${dx * gap}%, ${dy * gap}%)`, offset: 0.3 },
                { transform: `translate(${dx * gap * -0.18}%, ${dy * gap * -0.18}%)`, offset: 0.62 },
                { transform: 'translate(0, 0)' }
            ],
            { duration, delay: delay + duration * 0.16, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
        );
    };

    separate(top, 2.2, -7);
    separate(bottom, -2.2, 7);
}

/* ---------- Logos de la página ---------- */
function initLogos() {
    document.querySelectorAll('.logo-mark[data-logo]:not(.intro-mark)').forEach((mount) => {
        if (mount.classList.contains('is-ready')) return;   // ya montado
        const mark = buildMark(mount);
        const link = mount.closest('a, .logo-link') ?? mount;

        let playing = false;
        const play = () => {
            if (playing || reduceMotion()) return;
            playing = true;
            slice(mark);
            window.setTimeout(() => { playing = false; }, 720);
        };

        link.addEventListener('mouseenter', play);
        link.addEventListener('focus', play);
        mount.addEventListener('click', play);
    });
}

/* ---------- Cortinilla de entrada ---------- */
function playIntro() {
    const intro = document.getElementById('intro');
    const mount = intro?.querySelector('.intro-mark');
    if (!intro || !mount) return;

    const mark = buildMark(mount);
    intro.hidden = false;
    document.body.classList.add('intro-lock');
    void intro.offsetWidth;                 // fuerza reflujo para que la transición arranque
    intro.classList.add('is-visible');

    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        intro.classList.remove('is-visible');
        document.body.classList.remove('intro-lock');
        window.setTimeout(() => { intro.hidden = true; }, 420);
        window.removeEventListener('keydown', finish);
        window.removeEventListener('wheel', finish);
        window.removeEventListener('touchstart', finish);
        intro.removeEventListener('click', finish);
    };

    // Dos cortes encadenados: el segundo, más marcado, remata la entrada.
    slice(mark, { gap: 1.1, duration: 620, delay: 180 });
    slice(mark, { gap: 1.7, duration: 700, delay: 780 });
    window.setTimeout(() => intro.classList.add('is-named'), 900);
    window.setTimeout(finish, 1900);

    // Se puede saltar en cualquier momento.
    window.addEventListener('keydown', finish);
    window.addEventListener('wheel', finish, { passive: true });
    window.addEventListener('touchstart', finish, { passive: true });
    intro.addEventListener('click', finish);
}

function shouldPlayIntro() {
    if (!INTRO || reduceMotion()) return false;
    try {
        if (sessionStorage.getItem(INTRO_KEY)) return false;
        sessionStorage.setItem(INTRO_KEY, '1');
    } catch {
        return false;   // sin sessionStorage no arriesgamos a repetirla en cada página
    }
    return true;
}

let logoStarted = false;

// Nombre propio: `init` es también una función global de script.js y, al ser
// ambos scripts clásicos, comparten el mismo ámbito.
function initLogoSystem() {
    if (logoStarted) return;
    logoStarted = true;
    initLogos();
    if (shouldPlayIntro()) playIntro();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogoSystem);
} else {
    initLogoSystem();
}
