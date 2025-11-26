// DOM Elements
const header = document.getElementById('header');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuButton = document.getElementById('close-menu-button');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
const contactForm = document.getElementById('contact-form');
const submitButton = document.querySelector('.submit-button');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const languageToggle = document.getElementById('language-toggle');
const mobileLanguageToggle = document.getElementById('mobile-language-toggle');
const whatsappButton = document.getElementById('whatsapp-button');
const chatModal = document.getElementById('chat-modal');
const chatBody = document.getElementById('chat-body');
const chatOverlay = document.getElementById('chat-overlay');

// Translations
const translations = {
    es: {
        nav_services: "Servicios",
        nav_about: "Nosotros",
        nav_contact: "Contacto",
        nav_qr_tool: "Herramienta QR",
        hero_title: "Estudio de Innovación Digital",
        hero_subtitle: "Creamos soluciones digitales personalizadas, desde aplicaciones web y móviles hasta códigos QR interactivos y diseños visuales impresionantes.",
        hero_cta: "Inicia Tu Proyecto",
        services_title: "Nuestros Servicios",
        services_subtitle: "Ofrecemos una amplia gama de servicios digitales para dar vida a tus ideas.",
        service_1_title: "Desarrollo Web",
        service_1_desc: "Sitios web y aplicaciones web personalizadas construidas con tecnologías modernas.",
        service_2_title: "Soluciones QR",
        service_2_desc: "Códigos QR personalizados con seguimiento, análisis y contenido dinámico.",
        service_3_title: "Diseño UI/UX",
        service_3_desc: "Interfaces modernas e intuitivas diseñadas pensando en el usuario.",
        about_title: "Sobre Nosotros",
        about_subtitle: "Conoce al equipo detrás de ZPX Studio",
        about_desc: "Somos dos amigos apasionados por la informática, Rubén Palacio y David Giménez, fundadores de nuestro propio estudio de innovación digital. Aunque somos jóvenes en el sector, nos entusiasma crear soluciones digitales a medida para pequeñas y medianas empresas, adaptándonos a lo que realmente necesitan. Nos dedicamos a combinar creatividad, tecnología y compromiso para ayudar a que cada proyecto destaque y cumpla con sus objetivos en el mundo digital. Cada cliente es para nosotros una oportunidad de aprender, crecer y aportar valor real a su negocio.",
        ruben_name: "Rubén Palacio",
        ruben_role: "Desarrollador Full Stack",
        david_name: "David Giménez",
        david_role: "Diseñador UI/UX",
        contact_title: "Ponte en Contacto",
        contact_subtitle: "¿Listo para comenzar tu proyecto? Contáctanos hoy.",
        contact_info: "Información de Contacto",
        form_send_message: "Envíanos un mensaje",
        form_submit: "Enviar Mensaje",
        form_name: "Nombre",
        form_email: "Correo Electrónico",
        form_subject: "Asunto",
        projects_title: "Nuestros Proyectos",
        projects_subtitle: "Descubre algunos de nuestros trabajos más recientes",
        project_button: "Ver Proyecto",
        project_app_button: "Ver App",
        project_1_title: "BarberShop",
        project_1_desc: "Sitio web moderno para barbería con sistema de reservas online.",
        project_2_title: "BasketStats",
        project_2_desc: "App para Estadísticas de Baloncesto.",
        form_message: "Mensaje",
        form_submitting: "Enviando...",
        form_success: "Mensaje Enviado",
        footer_description: "Creamos soluciones digitales personalizadas, desde aplicaciones web hasta códigos QR interactivos y diseños visuales impresionantes.",
        footer_copyright: "© 2025 ZPX Studio. Todos los derechos reservados.",
        chat_title: "ZPX Studio",
        chat_welcome: "¡Hola! ¿Con quién deseas contactar?",
        chat_contact_selected: "Perfecto, has seleccionado contactar con",
        chat_contact_methods: "¿Cómo deseas contactar?",
        chat_redirecting: "Perfecto, redirigiendo a",
        chat_call: "Llamar",
        chat_email: "Email",
        chat_open: "Abrir",
        chat_phone_call: "Llamada telefónica",
        chat_email_method: "Correo electrónico",
        form_error_name: "El nombre es requerido",
        form_error_email: "El correo electrónico es requerido",
        form_error_email_invalid: "Dirección de correo electrónico inválida",
        form_error_subject: "El asunto es requerido",
        form_error_message: "El mensaje es requerido",
        form_success_message: "¡Tu mensaje ha sido enviado exitosamente!"
    },
    en: {
        nav_services: "Services",
        nav_about: "About Us",
        nav_contact: "Contact",
        nav_qr_tool: "QR Tool",
        hero_title: "Digital Innovation Studio",
        hero_subtitle: "We create custom digital solutions, from web and mobile applications to interactive QR codes and stunning visual designs.",
        hero_cta: "Start Your Project",
        services_title: "Our Services",
        services_subtitle: "We offer a comprehensive range of digital services to bring your ideas to life.",
        service_1_title: "Web Development",
        service_1_desc: "Custom websites and web applications built with modern technologies.",
        service_2_title: "QR Solutions",
        service_2_desc: "Custom QR codes with tracking, analytics and dynamic content.",
        service_3_title: "UI/UX Design",
        service_3_desc: "Modern, intuitive interfaces designed with the user in mind.",
        about_title: "About Us",
        about_subtitle: "Get to know the team behind ZPX Studio",
        about_desc: "We are two friends passionate about computing, Rubén Palacio and David Giménez, founders of our own digital innovation studio. Although we are young in the sector, we are excited to create custom digital solutions for small and medium-sized businesses, adapting to what they really need. We are dedicated to combining creativity, technology and commitment to help each project stand out and meet its objectives in the digital world. Each client is for us an opportunity to learn, grow and add real value to their business.",
        ruben_name: "Rubén Palacio",
        ruben_role: "Full Stack Developer",
        david_name: "David Giménez",
        david_role: "UI/UX Designer",
        contact_title: "Get In Touch",
        contact_subtitle: "Ready to start your project? Contact us today.",
        contact_info: "Contact Information",
        form_send_message: "Send us a message",
        form_submit: "Send Message",
        form_name: "Name",
        form_email: "Email",
        form_subject: "Subject",
        projects_title: "Our Projects",
        projects_subtitle: "Discover some of our recent works",
        project_button: "View Project",
        project_app_button: "View App",
        project_1_title: "BarberShop",
        project_1_desc: "Modern website for barbershop with online booking system.",
        project_2_title: "BasketStats",
        project_2_desc: "Basketball Statistics App.",
        form_message: "Message",
        form_submitting: "Sending...",
        form_success: "Message Sent",
        footer_description: "We create custom digital solutions, from web applications to interactive QR codes and stunning visual designs.",
        footer_copyright: "© 2025 ZPX Studio. All rights reserved.",
        chat_title: "ZPX Studio",
        chat_welcome: "Hello! Who would you like to contact?",
        chat_contact_selected: "Great, you've selected to contact",
        chat_contact_methods: "How would you like to contact?",
        chat_redirecting: "Great, redirecting to",
        chat_call: "Call",
        chat_email: "Email",
        chat_open: "Open",
        chat_phone_call: "Phone call",
        chat_email_method: "Email",
        form_error_name: "Name is required",
        form_error_email: "Email is required",
        form_error_email_invalid: "Invalid email address",
        form_error_subject: "Subject is required",
        form_error_message: "Message is required",
        form_success_message: "Your message has been sent successfully!"
    }
};

