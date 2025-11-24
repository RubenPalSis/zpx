// DOM Elements
const header = document.getElementById('header');
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenuButton = document.getElementById('close-menu-button');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
const qrInput = document.getElementById('qr-input');
const generateQrButton = document.getElementById('generate-qr');
const qrResult = document.getElementById('qr-result');
const qrImage = document.getElementById('qr-image');
const downloadQrButton = document.getElementById('download-qr');
const contactForm = document.getElementById('contact-form');
const submitButton = document.getElementById('submit-button');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const languageToggle = document.getElementById('language-toggle');
const mobileLanguageToggle = document.getElementById('mobile-language-toggle');

// Translations
const translations = {
    es: {
        nav_services: "Servicios",
        nav_about: "Nosotros",
        nav_qr_tool: "Herramienta QR",
        nav_contact: "Contacto",
        hero_title: "Estudio de Innovación Digital",
        hero_subtitle: "Creamos soluciones digitales personalizadas, desde aplicaciones web y móviles hasta códigos QR interactivos y diseños visuales impresionantes.",
        hero_cta: "Inicia Tu Proyecto",
        services_title: "Nuestros Servicios",
        services_subtitle: "Ofrecemos una amplia gama de servicios digitales para dar vida a tus ideas.",
        service_1_title: "Desarrollo Web",
        service_1_desc: "Sitios web y aplicaciones web personalizadas construidas con tecnologías modernas.",
        service_2_title: "Aplicaciones Móviles",
        service_2_desc: "Aplicaciones móviles nativas y multiplataforma para iOS y Android.",
        service_3_title: "Soluciones QR",
        service_3_desc: "Códigos QR personalizados con seguimiento, análisis y contenido dinámico.",
        service_4_title: "Diseño UI/UX",
        service_4_desc: "Interfaces hermosas e intuitivas diseñadas pensando en el usuario.",
        about_title: "Sobre Nosotros",
        about_subtitle: "Conoce al equipo detrás de ZPX Studio",
        about_desc: "Somos un estudio de innovación digital fundado por Rubén Palacio y David Giménez. Con años de experiencia en desarrollo web, aplicaciones móviles y diseño digital, nos apasiona crear soluciones que marcan la diferencia.",
        ruben_name: "Rubén Palacio",
        ruben_role: "Desarrollador Full Stack",
        david_name: "David Giménez",
        david_role: "Diseñador UI/UX",
        qr_title: "Generador de Códigos QR",
        qr_subtitle: "Crea tu código QR personalizado en segundos",
        qr_input_placeholder: "Ingresa URL o texto",
        qr_generate_button: "Generar",
        qr_download_button: "Descargar QR",
        contact_title: "Ponte en Contacto",
        contact_subtitle: "¿Listo para comenzar tu proyecto? Contáctanos hoy.",
        contact_info: "Información de Contacto",
        form_submit: "Enviar Mensaje",
        form_name: "Nombre",
        form_email: "Correo Electrónico",
        form_subject: "Asunto",
        form_message: "Mensaje",
        form_submitting: "Enviando...",
        form_success: "Mensaje Enviado",
        footer_copyright: "© 2023 ZPX Studio. Todos los derechos reservados."
    },
    en: {
        nav_services: "Services",
        nav_about: "About",
        nav_qr_tool: "QR Tool",
        nav_contact: "Contact",
        hero_title: "Digital Innovation Studio",
        hero_subtitle: "We create custom digital solutions, from web and mobile applications to interactive QR codes and stunning visual designs.",
        hero_cta: "Start Your Project",
        services_title: "Our Services",
        services_subtitle: "We offer a comprehensive range of digital services to bring your ideas to life.",
        service_1_title: "Web Development",
        service_1_desc: "Custom websites and web applications built with modern technologies.",
        service_2_title: "Mobile Apps",
        service_2_desc: "Native and cross-platform mobile applications for iOS and Android.",
        service_3_title: "QR Solutions",
        service_3_desc: "Custom QR codes with tracking, analytics and dynamic content.",
        service_4_title: "UI/UX Design",
        service_4_desc: "Beautiful, intuitive interfaces designed with the user in mind.",
        about_title: "About Us",
        about_subtitle: "Get to know the team behind ZPX Studio",
        about_desc: "We are a digital innovation studio founded by Rubén Palacio and David Giménez. With years of experience in web development, mobile applications, and digital design, we're passionate about creating solutions that make a difference.",
        ruben_name: "Rubén Palacio",
        ruben_role: "Full Stack Developer",
        david_name: "David Giménez",
        david_role: "UI/UX Designer",
        qr_title: "QR Code Generator",
        qr_subtitle: "Create your custom QR code in seconds",
        qr_input_placeholder: "Enter URL or text",
        qr_generate_button: "Generate",
        qr_download_button: "Download QR Code",
        contact_title: "Get In Touch",
        contact_subtitle: "Ready to start your project? Contact us today.",
        contact_info: "Contact Information",
        form_submit: "Send Message",
        form_name: "Name",
        form_email: "Email",
        form_subject: "Subject",
        form_message: "Message",
        form_submitting: "Sending...",
        form_success: "Message Sent",
        footer_copyright: "© 2023 ZPX Studio. All rights reserved."
    }
};

