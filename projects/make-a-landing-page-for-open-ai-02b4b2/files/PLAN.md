# PLAN.md — OpenAI Landing Page

## 1. Classification
- **Request type**: New project — build a landing page from scratch
- **Domain**: Static marketing/landing page
- **Scope**: Single-page responsive landing page inspired by OpenAI's brand style

## 2. Previous Work Summary
- No previous work exists. Workspace was empty.
- No previous PLAN.md found.
- This is a fresh project.

## 3. Files Inspected
- Entire workspace (`/Users/lukesimpson/Documents/Coding Projects/Clyra-AI-Final/projects/make-a-landing-page-for-open-ai-02b4b2/files`): **empty**
- Environment: Node.js v24.15.0, npm 11.12.1 available

## 4. Files to Create
| File | Purpose |
|------|---------|
| `index.html` | Single HTML file containing the entire landing page (HTML + CSS + JS in one file for simplicity) |
| `assets/` (dir) | Directory for any static assets (images, fonts) — only if needed |

> **Decision**: Use a single `index.html` with embedded CSS and JS. No build step, no framework. This keeps the landing page self-contained, zero-dependency, instantly deployable.

## 5. Files to Remove
- None

## 6. Files to Edit
- None (fresh project)

## 7. File Queue (creation order)
1. `index.html`

## 8. Design & Architecture

### Brand Inspiration
- OpenAI aesthetic: dark mode, clean typography, gradient accents (green/purple), large bold headings, subtle grid/particle backgrounds, rounded corners, glassmorphism elements.

### Sections
1. **Navigation** — Logo + nav links (Research, Products, Safety, Company) + CTA button
2. **Hero** — Big bold headline, subheading, CTA, subtle background animation
3. **Features/Models** — Grid of feature cards (GPT-4o, DALL·E, Sora, etc.)
4. **Research** — Research highlights section
5. **CTA Section** — Final call-to-action with gradient background
6. **Footer** — Links, social, legal

### Technology Choices
- **HTML5** — Semantic markup
- **CSS3** — Custom properties, flexbox/grid, animations, responsive design, dark theme
- **Vanilla JS** — Minimal interactivity (smooth scroll, mobile menu toggle, subtle scroll animations)
- **No external dependencies** — No Bootstrap, Tailwind, or JS libraries
- **Fonts** — System font stack or Google Fonts (Inter) loaded via @import

### Responsive Breakpoints
- Desktop: >1024px
- Tablet: 768px–1024px
- Mobile: <768px

## 9. Validation Strategy
- Open `index.html` directly in browser for visual inspection
- Verify responsive layout with Chrome DevTools device emulation
- Check for console errors
- Validate HTML with W3C validator (if network available)

## 10. Preview Strategy
- Use `file://` protocol or simple local server (e.g., `python3 -m http.server`)
- User can open and review in browser before finalizing

## 11. Checkpoints
| Checkpoint | Description |
|------------|-------------|
| CP-01 | `index.html` created with complete structure |
| CP-02 | Visual review — all sections render correctly |
| CP-03 | Responsive testing — works on mobile/tablet/desktop |
| CP-04 | Final polish — animations, hover states, edge cases |

## 12. Follow-up Strategy
- After creating the page, ask user for feedback on:
  - Visual design (colors, layout, branding)
  - Content (headlines, copy, CTAs)
  - Responsive behavior
  - Additional features (contact form, newsletter signup, etc.)
- Iterate based on feedback

## 13. Open Questions
- None — scope is well-defined as a landing page inspired by OpenAI
