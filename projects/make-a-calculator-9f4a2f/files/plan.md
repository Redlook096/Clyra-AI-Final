# Plan: make a calculator

## 1. Goal

Build a complete, presentable implementation for: **make a calculator**.

Done means the project has real files, a coherent UI, responsive layout, validation notes, and a preview-ready structure.

## 2. User Request Interpretation

- Direct request: make a calculator
- Preserve the existing Clyra visual language: minimal, white, rounded, premium, smooth.
- Avoid unrelated product changes.
- Build the obvious supporting states and structure a real user would expect.

## 3. Current Project Scan

Framework:

- React + Vite

Package manager:

- npm

Relevant files found:

- package.json — relevant to the app shell, styling, or generated project output
- src/App.tsx — relevant to the app shell, styling, or generated project output
- src/index.css — relevant to the app shell, styling, or generated project output
- server.ts — relevant to the app shell, styling, or generated project output

Existing design system:

- Typography: heavy rounded sans-serif with tight tracking.
- Spacing: centered premium panels, generous breathing room.
- Border radius: large rounded controls and cards.
- Glass effects: subtle white transparency and soft borders.
- Animation style: restrained transform/opacity transitions.

## 4. Requirements

### 4.1 User-Requested Requirements

- Build the requested project in real files.
- Keep UI premium, minimal, and functional.
- Save project state so it can be reopened.

### 4.2 Inferred Production Requirements

- Empty states, loading states, and error-safe flows.
- Responsive desktop/tablet/mobile layout.
- Preview-ready files and clear validation route.
- Checkpoint metadata and rollback structure.

### 4.3 Out of Scope

- Do not replace the existing LLM integration.
- Do not redesign unrelated Chat or Clip pages.
- Do not add heavy dependencies unless the project truly needs them.

## 5. UX Flow

1. User opens Vibe Coder.
2. User selects Plan Mode or Fast Mode.
3. User sends a request.
4. ThinkingStep appears and scans the project.
5. A collapsed plan card appears.
6. User expands, reviews, comments, and approves.
7. plan.md is saved.
8. Agent builds from the task graph.
9. Mini code boxes show file changes.
10. Validation and preview status are updated.

## 6. UI Plan

### Component: PlanCard

Purpose: show collapsed summary, expandable full plan, comments, and approval.

States:

- Collapsed
- Expanded
- Commenting
- Approved

### Component: MiniCodeBox

Purpose: show each file change in a compact Cursor-like stream.

States:

- Revealing
- Collapsed
- Reopened

## 7. Architecture Plan

### Frontend

- VibeCoderWorkspace — main workspace surface.
- ThinkingStep — reusable thinking/thought state.
- PlanCard — review and approval UI.
- RecentProjectCard — saved project entry point.

### Backend / Controller

- /api/vibe/projects — list and create projects.
- /api/vibe/plan — create the structured plan.
- /api/vibe/write-plan — save approved plan.md.
- /api/vibe/validate — run safe validation metadata.

### Storage

Project folder structure:

projects/
project-id/
plan.md
metadata.json
files/
checkpoints/
logs/
preview/
.agent/

## 8. File Change Plan

| File Path | Change Type | Reason | Risk Level |
| --- | --- | --- | --- |
| plan.md | Create | Save approved plan | Low |
| files/src/App.tsx | Create/Edit | Main app surface | Medium |
| files/src/styles.css | Create/Edit | Visual system | Low |
| files/README.md | Create | Project usage notes | Low |

## 9. Detailed Task Graph

### Task 1: Scan Project

ID: T1

Depends on: None

Assigned agent: Architect Agent

Files affected: None

Work:

- Read package metadata.
- Detect framework and package manager.
- Detect relevant source files.

Expected output:

- Project scan summary.

Validation:

- Confirm source folders exist or report missing files.

Rollback:

- Not needed.

### Task 2: Save Plan and Project Shell

ID: T2

Depends on: T1

Assigned agent: Project Agent

Files affected:

- plan.md
- metadata.json

Work:

- Save the approved plan.
- Create storage folders.

Expected output:

- Persistent project folder.

Validation:

- Confirm plan.md and metadata.json exist.

Rollback:

- Restore checkpoint before T2.

### Task 3: Generate Product Files

ID: T3

Depends on: T2

Assigned agent: Frontend Agent

Files affected:

- files/src/App.tsx
- files/src/styles.css
- files/README.md

Work:

- Generate complete UI.
- Keep responsive layout.
- Ensure controls have behavior.

Expected output:

- Preview-ready source files.

Validation:

- Typecheck/build if available.

Rollback:

- Restore checkpoint before T3.

### Task 4: Review and Preview

ID: T4

Depends on: T3

Assigned agent: QA Agent

Files affected:

- logs/validation.log
- preview/index.html

Work:

- Review output.
- Capture validation result.
- Prepare preview.

Expected output:

- Ready project summary.

Validation:

- No missing core files.

Rollback:

- Restore checkpoint before T4.

## 10. Build Execution Rules

- Create checkpoint before editing.
- Apply one task at a time.
- Show ThinkingStep before each task.
- Show mini code boxes for file edits.
- Validate after each major task.
- Do not mark task done until validation passes or is clearly reported.

## 11. Validation Plan

- Detect package manager: npm
- Run lint/typecheck/build where available.
- Do not fake command output.

## 12. Error Fixing Plan

1. Capture error.
2. Detect file path and line.
3. Think.
4. Patch file.
5. Re-run validation.
6. Repeat up to 5 times before pausing safely.

## 13. Live Preview Plan

- Start or refresh preview after generated files are saved.
- Show loading, compiling, ready, or failed states honestly.
- Do not show ready if preview files are missing.

## 14. Performance Plan

- Keep animations transform/opacity based.
- Avoid layout jumping.
- Lazy load heavy panels.
- Debounce preview refresh.
- Keep project cards and streams stable.

## 15. Safety Plan

Never delete files or reset git without approval. Never expose API keys. Never replace the existing LLM integration.

## 16. Final Review Checklist

- plan.md exists.
- Files are saved in the project folder.
- Task graph completed.
- Validation status recorded.
- Preview files are available.
- UI matches existing style.

## 17. Final User Summary

Build Complete:

- What was built.
- Files changed.
- plan.md saved.
- Commands run.
- Preview status.
- Checkpoint created.
- Rollback available.
