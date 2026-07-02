# NovaMind — Inspired AI Landing Page

An unofficial, concept landing page for a fictional AI platform called **NovaMind**, built with pure HTML, CSS, and JavaScript.

## How to Open

Open `index.html` in any modern browser:

```bash
open index.html
```

Or serve with a local HTTP server (recommended for best behavior):

```bash
npx serve .
# or
python3 -m http.server
```

## Sections

1. **Navbar** — Fixed top bar with original brand icon, navigation links, and mobile hamburger menu
2. **Hero** — Full-screen hero with gradient text, CTA buttons, and animated abstract background
3. **Products** — Card grid showcasing four fictional products (NovaChat, NovaVision, NovaWave, NovaAPI)
4. **Features** — Six benefits with iconography, hover effects
5. **Testimonials** — Fictional user quotes with star ratings
6. **CTA Banner** — Email signup form with decorative animations
7. **FAQ** — Accordion-style list of 6 questions
8. **Footer** — Link columns, branding, legal disclaimer

## Interactions

| Feature | Implementation |
|---------|---------------|
| Sticky blurred navbar | CSS `position: fixed` + JS class toggle on scroll |
| Mobile hamburger menu | JS toggle with slide-in overlay |
| Smooth anchor scrolling | JS offset calculation accounting for fixed nav |
| FAQ accordion | Native `<details>` element + CSS rotation |
| Scroll fade-in | Intersection Observer API |
| Form validation | Client-side email regex with feedback messages |
| Hover effects | CSS transitions on cards, buttons, nav links |
| Responsive design | CSS Grid + Media Queries (375px, 768px, 1200px+) |

## Design Decisions

- **Dark mode first**: Matches the AI-forward, premium-tech aesthetic
- **Custom brand icon**: Abstract geometric diamond shape — not the official OpenAI logomark
- **Colours**: Charcoal backgrounds (`#0a0a0b`), green/teal accent gradient — inspired but not copied
- **Typography**: Inter (Google Fonts) + system font fallback
- **No framework**: Pure vanilla HTML/CSS/JS — zero dependencies

## Safety & Originality

This page is an **unofficial concept** inspired by OpenAI's brand identity. It does not contain:
- Official OpenAI logos, wordmarks, or trademarks
- Copied CSS or layout code
- Exact text copy from openai.com
- Protected imagery or screenshots

All content is original and fictional. The brand name "NovaMind" and all product names are invented for this concept.

## Browser Support

Modern browsers only: Chrome, Firefox, Safari, Edge (latest 2 versions).
