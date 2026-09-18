/* =========================================================
   ZetaWeb — lógica de la página
   ========================================================= */

/* ---------- Traducciones ---------- */
const translations = {
    es: {
        page_title: 'ZetaWeb — Estudio de Innovación Digital',
        skip_link: 'Saltar al contenido',
        menu_open: 'Abrir menú',
        menu_close: 'Cerrar menú',
        theme_toggle: 'Cambiar tema',
        logo_home: 'ZetaWeb — ir al inicio',
        lang_switch: 'Switch to English',

        nav_services: 'Servicios',
        nav_projects: 'Proyectos',
        nav_pricing: 'Tarifas',
        nav_about: 'Nosotros',
        nav_contact: 'Contacto',

        hero_eyebrow: 'Disponibles para nuevos proyectos',
        hero_title: 'Estudio de Innovación Digital',
        hero_subtitle:
            'Creamos soluciones digitales personalizadas, desde aplicaciones web y móviles hasta códigos QR interactivos y diseños visuales impresionantes.',
        hero_cta: 'Inicia Tu Proyecto',
        hero_cta_secondary: 'Ver nuestro trabajo',
        stat_1_label: 'Clientes atendidos',
        stat_2_label: 'Plataformas',
        stat_2_value: 'Web · iOS · Android',
        stat_3_label: 'Respuesta media',
        stat_3_value: 'Menos de 24 h',

        services_title: 'Nuestros Servicios',
        services_subtitle: 'Ofrecemos una amplia gama de servicios digitales para dar vida a tus ideas.',
        service_1_title: 'Desarrollo Web',
        service_1_desc: 'Sitios web y aplicaciones web personalizadas construidas con tecnologías modernas.',
        service_2_title: 'Soluciones QR',
        service_2_desc: 'Códigos QR personalizados con seguimiento, análisis y contenido dinámico.',
        service_3_title: 'Diseño UI/UX',
        service_3_desc: 'Interfaces modernas e intuitivas diseñadas pensando en el usuario.',

        projects_title: 'Nuestros Proyectos',
        projects_subtitle: 'Descubre algunos de nuestros trabajos más recientes',
        btn_visit_site: 'Ver web',
        btn_new_version: 'Versión nueva',
        btn_instagram: 'Instagram',
        btn_open_app: 'Abrir app',
        btn_view_app: 'Ver en Play Store',
        tag_website: 'Página web',
        tag_android: 'App Android',
        tag_pwa: 'PWA iOS / Android',
        tag_maintenance: 'Mantenimiento',
        tag_redesign: 'Rediseño en curso',

        pricing_title: 'Tarifas',
        pricing_subtitle:
            'Precios de partida orientativos. El presupuesto final depende del alcance de cada proyecto.',
        price_from: 'desde',
        price_per_month: '/mes',
        price_cta: 'Pedir presupuesto',
        price_web_title: 'Página web',
        price_web_desc: 'Diseño y desarrollo a medida, adaptado a móvil y preparado para buscadores.',
        price_app_title: 'App a medida',
        price_app_desc:
            'Aplicación para iOS y Android, con la licencia de publicación en Play Store incluida.',
        price_maintenance_title: 'Mantenimiento web',
        price_maintenance_desc: 'Actualizaciones de contenido, copias de seguridad y soporte continuo.',
        price_note:
            '¿Tu proyecto necesita algo distinto? Cuéntanoslo y te preparamos un presupuesto cerrado sin compromiso.',

        about_title: 'Sobre Nosotros',
        about_subtitle: 'Conoce al equipo detrás de ZetaWeb',
        about_desc:
            'Somos un equipo apasionado por la tecnología: Rubén Palacio e Ines Capdevila. Nos entusiasma crear soluciones digitales a medida para pequeñas y medianas empresas, adaptándonos a lo que realmente necesitan. Combinamos creatividad, tecnología y compromiso para que cada proyecto destaque y cumpla sus objetivos en el mundo digital. Cada cliente es para nosotros una oportunidad de aprender, crecer y aportar valor real a su negocio.',
        ruben_role: 'Desarrollador Full Stack',
        ines_role: 'Desarrollo de Negocio y Redes Sociales',

        contact_title: 'Ponte en Contacto',
        contact_subtitle: '¿Listo para comenzar tu proyecto? Contáctanos hoy.',
        contact_info: 'Información de Contacto',
        contact_portfolio: 'Portfolio online',
        form_send_message: 'Envíanos un mensaje',
        form_name: 'Nombre',
        form_email: 'Correo Electrónico',
        form_subject: 'Asunto',
        form_message: 'Mensaje',
        form_submit: 'Enviar Mensaje',
        form_submitting: 'Enviando…',
        form_error_name: 'El nombre es obligatorio',
        form_error_email: 'El correo electrónico es obligatorio',
        form_error_email_invalid: 'Dirección de correo electrónico no válida',
        form_error_subject: 'El asunto es obligatorio',
        form_error_message: 'El mensaje es obligatorio',
        form_success_message: '¡Tu mensaje se ha enviado correctamente!',
        form_network_error: 'No hemos podido enviar el mensaje. Inténtalo de nuevo o escríbenos por email.',

        footer_description:
            'Creamos soluciones digitales personalizadas, desde aplicaciones web hasta códigos QR interactivos y diseños visuales impresionantes.',
        footer_copyright: '© 2025 ZetaWeb. Todos los derechos reservados.',

        chat_open_label: 'Abrir chat de contacto',
        chat_close_label: 'Cerrar chat',
        chat_welcome: '¡Hola! ¿Con quién deseas contactar?',
        chat_contact_selected: 'Perfecto, has seleccionado contactar con',
        chat_contact_methods: '¿Cómo deseas contactar?',
        chat_redirecting: 'Perfecto, abriendo',
        chat_open: 'Abrir',
        chat_call: 'Llamar',
        chat_email: 'Email',
        chat_phone_call: 'Llamada telefónica',
        chat_email_method: 'Correo electrónico',
        chat_of: 'de'
    },

    en: {
        page_title: 'ZetaWeb — Digital Innovation Studio',
        skip_link: 'Skip to content',
        menu_open: 'Open menu',
        menu_close: 'Close menu',
        theme_toggle: 'Toggle theme',
        logo_home: 'ZetaWeb — go to home',
        lang_switch: 'Cambiar a español',

        nav_services: 'Services',
        nav_projects: 'Projects',
        nav_pricing: 'Pricing',
        nav_about: 'About',
        nav_contact: 'Contact',

        hero_eyebrow: 'Available for new projects',
        hero_title: 'Digital Innovation Studio',
        hero_subtitle:
            'We create custom digital solutions, from web and mobile applications to interactive QR codes and stunning visual designs.',
        hero_cta: 'Start Your Project',
        hero_cta_secondary: 'See our work',
        stat_1_label: 'Clients served',
        stat_2_label: 'Platforms',
        stat_2_value: 'Web · iOS · Android',
        stat_3_label: 'Average reply',
        stat_3_value: 'Under 24 h',

        services_title: 'Our Services',
        services_subtitle: 'We offer a comprehensive range of digital services to bring your ideas to life.',
        service_1_title: 'Web Development',
        service_1_desc: 'Custom websites and web applications built with modern technologies.',
        service_2_title: 'QR Solutions',
        service_2_desc: 'Custom QR codes with tracking, analytics and dynamic content.',
        service_3_title: 'UI/UX Design',
        service_3_desc: 'Modern, intuitive interfaces designed with the user in mind.',

        projects_title: 'Our Projects',
        projects_subtitle: 'Discover some of our most recent work',
        btn_visit_site: 'Visit site',
        btn_new_version: 'New version',
        btn_instagram: 'Instagram',
        btn_open_app: 'Open app',
        btn_view_app: 'View on Play Store',
        tag_website: 'Website',
        tag_android: 'Android app',
        tag_pwa: 'PWA iOS / Android',
        tag_maintenance: 'Maintenance',
        tag_redesign: 'Redesign in progress',

        pricing_title: 'Pricing',
        pricing_subtitle:
            'Indicative starting prices. The final quote depends on the scope of each project.',
        price_from: 'from',
        price_per_month: '/month',
        price_cta: 'Request a quote',
        price_web_title: 'Website',
        price_web_desc: 'Custom design and development, mobile-ready and prepared for search engines.',
        price_app_title: 'Custom app',
        price_app_desc: 'An iOS and Android application, Play Store publishing licence included.',
        price_maintenance_title: 'Website maintenance',
        price_maintenance_desc: 'Content updates, backups and ongoing support.',
        price_note:
            'Need something different? Tell us about it and we will put together a fixed quote, no strings attached.',

        about_title: 'About Us',
        about_subtitle: 'Get to know the team behind ZetaWeb',
        about_desc:
            'We are a team passionate about technology: Rubén Palacio and Ines Capdevila. We love building tailor-made digital solutions for small and medium-sized businesses, adapting to what they actually need. We combine creativity, technology and commitment so every project stands out and meets its goals in the digital world. Each client is an opportunity for us to learn, grow and add real value to their business.',
        ruben_role: 'Full Stack Developer',
        ines_role: 'Business Development & Social Media',

        contact_title: 'Get In Touch',
        contact_subtitle: 'Ready to start your project? Contact us today.',
        contact_info: 'Contact Information',
        contact_portfolio: 'Online portfolio',
        form_send_message: 'Send us a message',
        form_name: 'Name',
        form_email: 'Email',
        form_subject: 'Subject',
        form_message: 'Message',
        form_submit: 'Send Message',
        form_submitting: 'Sending…',
        form_error_name: 'Name is required',
        form_error_email: 'Email is required',
        form_error_email_invalid: 'Invalid email address',
        form_error_subject: 'Subject is required',
        form_error_message: 'Message is required',
        form_success_message: 'Your message has been sent successfully!',
        form_network_error: "We couldn't send your message. Please try again or email us directly.",

        footer_description:
            'We create custom digital solutions, from web applications to interactive QR codes and stunning visual designs.',
        footer_copyright: '© 2025 ZetaWeb. All rights reserved.',

        chat_open_label: 'Open contact chat',
        chat_close_label: 'Close chat',
        chat_welcome: 'Hello! Who would you like to contact?',
        chat_contact_selected: "Great, you've chosen to contact",
        chat_contact_methods: 'How would you like to get in touch?',
        chat_redirecting: 'Great, opening',
        chat_open: 'Open',
        chat_call: 'Call',
        chat_email: 'Email',
        chat_phone_call: 'Phone call',
        chat_email_method: 'Email',
        chat_of: 'for'
    }
};

