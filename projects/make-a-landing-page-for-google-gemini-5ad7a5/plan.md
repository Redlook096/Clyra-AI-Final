# Implementation Plan

## Goal
Create a polished, unofficial concept landing page for **Google Gemini** — Google DeepMind's flagship AI model family. This is a greenfield project in an empty workspace. The page will be a single, self-contained HTML file with embedded CSS and JS (no build tools or frameworks) that showcases Gemini's capabilities in an inspired, original visual style.

## Current Project Understanding
- **Framework**: None (vanilla HTML/CSS/JS)
- **Package file**: None (no package.json, no dependencies)
- **Styling**: None yet — will build from scratch
- **Existing files**: 0 — empty directory
- **Previous PLAN.md**: None — fresh start

## Requirements
1. **Brand context**: Google Gemini is Google DeepMind's most capable AI model family — multimodal (text, image, audio, video, code), strong reasoning, available in multiple sizes (Ultra, Pro, Nano), powering products like Gemini app, AI Studio, and enterprise platforms.
2. **Visual style**: Inspired by Google DeepMind's modern, clean aesthetic — but entirely original. No copying of official logos, exact text, or CSS.
3. **Sections to include**:
   - Navigation bar (sticky, responsive)
   - Hero section with tagline and CTA
   - Product preview / visual showcase area
   - Features/benefits section (cards or grid)
   - Model comparison or tier cards (Ultra, Pro, Nano)
   - Call-to-action section
   - FAQ accordion
   - Footer with links placeholder
4. **Interactions**:
   - Mobile hamburger menu
   - Smooth scroll navigation
   - Hover/active states on cards and buttons
   - FAQ accordion toggle
   - Scroll-triggered fade-in animations (Intersection Observer)
   - Working CTA buttons (anchor links or placeholder modals)
5. **Responsive**: Desktop, tablet, mobile breakpoints
6. **Performance**: Lightweight, no external dependencies, fast load

## Non-Negotiable Constraints
- **Zero external dependencies**: No frameworks, no CDN links, no npm packages
- **Single-file build**: Everything in one `index.html` file
- **Original design only**: Do not copy Google's actual logo, trademarked text, or CSS. Use only the Gemini / DeepMind brand name descriptively ("Google Gemini") as a real company — but the layout, colors, graphics, and copy must be original and inspired, not cloned.
- **No web search, screenshot, or style extraction tools available** — design is based on publicly known brand aesthetics only
- **Accessibility**: Semantic HTML, proper heading hierarchy, alt text on any images
- **Must pass basic validation**: HTML5 doctype, valid CSS, no console errors on load

## Proposed Changes
| Action | File | Description |
|--------|------|-------------|
| **Create** | `index.html` | Full single-file landing page with embedded CSS and JS |
| **Create** | `PLAN.md` | This plan file |

No other files are required. The entire product is self-contained in `index.html`.

## Implementation Steps

### Step 1 — Analyse Existing Structure
- Workspace is empty; nothing to analyse or preserve.
- Confirm absolute paths and working directory.

### Step 2 — Draft HTML Structure
- Write semantic HTML skeleton within `<!DOCTYPE html>`
- Sections: `<header>` (nav), `<section id="hero">`, `<section id="preview">`, `<section id="features">`, `<section id="models">`, `<section id="cta">`, `<section id="faq">`, `<footer>`
- Mobile-first container classes

### Step 3 — Implement CSS Styling
- Root variables for colours, fonts, spacing
- Colour palette: Inspired by DeepMind's modern gradient-forward style — deep indigo/purple/blue tones with vibrant accent gradients, clean whites and dark backgrounds. No Google brand colours copied.
- Typography: System font stack, large display headings
- Layout: CSS Grid and Flexbox for all sections
- Animations: Keyframe fade-ins, hover transitions, scroll reveal via Intersection Observer
- Responsive: 3 breakpoints (mobile < 640px, tablet < 1024px, desktop)

### Step 4 — Add Interactive JavaScript
- Mobile hamburger menu toggle
- FAQ accordion (click to expand/collapse)
- Scroll-triggered fade-in reveal (Intersection Observer API)
- Smooth scroll for anchor links
- Optional: interactive hero particle effect or gradient animation

### Step 5 — Validate & Polish
- Check HTML5 validity
- Check no console errors
- Manual visual review across viewport sizes
- Verify all interactive elements work

### Step 6 — Preview & Checkpoint
- Open in browser / screenshot for final review
- Confirm responsive behaviour

## Technical Design

### Architecture
A single `index.html` file with:
- `<style>` block in `<head>` for all CSS (~300-400 lines)
- `<script>` block before `</body>` for all JS (~150-200 lines)
- Semantic HTML5 elements throughout

### Color Palette (original, inspired)

