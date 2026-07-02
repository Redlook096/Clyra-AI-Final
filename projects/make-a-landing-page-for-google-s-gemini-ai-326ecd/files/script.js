/* ============================================================
   Gemini AI Landing Page — Interaction Layer
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // 1. NAVBAR — Scroll effect + background transition
  // ============================================================
  const navbar = document.getElementById('navbar');

  function updateNavbar() {
    if (window.scrollY > 40) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  // ============================================================
  // 2. MOBILE MENU — Hamburger toggle + overlay nav
  // ============================================================
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const navbarNav = document.getElementById('navbarNav');

  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    hamburgerBtn.classList.add('navbar__hamburger--active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    hamburgerBtn.setAttribute('aria-label', 'Close menu');
    mobileOverlay.classList.add('mobile-overlay--active');
    document.body.style.overflow = 'hidden';

    // Clone nav links into overlay
    const linksClone = navbarNav.querySelector('.navbar__links').cloneNode(true);
    mobileOverlay.innerHTML = '';
    mobileOverlay.appendChild(linksClone);
    mobileOverlay.setAttribute('aria-hidden', 'false');

    // Attach close-on-click to cloned links
    linksClone.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  function closeMenu() {
    menuOpen = false;
    hamburgerBtn.classList.remove('navbar__hamburger--active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-label', 'Open menu');
    mobileOverlay.classList.remove('mobile-overlay--active');
    mobileOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Clear overlay content after transition
    setTimeout(() => {
      if (!menuOpen) mobileOverlay.innerHTML = '';
    }, 350);
  }

  hamburgerBtn.addEventListener('click', () => {
    menuOpen ? closeMenu() : openMenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });
  // ============================================================
  // 3. SCROLL ANIMATIONS — IntersectionObserver reveal
  // ============================================================
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach((el) => revealObserver.observe(el));

  // ============================================================
  // 4. FAQ ACCORDION — Toggle open/close
  // ============================================================
  const faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach((item) => {
    const summary = item.querySelector('.faq__question');
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = item.hasAttribute('open');
      if (isOpen) {
        item.removeAttribute('open');
  // ============================================================
  // 6. STAT COUNTER — Animated count-up on scroll into view
  // ============================================================
  const statNumbers = document.querySelectorAll('.stat__number');
  let statsAnimated = false;

  function animateStats() {
    if (statsAnimated) return;
    statsAnimated = true;

    statNumbers.forEach((stat) => {
      const target = parseInt(stat.getAttribute('data-count'), 10);
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      let currentStep = 0;

      function formatNumber(n) {
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
        if (n >= 1000) return (n / 1000).toFixed(0) + 'K+';
        return n + '+';
      }

      if (target >= 1000000) {
        stat.textContent = '0';
      }

      const counter = setInterval(() => {
        currentStep++;
        const progress = Math.min(currentStep / steps, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(eased * target);

        stat.textContent = formatNumber(currentValue);

        if (currentStep >= steps) {
          clearInterval(counter);
          stat.textContent = formatNumber(target);
  // ============================================================
  // 7. CTA FORM — Simple email validation mockup
  // ============================================================
  const ctaForm = document.getElementById('ctaForm');
  const ctaEmail = document.getElementById('ctaEmail');
  const ctaFormMessage = document.getElementById('ctaFormMessage');

  if (ctaForm) {
    ctaForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = ctaEmail.value.trim();

      if (!email) {
        ctaFormMessage.textContent = 'Please enter your email address.';
        ctaFormMessage.className = 'cta__form-message cta__form-message--error';
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        ctaFormMessage.textContent = 'Please enter a valid email address.';
        ctaFormMessage.className = 'cta__form-message cta__form-message--error';
        return;
      }

      ctaFormMessage.textContent = 'Thanks! Check your inbox for your API key (this is a demo).';
      ctaFormMessage.className = 'cta__form-message cta__form-message--success';
      ctaEmail.value = '';

      setTimeout(() => {
        ctaFormMessage.textContent = '';
        ctaFormMessage.className = 'cta__form-message';
      }, 5000);
    });
  }

  // ============================================================
  // 8. PARALLAX-LIKE HERO ORB (subtle mouse tracking)
  // ============================================================
  const hero = document.getElementById('hero');
  const orb = hero?.querySelector('.hero__orb');
  const orbGlow = hero?.querySelector('.hero__orb-glow');

  if (hero && orb && orbGlow) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      orb.style.transform = `translate(${x * 20}px, ${y * 20}px) translate(-50%, -50%) scale(1)`;
      orbGlow.style.transform = `translate(${x * 30}px, ${y * 30}px) translate(-50%, -50%) scale(1)`;
    });

    hero.addEventListener('mouseleave', () => {
      orb.style.transform = 'translate(-50%, -50%) scale(1)';
      orbGlow.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  }

  // ============================================================
  // 9. LOG — Ready
  // ============================================================
  console.log('Gemini Landing Page — initialized');
});

        }
      }, stepDuration);
    });
  }

  const ctaSection = document.getElementById('build');
  if (ctaSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAnimated) {
          animateStats();
        }
      });
    }, { threshold: 0.3 });

    statsObserver.observe(ctaSection);
  }

      } else {
        item.setAttribute('open', '');
      }
    });
  });

  // ============================================================
  // 5. SMOOTH SCROLL for anchor links
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });

