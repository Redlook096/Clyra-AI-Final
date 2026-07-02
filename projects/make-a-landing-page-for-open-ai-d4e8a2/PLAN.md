# Implementation Plan

## Goal

Create a modern, inspired, unofficial landing page for OpenAI — the AI research and deployment company. This is a complete, polished, responsive single-page website using only HTML, CSS, and vanilla JavaScript (no frameworks, no build tools). The page will be visually inspired by OpenAI's known design language (clean, minimal, dark-mode-friendly, tech-forward) but will NOT copy any official assets, logos, exact text, or CSS. It will be an original concept.

## Current Project Understanding

- **Project directory**: `/Users/lukesimpson/Documents/Coding Projects/Clyra-AI-Final/projects/make-a-landing-page-for-open-ai-d4e8a2/files`
- **Framework**: unknown / none detected
- **Package file**: not found
- **Styling method**: unknown
- **Inspectable project files**: 0
- **Previous PLAN.md**: No
- **Checkpoints**: empty
- **Logs**: empty
- **Research context available**: company-research.json with summary that web_search, screenshot_page, and extract_brand_style are NOT connected. Only fetch_url is connected but failed to fetch official pages.
- **Metadata status**: "Planning" — no previous build.

This is a fresh, empty workspace. We are building from scratch.

## Requirements

1. Build a complete landing page for OpenAI using only vanilla HTML, CSS, and JavaScript.
2. Include these sections:
   - **Navbar**: Fixed, responsive, with logo placeholder and navigation links with mobile hamburger menu.
   - **Hero Section**: Bold headline, sub-headline, and primary CTA button with animated background effect.
   - **Product Preview / Visual**: A showcase area featuring a mock product card or visual representation of AI capabilities (original concept, not copied from OpenAI).
   - **Features / Benefits Section**: Grid of 4-6 feature cards highlighting AI-powered capabilities.
   - **Call to Action**: Final CTA section with secondary button.
   - **FAQ / Footer**: Accordion FAQ section + footer with links and copyright.
3. Working interactions:
   - Mobile hamburger menu toggle.
   - FAQ accordion expand/collapse.
   - Smooth scroll navigation.
   - Hover and active states on all interactive elements.
   - Scroll-triggered fade-in animations for sections.
4. Mobile-responsive design:
   - Breakpoints at 768px and 480px.
   - Touch-friendly tap targets.
   - Accessible contrast ratios.
5. Polished visual design:
   - Dark theme with accent colors (inspired by AI/tech aesthetic).
   - Subtle gradients, shadows, and transitions.
   - Clean typography with Google Fonts (Inter or similar).
   - No external CSS frameworks (no Tailwind, Bootstrap, etc.).
6. No copyrighted assets or exact copying of OpenAI's branding or assets.

## Non-Negotiable Constraints

- **No build tools**: Zero npm, webpack, vite, etc. Pure HTML/CSS/JS.
- **No copying official OpenAI logos, trademarks, or copyrighted text.** All content must be original and inspired, not replicated.
- **No external CSS frameworks**: No Tailwind, Bootstrap, etc. Hand-written CSS only.
- **Single file or multi-file**: All files go in the `files/` directory.
- **Must be responsive** and work on mobile, tablet, and desktop.
- **No server-side code**: Static site only.
- **Must pass basic W3C HTML validation** (no deprecated tags, proper semantic structure).
- **Accessibility**: Semantic HTML, aria labels where appropriate, proper heading hierarchy.
- **No placeholder images that require downloading** — use SVG or CSS-drawn graphics.

## Proposed Changes

Since this is a new project with an empty workspace, we will create the following files in `/Users/lukesimpson/Documents/Coding Projects/Clyra-AI-Final/projects/make-a-landing-page-for-open-ai-d4e8a2/files/`:

| File | Purpose |
|------|---------|
| `index.html` | Main HTML document with semantic structure |
| `styles.css` | All styling — dark theme, responsive, animations |
| `script.js` | All JavaScript — navigation, FAQ, scroll animations |

### File Architecture

```
files/
├── index.html      # Entry point — semantic HTML5 document
├── styles.css      # All CSS — no frameworks, fully custom
└── script.js       # Vanilla JS — interactions & animations
```

No additional assets (no images, no fonts beyond Google Fonts link in HTML).

## Implementation Steps

