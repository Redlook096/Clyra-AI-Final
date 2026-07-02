# Gemini AI — Unofficial Inspired Concept Landing Page

A visually rich, fully responsive landing page for **Google Gemini AI** — built as an unofficial fan/inspired concept.

> ⚠️ **Disclaimer:** This project is not affiliated with, endorsed by, or connected to Google or Google DeepMind.  
> No official logos, trademarks, or copyrighted assets have been used.  
> This is an educational/demonstration project built with ❤️.

## Features

- **Animated gradient hero** with floating orbs and subtle parallax
- **6 feature cards** in a responsive grid — Multimodal Understanding, Code Generation, Visual Reasoning, Audio Analysis, Long Context, Speed & Scale
- **3 use case cards** — Developer, Creator, Enterprise
- **Chat mockup** — A simulated Gemini conversation (pure HTML/CSS, no API)
- **Testimonials** — Fictional quote cards with avatars
- **CTA section** — Dummy email signup form with toast notification
- **FAQ accordion** — 6 questions with smooth expand/collapse
- **Mobile-first responsive** — Hamburger menu, stacked layouts for tablet & phone
- **Scroll-triggered animations** — Fade-in-up via Intersection Observer
- **Smooth scroll navigation**

## How to Run

No build step or dependencies required. Open directly in any modern browser:

```bash
# Option 1: Open file directly
open index.html

# Option 2: Serve locally with Python
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Project Structure

```
├── index.html       # Main HTML — all sections
├── css/
│   └── style.css    # All styles, animations, responsive breakpoints
├── js/
│   └── main.js      # Interactions, scroll animations, form handling
└── README.md        # This file
```

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, gradients, grid, flexbox, animations, responsive design
- **Vanilla JavaScript** — Intersection Observer, DOM manipulation, form handling
- **Inter Font** — Via Google Fonts (free, open-source)

## Color Palette

| Color | Hex | Usage |
|---|---|---|
| Deep Violet | `#7c3aed` | Primary accent, gradients |
| Indigo | `#4f46e5` | Secondary gradient stop |
| Amber | `#fbbf24` | Badge, star highlights |
| Dark bg | `#0f0a1a` | Page background |
| Surface | `#1c1638` | Card backgrounds |

## Pages & Sections

1. **Navbar** — Sticky, blur backdrop, hamburger on mobile
2. **Hero** — Full-viewport with animated orbs and CTAs
3. **Features** — 3×2 grid of capability cards
4. **Use Cases** — 3 wide cards for different audiences
5. **Demo Preview** — Chat widget mockup
6. **Testimonials** — 3 quote cards (fictional)
7. **CTA** — Email signup (dummy, no data collected)
8. **FAQ** — 6 accordion questions
9. **Footer** — 3-column links, social icons, disclaimer

## Validation

- ✅ No real API calls
- ✅ No copyrighted assets
- ✅ No external dependencies
- ✅ Fully responsive (375px → 1440px+)
- ✅ Accessible (ARIA labels, semantic HTML)
- ✅ Reduced motion support