/* ---------- Contactos ---------- */
const contacts = {
    ruben: {
        name: 'Rubén Palacio',
        phone: '+34615906268',
        email: 'rubenpalsis11@gmail.com',
        linkedin: 'https://www.linkedin.com/in/ruben-palacio-sisamon-4bb30425a/',
        github: 'https://github.com/RubenPalSis'
    },
    ines: {
        name: 'Ines Capdevila',
        phone: '+34656766857',
        email: 'Inesgiga18@gmail.com'
        // TODO: añadir linkedin / instagram de Ines cuando estén disponibles.
    }
};

/* ---------- Estado ---------- */
const STORAGE_LANG = 'zetaweb-lang';
const STORAGE_THEME = 'zetaweb-theme';

let currentLanguage = 'es';
let currentContact = null;

const t = (key) => translations[currentLanguage][key] ?? key;
const $ = (selector) => document.querySelector(selector);

/* ---------- Tema claro / oscuro ---------- */
function resolveInitialTheme() {
    const stored = localStorage.getItem(STORAGE_THEME);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_THEME, theme);
}

function toggleTheme() {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
}

/* ---------- Idioma ---------- */
function resolveInitialLanguage() {
    const stored = localStorage.getItem(STORAGE_LANG);
    if (stored === 'es' || stored === 'en') return stored;
    return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

function applyLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem(STORAGE_LANG, lang);
    document.documentElement.lang = lang;
    document.title = t('page_title');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const value = translations[lang][el.dataset.i18n];
        if (value !== undefined) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
        const value = translations[lang][el.dataset.i18nAriaLabel];
        if (value !== undefined) el.setAttribute('aria-label', value);
    });

    // El botón muestra el idioma al que cambiarías, no el activo.
    const target = lang === 'es' ? 'EN' : 'ES';
    ['#language-label', '#mobile-language-label'].forEach((sel) => {
        const el = $(sel);
        if (el) el.textContent = target;
    });
    ['#language-toggle', '#mobile-language-toggle'].forEach((sel) => {
        const el = $(sel);
        if (el) el.setAttribute('aria-label', t('lang_switch'));
    });

    // El menú móvil cambia de etiqueta según esté abierto o cerrado.
    const menuButton = $('#mobile-menu-button');
    if (menuButton) {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-label', t(isOpen ? 'menu_close' : 'menu_open'));
    }
}