// Current language - starting with Spanish
let currentLanguage = 'es';

// Contact information
const contacts = {
    ruben: {
        name: "Rubén Palacio",
        phone: "+34615906268",
        email: "rubenpalsis11@gmail.com",
        linkedin: "https://www.linkedin.com/in/ruben-palacio-sisamon-4bb30425a/",
        github: "https://github.com/RubenPalSis",
        hasInstagram: false
    },
    david: {
        name: "David Giménez",
        phone: "+34691467184",
        email: "davidgiga18@gmail.com",
        instagram: "https://www.instagram.com/caletacreativos/",
        linkedin: "https://www.linkedin.com/in/davidgiga18/",
        hasInstagram: true
    }
};

let currentContact = null;

// Initialize the application
function init() {
    // Scroll event listener for header
    window.addEventListener('scroll', handleScroll);
    
    // Mobile menu event listeners
    mobileMenuButton.addEventListener('click', openMobileMenu);
    closeMenuButton.addEventListener('click', closeMobileMenu);
    
    // Close mobile menu when clicking on a link
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Contact form submission
    contactForm.addEventListener('submit', handleFormSubmit);
        
    // Language toggle
    languageToggle.addEventListener('click', toggleLanguage);
    mobileLanguageToggle.addEventListener('click', toggleLanguage);
    
    // Initialize WhatsApp chat
    initWhatsAppChat();
    
    // Initialize with Spanish language
    updateLanguage();
}

