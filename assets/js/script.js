/* =========================================================
   ZetaWeb — lógica de la página
   ========================================================= */

/* ---------- Traducciones ---------- */
const translations = {
    es: {
        page_title: 'Diseño web en Zaragoza | Páginas web desde 80 € | ZetaWeb',
        skip_link: 'Saltar al contenido',
        menu_open: 'Abrir menú',
        menu_close: 'Cerrar menú',
        theme_toggle: 'Cambiar tema',
        logo_home: 'ZetaWeb — ir al inicio',
        lang_switch: 'Switch to English',
        nav_services: 'Servicios',
        nav_audience: 'Para quién',
        nav_projects: 'Proyectos',
        nav_process: 'Cómo trabajamos',
        nav_pricing: 'Tarifas',
        nav_faq: 'Preguntas',
        nav_about: 'Nosotros',
        nav_contact: 'Contacto',
        hero_eyebrow: 'Diseño web en Zaragoza · Disponibles para nuevos proyectos',
        hero_title: 'Diseño de páginas web en Zaragoza',
        hero_subtitle:
            'Creamos páginas web profesionales, rápidas y adaptadas al móvil para autónomos, pequeños negocios y empresas de Zaragoza y alrededores. Presupuesto cerrado desde 80 €, sin compromiso.',
        hero_cta: 'Pedir presupuesto',
        hero_cta_secondary: 'Ver proyectos web',
        cta_whatsapp: 'Escríbenos por WhatsApp',
        cta_call: 'Llamar al 615 906 268',
        stat_1_label: 'Clientes atendidos',
        stat_2_label: 'Zona de trabajo',
        stat_2_value: 'Zaragoza y alrededores',
        stat_3_label: 'Respuesta media',
        stat_3_value: 'Menos de 24 h',
        services_title: 'Servicios de diseño y desarrollo web en Zaragoza',
        services_subtitle:
            'Todo lo que necesitas para tener presencia online, desde la primera página hasta el mantenimiento del día a día.',
        service_1_title: 'Creación de páginas web',
        service_1_desc:
            'Diseñamos y programamos tu web desde cero, a medida de lo que haces, sin plantillas recicladas ni páginas cargadas de relleno.',
        service_2_title: 'Páginas web para autónomos y pequeños negocios',
        service_2_desc:
            'Una web sencilla y profesional donde explicar tus servicios, enseñar tu trabajo y que te puedan llamar en dos toques.',
        service_3_title: 'Rediseño de páginas web antiguas',
        service_3_desc:
            'Si tu web tiene años, la modernizamos: aspecto actual, carga rápida y un diseño responsive que funcione de verdad en el móvil.',
        service_4_title: 'Diseño UI/UX',
        service_4_desc:
            'Interfaces claras y fáciles de usar, pensadas para que quien entra encuentre lo que busca y acabe contactando contigo.',
        service_5_title: 'Desarrollo de aplicaciones móviles',
        service_5_desc:
            'Apps para iOS y Android cuando tu negocio necesita algo más que una web, con la publicación en Play Store incluida.',
        service_6_title: 'Mantenimiento web y códigos QR',
        service_6_desc:
            'Nos ocupamos de las actualizaciones, las copias de seguridad y los cambios de contenido. También hacemos códigos QR con seguimiento para cartas o escaparate.',
        audience_title: 'Páginas web para autónomos y pequeños negocios',
        audience_subtitle:
            'Trabajamos sobre todo con negocios pequeños de Zaragoza, donde una buena web se nota en el teléfono desde la primera semana.',
        audience_1_title: 'Autónomos y profesionales',
        audience_1_desc:
            'Trabajas por tu cuenta y ahora mismo sólo te encuentran por el boca a boca o por redes sociales. Te montamos un sitio propio que explique qué haces y facilite que te escriban.',
        audience_2_title: 'Pequeños negocios y comercios',
        audience_2_desc:
            'Tienes local y clientela, pero cuando alguien te busca en Google no aparece nada claro. Una web con tus servicios, horarios y contacto cambia esa primera impresión.',
        audience_3_title: 'Empresas con una web antigua',
        audience_3_desc:
            'La web se hizo hace años, se ve mal en el móvil y da pereza enseñarla. La renovamos partiendo de lo que ya tienes, sin empezar de cero si no hace falta.',
        audience_4_title: 'Clubes y asociaciones',
        audience_4_desc:
            'Equipos y entidades que necesitan publicar calendarios, resultados o actividades, y tenerlo todo ordenado en un mismo sitio.',
        audience_note_1: 'Si no te reconoces en ninguno, cuéntanoslo igual: puedes mirar nuestros',
        audience_note_services: 'servicios de diseño web',
        audience_note_2: ', los',
        audience_note_projects: 'proyectos que hemos publicado',
        audience_note_3: 'o los',
        audience_note_pricing: 'precios de las páginas web',
        projects_title: 'Proyectos de diseño web',
        projects_subtitle:
            'Portfolio de webs y aplicaciones publicadas y funcionando. Entra en cualquiera y juzga tú mismo.',
        project_barber_desc: 'Diseño web para una barbería: sus servicios y el contacto siempre a la vista.',
        project_tapicerias_desc:
            'Diseño web para una empresa de tapicería de Zaragoza, con sus trabajos, el presupuesto y un enlace directo a Instagram.',
        project_terma_desc:
            'Página web para una empresa de climatización: aire acondicionado, calefacción y ventilación, con petición de presupuesto.',
        project_quiro_desc:
            'Página web para un centro de quiromasaje de Zaragoza. Estamos con el rediseño: puedes comparar la actual con la versión nueva.',
        project_dominicos_desc:
            'Web para un club de baloncesto de Zaragoza, con sus equipos y categorías, también en pleno rediseño.',
        project_gestionateam_desc:
            'Aplicación web para entrenadores: gestión de equipos, entrenamientos y partidos desde el móvil.',
        project_basketstats_desc:
            'App Android publicada en Play Store para llevar las estadísticas en directo durante los partidos.',
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
        process_title: 'Cómo trabajamos',
        process_subtitle: 'Cuatro pasos, sin letra pequeña y sin sorpresas en la factura.',
        process_1_title: 'Nos cuentas tu idea',
        process_1_desc:
            'Por WhatsApp, por teléfono o con el formulario. Nos dices a qué te dedicas y qué esperas conseguir con la web.',
        process_2_title: 'Presupuesto cerrado',
        process_2_desc:
            'Te pasamos el precio, el plazo y lo que incluye antes de empezar. Si no te encaja, no hay compromiso ninguno.',
        process_3_title: 'Diseño y desarrollo',
        process_3_desc:
            'Trabajamos la web pensando primero en el móvil y te vamos enseñando avances para que puedas corregir sobre la marcha.',
        process_4_title: 'Publicación y soporte',
        process_4_desc:
            'La dejamos publicada y lista para que Google la encuentre. A partir de ahí puedes llevarla tú o dejarnos el mantenimiento.',
        pricing_title: 'Precios de páginas web',
        pricing_subtitle:
            'Precios de partida orientativos. El presupuesto final depende del alcance de cada proyecto.',
        price_from: 'desde',
        price_per_month: '/mes',
        price_cta: 'Pedir presupuesto',
        price_web_title: 'Página web',
        price_web_desc: 'Diseño y desarrollo a medida, con diseño responsive y preparada para buscadores.',
        price_app_title: 'App a medida',
        price_app_desc:
            'Aplicación para iOS y Android, con la licencia de publicación en Play Store incluida.',
        price_maintenance_title: 'Mantenimiento web',
        price_maintenance_desc: 'Actualizaciones de contenido, copias de seguridad y soporte continuo.',
        price_note:
            '¿Tu proyecto necesita algo distinto? Cuéntanoslo y te preparamos un presupuesto cerrado sin compromiso.',
        faq_title: 'Preguntas frecuentes sobre diseño web',
        faq_subtitle: 'Lo que nos preguntan casi siempre antes de empezar.',
        faq_1_q: '¿Cuánto cuesta hacer una página web?',
        faq_1_a:
            'Partimos de 80 € para una web sencilla de presentación. Antes de empezar te pasamos un presupuesto cerrado, para que sepas el precio exacto desde el principio. El importe final depende del número de páginas y de las funciones que necesites.',
        faq_2_q: '¿Cuánto se tarda en tener la web publicada?',
        faq_2_a:
            'Depende del tamaño del proyecto y, sobre todo, de lo rápido que llegue el material: textos, fotos y logo. Una web sencilla de presentación avanza rápido. El plazo concreto te lo damos junto con el presupuesto, antes de ponernos a trabajar.',
        faq_3_q: '¿Trabajáis con autónomos y negocios pequeños?',
        faq_3_a:
            'Es la mayor parte de lo que hacemos. Los proyectos del portfolio son de profesionales, negocios pequeños y clubes, no de grandes empresas, y las tarifas están pensadas para que una web deje de ser un gasto inalcanzable.',
        faq_4_q: '¿Trabajáis sólo en Zaragoza?',
        faq_4_a:
            'Trabajamos sobre todo con negocios de Zaragoza y alrededores, que es donde podemos vernos en persona si hace falta. Para el resto de Aragón, o más lejos, el proyecto se lleva igual de bien a distancia.',
        faq_5_q: 'Ya tengo una web antigua, ¿podéis rediseñarla?',
        faq_5_a:
            'Sí. El rediseño es parte de lo que hacemos: partimos de lo que ya tienes, conservamos lo que funciona y actualizamos el diseño, la velocidad y la versión móvil. Ahora mismo tenemos dos rediseños en curso.',
        faq_6_q: '¿Qué necesito para empezar?',
        faq_6_a:
            'Con que nos cuentes a qué te dedicas y qué quieres conseguir con la web es suficiente. Si tienes textos, fotos o logo, todo va más rápido; y si no los tienes, te ayudamos a prepararlos.',
        faq_7_q: '¿La página se verá bien en el móvil?',
        faq_7_a:
            'Sí. Diseñamos pensando primero en el móvil, porque es desde donde entra la mayoría de las visitas, y después comprobamos que se vea igual de bien en tablet y en ordenador.',
        faq_8_q: '¿Qué pasa después de publicar la web?',
        faq_8_a:
            'La web es tuya. Si quieres despreocuparte de las actualizaciones, las copias de seguridad y los cambios de contenido, tenemos mantenimiento por 50 € al mes; y si prefieres llevarla tú, también.',
        faq_9_q: '¿También hacéis aplicaciones móviles?',
        faq_9_a:
            'Sí, desarrollamos apps para iOS y Android desde 150 €, con la licencia de publicación en Play Store incluida. En el portfolio puedes ver BasketStats y GestionaTeam.',
        about_title: 'Sobre ZetaWeb',
        about_subtitle: 'Conoce al equipo detrás de ZetaWeb',
        about_desc:
            'Somos un equipo apasionado por la tecnología: Rubén Palacio e Ines Capdevila. Creamos páginas web y aplicaciones a medida para autónomos, pequeños negocios y empresas de Zaragoza, adaptándonos a lo que realmente necesitan y a lo que pueden gastarse. Nos gusta el trato directo: hablas con quien diseña y programa tu web, sin intermediarios ni departamentos de por medio. Cada cliente es para nosotros una oportunidad de aprender, crecer y aportar valor real a su negocio.',
        ruben_role: 'Desarrollador Full Stack',
        ines_role: 'Desarrollo de Negocio y Redes Sociales',
        contact_title: 'Contacto',
        contact_subtitle:
            'Cuéntanos tu proyecto por WhatsApp o rellena el formulario. Te respondemos normalmente en menos de 24 horas, sin compromiso.',
        contact_info: 'Información de Contacto',
        contact_portfolio: 'Portfolio online',
        contact_area:
            'Trabajamos con negocios de Zaragoza capital y alrededores, y también a distancia para el resto de Aragón.',
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
            'Diseño y creación de páginas web en Zaragoza para autónomos, pequeños negocios y empresas. También desarrollamos aplicaciones móviles y mantenemos webs ya publicadas.',
        foot_services: 'Servicios de diseño web',
        foot_audience: 'Páginas web para autónomos',
        foot_projects: 'Proyectos de diseño web',
        foot_process: 'Cómo trabajamos',
        foot_pricing: 'Precios de páginas web',
        foot_faq: 'Preguntas frecuentes',
        foot_about: 'Sobre ZetaWeb',
        foot_contact: 'Contacto',
        footer_copyright: '© 2026 ZetaWeb. Todos los derechos reservados.',
        chat_open_label: '¿Hablamos? Abrir chat de contacto',
        chat_close_label: 'Cerrar chat',
        chat_bubble: '¿Hablamos?',
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
        page_title: 'Web design in Zaragoza | Websites from €80 | ZetaWeb',
        skip_link: 'Skip to content',
        menu_open: 'Open menu',
        menu_close: 'Close menu',
        theme_toggle: 'Toggle theme',
        logo_home: 'ZetaWeb — go to home',
        lang_switch: 'Cambiar a español',
        nav_services: 'Services',
        nav_audience: 'Who we help',
        nav_projects: 'Projects',
        nav_process: 'How we work',
        nav_pricing: 'Pricing',
        nav_faq: 'FAQ',
        nav_about: 'About',
        nav_contact: 'Contact',
        hero_eyebrow: 'Web design in Zaragoza · Available for new projects',
        hero_title: 'Web design in Zaragoza',
        hero_subtitle:
            'We build professional, fast, mobile-ready websites for freelancers, small businesses and companies in Zaragoza and the surrounding area. Fixed quotes from €80, no strings attached.',
        hero_cta: 'Request a quote',
        hero_cta_secondary: 'See our web projects',
        cta_whatsapp: 'Message us on WhatsApp',
        cta_call: 'Call +34 615 906 268',
        stat_1_label: 'Clients served',
        stat_2_label: 'Where we work',
        stat_2_value: 'Zaragoza and around',
        stat_3_label: 'Average reply',
        stat_3_value: 'Under 24 h',
        services_title: 'Web design and development services in Zaragoza',
        services_subtitle:
            'Everything you need for a proper online presence, from the first page to the day-to-day upkeep.',
        service_1_title: 'Website creation',
        service_1_desc:
            'We design and build your site from scratch, tailored to what you do — no recycled templates, no filler pages.',
        service_2_title: 'Websites for freelancers and small businesses',
        service_2_desc:
            'A simple, professional site to explain your services, show your work and let people reach you in two taps.',
        service_3_title: 'Redesign of dated websites',
        service_3_desc:
            'If your site is a few years old, we modernise it: current look, fast loading and a responsive design that really works on the phone.',
        service_4_title: 'UI/UX design',
        service_4_desc:
            'Clear, easy interfaces, built so visitors find what they came for and end up getting in touch.',
        service_5_title: 'Mobile app development',
        service_5_desc:
            'iOS and Android apps for when your business needs more than a website, Play Store publishing included.',
        service_6_title: 'Website maintenance and QR codes',
        service_6_desc:
            'We take care of updates, backups and content changes. We also make trackable QR codes for menus or your shop window.',
        audience_title: 'Websites for freelancers and small businesses',
        audience_subtitle:
            'We mostly work with small businesses in Zaragoza, where a good website shows up in the phone line within the first week.',
        audience_1_title: 'Freelancers and professionals',
        audience_1_desc:
            'You work on your own and right now people only find you by word of mouth or social media. We set you up with a place of your own that explains what you do and makes it easy to write to you.',
        audience_2_title: 'Small businesses and shops',
        audience_2_desc:
            'You have a shop and regulars, but when someone searches for you on Google nothing clear shows up. A site with your services, opening hours and contact details changes that first impression.',
        audience_3_title: 'Companies with a dated website',
        audience_3_desc:
            'The site was built years ago, looks poor on mobile and you would rather not show it. We refresh it starting from what you have, without rebuilding from zero unless it is needed.',
        audience_4_title: 'Clubs and associations',
        audience_4_desc:
            'Teams and organisations that need to publish fixtures, results or activities and keep everything in one place.',
        audience_note_1: 'If none of these sounds like you, tell us anyway: you can look at our',
        audience_note_services: 'web design services',
        audience_note_2: ', the',
        audience_note_projects: 'projects we have published',
        audience_note_3: 'or the',
        audience_note_pricing: 'website prices',
        projects_title: 'Web design projects',
        projects_subtitle:
            'A portfolio of websites and apps that are live and running. Open any of them and judge for yourself.',
        project_barber_desc: 'Web design for a barbershop: its services and contact details always in view.',
        project_tapicerias_desc:
            'Web design for an upholstery company in Zaragoza, with their work, quotes and a direct link to Instagram.',
        project_terma_desc:
            'Website for an air conditioning company: cooling, heating and ventilation, with a quote request form.',
        project_quiro_desc:
            'Website for a massage therapy centre in Zaragoza. The redesign is under way: you can compare the current site with the new version.',
        project_dominicos_desc:
            'Website for a basketball club in Zaragoza, with its teams and age groups, also being redesigned right now.',
        project_gestionateam_desc:
            'Web app for coaches: managing squads, training sessions and games from the phone.',
        project_basketstats_desc:
            'Android app published on the Play Store for keeping live statistics during games.',
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
        process_title: 'How we work',
        process_subtitle: 'Four steps, no small print and no surprises on the invoice.',
        process_1_title: 'You tell us your idea',
        process_1_desc:
            'On WhatsApp, over the phone or through the form. You tell us what you do and what you expect the site to bring you.',
        process_2_title: 'A fixed quote',
        process_2_desc:
            'We send you the price, the timeline and what it covers before starting. If it does not suit you, there is no commitment at all.',
        process_3_title: 'Design and development',
        process_3_desc:
            'We build the site mobile-first and show you progress along the way, so you can correct course as we go.',
        process_4_title: 'Launch and support',
        process_4_desc:
            'We publish it, ready for Google to find. From there you can run it yourself or leave the maintenance to us.',
        pricing_title: 'Website prices',
        pricing_subtitle: 'Indicative starting prices. The final quote depends on the scope of each project.',
        price_from: 'from',
        price_per_month: '/month',
        price_cta: 'Request a quote',
        price_web_title: 'Website',
        price_web_desc: 'Custom design and development, fully responsive and prepared for search engines.',
        price_app_title: 'Custom app',
        price_app_desc: 'An iOS and Android application, Play Store publishing licence included.',
        price_maintenance_title: 'Website maintenance',
        price_maintenance_desc: 'Content updates, backups and ongoing support.',
        price_note:
            'Need something different? Tell us about it and we will put together a fixed quote, no strings attached.',
        faq_title: 'Frequently asked questions about web design',
        faq_subtitle: 'What people almost always ask us before starting.',
        faq_1_q: 'How much does a website cost?',
        faq_1_a:
            'We start at €80 for a simple presentation site. Before any work begins we send you a fixed quote, so you know the exact price from the start. The final figure depends on how many pages and features you need.',
        faq_2_q: 'How long does it take to get the site live?',
        faq_2_a:
            'It depends on the size of the project and, above all, on how quickly the material arrives: texts, photos and logo. A simple presentation site moves fast. We give you the specific timeline together with the quote, before starting work.',
        faq_3_q: 'Do you work with freelancers and small businesses?',
        faq_3_a:
            'That is most of what we do. The projects in the portfolio belong to professionals, small businesses and clubs, not large companies, and the prices are set so a website stops being out of reach.',
        faq_4_q: 'Do you only work in Zaragoza?',
        faq_4_a:
            'We mostly work with businesses in Zaragoza and the surrounding area, where we can meet in person if it helps. For the rest of Aragón, or further away, the project runs just as well remotely.',
        faq_5_q: 'I already have an old website, can you redesign it?',
        faq_5_a:
            'Yes. Redesign is part of what we do: we start from what you have, keep what works and update the design, the speed and the mobile version. We have two redesigns in progress right now.',
        faq_6_q: 'What do I need to get started?',
        faq_6_a:
            'Just tell us what you do and what you want the site to achieve. If you have texts, photos or a logo, everything moves faster; and if you do not, we help you put them together.',
        faq_7_q: 'Will the page look good on mobile?',
        faq_7_a:
            'Yes. We design mobile-first, because that is where most visits come from, and then we check it looks just as good on tablet and desktop.',
        faq_8_q: 'What happens after the site goes live?',
        faq_8_a:
            'The site is yours. If you would rather not deal with updates, backups and content changes, we offer maintenance at €50 a month; and if you prefer to run it yourself, that works too.',
        faq_9_q: 'Do you also build mobile apps?',
        faq_9_a:
            'Yes, we develop iOS and Android apps from €150, with the Play Store publishing licence included. You can see BasketStats and GestionaTeam in the portfolio.',
        about_title: 'About ZetaWeb',
        about_subtitle: 'Get to know the team behind ZetaWeb',
        about_desc:
            'We are a team passionate about technology: Rubén Palacio and Ines Capdevila. We build tailor-made websites and apps for freelancers, small businesses and companies in Zaragoza, adapting to what they actually need and what they can spend. We like working directly: you talk to the people who design and code your site, with no middlemen and no departments in between. Each client is an opportunity for us to learn, grow and add real value to their business.',
        ruben_role: 'Full Stack Developer',
        ines_role: 'Business Development & Social Media',
        contact_title: 'Contact',
        contact_subtitle:
            'Tell us about your project on WhatsApp or fill in the form. We usually reply within 24 hours, no strings attached.',
        contact_info: 'Contact Information',
        contact_portfolio: 'Online portfolio',
        contact_area:
            'We work with businesses in Zaragoza and the surrounding area, and remotely across the rest of Aragón.',
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
        form_network_error: 'We couldn\'t send your message. Please try again or email us directly.',
        footer_description:
            'Web design and development in Zaragoza for freelancers, small businesses and companies. We also build mobile apps and maintain websites that are already live.',
        foot_services: 'Web design services',
        foot_audience: 'Websites for freelancers',
        foot_projects: 'Web design projects',
        foot_process: 'How we work',
        foot_pricing: 'Website prices',
        foot_faq: 'Frequently asked questions',
        foot_about: 'About ZetaWeb',
        foot_contact: 'Contact',
        footer_copyright: '© 2026 ZetaWeb. All rights reserved.',
        chat_open_label: 'Shall we talk? Open contact chat',
        chat_close_label: 'Close chat',
        chat_bubble: 'Shall we talk?',
        chat_welcome: 'Hello! Who would you like to contact?',
        chat_contact_selected: 'Great, you\'ve chosen to contact',
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
const WHATSAPP_URL =
    'https://wa.me/34615906268?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20una%20p%C3%A1gina%20web';

const contacts = {
    ruben: {
        name: 'Rubén Palacio',
        whatsapp: WHATSAPP_URL,
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
    // Sólo cambiamos de idioma si el visitante lo ha pedido con el botón. Antes
    // se miraba navigator.language, y eso hacía que Googlebot —que rastrea en
    // en-US— indexara el título, el H1 y el lang de la página en inglés,
    // justo cuando lo que nos interesa es posicionar en español.
    const stored = localStorage.getItem(STORAGE_LANG);
    return stored === 'en' ? 'en' : 'es';
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
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884',
    phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
    email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    linkedin: 'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z',
    github: 'M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z',
    instagram: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3z'
};

// Cada método se muestra sólo si el contacto tiene ese dato.
const CHAT_METHODS = [
    { key: 'whatsapp', label: () => 'WhatsApp', text: () => 'WhatsApp', url: (c) => c.whatsapp },
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
