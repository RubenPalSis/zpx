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

// Translations
const translations = {
    es: {
        nav_services: "Servicios",
        nav_about: "Nosotros",
        nav_contact: "Contacto",
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
        form_message: "Mensaje",
        form_submitting: "Enviando...",
        form_success: "Mensaje Enviado",
        footer_description: "Creamos soluciones digitales personalizadas, desde aplicaciones web hasta códigos QR interactivos y diseños visuales impresionantes.",
        footer_copyright: "© 2025 ZPX Studio. Todos los derechos reservados."
    },
    en: {
        nav_services: "Services",
        nav_about: "About Us",
        nav_contact: "Contact",
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
        about_desc: "We are two friends passionate about computing, Rubén Palacio and David Giménez. Although we are young in the sector, we are excited to create custom digital solutions for small and medium-sized businesses, adapting to what they really need. We are dedicated to combining creativity, technology and commitment to help each project stand out and meet its objectives in the digital world. Each client is for us an opportunity to learn, grow and add real value to their business.",
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
        form_message: "Message",
        form_submitting: "Sending...",
        form_success: "Message Sent",
        footer_description: "We create custom digital solutions, from web applications to interactive QR codes and stunning visual designs.",
        footer_copyright: "© 2025 ZPX Studio. All rights reserved."
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
    document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
}

function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = ''; // Restore scrolling
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
    const submitBtn = contactForm.querySelector('.submit-button');
    submitBtn.disabled = true;
    submitBtn.textContent = translations[currentLanguage].form_submitting;
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        // Reset form
        contactForm.reset();
        
        // Show success message
        showToast(
            currentLanguage === 'es' 
                ? '¡Tu mensaje ha sido enviado exitosamente!' 
                : 'Your message has been sent successfully!', 
            'success'
        );
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = translations[currentLanguage].form_submit;
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
        showFieldError('name', currentLanguage === 'es' ? 'El nombre es requerido' : 'Name is required');
        isValid = false;
    }
    
    // Validate email
    if (!email) {
        showFieldError('email', currentLanguage === 'es' ? 'El correo electrónico es requerido' : 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('email', currentLanguage === 'es' ? 'Dirección de correo electrónico inválida' : 'Invalid email address');
        isValid = false;
    }
    
    // Validate subject
    if (!subject) {
        showFieldError('subject', currentLanguage === 'es' ? 'El asunto es requerido' : 'Subject is required');
        isValid = false;
    }
    
    // Validate message
    if (!message) {
        showFieldError('message', currentLanguage === 'es' ? 'El mensaje es requerido' : 'Message is required');
        isValid = false;
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    let errorElement = document.getElementById(`${fieldId}-error`);
    if (!errorElement) {
        // Create error element if it doesn't exist
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
    // Update the toggle button text
    languageToggle.textContent = currentLanguage === 'es' ? 'ES/EN' : 'EN/ES';
    mobileLanguageToggle.textContent = currentLanguage === 'es' ? 'ES/EN' : 'EN/ES';
}

function updateLanguage() {
    const t = translations[currentLanguage];
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks[0].textContent = t.nav_services;
    navLinks[1].textContent = t.nav_about;
    navLinks[2].textContent = t.nav_contact;
    
    // Update mobile navigation
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks[0].textContent = t.nav_services;
    mobileNavLinks[1].textContent = t.nav_about;
    mobileNavLinks[2].textContent = t.nav_contact;
    
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
    document.querySelector('.about-section .section-subtitle').textContent = t.about_subtitle;
    document.querySelector('.about-text p').textContent = t.about_desc;
    
    const founderNames = document.querySelectorAll('.founder-name');
    founderNames[0].textContent = t.ruben_name;
    founderNames[1].textContent = t.david_name;
    
    const founderRoles = document.querySelectorAll('.founder-role');
    founderRoles[0].textContent = t.ruben_role;
    founderRoles[1].textContent = t.david_role;
    
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
    
    // Update page title
    document.title = currentLanguage === 'es' ? 'ZPX Studio - Innovación Digital' : 'ZPX Studio - Digital Innovation';
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);