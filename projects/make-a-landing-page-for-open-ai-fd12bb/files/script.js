'use strict';

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', function() {

  // ===== Mobile Nav Toggle =====
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close nav on link click
    navMenu.querySelectorAll('.nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        navMenu.classList.remove('open');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ===== Sticky Nav: Background on Scroll =====
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function() {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // ===== Intersection Observer: Scroll Animations =====
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.getAttribute('data-delay')) || 0;
          setTimeout(function() {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    fadeElements.forEach(function(el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all immediately
    fadeElements.forEach(function(el) {
      el.classList.add('visible');
    });
  }

  // ===== Animated Counter (Stats) =====
  const statNumbers = document.querySelectorAll('.stat-number');

  if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const target = entry.target;
          const max = parseInt(target.getAttribute('data-target'));
          animateCounter(target, max);
          counterObserver.unobserve(target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(function(el) {
      counterObserver.observe(el);
    });
  }

  function animateCounter(element, max) {
    let current = 0;
    const duration = 2000;
    const step = Math.ceil(max / (duration / 16));
    const suffix = max >= 100 ? '+' : '';

    function tick() {
      current += step;
      if (current >= max) {
        element.textContent = max + suffix;
        return;
      }
      element.textContent = current;
      requestAnimationFrame(tick);
    }

    tick();
  }

  // ===== Email Form Handling =====
  const ctaForm = document.getElementById('ctaForm');
  const formMessage = document.getElementById('formMessage');

  if (ctaForm && formMessage) {
    ctaForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const email = document.getElementById('ctaEmail').value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        formMessage.textContent = 'Please enter your email address.';
        formMessage.className = 'form-message error';
        return;
      }

      if (!emailRegex.test(email)) {
        formMessage.textContent = 'Please enter a valid email address.';
        formMessage.className = 'form-message error';
        return;
      }

      formMessage.textContent = 'Thanks for subscribing! We\u2019ll keep you updated.';
      formMessage.className = 'form-message success';
      ctaForm.reset();

      // Reset after 5 seconds
      setTimeout(function() {
        formMessage.textContent = '';
        formMessage.className = 'form-message';
      }, 5000);
    });
  }

});
