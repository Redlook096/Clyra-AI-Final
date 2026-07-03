<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Clyra AI

AI workspace with **Chat**, **Vibe Coder** (plan → code → preview), and **Clip**.

## Directory layout

```
Clyra-AI-Final/
├── src/                         Frontend (React)
│   ├── App.tsx                  Main app shell
│   ├── components/
│   │   ├── vibe/                Chat-embedded Vibe agent UI
│   │   ├── vibe-coder/          Vibe Coder workspace UI
│   │   │   ├── code/            Live code streaming boxes
│   │   │   ├── preview/         Browser-style live preview panel
│   │   │   └── thinking/        Agent thinking status
│   │   └── ui/                  Shared UI primitives
│   ├── hooks/                   React hooks (Vibe workspace state)
│   └── lib/                     Frontend helpers & parsers
├── lib/                         Server-side code
│   ├── agent/                   Plan/code orchestrators, local scaffold
│   ├── cline/                   Cline SDK integration & routes
│   └── vibe-coder/              Preview runner & build harness
├── types/                       Shared TypeScript schemas
├── public/                      Static assets (icons, etc.)
├── pages/                       Extra Vite entry pages
├── scripts/
│   ├── browser/                 Local browser automation helpers
│   ├── clipper-pipeline.py      AI Clipper backend
│   └── record-vibe-coder.ts     Demo screen recorder
├── tests/e2e/                   Playwright smoke tests
├── projects/                    Generated Vibe builds (runtime output)
│   ├── project-advanced-vibe/   Default placeholder project
│   └── _samples/                Example completed builds
├── server.ts                    Express + Vite dev server
└── vibe-server.ts                 Isolated preview sandbox
```

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
cp .env.example .env.local   # add DEEPSEEK_API_KEY
npm run dev:source
```

Open http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:source` | Dev server (fast iteration) |
| `npm run dev` | Build + production-style server |
| `npm run build` | Production build |
| `npm run lint` | TypeScript check |
| `npm run test:e2e` | UI smoke test |
| `npm run test:vibe` | Vibe Coder API + UI test |
| `npm run record:vibe` | Record a Vibe Coder demo video |
| `npm run clean` | Remove `dist/` |

## Notes

- New Vibe builds write to `projects/` at runtime (gitignored except placeholder + samples).
- Browser profiles and QA screenshots are local-only and gitignored.
- Set `DEEPSEEK_API_KEY` in `.env.local` for chat and the coding agent.