function toggleLanguage() {
    applyLanguage(currentLanguage === 'es' ? 'en' : 'es');
}

/**
 * Muestra un panel y activa su transición. El reflujo intermedio es necesario:
 * el elemento viene de display:none y sin él el navegador no anima el cambio.
 */
function reveal(el, className) {
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add(className);
}

/* ---------- Cabecera y navegación ---------- */
function initHeader() {
    const header = $('#header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

function initScrollSpy() {
    const sections = [...document.querySelectorAll('main section[id]')];
    const links = new Map(
        [...document.querySelectorAll('.nav-link')].map((link) => [link.getAttribute('href').slice(1), link])
    );
    if (!sections.length || !links.size) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((link) => link.classList.remove('active'));
                links.get(entry.target.id)?.classList.add('active');
            });
        },
        { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
}

/* ---------- Menú móvil ---------- */
function initMobileMenu() {
    const menu = $('#mobile-menu');
    const scrim = $('#menu-scrim');
    const openButton = $('#mobile-menu-button');
    const closeButton = $('#close-menu-button');
    let closeTimer;

    const open = () => {
        // Si aún corría el cierre anterior, lo cancelamos: si no, su temporizador
        // ocultaría el velo dejando el menú abierto sin forma de cerrarlo tocando fuera.
        window.clearTimeout(closeTimer);
        reveal(menu, 'open');
        reveal(scrim, 'active');
        openButton.setAttribute('aria-expanded', 'true');
        openButton.setAttribute('aria-label', t('menu_close'));
        document.body.classList.add('no-scroll');
        closeButton.focus();
    };

    const close = ({ restoreFocus = true } = {}) => {
        menu.classList.remove('open');
        scrim.classList.remove('active');
        openButton.setAttribute('aria-expanded', 'false');
        openButton.setAttribute('aria-label', t('menu_open'));
        document.body.classList.remove('no-scroll');

        // Devolvemos el foco a quien abrió el menú, salvo al seguir un enlace.
        if (restoreFocus && menu.contains(document.activeElement)) openButton.focus();

        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
            menu.hidden = true;
            scrim.hidden = true;
        }, 350);
    };

    openButton.addEventListener('click', open);
    closeButton.addEventListener('click', () => close());
    scrim.addEventListener('click', () => close());
    document.querySelectorAll('.mobile-nav-link').forEach((link) =>
        link.addEventListener('click', () => close({ restoreFocus: false })));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu.classList.contains('open')) close();
    });
}

