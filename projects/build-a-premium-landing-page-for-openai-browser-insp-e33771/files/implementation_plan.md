I have enough knowledge of OpenAI's visual language from its public presence. Let me now produce a detailed PLAN.md.

---

Here is the complete **PLAN.md**:

---

# PLAN.md — OpenAI Browser Premium Landing Page

## 1. Request Summary

Build a premium, single-page landing page for **"OpenAI Browser"** — a conceptual AI-powered web browser product. The page is inspired by OpenAI's own visual language: clean, minimal, enterprise-calm, with subtle gradients, generous whitespace, dark/light capable, and smooth micro-interactions.

## 2. Product Type

- **Type:** Premium landing page (single-page marketing site)
- **Category:** SaaS/AI product launch page
- **Brand:** OpenAI Browser (conceptual fork of OpenAI's design DNA)
- **Target Audience:** Developers, early adopters, AI enthusiasts, productivity users

## 3. Design Direction — OpenAI Visual Language (Researched & Synthesised)

Since OpenAI's site blocks scrapers, I synthesised from public knowledge of their recent design system (2024–2025):

| Token | Value |
|---|---|
| **Primary Background** | `#0F0F0F` (near-black) / `#FFFFFF` (light mode) |
| **Surface/Card** | `#1A1A1A` (dark) / `#F9F9F9` (light) |
| **Border Subtle** | `rgba(255,255,255,0.08)` dark / `rgba(0,0,0,0.06)` light |
| **Accent Brand** | `#10A37F` (OpenAI green) |
| **Accent Secondary** | `#8E8EA0` (muted grey) |
| **Text Primary** | `#EDEDED` (dark) / `#0F0F0F` (light) |
| **Text Secondary** | `#9B9B9B` (dark) / `#6B6B6B` (light) |
| **Typography** | System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (OpenAI uses a custom/inter font but we use system stack for performance) |
| **Radius** | `12px` cards, `8px` buttons, `24px` hero elements |
| **Spacing Rhythm** | Multiples of `8px` — `8/16/24/32/48/64/96/128` |
| **Gradients** | Subtle green->teal `#10A37F → #0EA5E9` or green->emerald for hero accents |
| **Shadows** | Very soft — `0 2px 8px rgba(0,0,0,0.2)` dark / `0 1px 3px rgba(0,0,0,0.06)` light |
| **Motion** | 300ms ease-out, spring physics for entrances, stagger children, fade+slide up |

**Design direction:** "Calm enterprise meets playful AI". Dark-first with light-mode toggle. Bento-grid feature layout. Generous negative space. Glassmorphism light overlays. Monochromatic with green accents.

## 4. User Flows

1. **First-time visitor:** Scrolls hero → product preview → features → pricing → FAQ → footer. Calls-to-action (CTA) at hero, feature mid-point, and pricing.
2. **Returning visitor:** Scrolls directly to pricing or FAQ, or opens auth modal from navbar CTA.
3. **Mobile visitor:** Hamburger nav → same flow with stacked layout, bottom-sheet modals.

## 5. Pages & Sections (All on one scrollable page)

| # | Section | Description |
|---|---|---|
| 1 | **Navbar** | Fixed top, transparent→solid on scroll, logo (text "OpenAI Browser"), nav links (Features, Pricing, FAQ), light/dark toggle, "Get Started" CTA button |
| 2 | **Hero** | Headline, subheadline, two CTAs ("Download Free" / "See Demo"), animated abstract browser mockup (gradient glass card with orbiting UI elements) |
| 3 | **Product Preview** | Interactive-looking browser window mockup showing AI sidebar with chat interface — subtle floating animation |
| 4 | **Features (Bento Grid)** | 6 feature cards in a 3×2 bento layout — each with icon, title, description, hover lift effect |
| 5 | **Pricing** | 3-tier cards (Free, Pro, Enterprise) with feature lists, toggle for monthly/annual, highlight "Pro" as featured |
| 6 | **FAQ** | Accordion-style, 6 questions, smooth open/close animation |
| 7 | **Footer** | Slim footer with links, social icons, copyright |
| 8 | **Auth Modal** | Modal overlay triggered by "Get Started" CTA — tabbed "Sign In" / "Sign Up" forms with email + password inputs |

## 6. Features (Content & Value Props)

- **AI-Powered Search** — Context-aware, semantic browser search
- **Smart Tab Groups** — Automatic tab organisation by topic
- **Built-in Chat** — OpenAI chat sidebar on any page
- **Privacy Mode** — Local-first AI processing
- **Cross-Device Sync** — Seamless across desktop/mobile
- **Extensions** — Open ecosystem for AI plugins

## 7. Interactions & Animations

| Element | Animation |
|---|---|
| **Navbar** | Background opacity transition (0→0.9) on scroll beyond 100px |
| **Hero title** | Fade-in + slide-up on load (stagger 100ms) |
| **Browser mockup** | Subtle floating Y-axis oscillation (3px, 4s cycle) |
| **Feature cards** | Scale(1→1.02) + shadow lift on hover, staggered entrance on scroll (IntersectionObserver) |
| **Pricing cards** | Slide-up entrance, "Pro" card elevation emphasis, monthly/annual toggle switch animation |
| **FAQ accordion** | Rotate chevron icon, max-height transition 300ms ease |
| **Auth modal** | Backdrop blur-in, modal scale(0.95→1) + fade |
| **Mobile nav** | Slide-in from right, backdrop overlay |
| **Scroll-triggered** | All sections fade+slide-up with `IntersectionObserver` — 0.3 threshold, staggered children |

## 8. Responsive Behaviour

| Breakpoint | Layout Changes |
|---|---|
| **≥1024px** | Full bento grid (3 cols), horizontal nav, side-by-side hero |
| **768–1023px** | Bento grid 2 cols, stacked hero, compact nav |
| **<768px** | Single column, hamburger menu, stacked hero, full-width cards, bottom-sheet modals, smaller typography (scale down 10–15%) |
| **<480px** | Button full-width, pricing cards stack, reduced padding |

## 9. State & Data Needs

| State | Type | Notes |
|---|---|---|
| `theme` | `'dark' \| 'light'` | Persisted to localStorage; toggles `data-theme` on `<html>` |
| `mobileNavOpen` | `boolean` | Controls hamburger slide-in |
| `pricingInterval` | `'monthly' \| 'annual'` | Toggles pricing display |
| `faqOpenIndex` | `number \| null` | Which FAQ accordion is open |
| `authModalOpen` | `boolean` | Controls modal visibility |
| `authTab` | `'signin' \| 'signup'` | Active auth form tab |
| `scrollY` | `number` | Used for navbar transparency |

## 10. File Plan

```
project-root/
├── index.html              # Single HTML file containing all markup
├── style.css               # All styles — dark/light themes, responsive, animations
├── script.js               # All JS — interactions, IntersectionObserver, theme toggle, modal, accordion, pricing toggle, mobile nav
├── favicon.ico             # Simple favicon (or inline SVG favicon in HTML)
└── README.md               # Brief project overview
```

**Why single HTML + CSS + JS?** No framework overhead needed for a landing page. Keeps it fast, deployable anywhere (Vercel, Netlify, GitHub Pages), and maximally portable.

## 11. Tool / Stack Strategy

| Tool | Purpose |
|---|---|
| **HTML5** | Semantic structure with `<header>`, `<main>`, `<section>`, `<footer>`, `<dialog>` (or modal div) |
| **CSS3 (vanilla)** | Custom properties for theming, `@media` queries, `@keyframes`, `transition`, `backdrop-filter`, `clamp()` for fluid typography |
| **JS (vanilla ES6+)** | DOM manipulation, IntersectionObserver, localStorage theme persistence, event delegation |
| **No external libraries** | Zero dependencies — keeps the page lightweight and fast |

## 12. Validation Checklist

- [ ] Semantic HTML5 landmarks used
- [ ] `meta viewport` tag present
- [ ] `prefers-color-scheme` media query respected for initial theme
- [ ] All interactive elements have `:focus-visible` styles (accessibility)
- [ ] Tab order logical through nav → main content → footer → modals
- [ ] `aria-label` on icon-only buttons (theme toggle, hamburger, close)
- [ ] `aria-expanded` on FAQ buttons and mobile nav
- [ ] `role="dialog"`, `aria-modal="true"` on auth modal
- [ ] `role="tablist"` on auth tabs
- [ ] All form inputs have associated `<label>` elements
- [ ] Contrast ratio ≥4.5:1 for text (test green on dark)
- [ ] Lighthouse performance score target >90
- [ ] No console errors on load or interaction
- [ ] Dark/light theme persists on reload
- [ ] Responsive tested at 375px, 768px, 1024px, 1440px
- [ ] All animations have `prefers-reduced-motion: no-preference` guard

## 13. Acceptance Tests

1. **Page loads** — Hero visible with title, subtitle, CTA buttons, and animated browser mockup
2. **Navbar** — Logo, 3 nav links, theme toggle, "Get Started" button visible; background becomes opaque after scrolling 100px
3. **Dark/Light toggle** — Click toggles theme instantly; persists on refresh; system preference respected on first visit
4. **Product preview** — Browser mockup with animated elements visible in viewport
5. **Feature cards** — 6 cards in bento grid; hover lifts card; scroll-triggered staggered entrance works
6. **Pricing** — 3 cards; monthly/annual toggle switches displayed prices; "Pro" card visually distinct (larger, highlighted CTA)
7. **FAQ** — Click question opens answer with chevron rotation; click again closes; only one open at a time
8. **Auth modal** — Click "Get Started" opens modal with backdrop blur; tabs switch between Sign In / Sign Up; close button and click-outside both close modal; Escape key closes
9. **Mobile nav** — Hamburger icon visible below 768px; click opens slide-in menu with links and CTA; close button works
10. **Footer** — Links rendered, copyright text with current year
11. **Animations** — All entrance animations play on scroll; no animation on `prefers-reduced-motion`
12. **Performance** — No render-blocking external resources; CSS and JS under 50KB combined
13. **Accessibility** — Tab through all interactive elements; labels present; no keyboard traps

---

This plan is ready for implementation. Approve it and I'll build the full page.