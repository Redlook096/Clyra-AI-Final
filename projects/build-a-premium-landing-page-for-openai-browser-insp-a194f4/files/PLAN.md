Good. Node 24, npm 11. Now I'll produce the complete PLAN.md.

---

# PLAN.md

## 1. Request Summary

Build a premium, production-quality landing page for **OpenAI Browser** — a conceptual AI-powered web browser. The page must draw visual inspiration from OpenAI's public-facing design language (clean, minimal, dark-leaning, with subtle glow/card aesthetics) while being an original work. Deliver includes: sticky navbar, hero section, product preview, features grid (bento layout), pricing tiers, FAQ accordion, authentication modal, polished micro-interactions/animations, and full mobile responsiveness.

## 2. Product Type & Target Product

- **Type**: Premium single-page landing page (SPA-style with anchor nav)
- **Product**: OpenAI Browser — a futuristic AI-native web browser concept
- **Positioning**: "The browser that thinks with you" — AI-enhanced browsing (summarization, context-aware search, tab management, privacy-first)

## 3. Design Research Summary (OpenAI Visual Language)

Based on trained knowledge of OpenAI's public design system:

| Property | Observed Direction |
|---|---|
| **Primary Palette** | Dark backgrounds (#0a0a0a, #111), white/off-white text, green accent (#10a37f / #00c853 range), muted grey midtones (#2a2a2a, #3a3a3a) |
| **Typography** | Sans-serif — OpenAI uses a custom version of Neue Haas Grotesk / similar. We'll use **Inter** (Google Fonts) as closest publicly available equivalent. Weights: 400 (body), 500 (subhead), 600 (headings), 700 (hero/cta) |
| **Layout Rhythm** | Massive whitespace; section padding 140–200px vertical; max-width ~1200px centred; content blocks align to 12-column grid |
| **Navigation** | Thin fixed navbar, ~60px height, translucent backdrop blur, logo left, links right, CTA button stand-out |
| **Buttons** | Pill-shaped (border-radius: 9999px) or soft-rounded; filled primary (green accent), ghost/secondary (white border thin), hover: subtle scale + glow |
| **Cards** | Dark grey surfaces (#1a1a1a / #222), 1px border (transparent-white), subtle box-shadow, rounded corners (12–16px), inner padding 32px |
| **Animations** | Slow, elegant (0.3–0.5s easing cubic-bezier(0.16, 1, 0.3, 1)); fade-up on scroll; stagger children; subtle scale on hover; backdrop blur transitions |
| **Glow Effects** | Subtle green radial glow behind hero text or key elements — not overpowering, uses box-shadow or pseudo-elements with low opacity |
| **Accents** | Thin divider lines, decorative dot patterns, small badge tags with green dot |

## 4. Design Direction

- **Mood**: Calm, premium, futuristic but grounded — "enterprise magic"
- **Colour Theme**: Dark mode by default (primary background `#0b0b0f`), with green accent (`#10a37f`), warm grey cards (`#18181b`), text `#f5f5f7` / `#a1a1aa`
- **Gradient**: Subtle `#10a37f → #0d9488` for buttons/gradients
- **Glassmorphism**: Navbar with `backdrop-blur-xl` and `bg-white/5` border
- **Imagery**: Abstract 3D browser mockup (CSS-drawn or SVG placeholder), floating UI panels, code/glow decorative elements
- **Interaction**: Smooth scroll, scroll-triggered fade-ups, sticky nav shrink on scroll, card hover lift, accordion expand/collapse with icon rotation

## 5. User Flows

1. **First Visit** → Hero grabs attention → Scroll down to product preview → Features explain value → Pricing comparison → FAQ resolves doubts → CTA buttons throughout
2. **Auth Flow** → Click "Get Started" / "Sign In" → Modal slides up → Tab between Sign In / Sign Up → Form fields with validation → Submit success state → Modal closes
3. **Pricing Selection** → Click plan card → Highlight animation → CTA redirect (or modal) for checkout flow
4. **FAQ Interaction** → Click question → Smooth expand/collapse of answer → Icon rotates → Click again to close

## 6. Pages / Sections

**Single-page application with 6 sections:**

| # | Section | Purpose |
|---|---|---|
| 1 | **Navbar** | Sticky top; logo + nav links (Features, Pricing, FAQ) + auth buttons |
| 2 | **Hero** | Big tagline, subtext, primary CTA + secondary ghost CTA, ambient glow behind |
| 3 | **Product Preview** | Browser mockup (CSS-art or SVG) with floating UI elements, annotation callouts |
| 4 | **Features Grid** | Bento-style 3×2 grid (→ 1-column on mobile). 6 feature cards with icons, title, description |
| 5 | **Pricing** | 3 tiers (Free, Pro, Enterprise). Toggle monthly/yearly. Highlighted "Popular" badge on Pro |
| 6 | **FAQ** | 5–6 accordion items. Clean border-bottom layout |
| 7 | **Footer** | Minimal: logo, links, copyright, social icons |

**Overlay:**
- **Auth Modal** — Sign In / Sign Up toggle; email + password inputs; submit button; loading + success states

## 7. Features

| Feature | Description |
|---|---|
| AI Tab Manager | Auto-group and suspend tabs based on context |
| Smart Summaries | One-click page summaries with adjustable detail |
| Context-Aware Search | Search that understands your current page, history, and intent |
| Privacy Vault | Built-in tracker blocking, fingerprint randomization |
| Split-View Browsing | Side-by-side page comparison |
| Cross-Device Sync | Encrypted sync across all devices |

## 8. Interactions & Animations

| Element | Interaction |
|---|---|
| **Navbar** | On scroll > 80px: background opacity increases (solidifies), subtle border-bottom appears. Links change colour on hover. CTA button glows |
| **Hero** | `fade-in-up` on mount for heading, subtitle, CTA (staggered 0.1s delays). Ambient green glow orb rotates slowly (CSS animation) |
| **Product Preview** | Reveal from below on scroll (Intersection Observer). Subtle float animation on browser mockup |
| **Feature Cards** | Scroll-triggered `fade-in-up` with stagger (0.1s per card). Hover: `translateY(-4px)` + glow shadow |
| **Pricing Cards** | Highlighted card scale(1.02) on hover. Monthly/yearly toggle slide transition. Checkmark list items |
| **FAQ Accordion** | Max-height transition (0.4s ease). Chevron rotate 180° on open. First item open by default |
| **Auth Modal** | Backdrop blur + fade in (0.3s). Modal slides up from below. Input focus ring animation. Tab switch underline slide |
| **Scroll** | `scroll-behavior: smooth` on html. All reveal animations use Intersection Observer with `threshold: 0.15` |
| **Micro-interactions** | Button hover: scale(1.02) + shadow increase. Cursor: subtle pointer effects. Loading spinner on form submit |

## 9. Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| **≥ 1024px (desktop)** | Full bento grid (3 cols), horizontal nav, large hero text, side-by-side pricing |
| **768–1023px (tablet)** | 2-column features grid, reduced hero font, pricing stacked, hamburger menu |
| **< 768px (mobile)** | Single-column everything. Hamburger nav (slide-in drawer). Smaller padding. Full-width cards. Pricing vertical stack. Modal full-screen |

## 10. State & Data Needs

| State | Type | Details |
|---|---|---|
| `scrollY` | number | For navbar style change |
| `activeNav` | string | Current section in view for highlight |
| `showMobileMenu` | boolean | Hamburger toggle |
| `revealedSections` | Set | Which sections have animated in |
| `selectedPlan` | string | 'monthly' \| 'yearly' |
| `faqOpen` | number \| null | Index of open FAQ item |
| `showAuthModal` | boolean | Modal visibility |
| `authTab` | 'signin' \| 'signup' | Active auth tab |
| `authForm` | { email, password } | Form fields |
| `authLoading` | boolean | Submit loading state |
| `authSuccess` | boolean | Success feedback |

**Data (static):**
- Features array (6 items): icon, title, description, accent colour
- Pricing plans (3): name, price, period, features list, highlighted boolean, CTA text
- FAQ array (5–6): question, answer (can contain HTML/links)

## 11. File Plan

```
openai-browser-landing/
├── index.html                  # Entry: all HTML in one file (SPA)
├── css/
│   └── style.css              # All styles (Tailwind via CDN + custom)
├── js/
│   └── main.js                # All JS: navigation, animations, modals, accordion, pricing toggle
├── assets/
│   ├── logo.svg               # OpenAI Browser logomark (inline SVG)
│   ├── browser-mockup.svg     # Browser UI illustration (inline SVG)
│   └── icons/                 # Feature icons (inline SVGs in HTML)
└── README.md                  # Setup instructions
```

**Rationale**: Single HTML file approach keeps everything self-contained and easy to deploy. Tailwind via CDN for rapid utility-first styling. Vanilla JS (no framework overhead) — appropriate for a landing page.

## 12. Technology Strategy

| Layer | Choice | Reason |
|---|---|---|
| **HTML** | Semantic HTML5 | SEO, accessibility, clean structure |
| **CSS** | Tailwind CSS v3 (CDN) + custom CSS | Rapid prototyping; utility classes for 95% of styling; custom CSS for complex animations/glows |
| **Icons** | Inline SVGs (Heroicons style) | No external dependency; zero-latency; colour-control |
| **JavaScript** | Vanilla ES6 | No framework overhead; Intersection Observer API for scroll animations; lightweight (~200 lines) |
| **Fonts** | Google Fonts — Inter (300–700) | Closest to OpenAI's Neue Haas Grotesk; great variable font support |
| **Animation** | CSS transitions + keyframes + Intersection Observer | GPU-accelerated; no library needed; smooth 60fps |
| **Deployment** | Static HTML → any CDN/host (Vercel, Netlify, GitHub Pages) | Zero server requirements |

## 13. Validation Checklist

- [ ] HTML validates (W3C validator)
- [ ] All interactive elements have `cursor: pointer`
- [ ] Scroll animations perform at 60fps (no layout thrashing)
- [ ] Navbar links scroll to correct sections (`scroll-behavior: smooth`)
- [ ] Modal traps focus (Tab stays within modal) — basic version
- [ ] Mobile hamburger menu opens/closes
- [ ] FAQ accordion: one open at a time (or toggle same item)
- [ ] Pricing toggle switches all plan prices
- [ ] Auth modal tabs switch form content
- [ ] Form validation: email format, password min 6 chars
- [ ] Loading state shows on auth submit
- [ ] All text contrast ratio ≥ 4.5:1
- [ ] Responsive tested at 1440px, 1024px, 768px, 375px
- [ ] No console errors
- [ ] Logo and brand assets are original (no trademark infringement)

## 14. Acceptance Test

**Visual:**
1. Page loads with dark theme, green accents, premium feel
2. Hero section shows large heading + animated glow + two CTA buttons
3. Product preview section shows a browser mockup with floating UI elements
4. Features bento grid animates in on scroll (6 cards, staggered)
5. Pricing section shows 3 cards with monthly/yearly toggle, "Popular" badge on Pro
6. FAQ section has 5–6 fully functional accordion items
7. Footer is minimal with links

**Functional:**
8. Navbar sticks to top, changes opacity on scroll, links navigate to sections
9. Mobile hamburger opens a full-screen menu overlay
10. Auth modal opens on "Get Started" click, switches between Sign In / Sign Up, validates inputs
11. Pricing toggle switches between monthly and yearly pricing values
12. FAQ items expand/collapse with smooth animation, icon rotates
13. All scroll-triggered animations fire once when element enters viewport
14. Page has smooth scroll between sections

**Responsive:**
15. At 375px: single column, hamburger visible, cards stack, pricing vertical, modal full-width
16. At 1440px: multi-column grid, horizontal nav, side-by-side pricing cards, balanced whitespace

---

## Next Steps

Once this PLAN.md is approved, the implementation phase will:

1. Create the project directory (`openai-browser-landing/`)
2. Build `index.html` with all 6 sections + auth modal
3. Write `style.css` with Tailwind utilities + custom animation keyframes
4. Write `main.js` with all interaction logic
5. Create inline SVG assets (logo, browser mockup, feature icons)
6. Test all interactions and responsive breakpoints
7. Final review against validation checklist

**Estimated implementation size**: ~500 lines HTML, ~400 lines CSS, ~250 lines JS = one focused build session.