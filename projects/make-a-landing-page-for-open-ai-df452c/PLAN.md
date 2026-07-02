# Implementation Plan

## Goal

Build an unofficial, inspired concept landing page for OpenAI — a complete, responsive, single-page website with modern animations, working interactions, multiple content sections, and polished visual design. This is a greenfield build in an empty workspace.

## Current Project Understanding

- **Workspace:** `/Users/lukesimpson/Documents/Coding Projects/Clyra-AI-Final/projects/make-a-landing-page-for-open-ai-df452c/files` (empty)
- **Framework:** None detected (vanilla HTML/CSS/JS or lightweight tooling TBD)
- **Styling:** None detected (TBD — likely CSS with animations)
- **Package file:** Not found
- **Previous PLAN.md:** No
- **Build status:** Planning phase only

## Requirements

1. **Landing page inspired by OpenAI** — an unofficial concept, not copying official assets/logos/exact text/CSS.
2. **Multiple sections** typical of a modern AI company landing page:
   - Navigation bar (sticky/responsive)
   - Hero section with headline, subtext, and primary CTA
   - Product/capability preview (e.g., ChatGPT, API, Codex inspired concept cards)
   - Features/benefits section
   - Testimonials or trust signals
   - Pricing or tier overview (concept)
   - FAQ accordion section
   - Footer with links and social cues
3. **Working interactions:**
   - Mobile hamburger menu toggle
   - Section scroll navigation
   - FAQ accordion open/close
   - Hover/focus states on all interactive elements
   - Smooth scroll between sections
4. **Responsive design** — mobile, tablet, desktop breakpoints
5. **Polished animations** — fade-in on scroll, hover transitions, smooth reveals
6. **Single-page application** (no routing), self-contained in the `files/` directory

## Non-Negotiable Constraints

1. **Do not copy official OpenAI assets**, logos, exact text, or CSS — this is an inspired concept only.
2. **No frameworks or build step required** unless explicitly beneficial — preference for vanilla HTML/CSS/JS or minimal tooling (e.g., Vite for dev server only).
3. **All source files must live in `files/`** — no files outside that directory.
4. **Must pass visual review** — responsive, no broken elements, polished animations.
5. **Must be a complete product** — not a shallow one-file demo. Minimum 4-6 focused files (HTML, CSS, JS split by concern).
6. **PLAN.md must be in workspace root** (not inside `files/`).
7. **Do not write code or modify files during Plan Mode** — only PLAN.md.
8. **Wait for user approval before implementation.**

## Proposed Changes

This is a greenfield build. All files are new.

| File | Purpose |
|---|---|
| `files/index.html` | Main HTML document — semantic, accessible, all sections |
| `files/css/styles.css` | Core layout, typography, responsive grid, color system |
| `files/css/animations.css` | Scroll-triggered reveals, hover transitions, keyframes |
| `files/js/navigation.js` | Sticky nav, mobile hamburger toggle, smooth scroll |
| `files/js/faq.js` | FAQ accordion interaction |
| `files/js/main.js` | Scroll animation observer, hero cursor effects, entry point |
| `files/assets/` | Placeholder directory for any SVG icons or placeholder images (inline SVG preferred) |

### Sections in `index.html`

1. **Navbar** — Logo placeholder (text-based), nav links (Research, Products, API, Company, Pricing), CTA button, mobile hamburger
2. **Hero** — Large headline ("The Future of Intelligence"), subtitle, email input + CTA, subtle animated background
3. **Product Showcase** — 3 concept cards (e.g., "Chat" — conversational AI, "Code" — coding agent, "Create" — media generation) with hover effects
4. **Features Grid** — 4-6 benefit items with icons and descriptions
5. **Stats / Trust** — Key metrics (users served, API calls, research papers, countries reached)
6. **Pricing Section** — 3 tiers (Starter, Pro, Enterprise) with feature lists
7. **FAQ** — 5-6 accordion items about AI safety, availability, pricing, etc.
8. **CTA Section** — Final call-to-action with background gradient
9. **Footer** — Column layout with links, social placeholders, copyright