/* ---------- Animación al hacer scroll ---------- */
function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach((item) => item.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach((item) => observer.observe(item));
}

/* ---------- Formulario de contacto ---------- */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const field = document.getElementById(fieldId);
    if (!errorElement || !field) return;
    errorElement.textContent = message;
    errorElement.classList.add('show');
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', `${fieldId}-error`);
}

function clearFieldErrors() {
    document.querySelectorAll('.error-message').forEach((el) => {
        el.classList.remove('show');
        el.textContent = '';
    });
    document.querySelectorAll('[aria-invalid]').forEach((el) => {
        el.removeAttribute('aria-invalid');
        el.removeAttribute('aria-describedby');
    });
}

function validateForm({ name, email, subject, message }) {
    clearFieldErrors();
    let firstInvalid = null;

    const fail = (field, key) => {
        showFieldError(field, t(key));
        firstInvalid ??= field;
    };

    if (!name?.trim()) fail('name', 'form_error_name');
    if (!email?.trim()) fail('email', 'form_error_email');
    else if (!isValidEmail(email.trim())) fail('email', 'form_error_email_invalid');
    if (!subject?.trim()) fail('subject', 'form_error_subject');
    if (!message?.trim()) fail('message', 'form_error_message');

    if (firstInvalid) document.getElementById(firstInvalid).focus();
    return firstInvalid === null;
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const values = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
    };

    if (!validateForm(values)) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = t('form_submitting');

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error(`Formspree respondió ${response.status}`);

        form.reset();
        showToast(t('form_success_message'), 'success');
    } catch (error) {
        console.error('Error al enviar el formulario:', error);
        showToast(t('form_network_error'), 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = t('form_submit');
    }
}

