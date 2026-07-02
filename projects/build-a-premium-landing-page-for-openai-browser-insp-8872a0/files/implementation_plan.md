Empty workspace — greenfield project. Here's the complete plan.

---

# PLAN.md

## 1. Request Summary

Build a premium, production-quality landing page for "OpenAI Browser" — a fictional product that positions itself as an AI-native web browser with deep reasoning capabilities. The page must be inspired by OpenAI's official visual language (clean, minimal, dark-leaning, with thoughtful motion and bento-grid layouts). It needs: navbar, hero, product preview, features (bento grid), pricing, FAQ, auth modal, responsive mobile layout, and polished animations. No framework locked in, no router, no state management beyond UI state.

---

## 2. Product Type & Target Product

| Field | Value |
|---|---|
| **Product type** | Landing page (single-page marketing site) |
| **Target product** | *OpenAI Browser* — a hypothetical AI-powered browser that summarises, reasons over, and rewrites web pages in real-time |
| **Tone** | Premium, intelligent, calm, slightly futuristic |
| **Target audience** | Developers, power users, early adopters, AI enthusiasts |

---

## 3. Design Direction (OpenAI-Inspired)

Based on well-known OpenAI visual design patterns (openai.com, Sora, DALL·E, ChatGPT marketing pages):

### Colour Palette

| Role | Hex / Token | Usage |
|---|---|---|
| **Background** | `#0b0b0f` (near-black) | Page background, dark sections |
| **Surface** | `#14151a` | Cards, bento tiles, modals |
| **Surface border** | `#23262d` | Subtle 1px borders on cards |
| **Primary text** | `#ffffff` | Headlines, nav links |
| **Secondary text** | `#a1a1aa` / `#8b8d97` | Body copy, muted labels |
| **Accent (green)** | `#21c55e` (OpenAI green) | CTAs, active indicators, emphasis |
| **Accent (blue)** | `#3b82f6` | Secondary CTAs, links |
| **Gradient hero** | `#0b0b0f` → `#14151a` with radial `#21c55e` at ~10% opacity | Hero background glow |

### Typography

- **Primary font**: Inter (sans-serif) — OpenAI's known choice
- **Fallback**: `system-ui, -apple-system, sans-serif`
- **Headings**: Bold (700), large letter-spacing `-0.02em`
- **Body**: Regular (400), comfortable leading `1.6`
- **Mono**: `'JetBrains Mono', monospace` for product preview code/browser chrome

### Layout Rhythm

- Max content width: `1280px` (centred, `mx-auto`)
- Section spacing: `py-24 md:py-32` (96px/128px)
- Bento grid: 2-col on desktop, 1-col on mobile
- Navbar height: `h-16` (64px)
- Padding horizontal: `px-6 md:px-12`

### Spacing Scale (Tailwind or custom)

| Token | Pixels |
|---|---|
| `space-4` | 16px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-24` | 96px |

### Interaction & Animation Style

- **Micro-delay scroll reveals**: Elements fade-up with 0.2s stagger per sibling (Intersection Observer)
- **Navbar shrink**: On scroll >60px, navbar shrinks from `h-20` → `h-16`, backdrop-blur activates
- **Button hover**: Scale 1.02 + brighter shadow, `transition-all duration-200 ease-out`
- **Card hover**: Slight lift `translateY(-2px)`, border highlight to `#21c55e` at 30% opacity
- **Auth modal**: Centered overlay, backdrop blur `12px`, slide-up animation `0.3s ease-out`
- **Hero glow**: Pulsing radial gradient behind headline, slow `10s ease-in-out infinite`
- **Pricing toggle**: Tab-style switch, smooth `width` transition on active pill
- **FAQ accordion**: Max-height expand with `grid-template-rows` transition, rotate chevron
- **Mobile menu**: Slide-in from right, `translate-x-full` → `translate-x-0`, 0.3s

### OpenAI Visual Cues Applied

- "No corners cut" — subtle `rounded-lg` (8px) or `rounded-xl` (12px) on cards, never sharp
- Thin 1px borders on all surface-level elements (`border-[#23262d]`)
- Minimal shadows — instead use `border` + `bg-[#14151a]` contrast
- "Glowing dot" accent on feature cards (small `#21c55e` pulse)
- Clean, centred navigation with minimal links (max 5 items)

---

## 4. User Flows

```
1. LANDING → Scroll → Read Hero → Click "Get started" → Auth modal opens
2. LANDING → Scroll → Features → Learn product value → Scroll to Pricing
3. LANDING → Scroll → Pricing → Toggle monthly/yearly → Click "Subscribe" → Auth modal
4. LANDING → Scroll → FAQ → Expand questions → Click CTA in footer
5. LANDING → Click "Sign In" in navbar → Auth modal (login tab active)
6. MOBILE: Hamburger icon → Slide-in nav → Click link → Smooth scroll + close menu
```

