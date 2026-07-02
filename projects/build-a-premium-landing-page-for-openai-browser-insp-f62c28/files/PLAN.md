Dependencies aren't installed yet. I now have all the context I need. Let me produce the plan.

Here is the complete **PLAN.md**:

---

# PLAN.md — OpenAI Browser Premium Landing Page

## 1. Request Summary

Build a premium, production-quality landing page for a fictional product called **"OpenAI Browser"** — a next-generation AI-powered web browser. The design must be inspired by OpenAI's own visual language (minimal, clean, dark-leaning, with soft gradients, subtle glow effects, and confident typography), and include: navbar, hero section, product preview, features grid, pricing tiers, FAQ accordion, authentication modal, micro-animations/transitions, and full mobile responsiveness.

## 2. Product Type

- **Category:** Landing Page (SaaS / AI Product)
- **Brand:** OpenAI Browser (fictional, but visually positioned as a sibling to OpenAI's ecosystem)
- **Tone:** Premium, intelligent, trustworthy, forward-looking

## 3. Target Product

A single-page React + TypeScript landing page built with Vite, using:
- **React 19**
- **TypeScript**
- **Vite 6**
- **framer-motion** (for animations)
- **lucide-react** (for icons)
- No CSS framework — custom CSS modules or a single global CSS with CSS custom properties for the design system

## 4. Research Summary

OpenAI's design language (sourced from their platform docs, public pages, and community analysis):

| Element | Direction |
|---|---|
| **Colour palette** | Near-black backgrounds (`#0d0d0d`), white text, accent green-teal (`#10a37f`), soft grey for secondary text (`#8e8ea0`), subtle gradient overlays (dark → slightly lighter dark) |
| **Typography** | System font stack, clean sans-serif, heavy use of weight contrast (400 body, 600 subheadings, 700+ for hero headlines), large leading |
| **Spacing/rhythm** | Generous padding (px-6 md:px-12), large section gaps (py-24+), max-width ~1200px centred |
| **Buttons** | Solid rounded-full primary (green-teal bg, white text), ghost/secondary with hover border effect, pill-shaped, medium padding |
| **Cards** | Subtle glass/dark cards with 1px border (`rgba(255,255,255,0.1)`), rounded-2xl, hover lift with glow |
| **Navigation** | Fixed top, transparent → frosted glass on scroll, logo left, links right, CTA button |
| **Animation feel** | Fade-up on scroll, staggered children, subtle scale on hover, smooth transitions (0.3s–0.5s ease-out) |

## 5. Design Direction

- **Colour mood:** Dark mode first — deep near-black `#0a0a0a` base, with a vibrant emerald-teal `#10a37f` accent that acts as the primary action colour. Soft white `#f0f0f0` for headings, muted grey `#8e8ea0` for body copy.
- **Typography:** `Inter` or system-ui stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`). Hero text: 56–72px, very bold (800). Body: 16–18px, regular (400).
- **Layout rhythm:** Full-width bleed sections with a centred content bucket (max-w-7xl ~1200px). Bento-style feature grid with asymmetric card sizes.
- **Interior design feel:** Glassmorphism-lite navigation, floating mockup with subtle shadow/glow, soft radial gradient backgrounds for section differentiation.

## 6. User Flows

1. **First-time visitor lands** → sees hero → scrolls to product preview → explores features → checks pricing → reads FAQ → signs up via auth modal.
2. **Returning visitor** → uses navbar links to jump to any section → clicks CTA → auth modal appears.
3. **Mobile user** → hamburger menu opens slide-out nav → all sections stack vertically → auth modal resizes to full-screen.

## 7. Pages / Sections

All on **one single-page layout**:

| # | Section | Content |
|---|---|---|
| 1 | **Navbar** | Fixed, glass-blur on scroll. Logo (OpenAI Browser wordmark), nav links: Features, Pricing, FAQ. CTA "Get Started" button. Mobile hamburger. |
| 2 | **Hero** | Large headline "The Browser That Thinks With You". Subheadline value prop. Two CTAs: "Download Free" (primary), "Watch Demo" (ghost). Floating browser mockup UI (an SVG/HTML illustration of a browser window with AI chat panel). Subtle animated background particles or gradient glow. |
| 3 | **Product Preview** | A more detailed interactive mockup showing the browser interface — split into: tab bar, URL bar with AI command input, sidebar with chat history, main content area rendering AI-summarised web pages. Animated transitioning between "normal browsing" and "AI mode". |
| 4 | **Features Grid** | Bento-style 3-column grid. 6 feature cards:
   - AI-Powered Search
   - Smart Tab Management
   - Built-in Privacy Guard
   - Real-time Translation
   - Voice Navigation
   - Web Summariser
   Each card: icon (lucide), title, description, subtle hover lift. Two cards span 2 cols. |
| 5 | **Pricing** | 3-tier cards: **Free** (basic), **Pro** ($12/mo, highlighted/recommended), **Enterprise** (custom). Each: feature list, CTA button. Annual/monthly toggle. |
| 6 | **FAQ** | Accordion. 5–6 questions. Smooth expand/collapse with framer-motion AnimatePresence. |
| 7 | **Footer** | Logo, small nav links, copyright, social placeholder icons. Minimal. |
| 8 | **Auth Modal** | Overlay modal. Two tabs: Sign In / Sign Up. Email + password fields, "Continue with Google" button, divider. Animated entrance (scale + fade). Close on overlay click / Escape key. |

## 8. Features List

- Sticky navbar with blur-on-scroll effect
- Hero with animated gradient glow / particles
- Interactive browser mockup showing AI features visually
- 6 bento-grid feature cards with staggered entrance animations
- Pricing with monthly/annual toggle and recommended badge
- FAQ accordion with smooth open/close
- Auth modal with tab switching (Sign In / Sign Up)
- Mobile hamburger nav with slide-out drawer
- Scroll-triggered animations (fade-up, stagger children)
- Dark-mode-only theme

## 9. Interactions & Animations

| Element | Animation |
|---|---|
| Navbar | `bg-opacity` transition on scroll (transparent → `rgba(10,10,10,0.85)` + backdrop-blur) |
| Hero headline | Staggered fade-up for headline, subtext, CTAs |
| Browser mockup | Subtle floating Y-axis animation (3s infinite ease-in-out), glow pulse on AI elements |
| Feature cards | Fade-up on viewport entry (stagger 0.1s per card), hover: translateY(-4px) + shadow increase |
| Pricing cards | Selected tier scales slightly (1.02) on hover, recommended card has a glowing border |
| FAQ items | Accordion expand: `AnimatePresence` with height auto, rotate chevron icon |
| Auth modal | Backdrop fade-in, modal scale(0.95 → 1) + fade, tab switch crossfade |
| Mobile nav | Slide-in from right, backdrop overlay, smooth links stagger |
| Smooth scroll | All internal anchor links use `scrollIntoView({ behavior: 'smooth' })` |

## 10. Responsive Behaviour

| Breakpoint | Behaviour |
|---|---|
| **Desktop (>1024px)** | Full multi-column bento grid, side-by-side hero, horizontal nav, 3-column pricing |
| **Tablet (768–1024px)** | 2-column feature grid, stacked hero with mockup below, hamburger menu activates, pricing stacks to 2 rows |
| **Mobile (<768px)** | Single column everywhere, hamburger nav, full-width mockup, stacked pricing cards, auth modal goes full-screen, reduced animation complexity for performance |

## 11. State & Data Needs

All client-side, no backend:

| State | Type | Location |
|---|---|---|
| Navbar scroll state | `boolean` (scrolled) | useState in Layout/Navbar |
| Mobile menu open | `boolean` | useState in Navbar |
| Pricing toggle (annual/monthly) | `boolean` | useState in PricingSection |
| FAQ open indices | `Set<number>` or `number[]` | useState in FAQSection |
| Auth modal open | `boolean` | useState in App/Layout |
| Auth tab (signin/signup) | `'signin' \| 'signup'` | useState in AuthModal |
| Form fields | `string` (email, password) | useState in AuthModal |
| Scroll-trigger visibility | `InView` refs | framer-motion `useInView` or IntersectionObserver |
| Form validation | local check for non-empty, email regex | inline in AuthModal |

## 12. File Plan

```
src/
├── main.tsx                          # Entry point, renders <App />
├── App.tsx                           # Root layout, composes all sections + global providers
├── index.css                         # Global styles, CSS custom properties (design tokens), reset
├── components/
│   ├── Navbar.tsx                    # Sticky navbar with glass effect, mobile drawer
│   ├── Hero.tsx                      # Headline, CTAs, animated browser mockup
│   ├── BrowserMockup.tsx             # Interactive browser window illustration
│   ├── ProductPreview.tsx            # Detailed product UI demo
│   ├── FeaturesGrid.tsx              # Bento feature cards with staggered animation
│   ├── FeatureCard.tsx               # Single feature card component
│   ├── PricingSection.tsx            # Monthly/annual toggle + 3 pricing cards
│   ├── PricingCard.tsx               # Single pricing tier card
│   ├── FAQSection.tsx                # Accordion list
│   ├── FAQItem.tsx                   # Single accordion item
│   ├── AuthModal.tsx                 # Sign In / Sign Up modal overlay
│   ├── Footer.tsx                    # Minimal footer
│   └── UI/
│       ├── Button.tsx                # Reusable button (primary, ghost, sizes)
│       └── SectionWrapper.tsx        # Max-width container + section padding
├── hooks/
│   └── useScrollPosition.ts          # Custom hook for scroll Y tracking
├── utils/
│   └── pricingData.ts                # Pricing tier data objects
│   └── faqData.ts                    # FAQ Q&A array
│   └── featuresData.ts               # Feature card content array
```

**No additional files needed.** The plan avoids over-engineering; each component is purposeful.

## 13. Tool / Build Strategy

| Tool | Purpose |
|---|---|
| **Vite 6** | Dev server + build |
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **framer-motion** | Declarative scroll/enter animations, layout animations, AnimatePresence |
| **lucide-react** | Consistent icon set (search, tab, shield, globe, mic, file-text, etc.) |
| **CSS custom properties** | Design tokens in `index.css` for colours, spacing, radii, fonts — no Tailwind dependency |

## 14. Validation Checklist

- [ ] Navbar glass effect only activates after scrolling past 50px
- [ ] Mobile hamburger toggles slide-out drawer, closes on link click
- [ ] Hero CTA buttons scroll to pricing or play demo animation
- [ ] Browser mockup animates (floating + glow) on desktop, static on mobile
- [ ] Feature cards enter via staggered fade-up animation on first scroll
- [ ] Pricing toggle switches between monthly and annual prices
- [ ] Recommended "Pro" card has visual distinction (border glow / badge)
- [ ] FAQ accordion opens one item at a time (or allows multiple — decide), chevron rotates
- [ ] Auth modal opens with scale-fade, Sign In / Sign Up tabs switch forms, close on Escape/overlay
- [ ] All sections are reachable via navbar anchor links with smooth scroll
- [ ] Page is fully responsive: desktop → tablet → mobile without horizontal overflow
- [ ] No console errors, no TypeScript strict mode errors
- [ ] Build succeeds (`npm run build`)

## 15. Acceptance Test

1. **Visual polish** — The page feels premium, dark-themed, and visually consistent with OpenAI's aesthetic (green-teal accents, clean typography, subtle glow effects).
2. **Animation quality** — Scroll-triggered entrances are smooth, not janky; hover states feel responsive; modal transitions are crisp.
3. **Responsive integrity** — All content is readable and well-spaced at 320px, 768px, 1024px, and 1440px widths.
4. **Interactive completeness** — Pricing toggle works, FAQ opens/closes, auth modal tabs switch, mobile nav functions, links scroll correctly.
5. **Code quality** — Components are reasonably sized, types are used, logic is separated from presentation, no unused imports.

---

**Next steps after approval:** Run `npm install`, create all files as per the file plan, implement each component with full styling and animations, then verify against the validation checklist.