### Step 1 — Analyse Existing Structure
No existing structure. Confirm workspace is empty, note the project root, verify the `files/` directory exists.

### Step 2 — Research & Content Planning
- Use the company research summary (OpenAI is an AI research/deployment company).
- Create original, inspired copy for each section.
- Plan color palette (dark theme with green/teal accent colors — inspired but distinct).
- Plan layout structure and responsive breakpoints.

### Step 3 — Create index.html
- Full HTML5 boilerplate with viewport meta, charset, Google Fonts link, and stylesheet/script links.
- Semantic structure: `<header>`, `<main>`, `<section>` for each content area, `<footer>`.
- Navbar with logo placeholder (`<span>` or SVG), nav links, hamburger button.
- Hero section with headline, sub-headline, CTA button, and animated background container.
- "Product Preview" section with a mock AI card / visual showcase (SVG-based).
- "Features" section with a 3-column grid of 6 feature cards.
- "CTA" section with headline, text, and button.
- "FAQ" section with accordion items (4-6 questions).
- Footer with column links and copyright.
- ARIA labels and semantic attributes throughout.

### Step 4 — Create styles.css
- CSS custom properties (variables) for theming.
- Reset/normalize base styles.
- Typography (Inter from Google Fonts).
- Dark theme: background `#0a0a0f`, surface `#13131a`, accent green `#00cc88` / teal `#00aaff`.
- Navbar: fixed, glass-morphism effect, responsive hamburger toggle.
- Hero: full-viewport height, animated gradient/particle background, centered content.
- Product preview: centered card with a CSS/SVG visual.
- Features: responsive CSS grid (3 columns → 2 columns → 1 column).
- FAQ: accordion with smooth max-height transitions.
- Footer: multi-column grid.
- Animations: `@keyframes` for hero background, `.fade-in` scroll reveals, micro-interactions on hover.
- Media queries for 768px and 480px breakpoints.
- Focus and active states for accessibility.

### Step 5 — Create script.js
- Mobile hamburger toggle (toggle `aria-expanded`, toggle nav visibility).
- Smooth scroll for anchor links.
- FAQ accordion: click to toggle open/close with accessible `aria-expanded` and `aria-controls`.
- Scroll-triggered fade-in using Intersection Observer API.
- Active nav link highlighting on scroll.

### Step 6 — Validate & Review
- Check HTML structure, ensure no unclosed tags.
- Verify all CSS is valid and responsive.
- Test all JavaScript interactions conceptually.
- Ensure no copyrighted OpenAI content is present.

## Technical Design

### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Background | Deep dark | `#0a0a0f` |
| Surface | Dark card | `#13131a` |
| Surface hover | Lighter dark | `#1a1a24` |
| Primary accent | Mint/teal | `#00cc88` |
| Secondary accent | Blue-teal | `#00aaff` |
| Text primary | Near white | `#e8e8ef` |
| Text secondary | Muted gray | `#8888a0` |
| Border | Subtle line | `#2a2a3a` |
| Error/alert (not used) | — | — |

### Typography
- **Primary**: Inter (Google Fonts) — weights 300, 400, 500, 600, 700.
- **Fallback**: system-ui, -apple-system, sans-serif.
- **Scale**: `clamp()` for responsive font sizes.

### Layout Strategy
- Desktop: max-width 1200px centered container.
- Breakpoints: 768px (tablet), 480px (mobile).
- CSS Grid for feature cards, footer.
- Flexbox for navbar, hero, CTA.

### Interaction Plan
| Feature | Implementation |
|---------|---------------|
| Hamburger menu | Button toggle → CSS class on nav → slide-in via transform |
| Smooth scroll | `scroll-behavior: smooth` + JS fallback for anchor links |
| FAQ accordion | Button click → toggle `max-height` + rotate arrow icon |
| Scroll fade-in | Intersection Observer → add `.visible` class → CSS transition |
| Hover effects | CSS `transition` on transform, opacity, background-color |
| Active nav link | Intersection Observer tracking section visibility |

### Animation Blueprint
- **Hero background**: `@keyframes gradientShift` — slow animated gradient across 15s infinite.
- **Fade-in sections**: `opacity: 0; transform: translateY(30px)` → `.visible` state to `opacity: 1; transform: translateY(0)` with 0.6s ease.
- **Feature cards**: Staggered delay on `.visible` via `nth-child` for cascade.
- **Navbar**: `backdrop-filter: blur(12px)` glass effect with subtle border.
- **Buttons**: `transform: scale(1.02)` on hover, `scale(0.98)` on active.
- **FAQ arrows**: `transform: rotate(0deg)` ↔ `rotate(180deg)` transition.