---

## 5. Pages / Sections

### SPA — Single Scroll Page

| # | Section | Details |
|---|---|---|
| 1 | **Navbar** | Fixed top, `bg-[#0b0b0f]/80 backdrop-blur-xl`. Logo (text "OpenAI Browser"), four links (Features, Pricing, FAQ, Sign In), "Get Started" CTA button. Mobile: hamburger → slide-in panel. Border-bottom 1px `#23262d`. |
| 2 | **Hero** | Full viewport height minus navbar. Large headline "The browser that thinks with you." Subhead: "OpenAI Browser brings real-time reasoning, summarisation, and rewriting directly into every page you visit." Two CTAs: "Get started" (green filled) / "See how it works" (outline). Subtle gradient glow behind text. Scroll-down indicator (animated chevron bounce). |
| 3 | **Product Preview** | A bento-style mockup of the browser UI. Dark browser chrome frame, URL bar with "openai.com/..." + a small reasoning panel on the right showing "Summarising..." + bullet-point output. Use CSS/HTML only (no screenshots). Floating label "AI reasoning panel" with small green dot. |
| 4 | **Features** | Bento grid: 6 feature cards in a 2×3 (desktop) / 1-col (mobile) layout. Each card has a subtle icon (simple SVG), title, description, and an underline accent glow. Features: ① Real-Time Summaries, ② Smart Rewriting, ③ Source-Aware Citations, ④ One-Click Deep Research, ⑤ Privacy-First Architecture, ⑥ Cross-Device Sync. |
| 5 | **Pricing** | Two cards side-by-side (Free / Pro). Monthly/Yearly toggle at top. Free: $0, limited summaries, 1 device. Pro: $19/mo or $190/yr (2 months free), unlimited, 5 devices, priority access. Features list in each card. "Get started" CTA on each. |
| 6 | **FAQ** | Accordion list with 5-6 questions: "What makes OpenAI Browser different?", "Is my data private?", "Can I use it without an account?", "Which languages are supported?", "How does the AI summarisation work?", "Can I cancel anytime?". Click to expand, chevron rotates, max-height animation. |
| 7 | **Footer** | Minimal. Three columns: Product (Features, Pricing, FAQ), Company (About, Blog, Careers), Legal (Privacy, Terms). Bottom bar: "© 2025 OpenAI Browser. All rights reserved." Small OpenAI-style logo text. Border-top 1px `#23262d`. |

### Auth Modal

| State | Details |
|---|---|
| **Overlay** | Fixed full-screen, `bg-black/60 backdrop-blur-md`, z-50 |
| **Card** | `bg-[#14151a] border border-[#23262d] rounded-xl`, max-w-md, centred |
| **Tabs** | "Sign In" / "Sign Up" — pill toggle, active has `bg-[#21c55e] text-black`, inactive `text-[#a1a1aa]` |
| **Form** | Email + Password inputs (dark style `bg-[#0b0b0f] border-[#23262d]`), "Continue" button (green), divider "or", Google/Apple buttons |
| **Close** | X button top-right, ESC key |
| **Transitions** | Scale-up + fade-in on mount (0.3s), reverse on unmount |

---

## 6. Features Checklist

- [x] Fixed navbar with blur backdrop
- [x] Hero with dual CTAs and animated glow
- [x] Product preview bento card (CSS browser chrome)
- [x] 6-feature bento grid with hover effects
- [x] Pricing section with monthly/yearly toggle
- [x] FAQ accordion with smooth expand
- [x] Auth modal (login/signup tabs)
- [x] Mobile hamburger menu
- [x] Scroll-triggered fade-up animations
- [x] Responsive from 320px to 1920px

---

## 7. Interactions & Animations (Detailed)

| Interaction | Trigger | Behaviour |
|---|---|---|
| **Navbar shrink** | `scrollY > 60` | Height `h-20` → `h-16`, `backdrop-blur` intensity increases |
| **Scroll reveal** | Element enters viewport (Intersection Observer, 0.15 threshold) | `opacity 0 → 1`, `translateY(24px) → 0`, stagger 80ms between siblings, `duration-600` |
| **Button hover** | `:hover` | `scale(1.02)`, `box-shadow` glow in `#21c55e` at 20% |
| **Card hover** | `:hover` | `translateY(-2px)`, border `#21c55e` with 30% opacity |
| **Pricing toggle** | Click monthly/yearly | Active pill slides, prices update with counter animation (framed) |
| **FAQ expand** | Click question row | `grid-template-rows: 0fr → 1fr`, chevron `rotate(180deg)`, duration 300ms |
| **Auth modal** | Click "Sign In" or "Get Started" | Overlay fade-in 200ms, modal scale-up 300ms, backdrop-blur 12px |
| **Mobile menu** | Click hamburger | Panel slides from right, `translate-x-full → 0`, duration 300ms, links fade in staggered |
| **Hero glow** | Auto on load | Radial gradient `#21c55e` at 10% opacity pulses slow (10s animation) |
| **Scroll-down indicator** | On mount | Bouncing chevron `translateY` loop, fades out after first scroll |

