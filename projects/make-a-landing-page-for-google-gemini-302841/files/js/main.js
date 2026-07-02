/* ============================================================
   MAIN.JS — Google Gemini Inspired Concept Landing Page
   Intersection Observer | Mobile Hamburger | FAQ Accordion
   Smooth Scroll | Email Form (Dummy)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* =========================================
     1. INTERSECTION OBSERVER — Scroll Fade-In
     ========================================= */
  const fadeElements = document.querySelectorAll('.fade-section');

  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  fadeElements.forEach((el) => observer.observe(el));

  /* =========================================
     2. MOBILE HAMBURGER TOGGLE
     ========================================= */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    navLinks.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* =========================================
     3. FAQ ACCORDION
     ========================================= */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all FAQ items
      faqItems.forEach((other) => {
        other.classList.remove('active');
        const otherBtn = other.querySelector('.faq-question');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked one
      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* =========================================
     4. SMOOTH SCROLL FOR NAV LINKS
     ========================================= */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navHeight = document.getElementById('navbar')?.offsetHeight || 72;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });

  /* =========================================
     5. DUMMY EMAIL FORM SUBMISSION
     ========================================= */
  const ctaForm = document.getElementById('ctaForm');
  const ctaToast = document.getElementById('ctaToast');
  const ctaEmail = document.getElementById('ctaEmail');

  if (ctaForm && ctaToast && ctaEmail) {
    ctaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = ctaEmail.value.trim();
      if (!email) {
        ctaEmail.style.borderColor = '#ef4444';
        ctaEmail.placeholder = 'Please enter your email address';
        return;
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        ctaEmail.style.borderColor = '#ef4444';
        ctaEmail.value = '';
        ctaEmail.placeholder = 'Please enter a valid email';
        return;
      }

      // Show toast
      ctaToast.classList.add('show');
      ctaForm.reset();
      ctaEmail.style.borderColor = '';
      ctaEmail.placeholder = 'Enter your email address';

      // Auto-hide toast after 4 seconds
      setTimeout(() => {
        ctaToast.classList.remove('show');
      }, 4000);
    });

    // Reset error state on input
    ctaEmail.addEventListener('input', () => {
      ctaEmail.style.borderColor = '';
      ctaEmail.placeholder = 'Enter your email address';
    });
  }

  /* =========================================
     6. NAVBAR SCROLL EFFECT
     ========================================= */
  const navbar = document.getElementById('navbar');

  if (navbar) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 100) {
        navbar.style.background = 'rgba(15, 10, 26, 0.85)';
      } else {
        navbar.style.background = 'rgba(15, 10, 26, 0.72)';
      }
      lastScroll = currentScroll;
    });
  }

  console.log('🚀 Gemini Landing Page — Unofficial Concept');
  console.log('📄 This is a static demo. No API calls are made.');
  console.log('🔒 No data is collected or stored.');
});
