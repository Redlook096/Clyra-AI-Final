# PLAN: Landing Page for Google's Gemini AI

## 1. Request Classification

**Type:** Complete Landing Page (static HTML/CSS/JS single-page website)

This is a **fresh build from scratch** — an empty workspace with no existing files, frameworks, or dependencies. The request is for a full-featured landing page for *Google's Gemini AI*, not a demo of the Vibe Coder or Clyra tools.

---

## 2. Previous Work Summary

- **No previous PLAN.md** existed.
- **Workspace state:** Empty directory at `/Users/lukesimpson/Documents/Coding Projects/Clyra-AI-Final/projects/make-a-landing-page-for-google-s-gemini-ai-326ecd/files/` with zero files.
- **Framework:** None (no package.json, no bundler config).
- **Styling:** Unknown — we will define our own.

---

## 3. Files Inspected

| File | Contents |
|------|----------|
| `metadata.json` | Project metadata, status = "Planning", mode = "plan" |
| `.agent/project-analysis.txt` | Confirmed empty workspace: no framework, no packages, no existing files, no previous PLAN.md |
| *(workspace root)* | Empty directory (only `.` and `..` entries) |

---

## 4. Files to Create

All files will be placed under the workspace root: `/Users/lukesimpson/Documents/Coding Projects/Clyra-AI-Final/projects/make-a-landing-page-for-google-s-gemini-ai-326ecd/files/`