---

## 8. Responsive Behaviour

| Breakpoint | Layout changes |
|---|---|
| **≥ 1024px** | Full desktop: bento 2×3, pricing side-by-side, navbar horizontal, hero two-column |
| **768px – 1023px** | Tablet: features 2×2 + 2 stacked, pricing side-by-side, slightly smaller hero text |
| **< 768px** | Mobile: everything 1-column, hamburger nav, pricing stacked, smaller hero headline, reduced padding |

---

## 9. State & Data Needs

No backend needed — all static/frontend state:

| State | Type | Used by |
|---|---|---|
| `scrolled` | `boolean` | Navbar shrink |
| `mobileMenuOpen` | `boolean` | Mobile nav |
| `activePricingTab` | `'monthly' \| 'yearly'` | Pricing cards |
| `expandedFaq` | `number \| null` | FAQ accordion |
| `authModalOpen` | `boolean` | Auth modal |
| `authTab` | `'login' \| 'signup'` | Auth modal tabs |
| `visibleSections` | `Set<string>` | Scroll reveal (Intersection Observer) |

---

## 10. File Plan

```
/
├── index.html              # Single HTML file with all sections (no framework)
├── styles.css              # All styles (Tailwind via CDN + custom overrides)
├── script.js               # All JS: navigation, scroll, modal, animations, FAQ, pricing toggle
└── PLAN.md                 # This file
```

### Why single-file approach?
- No framework required for a standalone landing page
- Tailwind CDN for utility classes (minimal CSS), JS is ~200 lines
- Fast delivery, zero build step

---

## 11. Tooling & Strategy

| Tool | Purpose |
|---|---|
| **Tailwind CSS v3** (CDN) | Utility-first styling, responsive breakpoints, dark theme support |
| **Inter font** (Google Fonts via CDN) | Primary typeface |
| **JetBrains Mono** (Google Fonts via CDN) | Mono for product preview |
| **Vanilla JS** (ES6+) | All interactivity — no libraries needed |
| **Intersection Observer API** | Scroll-triggered reveals |
| **CSS `@keyframes`** | Hero glow, scroll indicator bounce |
| **CSS `transition` / `transform`** | All hover/expand/slide animations |

No package.json, no build step, no router — pure HTML+CSS+JS.

---

## 12. Validation Checklist

- [ ] Lighthouse Performance ≥ 90 (no render-blocking resources beyond fonts)
- [ ] Lighthouse Accessibility ≥ 95 (proper `aria-*`, roles, focus management)
- [ ] Lighthouse Best Practices ≥ 95
- [ ] No JavaScript errors in console
- [ ] Auth modal traps focus, closes on ESC + overlay click
- [ ] Mobile menu closes on link click
- [ ] FAQ accordion closes other items when opening new one
- [ ] Pricing toggle updates both card prices correctly
- [ ] Scroll reveals work on re-entering viewport (not just once)
- [ ] All links are `href="#section-id"` with smooth scroll
- [ ] Responsive down to 320px width with no overflow

---

## 13. Acceptance Test

1. Page loads — full hero visible with glow, CTA buttons, scroll indicator
2. Scroll down — navbar shrinks, sections fade in with stagger
3. Features section — 6 cards, hover effects work, bento layout correct
4. Pricing — toggle monthly/yearly updates prices and callouts
5. FAQ — click any question, it expands smoothly; click another, first closes
6. Click "Get Started" — auth modal opens with backdrop blur, tabs work
7. Click "Sign In" in nav — auth modal opens on login tab
8. Resize to mobile — hamburger visible, sections stack vertically
9. Open mobile menu — panel slides in, links work, close on X or link click
10. No horizontal scrollbar at any breakpoint

---

## 14. OpenAI Style Capture (Disclaimer)

This page uses a design direction *inspired by* publicly observable patterns from OpenAI's marketing pages (openai.com, Sora, ChatGPT). No proprietary code, assets, or copy was extracted. The colour palette, typography choices, layout rhythms, and animation feel are derived from well-documented industry analysis and public screenshots. All product copy ("OpenAI Browser" features, description) is fictional and created for this project only.