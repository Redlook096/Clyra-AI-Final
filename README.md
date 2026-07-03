<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Clyra AI

AI workspace with **Chat**, **Vibe Coder** (plan → code → preview), and **Clip**.

## Project layout

```
├── src/              React frontend (App, Vibe Coder UI, components)
├── lib/              Server-side agents, Cline integration, preview harness
├── types/            Shared TypeScript types
├── public/           Static assets
├── scripts/          Dev utilities (browser helpers, clipper pipeline, recordings)
├── tests/e2e/        Playwright smoke tests
├── pages/            Secondary Vite entry pages
├── projects/         Generated Vibe projects (runtime output; samples committed)
│   ├── project-advanced-vibe/   Default placeholder project
│   └── _samples/                Example completed builds
├── server.ts         Main Express + Vite server
└── vibe-server.ts    Isolated preview sandbox server
```

## Run locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and set `DEEPSEEK_API_KEY`.
3. Start the app:
   ```bash
   npm run dev:source
   ```
4. Open http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:source` | Dev server (fast iteration) |
| `npm run dev` | Build + production-style server |
| `npm run lint` | TypeScript check |
| `npm run test:e2e` | UI smoke test (Playwright) |
| `npm run test:vibe` | Vibe Coder API + UI test |
| `npm run record:vibe` | Record a Vibe Coder demo video |

## Environment

See `.env.example` for `DEEPSEEK_API_KEY`, optional LLM overrides, and port settings.

Generated Vibe builds are written to `projects/` at runtime and are gitignored except the placeholder and `_samples/`.
