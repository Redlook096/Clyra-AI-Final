/**
 * NovaMind Landing Page — Interactions
 * Scroll effects, mobile menu, FAQ accordion, fade-in animations, form handling.
 */
(function () {
  'use strict';

  // ============================================
  // 1. STICKY NAVBAR — Background blur on scroll
  // ============================================
  const navbar = document.getElementById('navbar');

  function handleNavScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll(); // initial check

  // ============================================
  // 2. MOBILE HAMBURGER MENU
  // ============================================
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  function toggleNav() {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
  }

  hamburger.addEventListener('click', toggleNav);

  // Close menu on link click (mobile)
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  // ============================================
  // 3. FAQ ACCORDION — Arrow rotation
  // ============================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    const summary = item.querySelector('.faq-question');
    summary.addEventListener('click', function (e) {
      // Allow default details/summary behaviour
      // Arrow rotation is handled by CSS via [open] attribute
    });
  });

  // Close other open FAQ items when one opens
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item && other.open) {
            other.open = false;
          }
        });
      }
    });
  });

  // ============================================
  // 4. SCROLL-TRIGGERED FADE-IN (Intersection Observer)
  // ============================================
  const fadeElements = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optionally stop observing once visible
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    fadeElements.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: make all visible immediately
    fadeElements.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // ============================================
  // 5. CTA FORM — Simple email validation
  // ============================================
  const ctaForm = document.getElementById('ctaForm');

  if (ctaForm) {
    ctaForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const emailInput = document.getElementById('ctaEmail');
      const email = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        showFormMessage('Please enter your email address.', 'error');
        emailInput.focus();
        return;
      }

      if (!emailRegex.test(email)) {
        showFormMessage('Please enter a valid email address.', 'error');
        emailInput.focus();
        return;
      }

      // Success
      showFormMessage('Thanks! You\'re on the early access list.', 'success');
      emailInput.value = '';
    });
  }

  function showFormMessage(msg, type) {
    // Remove existing message
    const existing = document.querySelector('.cta-form-message');
    if (existing) existing.remove();

    const message = document.createElement('p');
    message.className = 'cta-form-message';
    message.textContent = msg;
    message.style.cssText =
      'font-size:0.85rem;margin-top:8px;' +
      (type === 'error' ? 'color:#f87171;' : 'color:#34d399;');

    const form = document.getElementById('ctaForm');
    form.parentNode.insertBefore(message, form.nextSibling);

    // Auto-remove after 4 seconds
    setTimeout(function () {
      if (message.parentNode) message.remove();
    }, 4000);
  }

  // ============================================
  // 6. SMOOTH SCROLL ANCHOR OFFSET (for fixed nav)
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = navbar.offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });

})();