// Handle scroll for header styling
function handleScroll() {
    if (window.scrollY > 10) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

// Mobile menu functions
function openMobileMenu() {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
}

// Contact form handling
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    if (!validateForm(name, email, subject, message)) {
        return;
    }
    
    const submitBtn = contactForm.querySelector('.submit-button');
    submitBtn.disabled = true;
    submitBtn.textContent = translations[currentLanguage].form_submitting;
    
    setTimeout(() => {
        contactForm.reset();
        showToast(translations[currentLanguage].form_success_message, 'success');
        submitBtn.disabled = false;
        submitBtn.textContent = translations[currentLanguage].form_submit;
    }, 2000);
}

function validateForm(name, email, subject, message) {
    let isValid = true;
    
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
    });
    
    if (!name) {
        showFieldError('name', translations[currentLanguage].form_error_name);
        isValid = false;
    }
    
    if (!email) {
        showFieldError('email', translations[currentLanguage].form_error_email);
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('email', translations[currentLanguage].form_error_email_invalid);
        isValid = false;
    }
    
    if (!subject) {
        showFieldError('subject', translations[currentLanguage].form_error_subject);
        isValid = false;
    }
    
    if (!message) {
        showFieldError('message', translations[currentLanguage].form_error_message);
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
        const field = document.getElementById(fieldId);
        errorElement = document.createElement('div');
        errorElement.id = `${fieldId}-error`;
        errorElement.className = 'error-message';
        field.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Toast notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    
    const toastContent = document.querySelector('.toast-content');
    if (type === 'error') {
        toastContent.style.backgroundColor = '#fef2f2';
        toastContent.style.borderColor = '#fecaca';
        toastContent.style.color = '#dc2626';
    } else if (type === 'success') {
        toastContent.style.backgroundColor = '#f0fdf4';
        toastContent.style.borderColor = '#bbf7d0';
        toastContent.style.color = '#16a34a';
    } else {
        toastContent.style.backgroundColor = '';
        toastContent.style.borderColor = '';
        toastContent.style.color = '';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Language toggle
function toggleLanguage() {
    currentLanguage = currentLanguage === 'es' ? 'en' : 'es';
    updateLanguage();
    languageToggle.textContent = currentLanguage === 'es' ? 'ES/EN' : 'EN/ES';
    mobileLanguageToggle.textContent = currentLanguage === 'es' ? 'ES/EN' : 'EN/ES';
}

// WhatsApp Chat Functionality
function initWhatsAppChat() {
    whatsappButton.addEventListener('click', toggleChat);
    chatOverlay.addEventListener('click', closeChat);
    
    chatModal.addEventListener('animationend', () => {
        if (chatModal.classList.contains('active')) {
            startConversation();
        }
    });
}

function toggleChat() {
    if (chatModal.classList.contains('active')) {
        closeChat();
    } else {
        openChat();
    }
}

function openChat() {
    chatModal.classList.add('active');
    chatOverlay.classList.add('active');
}

function closeChat() {
    chatModal.classList.remove('active');
    chatOverlay.classList.remove('active');
    setTimeout(() => {
        chatBody.innerHTML = '';
        currentContact = null;
    }, 300);
}

function startConversation() {
    addBotMessage(translations[currentLanguage].chat_welcome);
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        showContactOptions();
    }, 1000);
}

function addBotMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.textContent = text;
    chatBody.appendChild(messageDiv);
    scrollToBottom();
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.textContent = text;
    chatBody.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatBody.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function showContactOptions() {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';
    
    const rubenButton = document.createElement('button');
    rubenButton.className = 'option-button';
    rubenButton.textContent = contacts.ruben.name;
    rubenButton.addEventListener('click', () => selectContact('ruben'));
    
    const davidButton = document.createElement('button');
    davidButton.className = 'option-button';
    davidButton.textContent = contacts.david.name;
    davidButton.addEventListener('click', () => selectContact('david'));
    
    optionsDiv.appendChild(rubenButton);
    optionsDiv.appendChild(davidButton);
    
    chatBody.appendChild(optionsDiv);
    scrollToBottom();
}

function selectContact(contactKey) {
    currentContact = contacts[contactKey];
    addUserMessage(currentContact.name);
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        showContactMethods();
    }, 1000);
}

function showContactMethods() {
    const contact = currentContact;
    
    addBotMessage(`${translations[currentLanguage].chat_contact_selected} ${contact.name}. ${translations[currentLanguage].chat_contact_methods}`);
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'contact-options';
    
    const phoneOption = document.createElement('button');
    phoneOption.className = 'contact-option';
    phoneOption.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
        ${translations[currentLanguage].chat_call}
    `;
    phoneOption.addEventListener('click', () => selectContactMethod('phone'));
    
    const emailOption = document.createElement('button');
    emailOption.className = 'contact-option';
    emailOption.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        ${translations[currentLanguage].chat_email}
    `;
    emailOption.addEventListener('click', () => selectContactMethod('email'));
    
    const linkedinOption = document.createElement('button');
    linkedinOption.className = 'contact-option';
    linkedinOption.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
        LinkedIn
    `;
    linkedinOption.addEventListener('click', () => selectContactMethod('linkedin'));
    
    optionsDiv.appendChild(phoneOption);
    optionsDiv.appendChild(emailOption);
    optionsDiv.appendChild(linkedinOption);
    
    if (contact.hasInstagram) {
        const instagramOption = document.createElement('button');
        instagramOption.className = 'contact-option';
        instagramOption.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3z"/>
            </svg>
            Instagram
        `;
        instagramOption.addEventListener('click', () => selectContactMethod('instagram'));
        optionsDiv.appendChild(instagramOption);
    }
    
    if (contact.github) {
        const githubOption = document.createElement('button');
        githubOption.className = 'contact-option';
        githubOption.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
            </svg>
            GitHub
        `;
        githubOption.addEventListener('click', () => selectContactMethod('github'));
        optionsDiv.appendChild(githubOption);
    }
    
    chatBody.appendChild(optionsDiv);
    scrollToBottom();
}

function selectContactMethod(method) {
    const contact = currentContact;
    let methodText = '';
    let redirectUrl = '';
    
    switch(method) {
        case 'phone':
            methodText = currentLanguage === 'es' ? 'Llamada telefónica' : 'Phone call';
            redirectUrl = `tel:${contact.phone}`;
            break;
        case 'email':
            methodText = translations[currentLanguage].chat_email_method;
            redirectUrl = `mailto:${contact.email}`;
            break;
        case 'linkedin':
            methodText = 'LinkedIn';
            redirectUrl = contact.linkedin;
            break;
        case 'instagram':
            methodText = 'Instagram';
            redirectUrl = contact.instagram;
            break;
        case 'github':
            methodText = 'GitHub';
            redirectUrl = contact.github;
            break;
    }
    
    addUserMessage(methodText);
    
    showTypingIndicator();
    
    setTimeout(() => {
        removeTypingIndicator();
        showRedirectButton(methodText, redirectUrl, contact.name);
    }, 1000);
}

function showRedirectButton(method, url, contactName) {
    addBotMessage(`${translations[currentLanguage].chat_redirecting} ${method} ${currentLanguage === 'es' ? 'de' : 'for'} ${contactName}`);
    
    const redirectButton = document.createElement('button');
    redirectButton.className = 'redirect-button';
    redirectButton.textContent = `${translations[currentLanguage].chat_open} ${method}`;
    
    redirectButton.addEventListener('click', () => {
        window.open(url, '_blank');
        closeChat();
    });
    
    chatBody.appendChild(redirectButton);
    scrollToBottom();
}

function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
}

function updateLanguage() {
    const t = translations[currentLanguage];
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks[0].textContent = t.nav_services;
    navLinks[1].textContent = t.nav_about;
    navLinks[2].textContent = t.nav_contact;
    
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks[0].textContent = t.nav_services;
    mobileNavLinks[1].textContent = t.nav_about;
    mobileNavLinks[2].textContent = t.nav_qr_tool;
    mobileNavLinks[3].textContent = t.nav_contact;
    
    // Update hero section
    document.querySelector('.hero-title').textContent = t.hero_title;
    document.querySelector('.hero-subtitle').textContent = t.hero_subtitle;
    document.querySelector('.cta-button').innerHTML = `${t.hero_cta} <svg class="arrow-icon" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>`;
    
    // Update services section
    document.querySelector('.services-section .section-title').textContent = t.services_title;
    document.querySelector('.services-section .section-subtitle').textContent = t.services_subtitle;
    
    const serviceTitles = document.querySelectorAll('.service-title');
    serviceTitles[0].textContent = t.service_1_title;
    serviceTitles[1].textContent = t.service_2_title;
    serviceTitles[2].textContent = t.service_3_title;
    
    const serviceDescriptions = document.querySelectorAll('.service-description');
    serviceDescriptions[0].textContent = t.service_1_desc;
    serviceDescriptions[1].textContent = t.service_2_desc;
    serviceDescriptions[2].textContent = t.service_3_desc;
    
    // Update about section
    document.querySelector('.about-section .section-title').textContent = t.about_title;
    document.querySelector('.about-text p').textContent = t.about_desc;
    
    const founderNames = document.querySelectorAll('.founder-name');
    founderNames[0].textContent = t.ruben_name;
    founderNames[1].textContent = t.david_name;
    
    const founderRoles = document.querySelectorAll('.founder-role');
    founderRoles[0].textContent = t.ruben_role;
    founderRoles[1].textContent = t.david_role;
    
    // Update projects section
    document.querySelector('.projects-section .section-title').textContent = t.projects_title;
    document.querySelector('.projects-section .section-subtitle').textContent = t.projects_subtitle;
    
    const projectTitles = document.querySelectorAll('.project-title');
    projectTitles[0].textContent = t.project_1_title;
    projectTitles[1].textContent = t.project_2_title;
    
    const projectDescriptions = document.querySelectorAll('.project-description');
    projectDescriptions[0].textContent = t.project_1_desc;
    projectDescriptions[1].textContent = t.project_2_desc;
    
    const projectButtons = document.querySelectorAll('.project-button');
    projectButtons[0].innerHTML = `${t.project_button} <svg class="arrow-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>`;
    projectButtons[1].innerHTML = `${t.project_app_button} <svg class="arrow-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>`;
    
    // Update contact section
    document.querySelector('.contact-section .section-title').textContent = t.contact_title;
    document.querySelector('.contact-section .section-subtitle').textContent = t.contact_subtitle;
    document.querySelector('.contact-info h3').textContent = t.contact_info;
    document.querySelector('.contact-form-header h3').textContent = t.form_send_message;
    
    document.querySelector('label[for="name"]').textContent = t.form_name;
    document.querySelector('label[for="email"]').textContent = t.form_email;
    document.querySelector('label[for="subject"]').textContent = t.form_subject;
    document.querySelector('label[for="message"]').textContent = t.form_message;
    
    const submitBtn = document.querySelector('.submit-button');
    if (submitBtn) {
        submitBtn.textContent = t.form_submit;
    }
    
    // Update footer
    document.querySelector('.footer-description').textContent = t.footer_description;
    document.querySelector('.footer-bottom p').textContent = t.footer_copyright;
    
    // Update chat title
    document.querySelector('.chat-header h3').textContent = t.chat_title;
    
    // Update page title
    document.title = currentLanguage === 'es' ? 'ZPX Studio - Innovación Digital' : 'ZPX Studio - Digital Innovation';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
