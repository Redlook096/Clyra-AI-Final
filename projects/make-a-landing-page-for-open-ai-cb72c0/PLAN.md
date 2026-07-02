# PLAN.md — Landing Page for OpenAI

## 1. Request Classification

| Aspect | Value |
|---|---|
| **Type** | Greenfield project (empty workspace) |
| **Scope** | Single landing page for "OpenAI" |
| **Tech stack** | Not pre-specified — free choice |
| **Styling** | Not pre-specified — free choice |
| **Previous build** | Multiple prior iterations exist in sibling projects |

## 2. Research Sources

| Source | Status |
|---|---|
| web_search | ❌ Not connected |
| screenshot_page | ❌ Not connected |
| extract_brand_style | ❌ Not connected |
| fetch_url — Heuristic candidates | ⚠️ Could not fetch official page |

**Summary:** No live research or brand extraction tools are available. This is an unofficial, inspired concept. Do not copy official OpenAI assets, logos, exact text, or CSS.

## 3. Company Summary

OpenAI is an AI research and deployment company known for creating ChatGPT, DALL·E, GPT-4o, Whisper, Codex, and the OpenAI API. Their brand aesthetic is dark/clean/minimalist with green (#10a37f) accents, bold typography, and a futuristic yet approachable tone.

## 4. Visual Style Limits & Safety Boundary

- **Do NOT** use the OpenAI logo, wordmark, or official typeface.
- **Do NOT** copy verbatim text from openai.com.
- **Do NOT** impersonate or claim affiliation with OpenAI.
- **DO** create an inspired tribute/concept page with original copy and original SVG iconography.
- **DO** use a similar dark-theme, green-accents design language as an homage.
- **DO** include clear disclaimers that this is an unofficial fan/concept project.

## 5. Previous Plan Summary

Multiple prior iterations of "make a landing page for open ai" exist:

| Project ID | Approach | Files | Notes |
|---|---|---|---|
| `-20f924` | React + Vite + TSX components (13 files) | Full component tree with Auth, FAQ, Pricing, etc. | Build was for "with login and sign up" |
| `-b42984` | Single `index.html` with Tailwind CDN | 1 file | Simplest plan, not built out |
| `-fd12bb` | Vanilla HTML + CSS + JS (3 files) | index.html + styles.css + script.js | Latest complete attempt, dark theme, green accents |
| `-6a9994` | Empty (PLAN.md was empty) | None | Abandoned |
| `-02b4b2` | Single `index.html` plan | plan.md only | Planned but not built out |

## 6. Relationship to Previous Work

This iteration (cb72c0) should NOT reuse previous files directly since each project is independent. However, we can learn from what worked:

**What worked well in `-fd12bb`:**
- Dark theme with green (#10a37f) accent color
- 3-file split (HTML, CSS, JS) for maintainability
- Scroll animations via Intersection Observer
- Responsive nav with hamburger toggle
- Newsletter subscription form with validation
- Stats section with animated counters
- Research timeline

**What was missing / could be improved:**
- No dark/light theme toggle
- Static FAQ (no accordion)
- No pricing section
- No animated hero background (was using static CSS orbs)
- No testimonial carousel
- No scroll-triggered animations beyond simple fade-in
- Limited mobile interactivity polish

## 7. Files Inspected

| Path | Status | Notes |
|---|---|---|
| `files/` | Empty | Target output directory |
| `metadata.json` | Present | Project metadata |
| `.agent/project-analysis.txt` | Present | Confirms empty workspace |
| `.agent/company-research.json` | Present | Research context (no live tools) |
| `checkpoints/` | Empty | No prior checkpoints |
| Sibling project `-fd12bb/files/` | Inspected | Reference for prior approach |

## 8. Files to Create

| # | File | Purpose |
|---|---|---|
| 1 | `files/index.html` | Main HTML document |
| 2 | `files/styles.css` | All styles (custom properties, layout, animations, responsive) |
| 3 | `files/script.js` | All interactivity (nav, animations, FAQ, form, theme toggle, counters) |

No files to edit or remove. All files are new.

## 9. Strategy & Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| **HTML** | Semantic HTML5 | No framework, works everywhere |
| **CSS** | Vanilla CSS with custom properties | Zero dependencies, full control |
| **JS** | Vanilla ES6+ | No bundler needed |
| **Fonts** | Inter (Google Fonts via CDN) | Matches modern AI aesthetic |
| **Icons** | Font Awesome 6 (CDN) | Rich icon set, used in prior iteration |
| **Preview** | `python3 -m http.server` | No installs needed |

**Why not React/Vite?** A landing page is best served as static files — instant load, deployable anywhere, zero build step.

## 10. Design & Layout Plan

### Visual Direction
- **Theme:** Dark (#0a0a0a bg) with optional light mode toggle
- **Accent:** OpenAI-inspired green (#10a37f) with purple/blue secondary accents
- **Typography:** Inter, 300–800 weight
- **Cards:** Subtle glassmorphism / dark surface cards with border glow
- **Animations:** Scroll-triggered fade/slide, smooth hover transitions, animated gradient hero

### Page Sections (top → bottom)

1. **Navigation Bar** — Sticky, logo + links (Products, Research, Safety, About) + theme toggle + CTA button + mobile hamburger
2. **Hero Section** — Full-viewport, animated gradient/orb background, badge ("Introducing GPT-4o"), headline, subtitle, dual CTAs, scroll indicator
3. **Featured Product / GPT-4o Showcase** — Large card highlighting GPT-4o with capabilities grid
4. **Products Grid** — 4-column grid for ChatGPT, DALL·E, Whisper, API
5. **Research Timeline** — Vertical timeline with milestone cards (2024 → 2020)
6. **Safety & Responsibility** — Stats counters (users, researchers, safety initiatives, papers) + description
7. **Pricing / Plans** — 3-tier cards (Free, Plus, Team) with features and CTA
8. **Testimonials** — Simple testimonial cards with avatar + quote + name
9. **FAQ Accordion** — Expandable Q&A items
10. **CTA Newsletter Section** — Email subscribe form with validation
11. **Footer** — Logo, description, link columns, social icons, copyright

### Responsive Breakpoints
- Mobile: < 768px (single column, stacked)
- Tablet: 768px – 1024px (2-column grids)
- Desktop: > 1024px (full layouts)

## 11. File Queue (ordered)

```
files/index.html   [CREATE]
files/styles.css   [CREATE]
files/script.js    [CREATE]
```

## 12. Build & Validation Steps

1. Create all 3 files in order
2. Validate HTML structure (semantic tags, no unclosed tags)
3. Verify CSS custom properties are consistent and no broken references
4. Check JS for runtime errors (syntax, undefined references)
5. **Responsive test** at 375px, 768px, 1024px, 1440px
6. **Accessibility check** — alt text, aria labels, semantic headings, focus states
7. **Preview** with `python3 -m http.server` from `files/`
8. **Interaction test** — mobile nav open/close, FAQ accordion, form validation, theme toggle, animated counters
9. **No broken links** — anchors work, external links have `rel="noopener noreferrer"`

## 13. Checkpoint Strategy

| CP | After | Action |
|---|---|---|
| CP-01 | HTML structure written | Review DOM skeleton before styling |
| CP-02 | Nav + Hero + Products styled | Visual check, responsive nav test |
| CP-03 | All sections complete | Full page review, interaction tests |
| CP-04 | Final polish + validation | Accessibility, preview, edge cases |

## 14. Follow-up Strategy

| Scenario | Action |
|---|---|
| User wants React/Vite | Rewrite as component-based app |
| User wants more sections | Edit PLAN.md, add to queue |
| User wants deployment | Add deploy step (Vercel, Netlify, GitHub Pages) |
| User requests specific ref | Adjust design accordingly |
| User reports bug | Fix, re-run validation |

---

*PLAN.md created on 2026-06-30. Ready for Act mode.*
