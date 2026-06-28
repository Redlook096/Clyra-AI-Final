# Vibe Coder Overhaul — Task List

## Group 1: Thinking Row Fixes
- [x] Fix `formatTime()` → `18s` / `1min 2s` format in VibeCoderWorkspace.tsx
- [x] Fix `ThinkingStep` font weight: remove `font-semibold` override → `font-normal`
- [x] Fix `ShiningText.tsx` thinkingChat preset: `motion.h1` → `motion.span`, ensure font-normal + subtler gradient
- [x] Upgrade `ThinkingUnderText.tsx` — 3-6 sentences, scroll, collapse, hover expand, smooth print
- [x] Update `visible-thought-preview.ts` — multi-sentence thought text per phase

## Group 2: Harness Layout Fixes (VibeCoderWorkspace.tsx)
- [x] Replace always-visible TaskTimeline with CompactTaskStatus + expandable drawer
- [x] Remove per-patch reason text labels; add single grouped summary
- [x] Fix live preview grid column transition (smooth squish + CSS transition)
- [x] Fix chat column to be scrollable; preview stays contained (overflow-hidden + min-h-0)

## Group 3: Live Preview Browser Fixes
- [x] PreviewTabBar.tsx — remove pill/border around tab title, plain globe + text
- [x] PreviewUrlInput.tsx — hidden by default, show on hover only (opacity-0 + pointer-events-none)
- [x] PreviewBrowserChrome.tsx — add `group` class for hover propagation
- [x] LivePreviewPanel.tsx — buttery slide-in from right (x:60→0, 0.7s), overflow-hidden fix

## Verification
- [x] TypeScript lint: 0 errors