/* ---------- Toast ---------- */
let toastTimer;

function showToast(message, type = 'info') {
    const toast = $('#toast');
    const content = toast.querySelector('.toast-content');

    $('#toast-message').textContent = message;
    content.classList.remove('is-error', 'is-success');
    if (type === 'error') content.classList.add('is-error');
    if (type === 'success') content.classList.add('is-success');

    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 5000);
}

/* ---------- Chat de contacto ---------- */
const CHAT_ICONS = {
    phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    linkedin: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z',
    github: 'M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z',
    instagram: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3z'
};

// Cada método se muestra sólo si el contacto tiene ese dato.
const CHAT_METHODS = [
    { key: 'phone', label: () => t('chat_call'), text: () => t('chat_phone_call'), url: (c) => `tel:${c.phone}` },
    { key: 'email', label: () => t('chat_email'), text: () => t('chat_email_method'), url: (c) => `mailto:${c.email}` },
    { key: 'linkedin', label: () => 'LinkedIn', text: () => 'LinkedIn', url: (c) => c.linkedin },
    { key: 'instagram', label: () => 'Instagram', text: () => 'Instagram', url: (c) => c.instagram },
    { key: 'github', label: () => 'GitHub', text: () => 'GitHub', url: (c) => c.github }
];

function chatIcon(key) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${CHAT_ICONS[key]}"/></svg>`;
}

function scrollChatToBottom() {
    const body = $('#chat-body');
    body.scrollTop = body.scrollHeight;
}

function addMessage(text, who) {
    const node = document.createElement('div');
    node.className = `message ${who}`;
    node.textContent = text;
    $('#chat-body').appendChild(node);
    scrollChatToBottom();
}

function showTypingIndicator() {
    const node = document.createElement('div');
    node.className = 'typing-indicator';
    node.id = 'typing-indicator';
    node.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    $('#chat-body').appendChild(node);
    scrollChatToBottom();
}

function removeTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
}

// Los pasos del chat van encadenados con temporizadores; hay que poder
// cortarlos al cerrar, o se ejecutarían sobre una conversación ya vaciada.
let chatStepTimers = [];
let chatCloseTimer;

function clearChatTimers() {
    chatStepTimers.forEach((id) => window.clearTimeout(id));
    chatStepTimers = [];
}

function afterTyping(callback, delay = 900) {
    showTypingIndicator();
    chatStepTimers.push(window.setTimeout(() => {
        removeTypingIndicator();
        callback();
    }, delay));
}

function startConversation() {
    if ($('#chat-body').childElementCount) return;
    addMessage(t('chat_welcome'), 'bot');
    afterTyping(showContactOptions);
}

