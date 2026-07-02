Excellent. I have a solid picture of the competitive landscape and what a premium note-taking landing page looks like. Let me now write a comprehensive PLAN.md for NotePilot.

---

# PLAN.md — NotePilot Landing Page

## 1. Request Summary

Build a premium, conversion-focused landing page for **NotePilot**, a modern note-taking application. The page must feel polished, trustworthy, and inviting — targeting knowledge workers, students, and professionals who crave a beautiful, organized, and fast note-taking experience.

## 2. Product Type

**SaaS Landing Page** — single-page marketing site for a note-taking app, with a freemium pricing model, feature showcase, social proof, and clear call-to-action flow.

## 3. Target Product

**NotePilot** — a note-taking app that combines a clean editor, powerful organization (tags, folders, search), cross-device sync, and optional AI assistance. It positions itself as "the captain of your notes" — organized, fast, and reliable.

## 4. Research Summary

- **Notion** uses a full-width, block-heavy layout with AI agents as the headline hook. Dark/light toggle, lots of motion, gradient CTAs, and a dense feature grid. Colour: deep indigos, whites, neon purple accents.
- **Bear** leans into a minimal, cozy, Apple-inspired aesthetic. Soft greys, warm accents, beautiful typography, illustration-based hero, clear feature cards with icons, and a transparent two-tier pricing section.
- **Common patterns**: hero with app mockup + headline + subhead + CTA; 3-column feature grid; testimonial carousel; pricing comparison; sticky nav; dark/light mode; subtle scroll animations.

**Design direction derived**: Clean, vibrant, slightly playful startup vibe. Deep navy / slate base with warm gold-orange and teal accents. Generous whitespace, bold headings, subtle micro-interactions, and a friendly tone.

## 5. Design Direction

| Attribute | Decision |
|---|---|
| **Colour Mood** | Vibrant startup — dark navy `#0b1120` base, warm accent `#f59e0b` (amber/gold), supporting teal `#06b6d4`, pure white text, soft grey `#94a3b8` for body copy. |
| **Typography** | Inter (headings, clean sans) + JetBrains Mono (code snippets, badges). System fallback stack. |
| **Layout Pattern** | Centered storytelling — wide hero, staggered feature sections, full-width testimonial strip, sticky navigation, anchored pricing. |
| **Interaction Style** | Playful motion cues — staggered fade-in on scroll, subtle hover scale on cards, smooth anchor scroll, a "pulse" glow on primary CTA, counter animation on stats. |
| **Visual Hierarchy** | Giant bold headlines → supporting subhead → feature cards → testimonials → pricing → final CTA. |
| **Tone** | Professional yet warm, aspirational but grounded. Copy uses "you" frequently. |

## 6. Colour Palette

- **Background**: `#0a0f1e` (darkest), `#111827` (section alt), `#1e293b` (card/component surface)
- **Primary / Accent**: `#f59e0b` (amber-gold — CTAs, highlights, active states)
- **Secondary Accent**: `#06b6d4` (cyan-teal — secondary buttons, link hover, feature icons)
- **Text**: `#ffffff` (headings), `#cbd5e1` (body), `#64748b` (muted/labels)
- **Borders / Dividers**: `#1e293b`
- **Success / Status**: `#22c55e` (green for "sync online" badge / PRO badge)

## 7. User Flows

### Flow A — First-time visitor (cold traffic)
1. Scroll hero → headline interests → taps **"Get Started Free"** → scrolls to pricing → chooses Free plan → clicks CTA → opens email signup / app download.
2. OR scroll hero → scrolls down through features → sees social proof → scrolls to pricing → picks Pro → CTA to signup.

### Flow B — Returning / referral visitor
1. Lands on page → smooth scroll via nav ("Features" → section, "Pricing" → section) → clicks CTA from any section.

## 8. Pages & Sections

A single-page scroll with **7 primary sections**:

### 8.1 Navbar (sticky)
- Logo (NotePilot wordmark + paper-plane icon)
- Links: Features, Testimonials, Pricing, FAQ
- Two CTA buttons: "Log In" (ghost) + "Get Started" (solid amber)

### 8.2 Hero Section
- **Headline**: "Your thoughts, organized. Your ideas, amplified."
- **Subhead**: "NotePilot is the beautifully fast note-taking app that keeps you in flow. Capture, organize, and find anything — in seconds."
- **Visual**: Browser mockup / device frame showing the NotePilot editor with some sample notes (clean code screenshot or illustrated mockup).
- **CTAs**: "Get Started Free — it's free" (large amber button) + "Watch Demo" (ghost with play icon)
- **Trust bar below**: "Join 12,000+ users" with mini avatar stack

### 8.3 Social Proof / Stats Bar
- 4 stat items in a row: **12,000+** users, **4.9★** rating, **50M+** notes created, **99.9%** uptime
- Count-up animation on scroll