| # | File | Purpose |
|---|------|---------|
| 1 | `index.html` | Main landing page — semantic HTML5 structure with all sections |
| 2 | `style.css` | Full stylesheet — Google/Gemini-inspired design system, responsive, animations |
| 3 | `script.js` | Interaction layer — scroll effects, mobile menu, FAQ accordion, smooth navigation |
| 4 | `assets/` (dir) | Optional directory for any images/icons (we'll use inline SVGs + Google Material icons via CDN to avoid binary assets) |

**No files to edit or remove** — this is a greenfield build.

---

## 5. Design Approach

### Brand & Visual Direction (informed by research on google.com, deepmind.google, ai.google.dev)

- **Primary color palette:**
  - Google Blue: `#4285F4`
  - Gemini accent gradient: deep blue → purple (e.g., `#1A73E8` → `#8B5CF6`)
  - Backgrounds: near-black (`#0B0D17`), dark navy (`#111827`), and clean white sections
  - Text: white/off-white on dark; `#1F2937` on light
  - Accent glow effects on hero
- **Typography:**
  - Google Sans / Product Sans feel — use `'Inter'` from Google Fonts as a close match
  - Monospace for code/API snippets: `'JetBrains Mono'`
- **Atmosphere:**
  - Dark-first design (matching Gemini's current brand direction)
  - Glassmorphism cards with subtle gradient borders
  - Animated gradient orb behind hero text
  - Smooth scroll-triggered fade/slide animations
  - Grid-based layout with generous whitespace

### Page Sections (in order)

1. **Navbar** — Sticky, transparent → solid on scroll, mobile hamburger menu, links to sections
2. **Hero** — Large headline "Meet Gemini. AI built for the next era.", animated gradient orb background, subtitle, two CTA buttons ("Try Gemini", "Learn more"), subtle scroll indicator
3. **Product Preview / Visual** — Mockup of the Gemini chat interface or a visual showcase with floating feature badges
4. **Features Grid** — 6 feature cards:
   - Multimodal Reasoning (text, image, audio, video)
   - Code Generation
   - Massive Context Window (1M+ tokens)
   - Agentic Capabilities
   - Safety & Responsibility
   - Multi-platform (Web, Mobile, API)
   Each card: icon (SVG), title, short description, subtle hover lift
5. **Models / Ecosystem** — Cards for Gemini Ultra, Pro, Flash, Nano with comparison-style presentation
6. **CTA Section** — "Build with Gemini" large banner with gradient, input field mockup for API signup, stats/numbers row
7. **FAQ / Accordion** — 5-6 common questions about Gemini, click-to-expand interaction
8. **Footer** — Links: Models, Developers, Research, Safety, About; social icons; copyright; "Privacy | Terms"

---

## 6. Technical Stack & Dependencies

| Concern | Choice |
|---------|--------|
| **HTML** | Semantic HTML5 (`<header>`, `<section>`, `<nav>`, `<article>`, `<footer>`)
| **CSS** | Vanilla CSS3 with custom properties, flexbox, CSS grid, `@keyframes` animations, media queries
| **JS** | Vanilla ES6+ — zero framework, zero build step
| **Icons** | Google Material Symbols + inline SVG icons
| **Fonts** | Google Fonts — Inter (body), JetBrains Mono (code)
| **No bundler** | Just a simple `index.html` loading `style.css` and `script.js`

---

## 7. File Queue (Build Order)

1. `index.html` — Full semantic structure (all sections, no dummy text)
2. `style.css` — Complete responsive stylesheet with animations
3. `script.js` — All interactivity (mobile nav toggle, scroll animations with IntersectionObserver, FAQ accordion, smooth scroll)

---

## 8. Interactivity & States

- **Navbar:** Sticky; background opacity transitions on scroll; mobile hamburger toggles slide-in menu with overlay
- **Mobile Menu:** Full-screen overlay with animated link reveals; close on link click or backdrop tap
- **Hero:** Subtle parallax or floating animation on gradient orb; CTA buttons have hover/active states
- **Feature Cards:** Hover lift with shadow + border glow; staggered entrance on scroll (IntersectionObserver)
- **Model Cards:** Horizontal scrollable on mobile, grid on desktop; hover zoom effect
- **FAQ Accordion:** Click question to expand/collapse answer with smooth height transition; open/close icon toggles (chevron or +/-)
- **CTA Stats:** Count-up animation on scroll into view (e.g., "2M+ developers", "1M+ token context")
- **Scroll Animations:** Elements fade-in + translate-up on entering viewport
- **Links:** Smooth scroll to target section; proper hover/focus states

---

## 9. Responsive Breakpoints

| Breakpoint | Target |
|-----------|--------|
| 0–639px  | Mobile (single column, stacked, hamburger nav) |
| 640–1023px | Tablet (2-column grids, expanded nav) |
| 1024px+  | Desktop (3–4 column grids, full nav) |
| 1440px+  | Wide (max-width container, generous padding) |

---

## 10. Validation Strategy

| Check | How |
|-------|-----|
| **HTML validation** | Open in browser, check DevTools Console for errors |
| **CSS responsiveness** | Test at 375px, 768px, 1024px, 1440px via DevTools device toolbar |
| **JS interactions** | Test mobile nav toggle, FAQ accordion, scroll animations, CTA button states |
| **Performance** | Check Lighthouse (will be near-perfect since no heavy deps) |
| **Color contrast** | Ensure all text meets WCAG AA on their respective backgrounds |

---

## 11. Preview & Checkpoint Strategy

- After creating `index.html`, do a quick visual preview in terminal (check structure completeness)
- After `style.css`, verify in browser for layout correctness
- After `script.js`, test all interactions
- **Checkpoint:** Run `open index.html` or equivalent to preview in default browser

---

## 12. Follow-Up Strategy

After build complete:
1. User reviews the live page in browser
2. Collect feedback for revisions (tweak colors, copy, layout, interactions)
3. Possible enhancements based on feedback:
   - Add dark/light theme toggle
   - Add more model comparison data
   - Add video background or animation
   - Add a pricing table section
   - Add i18n language toggle

---

## 13. Edge Cases & Notes

- **No external API calls:** The page is entirely self-contained; the "Try Gemini" CTA links to `https://gemini.google.com/` and API signup is a visual mockup only
- **No build tooling:** Kept deliberately simple so it runs by double-clicking `index.html`
- **Asset-free:** All visuals are CSS-generated or inline SVGs — no external images to load (except Google Fonts & Material Icons CDN)
- **Graceful degradation:** JS-disabled browsers still see all content, just without animations
