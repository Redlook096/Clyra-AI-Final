# PLAN.md

## 1. Request Interpretation

- Original request: Build a complete premium landing page for a new SaaS product called FlowPilot. FlowPilot is a modern productivity platform that helps teams plan projects, track tasks, automate workflows, and see progress in one calm dashboard. It must be an independent product, not for this AI assistant. Include navbar, hero, product preview, trust badges, feature grid, workflow, dashboard preview, automation section, collaboration section, testimonials, pricing CTA, FAQ, footer, sign in modal, sign up modal, form validation, mobile menu, smooth animations, responsive layout, and no dead buttons. Use Plan Mode first, create PLAN.md, then wait for approval before building.
- Product type: full product surface
- Independent or current app: independent product unless the user explicitly says it is for Clyra, this AI assistant, or the current app.
- Brand/niche assumptions: FlowPilot is the requested brand and should feel polished, trustworthy, modern, and production-ready.
- What is not being assumed: this is not a page about the Vibe Coder itself unless the prompt clearly asks for that.

## 2. Full Product Scope

- Pages/sections: navbar, hero, product preview, features, benefits, workflow, live preview/demo, auth UI, pricing/CTA, FAQ, final CTA, and footer.
- User flows: primary CTA, secondary CTA, section navigation, sign in, sign up, forgot password, FAQ accordion, responsive mobile navigation, and demo-state form validation.
- Components: reusable section headers, content/data module, pricing cards, workflow cards, FAQ items, auth form, mock code/preview/terminal panels, and final CTA.
- States: default, hover, focus, active, loading/demo feedback, validation error, empty/supporting state where useful, and mobile layout.
- Interactions: every visible CTA, auth tab, form submit, FAQ toggle, and navigation link must perform a real local action or route to a real section.
- Animations: lightweight transform/opacity transitions, card hover movement, FAQ open/close, button press feedback, and responsive layout transitions.
- Responsive behaviour: single-column mobile, balanced tablet stacking, and full desktop grids with no horizontal overflow.

## 3. Feature Completeness Checklist

- Complete first viewport with strong value proposition and two working CTAs.
- Auth UI with sign in, sign up, forgot password, validation, and demo status.
- Realistic content and demo data with no lorem ipsum.
- Multi-section marketing flow that feels complete enough to show a client.
- Multiple focused source files instead of one giant component.
- Build validation and preview startup before final completion.

## User Request

Build a complete premium landing page for **FlowPilot**, an advanced modern productivity platform for planning projects, tracking tasks, automating workflows, and seeing progress. The page must feel premium, minimal, intelligent, developer-focused, smooth, trustworthy, modern, high-converting, responsive, and polished.

## Product Goal

FlowPilot should feel like a serious AI project workspace for developers who want an agent that can plan, code, preview, validate, fix errors, and ship complete apps. The landing page should make visitors trust that FlowPilot is not a shallow prompt-to-UI toy; it is a controlled coding platform with Planning, live preview, terminal checks, one-file-at-a-time generation, checkpoints, and final review.

## Existing Project Analysis

- Framework: React + Vite
- Styling system: Tailwind/CSS utility mix, soft glass panels, large rounded corners, restrained motion, and premium whitespace.
- Routing: single React app surface with tab state; Vibe Coder is rendered as a tab inside the existing Clyra shell.
- Component structure: Vibe Coder uses `VibeCoderWorkspace`, `ThinkingStatus`, `MiniCodeBoxQueue`, `FileTreePanel`, `PlanPanel`, `TerminalPanel`, and `LivePreviewPanel`.
- Current UI conventions: white surfaces, subtle borders, slate typography, smooth transform/opacity transitions, minimal glassy controls.
- Existing reusable components: AI orb, shining text, mini code boxes, preview browser chrome, terminal panel, project cards.
- Existing mini code boxes: stream through `file_started`, `file_delta`, and `file_completed` events and collapse after each generated file.
- Current preview/build setup: generated project files are saved under `projects/{projectId}/files`, built with Vite, and served by the managed preview runner.

## Landing Page Structure

- Hero: high-converting headline, short subheadline, primary CTA, secondary CTA, status pills, and premium AI coding visual.
- Product demo/preview: mock FlowPilot workspace with chat, thinking status, mini code box, file tree, preview panel, and terminal panel.
- Feature grid: deep Planning, multi-file generation, live preview, terminal logs, error fixing, checkpoints, model flexibility, responsive apps, file tree, and premium chat UI.
- Planning section: PLAN.md preview, structured steps, architecture planning, file queue, and validation checklist.
- Workflow automation section: one-file-at-a-time workflow from plan to file generation, checks, fixes, and preview.
- Live dashboard section: browser mock with URL bar, device toggles, ready state, refresh, and error overlay example.
- Terminal/build section: real command-style panel showing checks, error parsing, and fix loop.
- Pricing or CTA section: Starter, Pro, and Team cards with polished CTA buttons.
- FAQ: practical questions about FlowPilot, Planning, full apps, preview, error fixing, and export.
- Final CTA: focused conversion block.
- Footer: logo/name, tagline, links, and copyright.