### 8.4 Features Section (3-column grid)
Six feature cards in a staggered grid (3+3), each with icon + heading + short description:

| Icon | Heading | Description |
|---|---|---|
| ⚡ | Blazing Fast Search | Full-text search that finds any note in milliseconds. |
| 🏷️ | Smart Tags & Folders | Organize your way with nested tags, folders, and smart filters. |
| ☁️ | Cross-Device Sync | Pick up where you left off — on Mac, Windows, iOS, Android, and Web. |
| 🤖 | AI Copilot | Let AI summarize, rewrite, or expand your notes with one click. |
| 🔒 | End-to-End Encrypted | Your notes are private, secure, and encrypted by default. |
| 📝 | Markdown Editor | Rich Markdown with live preview, code blocks, tables, and math. |

### 8.5 Testimonials Section
- Heading: "Loved by thinkers, writers, and builders."
- 3 testimonial cards in a horizontal row/carousel:
  - **Sarah Chen**, Product Designer — "NotePilot replaced three apps for me. It's that good."
  - **Marcus Johnson**, PhD Student — "The AI summaries alone save me hours every week."
  - **Aisha Patel**, Freelance Writer — "Finally, a notes app that's fast, beautiful, and actually organized."
- Each card: avatar, name, role, quote, star rating (5★).

### 8.6 Pricing Section

**Two tiers** (Free / Pro) side by side.

| Feature | Free | Pro |
|---|---|---|
| Unlimited notes | ✅ | ✅ |
| 5 GB storage | ✅ | 50 GB |
| Sync (2 devices) | ✅ | Unlimited devices |
| Markdown & rich text | ✅ | ✅ |
| Tags & folders | Basic | Advanced + Smart Filters |
| AI Copilot | 50 queries/mo | Unlimited |
| End-to-end encryption | ❌ | ✅ |
| Priority support | ❌ | ✅ |
| Price | **$0 forever** | **$9/mo** or **$79/yr** |

- **Free card**: Ghost border style, "Get Started" CTA
- **Pro card**: Amber accent glow, "Most Popular" badge, "Start Free Trial" CTA (7-day trial, no card required)

### 8.7 FAQ Section
Accordion-style, 5-6 common questions:
- Is NotePilot really free?
- Can I import notes from Notion / Bear / Apple Notes?
- How does the AI Copilot work?
- Is my data encrypted?
- Can I use NotePilot offline?
- What happens when I upgrade to Pro?

### 8.8 Footer
- Logo + tagline: "Navigate your notes. Pilot your ideas."
- 4-column link grid: Product (Features, Pricing, Changelog), Resources (Blog, Help Center, API Docs), Company (About, Careers, Contact), Legal (Privacy, Terms, Cookies)
- Social icons (Twitter/X, GitHub, Discord)
- Copyright line

## 9. Interactive Elements & Animations

| Element | Interaction |
|---|---|
| **CTA Buttons** | Hover: scale(1.05) + brighter amber glow. Click: brief inner ripple. |
| **Feature Cards** | Hover: translateY(-4px) + subtle border glow. Staggered fade-in on scroll via Intersection Observer. |
| **Stat Counters** | Scroll-triggered count-up from 0 to target number (duration ~1.5s, ease-out). |
| **Testimonial Cards** | Hover: subtle shadow lift. Optional auto-rotating carousel every 5s with manual dots. |
| **Navbar** | Background-opacity shift from transparent to `#0a0f1e` with backdrop blur on scroll. Active section highlight. |
| **Pricing Cards** | Hover: slight elevation. Pro card has a subtle amber glow pulsing slowly. |
| **FAQ Accordion** | Smooth max-height transition on open/close. Plus icon rotates 45° to become X. |
| **Scroll Animations** | Staggered `fade-in-up` (opacity 0→1, y: 40px→0) with 100ms stagger per element. Triggered once. |

## 10. Responsive Behaviour

| Breakpoint | Layout Changes |
|---|---|
| **≥1024px (Desktop)** | Full 12-column grid. Side-by-side hero. 3-column feature grid. 3-column testimonials. Side-by-side pricing. |
| **768–1023px (Tablet)** | 2-column feature grid. Slightly narrower hero. Pricing stacked vertically. Testimonials stacked or 2-column. |
| **<768px (Mobile)** | Single column. Centered hero with stacked text + mockup. Feature cards full-width. Pricing stacked. Hamburger nav. Smaller typography scale. |

- Font sizes scale fluidly using `clamp()`.
- Padding/margins use `clamp()` for consistent rhythm.
- Touch targets minimum 44x44px.

## 11. State & Data Needs

### Component States