## Implementation Steps

### Step 1 — Analyse Existing Structure
- Confirm workspace is empty (already done)
- Confirm no package.json, framework config, or existing code

### Step 2 — Create Directory Structure
- Create `files/css/`, `files/js/`, `files/assets/` subdirectories

### Step 3 — Build `index.html`
- Semantic HTML5 structure
- All sections with descriptive class names and data attributes for JS hooks
- Mobile-first responsive containers
- Accessible (aria-labels, semantic landmarks, alt texts)
- Inline SVG icons for sections (no external dependencies)

### Step 4 — Build `css/styles.css`
- CSS custom properties (design tokens) for colors, spacing, typography
- Dark theme (inspired by OpenAI's dark aesthetic)
- Grid and flexbox layouts
- Responsive breakpoints at 480px, 768px, 1024px, 1280px
- Form styling, card styling, button system

### Step 5 — Build `css/animations.css`
- `@keyframes` for fade-in-up, fade-in-left, fade-in-right
- Scroll-triggered classes (`.reveal`, `.reveal-visible`)
- Hover transitions on cards and buttons
- Subtle gradient animation on hero background

### Step 6 — Build `js/navigation.js`
- Sticky nav on scroll (add `.scrolled` class)
- Mobile hamburger toggle (`.nav-open`)
- Smooth scroll to anchor sections
- Active link highlighting based on scroll position

### Step 7 — Build `js/faq.js`
- Click to toggle accordion open/close
- Animate max-height with CSS transitions
- Single open at a time (optional / configurable)

### Step 8 — Build `js/main.js`
- Intersection Observer for scroll-reveal animations
- Hero particle or gradient cursor effect (CSS-based, no heavy canvas)
- Initialize navigation and FAQ modules

### Step 9 — Validation
- Open in browser and test all interactions
- Check responsive behavior at all breakpoints
- Verify smooth scroll, accordion, hamburger, animations
- Run any static analysis (HTML validation, lighthouse)
- Confirm no broken links, missing assets, or console errors

### Step 10 — Final Polish
- Tweak timing of animations
- Review color contrast and readability
- Ensure section spacing is consistent

## Technical Design

### Architecture
- **Pattern:** Vanilla multi-file SPA (no framework)
- **Loading:** Single `<script>` entry in HTML head (defer), modules loaded via IIFE or global namespace
- **State:** Minimal — nav open/closed, active FAQ item, scroll position detection — all DOM-driven
- **No build step** — files are served directly or via `npx serve` / VS Code Live Server

### Color Palette (Concept)
- **Background:** `#0a0a0f` (near-black), `#14141f` (card surface)
- **Primary:** `#10a37f` (teal/green — OpenAI inspired but not exact)
- **Accent:** `#6c63ff` (purple-blue), `#ff6b6b` (warm accent)
- **Text:** `#f0f0f5` (primary), `#a0a0b0` (secondary)
- **Gradients:** Dark purple/green/teal blends for hero and CTAs

### Typography (System Stack)
- `font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Load Inter from Google Fonts via `<link>`

### Responsive Strategy
- **Mobile-first** CSS with `min-width` media queries
- Single column → 2 columns → 3/4 columns at breakpoints
- Nav collapses to hamburger below 768px

### Performance
- No external images (all inline SVG or CSS gradients)
- Minimal JS — no heavy libraries
- CSS animations use `transform` and `opacity` only (GPU-accelerated)

## Security / Edge Cases

- **No user data collected** — email input is a placeholder, no form submission to a real endpoint
- **No external scripts** — no tracking, analytics, or third-party embeds
- **Edge cases:**
  - What if JS is disabled? — All content is visible, accordion stays open, animations skipped (progressive enhancement)
  - What if scroll observer isn't supported? — All content visible without animations (IntersectionObserver polyfill not needed for a concept page)
  - Mobile touch targets — minimum 44x44px for all interactive elements
  - Reduced motion — `prefers-reduced-motion` media query disables animations

## Verification Checklist

- [ ] Navbar sticks on scroll and adds visual shift (shadow/background)
- [ ] Hamburger menu opens/closes on mobile
- [ ] All nav links smooth-scroll to correct sections
- [ ] Hero section renders with animated background
- [ ] Product cards have hover/focus effects
- [ ] FAQ accordion opens/closes with animation
- [ ] Scroll-triggered fade-in animations work
- [ ] Pricing cards display correctly with feature lists
- [ ] Footer renders with column layout
- [ ] Responsive at 360px, 768px, 1024px, 1440px
- [ ] No broken images or missing assets
- [ ] No console errors
- [ ] Color contrast meets WCAG AA (or reasonable approximation for concept)
- [ ] `prefers-reduced-motion` respected

## Expected Final Output

A `files/` directory containing:

```
files/
├── index.html
├── css/
│   ├── styles.css
│   └── animations.css
├── js/
│   ├── main.js
│   ├── navigation.js
│   └── faq.js
└── assets/
    └── (empty or README.md placeholder)
```

And a `PLAN.md` at the workspace root (this file).

The landing page will be a polished, dark-themed, responsive single-page concept inspired by OpenAI's brand identity — featuring product showcase, features, pricing, FAQ, and interactive elements — all built with vanilla HTML/CSS/JS.

## Research Sources

- https://openai.com/ — "OpenAI | Research & Deployment" — navigation structure (Research, Business, Developers, Company)
- https://openai.com/api/ — "API Platform" — developer-focused messaging
- https://openai.com/chatgpt/ — "ChatGPT" — product name and chat concept
- https://openai.com/codex/ — "Codex | AI Coding Partner from OpenAI" — coding agent product description
- https://openai.com/business/pricing/ — "ChatGPT Pricing" — tier structure (contact sales, customer stories)
- All fetched 2026-06-30.

**Limitations:** `web_search`, `screenshot_page`, and `extract_brand_style` tools were not available. This plan uses only fetched page text for directional inspiration. Visual style is an original concept — no official CSS, logos, or assets are copied.

## Company Summary

OpenAI is an AI research and deployment company. Their public-facing site highlights four primary areas: Research (cutting-edge AI research), Business (enterprise ChatGPT offerings), Developers (API platform for building with AI), and Company (about/mission). Key products include ChatGPT (conversational AI), the API platform (developer tools), and Codex (AI coding agent). Pricing follows a freemium/tiered model for ChatGPT and usage-based pricing for the API.

## Visual Style Limits

Since screenshot and style extraction tools were unavailable, the visual direction is an **original concept** inspired by the general aesthetic of modern AI company landing pages:
- **Dark theme** with high-contrast accent colors
- **Clean, minimal** layout with generous whitespace
- **Gradient hero** backgrounds
- **Card-based** product and feature layouts
- **Subtle animations** (fade, slide, glow)
- **System font stack** — no custom fonts beyond Google Fonts (Inter)
- **No official OpenAI logos**, trademarks, or copied CSS

## Safety Boundary

1. **Do not impersonate or misrepresent** — clearly an unofficial concept page, not affiliated with OpenAI
2. **No trademark infringement** — avoid using the exact OpenAI logo, "GPT" branding, or trademarked terminology in a way that implies official endorsement
3. **No deceptive functionality** — email forms do not collect or transmit real data
4. **No real API keys or credentials** in the codebase
5. **No scraping or reproduction of copyrighted content** from OpenAI's website
6. **Accessibility first** — semantic HTML, ARIA attributes, keyboard navigable

## Approval Gate

**This plan is ready for review.** Please review the plan above and provide approval before I proceed with implementation. I will not write or modify any code files until you explicitly approve this plan.

Once approved, I will begin with **Step 1 — Analyse Existing Structure** (confirm empty workspace) and proceed through all implementation steps sequentially, creating the complete landing page in the `files/` directory.