| Role | Colour | Hex |
|------|--------|-----|
| Primary bg (dark) | Deep Midnight | `#0B0C1E` |
| Secondary bg | Dark Navy | `#111327` |
| Card bg | Slate Navy | `#1A1D3A` |
| Accent gradient start | Vibrant violet | `#7C3AED` |
| Accent gradient end | Electric cyan | `#06B6D4` |
| Text primary | White | `#FFFFFF` |
| Text secondary | Light grey | `#A0A3C0` |
| Border / divider | Muted navy | `#2A2D4E` |

### Typography
- Headings: System UI font stack with bold weight
- Body: System UI font stack
- Scale: `clamp()` for responsive sizing

### Layout Strategy
- Nav: Flexbox, sticky top
- Hero: Full-viewport height, centered content with animated gradient background
- Features: 3-column grid → 2-column → single column
- Models: Horizontal card row → stacked cards
- FAQ: Single column max-width centered
- Footer: Flexbox row → stacked column

### Animation Strategy
- `@keyframes fadeInUp`, `fadeIn`, `gradientShift`
- Intersection Observer applies `.reveal` class which triggers CSS transitions
- CSS `prefers-reduced-motion` media query to disable animations

## Security / Edge Cases
- **No user input**: Only CTA clicks and accordion toggles — no forms to validate or sanitise
- **No external content**: All text is hardcoded; no XSS or injection vectors
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables all animations
- **Fallback fonts**: System font stack ensures no missing fonts
- **No JS fail**: Page is fully readable with JS disabled (no core content hidden by JS)
- **Empty states**: N/A — no dynamic data loading

## Verification Checklist

- [ ] File `index.html` exists and is valid HTML5
- [ ] No external dependencies (no CDN, no framework)
- [ ] Page loads without errors in Chrome, Firefox, Safari
- [ ] Responsive at 375px, 768px, 1440px widths
- [ ] Navbar is sticky and collapses to hamburger on mobile
- [ ] Hero section fills viewport
- [ ] Feature cards have hover effects
- [ ] FAQ accordion opens/closes on click
- [ ] Scroll-triggered fade-in animations work
- [ ] "prefers-reduced-motion" respected
- [ ] All text is original, not copied from official Google sites
- [ ] No Google logos, trademarks, or brand assets used

## Expected Final Output
A single file: `/Users/lukesimpson/Documents/Coding Projects/Clyra-AI-Final/projects/make-a-landing-page-for-google-gemini-5ad7a5/files/index.html`

The landing page will be a modern, dark-themed, gradient-accented showcase of Google Gemini's AI capabilities. It should look like a premium tech product page — comparable in polish to official landing pages but entirely original in execution.

## Risks / Assumptions

| Risk | Mitigation |
|------|------------|
| Cannot use official Google logos or assets | Original geometric/abstract visuals with CSS gradients instead of images; text-only brand mentions |
| No real product screenshots available | Use CSS-only illustrative representations (code blocks, abstract cards, iconography via Unicode/emoji) |
| Single-file size may grow large | Keep CSS/JS lean; target under 100KB total |
| User may want multi-file or framework-based build later | Plan is single-file, but structure is clean enough to split out if needed |
| No brand style guide available | Design based on publicly known aesthetic: dark themes, purple/blue gradients, clean sans-serif typography, rounded cards |

## Research Sources

1. https://deepmind.google/technologies/gemini/ — Official Google DeepMind Gemini page (fetched; content confirms model names, capabilities, ecosystem)
2. https://www.googlegemini.com — Unofficial fan/news site (fetched; not official brand resource, noted)
3. https://googlegemini.com — Same as above

**Note**: `web_search`, `screenshot_page`, and `extract_brand_style` tools are not connected. Full visual brand extraction was not possible. All design decisions are based on publicly known aesthetics and inspired originality.

## Company Summary
**Google Gemini** is a family of multimodal AI models developed by Google DeepMind. It supports text, image, audio, video, and code understanding/generation. Variants include Gemini Ultra (largest), Gemini Pro (best balance), and Gemini Nano (on-device). The ecosystem includes the Gemini app, Google AI Studio, Gemini API, and enterprise agent platforms.

## Visual Style Limits
- **Connected tools missing**: `web_search`, `screenshot_page`, `extract_brand_style`
- **Official assets unavailable**: No logos, trademarked icons, or screenshots
- **Design approach**: Dark theme with vibrant gradient accents (violet → cyan), clean sans-serif type, card-based layout, subtle glow effects, large typography
- **Original content only**: All copy, taglines, and descriptions are inspired original text — not quotes from Google's site

## Safety Boundary
- Do **not** copy Google's actual logo, favicon, or trademarked brand marks
- Do **not** claim affiliation with Google or Google DeepMind
- Do **not** use official product screenshots or videos
- Do **not** impersonate Google's official website
- The page is clearly an **unofficial, inspired concept** page
- All trademarked names ("Google Gemini", "Google DeepMind") are used descriptively and only where necessary

## Approval Gate

**This plan requires explicit user approval before any implementation begins.**

Please review the plan above. If you'd like any changes to the structure, sections, visual direction, or technology choices, let me know. Once you approve, I will switch to Act Mode and implement the full landing page as specified.

I will not write or modify any code until you confirm approval.