| Component | States |
|---|---|
| **CTA Buttons** | default, hover, active (ripple), loading (spinner if form submit), disabled |
| **Nav Links** | default, hover, active (section in view — underline/amber) |
| **Feature Cards** | default, hover, visible (scroll-animated in) |
| **FAQ Item** | closed, open (rotated icon, expanded content), hover |
| **Pricing Cards** | default, hover, selected/active, hover on CTA |
| **Testimonial Carousel** | idle (auto-play), manual navigation (dot click), paused (on hover) |
| **Stat Counter** | before-scroll (0), animating (counting up), settled |
| **Scroll Animations** | before-view (hidden + offset), in-view (animated visible), after-view (static visible) |

### Data / Content Entities

```
Stat { value: number, label: string, suffix?: string }
Feature { icon: string, title: string, description: string }
Testimonial { name: string, role: string, quote: string, avatar: string, rating: number }
PricingTier { name: string, price: string, period: string, features: FeatureItem[], cta: string, popular: boolean }
FaqItem { question: string, answer: string }
```

All data will be hardcoded in a single `content.js` (or within the Vue/React data layer) — no backend needed.

## 12. File Plan (Greenfield)

```
notepilot-landing/
├── index.html                  # Single HTML entry (if vanilla) / or index.html as entry
├── styles/
│   ├── reset.css               # Minimal CSS reset
│   └── main.css                # All styles (organized by section via comments)
├── scripts/
│   └── main.js                 # Intersection Observer, carousel, accordion, counter, nav
├── assets/
│   ├── logo.svg                # NotePilot wordmark + icon
│   ├── hero-mockup.png         # App screenshot/illustration
│   ├── favicon.svg             # Simple paper-plane favicon
│   ├── avatars/                # 3 testimonial avatars (placeholder SVGs or initials)
│   └── icons/                  # Feature icons (simple SVG inline or separate files)
├── README.md
└── PLAN.md                     # This file
```

**OR** a framework variant (if the user wants React/Vue later) — but given the empty workspace and the request for a "premium landing page," a **vanilla HTML/CSS/JS single-page approach** is fastest and most performant. However, I'll note the file plan can be adapted.

## 13. Tool & Build Strategy

- **Vanilla HTML5** — one `index.html` file with semantic landmarks (`<header>`, `<section>`, `<footer>`).
- **CSS3** — custom properties for colours, `clamp()` for fluid typography, CSS Grid and Flexbox for layout, `@media` queries for responsive, `@keyframes` for scroll-triggered animations.
- **Vanilla JS (ES6)** — Intersection Observer API for scroll animations + stat counters; minimal click handlers for FAQ accordion and testimonial dots; scroll-based navbar background swap.
- **Performance**: Preconnect to Google Fonts (Inter + JetBrains Mono); defer all JS; lazy-load below-fold images; inline critical CSS.
- **No build step** — zero dependencies. Deploy-ready by opening `index.html`.

## 14. Validation Checklist

- [ ] All 7 sections render on a single scroll
- [ ] Navbar links smooth-scroll to correct sections
- [ ] Navbar background darkens on scroll past hero
- [ ] Feature cards fade-in-up staggered on scroll into view
- [ ] Stat counters count up from 0 to target on first scroll into view
- [ ] Testimonials render with avatar, name, role, quote, stars
- [ ] Pricing cards show two tiers, Pro card has "Most Popular" badge
- [ ] FAQ accordion opens/closes with rotation animation on the toggle
- [ ] All CTAs are functional (even if pointing to `#`)
- [ ] Page is fully responsive at ≥1024px, 768-1023px, <768px
- [ ] No horizontal scroll overflow at any breakpoint
- [ ] All links have hover states
- [ ] Touch targets ≥44px on mobile
- [ ] Lighthouse Performance ≥90 (minimal JS, optimized fonts, no render-blocking resources)

## 15. Acceptance Test

1. Load the page in a desktop browser (≥1280px wide) — hero is full-viewport, bold headline, app mockup visible, CTA buttons prominent. ✅
2. Scroll down — navbar background shifts from transparent to solid dark with blur. ✅
3. Continue scrolling — each section animates into view with a smooth fade-up. ✅
4. Stop at the stats bar — numbers count up from 0 to their final value. ✅
5. Click each nav link — page smoothly scrolls to the correct section, the nav link highlights. ✅
6. Resize to 375px width — layout stacks vertically, text scales down, hamburger appears, no overflow. ✅
7. Click FAQ questions — panels expand/collapse smoothly, icon rotates. ✅
8. Hover over feature cards — they lift slightly with a glow border. ✅
9. Review the pricing section — two clear tiers, Pro has a "Most Popular" badge, CTAs are distinct. ✅
10. Footer is present with all link columns and social icons. ✅

---

**Ready for approval.** Once approved, I'll build the full landing page in a single `index.html` with embedded CSS and JS, plus any necessary assets.