// Current language - starting with Spanish
let currentLanguage = 'es';

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
    
    // QR Generator functionality
    generateQrButton.addEventListener('click', generateQRCode);
    qrInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            generateQRCode();
        }
    });
    
    // Download QR code
    downloadQrButton.addEventListener('click', downloadQRCode);
    
    // Contact form submission
    contactForm.addEventListener('submit', handleFormSubmit);
    
    // Language toggle
    languageToggle.addEventListener('click', toggleLanguage);
    mobileLanguageToggle.addEventListener('click', toggleLanguage);
    
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
}

function closeMobileMenu() {
    mobileMenu.classList.remove('open');
}

// QR Code functionality using Google Charts API
function generateQRCode() {
    const text = qrInput.value.trim();
    
    if (!text) {
        showToast('Por favor ingresa algún texto o URL', 'error');
        return;
    }
    
    try {
        // Usar API de Google Charts para generar QR
        const encodedText = encodeURIComponent(text);
        const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodedText}&choe=UTF-8`;
        
        qrImage.src = qrUrl;
        qrImage.alt = `Código QR para: ${text}`;
        qrResult.style.display = 'flex';
        showToast('Código QR generado exitosamente', 'success');
        
        // Guardar la URL para la descarga
        qrImage.dataset.downloadUrl = qrUrl;
    } catch (error) {
        console.error('Error generando QR:', error);
        showToast('Error generando código QR', 'error');
    }
}

function downloadQRCode() {
    const downloadUrl = qrImage.dataset.downloadUrl;
    
    if (!downloadUrl) {
        showToast('No hay código QR para descargar', 'error');
        return;
    }
    
    // Crear un enlace temporal para descargar la imagen
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = 'zpx-studio-qrcode.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    showToast('Código QR descargado', 'success');
}

// Contact form handling
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    // Validate form
    if (!validateForm(name, email, subject, message)) {
        return;
    }
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = translations[currentLanguage].form_submitting;
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        // Reset form
        contactForm.reset();
        
        // Show success message
        showToast('¡Tu mensaje ha sido enviado exitosamente!', 'success');
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = translations[currentLanguage].form_submit;
    }, 2000);
}

function validateForm(name, email, subject, message) {
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
    });
    
    // Validate name
    if (!name) {
        document.getElementById('name-error').textContent = currentLanguage === 'es' ? 'El nombre es requerido' : 'Name is required';
        document.getElementById('name-error').classList.add('show');
        isValid = false;
    }
    
    // Validate email
    if (!email) {
        document.getElementById('email-error').textContent = currentLanguage === 'es' ? 'El correo electrónico es requerido' : 'Email is required';
        document.getElementById('email-error').classList.add('show');
        isValid = false;
    } else if (!isValidEmail(email)) {
        document.getElementById('email-error').textContent = currentLanguage === 'es' ? 'Dirección de correo electrónico inválida' : 'Invalid email address';
        document.getElementById('email-error').classList.add('show');
        isValid = false;
    }
    
    // Validate subject
    if (!subject) {
        document.getElementById('subject-error').textContent = currentLanguage === 'es' ? 'El asunto es requerido' : 'Subject is required';
        document.getElementById('subject-error').classList.add('show');
        isValid = false;
    }
    
    // Validate message
    if (!message) {
        document.getElementById('message-error').textContent = currentLanguage === 'es' ? 'El mensaje es requerido' : 'Message is required';
        document.getElementById('message-error').classList.add('show');
        isValid = false;
    }
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Toast notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    
    // Set type-specific styling
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
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Language toggle
function toggleLanguage() {
    currentLanguage = currentLanguage === 'es' ? 'en' : 'es';
    updateLanguage();
}

function updateLanguage() {
    // Update all text content based on current language
    const t = translations[currentLanguage];
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach((link, index) => {
        const keys = ['nav_services', 'nav_about', 'nav_qr_tool', 'nav_contact'];
        if (keys[index]) {
            link.textContent = t[keys[index]];
        }
    });
    
    // Update mobile navigation
    document.querySelectorAll('.mobile-nav-link').forEach((link, index) => {
        const keys = ['nav_services', 'nav_about', 'nav_qr_tool', 'nav_contact'];
        if (keys[index]) {
            link.textContent = t[keys[index]];
        }
    });
    
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
    serviceTitles[3].textContent = t.service_4_title;
    
    const serviceDescriptions = document.querySelectorAll('.service-description');
    serviceDescriptions[0].textContent = t.service_1_desc;
    serviceDescriptions[1].textContent = t.service_2_desc;
    serviceDescriptions[2].textContent = t.service_3_desc;
    serviceDescriptions[3].textContent = t.service_4_desc;
    
    // Update about section
    document.querySelector('.about-section .section-title').textContent = t.about_title;
    document.querySelector('.about-section .section-subtitle').textContent = t.about_subtitle;
    document.querySelector('.about-text p').textContent = t.about_desc;
    
    const founderNames = document.querySelectorAll('.founder-name');
    founderNames[0].textContent = t.ruben_name;
    founderNames[1].textContent = t.david_name;
    
    const founderRoles = document.querySelectorAll('.founder-role');
    founderRoles[0].textContent = t.ruben_role;
    founderRoles[1].textContent = t.david_role;
    
    // Update QR section
    document.querySelector('.qr-section .section-title').textContent = t.qr_title;
    document.querySelector('.qr-section .section-subtitle').textContent = t.qr_subtitle;
    qrInput.placeholder = t.qr_input_placeholder;
    generateQrButton.textContent = t.qr_generate_button;
    downloadQrButton.innerHTML = `<svg class="download-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> ${t.qr_download_button}`;
    
    // Update contact section
    document.querySelector('.contact-section .section-title').textContent = t.contact_title;
    document.querySelector('.contact-section .section-subtitle').textContent = t.contact_subtitle;
    document.querySelector('.contact-info h3').textContent = t.contact_info;
    document.querySelector('.contact-form-header h3').textContent = t.form_submit;
    
    document.querySelector('label[for="name"]').textContent = t.form_name;
    document.querySelector('label[for="email"]').textContent = t.form_email;
    document.querySelector('label[for="subject"]').textContent = t.form_subject;
    document.querySelector('label[for="message"]').textContent = t.form_message;
    
    submitButton.textContent = t.form_submit;
    
    // Update footer
    document.querySelector('.footer-description').textContent = t.hero_subtitle;
    document.querySelector('.footer-section:nth-child(2) h3').textContent = t.contact_info;
    document.querySelector('.footer-bottom p').textContent = t.footer_copyright;
    
    // Update language toggle buttons
    languageToggle.textContent = currentLanguage === 'es' ? 'ES/EN' : 'EN/ES';
    mobileLanguageToggle.textContent = currentLanguage === 'es' ? 'ES/EN' : 'EN/ES';
    
    // Update page title
    document.title = currentLanguage === 'es' ? 'ZPX Studio - Innovación Digital' : 'ZPX Studio - Digital Innovation';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);