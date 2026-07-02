# PLAN — Landing Page for OpenAI

## 1. Request Classification

| Aspect | Value |
|---|---|
| **Type** | New project (greenfield) |
| **Scope** | Single landing page for "OpenAI" |
| **Tech stack** | Not pre-specified — free choice |
| **Styling** | Not pre-specified — free choice |
| **Previous build** | None (empty workspace) |

## 2. Previous Plan Summary

No previous PLAN.md found. This is the first plan for this project.

## 3. Files Inspected

| File | Status | Notes |
|---|---|---|
| `files/` | Empty | Target output directory |
| `metadata.json` | Present | Project metadata (plan mode, Cline harness) |
| `.agent/project-analysis.txt` | Present | Framework: unknown, no existing files |
| `PLAN.md` | Not found | Will be created now |

## 4. Strategy & Tech Stack Choice

Since no framework is prescribed and the workspace is empty, we'll use a **lightweight, fast, zero-config approach**:

| Concern | Choice | Rationale |
|---|---|---|
| **HTML** | Single `index.html` | No build step needed |
| **CSS** | Tailwind CSS (via CDN) | Rapid styling, responsive by default |
| **JS** | Vanilla JS (minimal) | Interactive elements only (e.g. mobile menu) |
| **Fonts** | Inter (Google Fonts) | Matches modern AI-product aesthetic |
| **Icons** | SVG inline or Heroicons CDN | Lightweight, no extra dependency |
| **Preview** | python3 -m http.server | No extra installs |

**Alternative considered:** Next.js / React — overkill for a single static landing page; unnecessary build step.

## 5. Design & Layout Plan

The landing page will be inspired by the official OpenAI homepage style: clean, dark/light modern theme, bold typography, gradient accents, and a clear product-value narrative.

### Sections (top to bottom):
1. **Navigation Bar** — Sticky, logo + nav links (Research, Products, Safety, Company) + CTA button
2. **Hero Section** — Full-viewport, large headline, subheading, primary CTA, subtle gradient background
3. **Featured Product / GPT-4o** — Card/feature block showcasing a product
4. **Key Features / Capabilities** — 3-column grid of capability highlights
5. **Research & Innovation** — Section with a visual element + description
6. **Safety & Responsibility** — Trust-building section
7. **Testimonials / Partners** — Social proof
8. **Footer** — Links, legal, social media

### Visual Notes:
- Color palette: Dark background (#0f0f0f), white text, green/teal accent (#10a37f OpenAI green)
- Rounded cards, glassmorphism subtle effects
- Responsive: mobile-first breakpoints
- Smooth scroll navigation

## 6. Files to Create

| # | File | Purpose |
|---|---|---|
| 1 | `files/index.html` | Main landing page (HTML + inline CSS + minimal JS) |

No files to modify or remove — this is a greenfield project.

## 7. Build/Validation Steps

After creating `files/index.html`:

1. **Lint check**: Validate HTML structure (no unclosed tags, proper semantic elements)
2. **Responsive check**: Verify layout at 375px, 768px, 1024px, 1440px widths
3. **Accessibility check**: Proper alt text on images, semantic headings, aria labels
4. **Preview**: Serve locally with `python3 -m http.server` from `files/` directory
5. **Link check**: No broken internal anchors, external links open in new tab with rel="noopener noreferrer"

## 8. Checkpoint Strategy

- **Checkpoint 1** (after HTML structure): Review DOM skeleton before styling
- **Checkpoint 2** (after hero + nav): Ensure responsive navigation works
- **Checkpoint 3** (all sections in place): Full page review
- **Checkpoint 4** (final polish): Accessibility, performance, cross-browser

## 9. Follow-up Strategy

| Scenario | Action |
|---|---|
| User wants different tech stack | Rewrite approach, adjust PLAN.md |
| User wants more/less sections | Edit file queue, adjust PLAN.md |
| User provides reference design | Update design section, implement accordingly |
| User requests dark/light toggle | Add JS theme switcher to file plan |
| User wants deployment | Add deploy step (Vercel, Netlify, GitHub Pages) |

## 10. File Queue (ordered)

```
files/index.html  [CREATE]
```

---

*PLAN.md created on 2026-06-29. Ready for Act mode.*