## Security / Edge Cases

### Security
- No forms collecting user data (no XSS/CSRF risk).
- No external scripts beyond Google Fonts.
- No cookies, localStorage, or tracking.
- All links are `rel="noopener noreferrer"` where external.

### Edge Cases
- **Mobile menu**: Close when a nav link is clicked, close when clicking outside.
- **FAQ**: Only one item open at a time (accordion behavior), or allow multiple — decided: allow multiple (simple toggle).
- **No JS scenario**: Basic fallback — all content visible, anchor links still work via HTML `id`.
- **Font loading**: `font-display: swap` to prevent invisible text.
- **Reduced motion**: `prefers-reduced-motion: reduce` query to disable animations.
- **Loading state**: Google Fonts preconnect for performance.
- **Empty state**: No dynamic data, so no empty states needed.
- **Error state**: No external data fetching, so no error states needed.
- **Edge screen sizes**: Test at 320px width minimum; use `min-width` and overflow hidden.

## Verification Checklist

- [ ] `index.html` passes W3C HTML validation (no deprecated elements).
- [ ] All sections render correctly: Navbar, Hero, Product Preview, Features, CTA, FAQ, Footer.
- [ ] Mobile hamburger menu toggles open/closed at ≤768px.
- [ ] FAQ accordion items open and close on click.
- [ ] Smooth scroll works for all anchor links.
- [ ] Scroll-triggered fade-in animations activate when sections enter viewport.
- [ ] Responsive layout works at 1200px+, 768px, and 480px widths.
- [ ] No placeholder images that 404; all visuals are CSS/SVG.
- [ ] All interactive elements have hover, focus, and active states.
- [ ] `prefers-reduced-motion` query disables animations.
- [ ] Contrast ratio meets WCAG AA (minimum 4.5:1 for text).
- [ ] No copyrighted OpenAI logos, trademarks, or exact text is used.
- [ ] Google Fonts loads correctly (fallback font visible if not loaded).
- [ ] No JavaScript errors in console.
- [ ] Build-free: opening `index.html` directly in a browser works.

## Expected Final Output

A complete, responsive, polished landing page for OpenAI consisting of 3 files:

1. **`files/index.html`** — Semantic HTML5 structure with all sections, Google Fonts, and linked CSS/JS.
2. **`files/styles.css`** — ~600-900 lines of custom CSS with dark theme, responsive grid, animations, and media queries.
3. **`files/script.js`** — ~100-150 lines of vanilla JavaScript handling navigation, FAQ, scroll animations, and accessibility.

The page will be a modern, dark-themed, AI-inspired landing page that could be hosted on any static hosting (GitHub Pages, Netlify, Vercel, etc.). It will feel premium and polished without using any build tools or frameworks.

## Risks / Assumptions

### Assumptions
- User has no preference for any specific framework — vanilla HTML/CSS/JS is acceptable.
- No server-side rendering or backend is needed.
- OpenAI's general brand direction (dark, minimal, tech-forward, green/purple accents) is known well enough to inspire an original design.
- Google Fonts CDN is acceptable as the only external dependency.
- The `files/` directory is where all output should go.

### Risks
- **Low**: Without web_search/screenshot_page, the design may differ from actual OpenAI visual style — mitigated by explicitly stating this is an inspired concept.
- **Low**: Google Fonts CDN could be blocked in some regions — mitigated by fallback fonts.
- **Medium**: If the `files/` directory is meant to contain only certain types of files, check with user if 3 files is acceptable.
- **Low**: Without actual OpenAI brand guidelines, accent colors are inspired guesses — mitigated by stating "inspired concept" throughout.

## Approval Gate

This plan is complete and ready for review. **Do not write or modify any code until the user explicitly approves this plan.** Once approved, the implementation can proceed by switching to Act Mode and following the Implementation Steps outlined above. Please review this plan carefully and provide feedback or approval to proceed.

---

*Plan generated based on research context from `.agent/company-research.json`. Missing research tools: web_search, screenshot_page, extract_brand_style. This is an unofficial inspired concept and does not represent or affiliate with OpenAI.*
