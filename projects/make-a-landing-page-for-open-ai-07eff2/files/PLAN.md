# PLAN: OpenAI-Inspired Landing Page

## 1. Request Classification

- **Type:** Complete landing page for a real company (OpenAI)
- **Goal:** Build a modern, responsive, interactive landing page inspired by OpenAI's brand identity, without copying official assets, logos, exact text, or CSS.
- **Deliverable:** Multi-section single-page site with working interactions, mobile behavior, and polished animations.

---

## 2. Research Sources

| Source | Status | Notes |
|--------|--------|-------|
| `fetch_url` (heuristic OpenAI URLs) | Failed - no official page fetched | DNS/resolve errors blocked retrieval |
| `web_search` | X Not connected in backend | Cannot search for latest OpenAI design language |
| `screenshot_page` | X Not connected in backend | Cannot visually inspect official site |
| `extract_brand_style` | X Not connected in backend | Cannot extract colours/fonts from official CSS |
| `company-research.json` | + Available | Provides only the summary above |

**Conclusion:** No live brand data is available. The landing page will be an **inspired, unofficial concept** that evokes AI-forward, premium-tech aesthetics without copying official assets.

---

## 3. Company Summary (from research context)

OpenAI is an AI research and deployment company. Its product ecosystem includes:
- GPT-4 / large language models
- ChatGPT (conversational AI)
- DALL-E (image generation)
- Whisper (speech recognition)
- API platform for developers

Known for clean, minimal UI, dark-mode preference in product interfaces, subtle gradients, and a focus on human-AI collaboration.

---

## 4. Visual Style & Safety Boundaries

| Constraint | Rule |
|-----------|------|
| **Logos** | Do NOT use the official OpenAI logomark or wordmark. Create an original abstract icon. |
| **Colour palette** | Use an inspired dark-mode scheme (charcoal, white, accent greens/teals/purples) - do NOT replicate exact brand colours. |
| **Typography** | Use system fonts or common Google Fonts (Inter, SF Pro). No custom proprietary fonts. |
| **Copy / Text** | Do NOT lift wording from official OpenAI pages. Write original promotional copy. |
| **CSS / Layout** | Do NOT copy official CSS. Author all styles from scratch. |
| **Imagery** | Do not embed official screenshots. Use placeholder illustrations, gradients, or abstract shapes. |
| **Naming** | Use a fictional brand name or refer generically to "the platform". |
| **Third-party assets** | Only use freely licensed or placeholder images. |

---

## 5. Workspace State (Before Build)

| Item | Value |
|------|-------|
| `files/` directory | Empty |
| `checkpoints/` | Empty |
| `logs/` | Empty |
| Previous `PLAN.md` | None |
| Framework detected | Unknown |
| Package file | Not found |
| Styling | Unknown |
| Inspectable project files | 0 |

**Fresh project - no existing code to modify or delete.**

---

## 6. Files to Create

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `files/index.html` | Single-page landing page HTML (all sections in one file) |
| 2 | `files/styles.css` | All styling - responsive, animations, custom properties |
| 3 | `files/script.js` | Interactions: scroll effects, FAQ accordion, nav behaviour |
| 4 | `files/README.md` | Brief description, how to open, design decisions, safety notes |

**Strategy:** Pure HTML/CSS/JS - no framework, no bundler, no build step.

---

## 7. Site Architecture (Sections)

1. **Navbar** - Fixed top, brand icon (original SVG), nav links, CTA button, mobile hamburger menu
2. **Hero** - Large headline, subtitle, primary CTA, abstract animated background
3. **Product Preview / Showcase** - Card grid featuring fictional products with hover effects
4. **Features / Benefits** - Icon + description grid
5. **Testimonials** - Placeholder quotes from fictional users, grid layout
6. **Call to Action** - Wide banner with headline, subtext, and email signup / button
7. **FAQ** - Accordion-style, 4-6 questions about the platform
8. **Footer** - Links, copyright, legal disclaimers

---

## 8. Interactions & Behaviour

| Interaction | Implementation |
|------------|---------------|
| Sticky navbar with background blur on scroll | CSS position: sticky, JS class toggle |
| Mobile hamburger menu | JS toggle on nav, slide-in overlay |
| Smooth anchor scrolling | CSS scroll-behavior: smooth |
| FAQ accordion | JS click toggles display |
| Scroll-triggered fade-in animations | Intersection Observer in JS |
| Button hover / focus states | CSS transitions |
| Responsive grid layout | CSS Grid + Media Queries |
| Abstract animated background (hero) | CSS keyframes |

---

## 9. File Queue (Creation Order)

```
1. files/index.html
2. files/styles.css
3. files/script.js
4. files/README.md
```

---

## 10. Validation Plan

| Check | Method |
|-------|--------|
| HTML validity | Open in browser and inspect console |
| CSS no errors | Browser DevTools - no 404s, no missing fonts |
| Responsive breakpoints | Manual resize (mobile 375px, tablet 768px, desktop 1200px+) |
| JS console errors | Browser DevTools console |
| Link anchors | Click all nav links, ensure they scroll to correct sections |
| Animation performance | Chrome DevTools Performance tab |
| No copyright/IP issues | Confirm no official logos, exact copy, or trademarked assets |

---

## 11. Preview Strategy

- Open `files/index.html` directly in browser via file:// or npx serve files/

---

## 12. Checkpoint Strategy

| Phase | Trigger | Snapshot |
|-------|---------|----------|
| After HTML scaffold | All sections present (empty content ok) | Save to checkpoints/ |
| After CSS styling | Visual layout complete | Save to checkpoints/ |
| After JS interactions | All interactions working | Save to checkpoints/ |
| Final polish + validation | All checks pass | Save to checkpoints/ |

---

## 13. Follow-up Strategy

After build is complete, the user can request:
- Dark/light theme toggle
- Additional sections (pricing, team, blog preview)
- Form backend integration (e.g., Formspree)
- Performance optimisations
- Convert to React / Next.js
- Accessibility audit fixes

---

*PLAN.md created: 2026-06-30 in Plan Mode. Ready to switch to Act Mode on user approval.*