## Visual Direction

- Layout: centered editorial landing page with full-width sections, contained inner grids, and one strong first viewport.
- Spacing: generous section spacing, compact text blocks, and balanced card grids.
- Typography: tight display headline, confident section headings, readable body copy, and monospace accents for code/terminal areas.
- Colours: white base, slate text, subtle blue/cyan/violet accents, and glassy light panels that match Clyra.
- Dark/light behaviour: primarily light mode to match the app, with dark embedded code/terminal mock surfaces for contrast.
- Animations: lightweight opacity/translate reveal, subtle hover lift, animated status dots, and no heavy canvas/WebGL.
- Hover states: soft borders, gentle background shifts, and cursor-friendly CTA feedback.
- Responsive behaviour: single-column mobile, two-column tablet sections, three-column desktop grids, no horizontal overflow.

## File Plan

| Path | Purpose | Main components/functions | Connected files | Validation method |
| --- | --- | --- | --- | --- |
| package.json | Preview project metadata and scripts | dev/build/preview scripts | Vite preview runner | Vite build reads scripts |
| index.html | Vite HTML entry | root mount | src/main.tsx | Vite build |
| src/main.tsx | React bootstrap | createRoot render | src/App.tsx | TypeScript/Vite build |
| src/App.tsx | Landing page composition | imports all sections | components + data + styles | Vite build and preview |
| src/styles.css | Visual system and responsive styling | CSS variables, layout, cards, motion | all components | visual preview + Vite build |
| src/data/landingContent.ts | Central content model | arrays for nav, features, plans, FAQ | section components | TypeScript import check |
| src/components/SectionHeader.tsx | Reusable section heading | SectionHeader | content sections | TypeScript import check |
| src/components/HeroSection.tsx | Hero and main CTAs | HeroSection | landingContent + CSS | visual preview |
| src/components/ProductPreview.tsx | Workspace mock preview | ProductPreview | CSS | visual preview |
| src/components/PlanModeSection.tsx | PLAN.md/steps visual | PlanModeSection | landingContent | visual preview |
| src/components/CodeGenerationSection.tsx | One-file workflow | CodeGenerationSection | landingContent | visual preview |
| src/components/LivePreviewSection.tsx | Preview/device mock | LivePreviewSection | CSS | visual preview |
| src/components/FeatureGrid.tsx | Feature cards | FeatureGrid | landingContent | responsive preview |
| src/components/WorkflowSection.tsx | Prompt to ship process | WorkflowSection | landingContent | responsive preview |
| src/components/PricingSection.tsx | Pricing/CTA cards | PricingSection | landingContent | button/link check |
| src/components/FAQSection.tsx | FAQ accordion | FAQSection | landingContent | interaction check |
| src/components/Footer.tsx | Footer navigation | Footer | landingContent | visual preview |
| README.md | Project summary | usage notes | generated files | file existence check |

## Execution Steps

1. Create and save this PLAN.md as the source of truth.
2. Create the preview project package, HTML entry, and React bootstrap.
3. Add shared content data so sections stay structured and maintainable.
4. Generate reusable section components one at a time through mini code boxes.
5. Compose the full landing page in App.tsx.
6. Add the responsive visual system in styles.css.
7. Run a real Vite build and capture terminal output.
8. Fix any build/import/style issues that appear.
9. Start the live preview server and verify a localhost URL responds.
10. Review responsiveness, CTAs, FAQ interaction, visual polish, and no fake/dead controls.

## Validation Checklist

- TypeScript check through Vite build.
- Build check with the generated project Vite build.
- Preview check through the managed localhost preview runner.
- Responsive layout check for mobile, tablet, and desktop breakpoints.
- No broken imports.
- No fake buttons: CTAs use anchors, FAQ buttons work, and preview controls are visual mocks only where clearly part of the product preview.
- No placeholder sections or lorem ipsum.
- PLAN.md exists and was created before implementation files.
- More than a shallow 2-3 file implementation was generated.
- Files streamed one by one through mini code boxes.
- Terminal output is real.

## Original Prompt

Build a complete premium landing page for a new SaaS product called FlowPilot. FlowPilot is a modern productivity platform that helps teams plan projects, track tasks, automate workflows, and see progress in one calm dashboard. It must be an independent product, not for this AI assistant. Include navbar, hero, product preview, trust badges, feature grid, workflow, dashboard preview, automation section, collaboration section, testimonials, pricing CTA, FAQ, footer, sign in modal, sign up modal, form validation, mobile menu, smooth animations, responsive layout, and no dead buttons. Use Planning first, create PLAN.md, then wait for approval before building.