function showContactOptions() {
    const wrapper = document.createElement('div');
    wrapper.className = 'options';

    Object.entries(contacts).forEach(([key, contact]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option-button';
        button.textContent = contact.name;
        button.addEventListener('click', () => selectContact(key));
        wrapper.appendChild(button);
    });

    $('#chat-body').appendChild(wrapper);
    scrollChatToBottom();
}

function selectContact(key) {
    currentContact = contacts[key];
    addMessage(currentContact.name, 'user');
    afterTyping(showContactMethods);
}

function showContactMethods() {
    const contact = currentContact;
    addMessage(`${t('chat_contact_selected')} ${contact.name}. ${t('chat_contact_methods')}`, 'bot');

    const wrapper = document.createElement('div');
    wrapper.className = 'contact-options';

    CHAT_METHODS.filter((method) => contact[method.key]).forEach((method) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'contact-option';
        button.innerHTML = `${chatIcon(method.key)}<span>${method.label()}</span>`;
        button.addEventListener('click', () => selectContactMethod(method));
        wrapper.appendChild(button);
    });

    $('#chat-body').appendChild(wrapper);
    scrollChatToBottom();
}

function selectContactMethod(method) {
    const contact = currentContact;
    const label = method.text();
    const url = method.url(contact);

    addMessage(label, 'user');
    afterTyping(() => showRedirectButton(label, url, contact.name));
}

function showRedirectButton(label, url, contactName) {
    addMessage(`${t('chat_redirecting')} ${label} ${t('chat_of')} ${contactName}`, 'bot');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'redirect-button';
    button.textContent = `${t('chat_open')} ${label}`;
    button.addEventListener('click', () => {
        window.open(url, '_blank', 'noopener');
        closeChat();
    });

    $('#chat-body').appendChild(button);
    scrollChatToBottom();
}

function openChat() {
    const modal = $('#chat-modal');
    const scrim = $('#chat-scrim');

    // Cancelamos un cierre a medias y arrancamos siempre de una conversación limpia.
    window.clearTimeout(chatCloseTimer);
    clearChatTimers();
    $('#chat-body').replaceChildren();
    currentContact = null;

    reveal(modal, 'active');
    reveal(scrim, 'active');
    $('#whatsapp-button').setAttribute('aria-expanded', 'true');
    startConversation();
}

function closeChat() {
    const modal = $('#chat-modal');
    const scrim = $('#chat-scrim');

    clearChatTimers();
    modal.classList.remove('active');
    scrim.classList.remove('active');
    $('#whatsapp-button').setAttribute('aria-expanded', 'false');

    window.clearTimeout(chatCloseTimer);
    chatCloseTimer = window.setTimeout(() => {
        modal.hidden = true;
        scrim.hidden = true;
    }, 280);
}

function initChat() {
    const modal = $('#chat-modal');
    $('#whatsapp-button').addEventListener('click', () => {
        modal.classList.contains('active') ? closeChat() : openChat();
    });
    $('#chat-close').addEventListener('click', closeChat);
    $('#chat-scrim').addEventListener('click', closeChat);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('active')) closeChat();
    });
}

/* ---------- Arranque ---------- */
let started = false;

function init() {
    // Idempotente a propósito: si init() corriera dos veces se duplicarían los
    // escuchadores y un solo clic abriría y cerraría el chat a la vez.
    if (started) return;
    started = true;

    applyTheme(resolveInitialTheme());
    applyLanguage(resolveInitialLanguage());

    initHeader();
    initScrollSpy();
    initMobileMenu();
    initReveal();
    initChat();

    $('#contact-form').addEventListener('submit', handleFormSubmit);
    $('#theme-toggle').addEventListener('click', toggleTheme);
    $('#mobile-theme-toggle').addEventListener('click', toggleTheme);
    $('#language-toggle').addEventListener('click', toggleLanguage);
    $('#mobile-language-toggle').addEventListener('click', toggleLanguage);
}

// Con defer el script corre antes de DOMContentLoaded, pero comprobamos el
// estado por si alguna vez se carga más tarde: así init() no se queda sin correr.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
