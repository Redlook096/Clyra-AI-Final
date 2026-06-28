# Plan: Build a complete project management SaaS dashboard with task boards, calendar pl

## 1. Goal

Build a complete, presentable implementation for **Build a complete project management SaaS dashboard with task boards, calendar pl**.

Done means the saved project has real files, a coherent UI, responsive layout, working interactions, validation notes, a live preview route, project metadata, checkpoint data, and a final review summary.

## 2. User Request Interpretation

- Direct request: Build a complete project management SaaS dashboard with task boards, calendar planning, analytics, team settings, onboarding, empty states, mobile layout, and deployment-ready polish
- Preserve the existing Clyra visual language: minimal, white, rounded, premium, smooth.
- Avoid unrelated product changes.
- Build the obvious supporting states and structure a real user would expect.
- Assume the user wants a production-feeling result, not a placeholder.
- Do not replace the existing Clyra LLM integration or app shell.

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
- Existing Vibe files: VibeCoderWorkspace, mini code boxes, live preview panel, preview runner, project storage.
- Existing preview systems: local project files under projects/{projectId}/files and a managed localhost preview session.

## 4. Existing File Tree Summary

Relevant current files:

- package.json
- src/App.tsx
- src/index.css
- server.ts

## 5. Proposed File Tree

Adapted target tree for this project:

```
projects/{projectId}/
  plan.md
  AGENTS.md
  metadata.json
  files/
    index.html
    package.json
    README.md
    src/
      main.tsx
      App.tsx
      styles.css
  checkpoints/
    checkpoint-initial.json
  logs/
    validation.log
    preview.log
  preview/
  .agent/
    task-graph.json
    agent-state.json
    pending-patches.json
    applied-patches.json
    build-summary.json
    review-results.json
    memory.json
```

## 6. Requirements

### 6.1 User-Requested Requirements

- Build the requested project in real files.
- Keep UI premium, minimal, and functional.
- Save project state so it can be reopened.
- Show each important file operation through mini code boxes.
- Keep the live preview honest and synced with saved files.

### 6.2 Inferred Production Requirements

- Empty states, loading states, and error-safe flows.
- Responsive desktop/tablet/mobile layout.
- Preview-ready files and clear validation route.
- Checkpoint metadata and rollback structure.
- Accessible labels for interactive controls.
- Fast reopen without replaying generation.
- Smooth transitions and stable layout.
- Final review before marking Ready.

## 7. Out of Scope

- Do not replace the existing LLM integration.
- Do not redesign unrelated Chat or Clip pages.
- Do not add heavy dependencies unless the project truly needs them.
- Do not run destructive commands or delete user files.

## 8. UX Flow

1. User opens Vibe Coder.
2. User selects Plan Mode or Fast Mode.
3. User sends a request.
4. Shimmer thinking appears with one safe visible focus sentence.
5. Agent scans project, framework, package manager, UI patterns, Vibe files, LLM adapter, and preview storage.
6. Agent creates detailed plan.md, proposed file tree, and task graph.
7. Collapsed plan card appears.
8. User expands, comments, regenerates, or approves.
9. Approved plan.md is saved as the source of truth.
10. Project folder, metadata, checkpoint, logs, and .agent state are created.
11. Agent reads plan.md before each task.
12. Mini code boxes show file changes one at a time.
13. Validation runs.
14. Preview refreshes.
15. Final review checks saved files, preview status, task graph, and rollback readiness.

## 9. UI Layout Plan

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

### Component: LivePreviewPanel

Purpose: run the saved project in a real browser-like preview.

States:

- Starting
- Compiling
- Ready
- Refreshing
- Runtime error
- Full screen

### Component: RecentProjectCard

Purpose: show saved project preview, name, status, rename/delete actions, and open project flow.

## 10. Architecture Plan

### Frontend

- VibeCoderWorkspace — main workspace surface.
- ThinkingStep — reusable thinking/thought state.
- ThinkingUnderText — one safe Cursor-style focus sentence.
- PlanCard — review and approval UI.
- RecentProjectCard — saved project entry point.
- LivePreviewPanel — managed local preview.
- VibeMiniCodeBox — file change stream.

### Backend / Controller

- /api/vibe/projects — list and create projects.
- /api/vibe/plan — create the structured plan.
- /api/vibe/write-plan — save approved plan.md.
- /api/vibe/validate — run safe validation metadata.
- /api/vibe/preview/start — start preview session.
- /api/vibe/preview/status/:id — report preview state.
- /api/vibe/preview/refresh — refresh preview.

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

## 11. File Change Plan

| File Path | Change Type | Purpose | Owner Agent | Risk |
| --- | --- | --- | --- | --- |
| plan.md | Create | Save approved source-of-truth plan | Planner Agent | Low |
| metadata.json | Create/Edit | Persist project status and reopen behavior | Harness Agent | Low |
| .agent/task-graph.json | Create/Edit | Track executable task graph | Harness Agent | Medium |
| .agent/agent-state.json | Create/Edit | Persist active task and gates | Harness Agent | Medium |
| files/package.json | Create/Edit | Provide dev/build scripts for preview | Backend Agent | Medium |
| files/src/App.tsx | Create/Edit | Main functional product surface | Frontend Agent | Medium |
| files/src/styles.css | Create/Edit | Visual system and responsiveness | Design Agent | Low |
| logs/validation.log | Create/Edit | Store validation result | Terminal Agent | Low |

## 12. Detailed Task Graph

### Task 1: Scan Project

ID: T1

Depends on: None

Assigned agent: Architect Agent

Files affected: None

Purpose:

- Understand the current app before planning.

Work:

- Read package metadata.
- Detect framework and package manager.
- Detect relevant source files.
- Detect existing Vibe coder files, preview runner, mini code boxes, and styling.

Expected output:

- Project scan summary.
- Relevant current file tree.

Validation:

- Confirm source folders exist or report missing files.

Rollback point:

- Not needed.

Done criteria:

- Scan results are reflected in plan.md.

### Task 2: Generate plan.md and proposed file tree

ID: T2

Depends on: T1

Assigned agent: Planner Agent

Files affected:

- plan.md

Work:

- Create detailed plan.md.
- Create proposed file tree.
- Create execution gates and validation plan.

Expected output:

- Reviewable plan card.

Validation:

- Confirm plan.md has all required sections.

Rollback point:

- Restore checkpoint before T2.

Done criteria:

- User can expand, comment, and approve the plan.

### Task 3: Create project shell and checkpoint

ID: T3

Depends on: T2

Assigned agent: Harness Agent

Files affected:

- metadata.json
- checkpoints/checkpoint-initial.json
- .agent/task-graph.json
- .agent/agent-state.json

Work:

- Create persistent project folder.
- Save approved plan and metadata.
- Create checkpoint before file edits.

Expected output:

- Project can be reopened without replaying generation.

Validation:

- Confirm folder structure exists.

Rollback point:

- Initial checkpoint.

Done criteria:

- Gate 4 and Gate 5 pass.

### Task 4: Generate product files

ID: T4

Depends on: T3

Assigned agent: Frontend Agent

Files affected:

- files/package.json
- files/index.html
- files/src/main.tsx
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

Rollback point:

- Restore checkpoint before T4.

Done criteria:

- Mini code boxes emitted for each created/edited file.

### Task 5: Validate and fix

ID: T5

Depends on: T4

Assigned agent: Terminal Agent + Error Agent + Fixer Agent

Files affected:

- logs/validation.log

Work:

- Run available validation commands or local structural checks.
- Parse errors.
- Patch targeted files if needed.
- Repeat up to 5 times.

Expected output:

- Passing or clearly reported validation.

Validation:

- No missing core files.

Rollback point:

- Restore checkpoint before T5.

Done criteria:

- Validation gate passes or build is paused with a clear reason.

### Task 6: Refresh live preview and final review

ID: T6

Depends on: T5

Assigned agent: Reviewer Agent

Files affected:

- preview/
- logs/preview.log
- .agent/build-summary.json

Work:

- Start or refresh live preview.
- Check preview state honestly.
- Confirm saved files, metadata, task graph, and rollback data.

Expected output:

- Ready project summary with preview status.

Validation:

- Preview URL responds or failure is reported.

Rollback point:

- Restore checkpoint before T6.

Done criteria:

- Final review checklist passes.

## 13. Execution Gates

Gate 1: Project Scanned — cannot create plan until scan is complete.

Gate 2: plan.md Generated — cannot show plan card until plan.md exists.

Gate 3: Plan Approved — cannot edit files until approval.

Gate 4: Project Folder Created — cannot build until metadata and folders exist.

Gate 5: Checkpoint Created — cannot edit files until checkpoint exists.

Gate 6: Task Read From plan.md — cannot execute a task until the current task is read from plan.md.

Gate 7: Mini Code Box Emitted — cannot hide important file changes.

Gate 8: Validation Passed — cannot mark task done until validation passes or failure is reported.

Gate 9: Preview Checked — cannot mark UI task done until preview is refreshed or failure is reported.

Gate 10: Final Review Passed — cannot show Build Complete until final review passes.

## 14. Validation Plan

- Detect package manager: npm
- Use package.json scripts when available.
- Run typecheck, lint, test, and build when defined.
- For generated project files, confirm package.json, index.html, src/main.tsx, src/App.tsx, and src/styles.css exist.
- Never fake command output.

## 15. Error Fixing Plan

1. Capture the error.
2. Map the error to the task from plan.md.
3. Map the error to file and line when possible.
4. Show thinking with a safe visible focus sentence.
5. Apply the smallest targeted patch.
6. Emit mini code box.
7. Re-run validation.
8. Repeat up to 5 times.
9. Pause with Build Paused if still broken.

## 16. Live Preview Plan

- Start the dev server for the saved project.
- Detect localhost URL.
- Load the project in the live preview.
- Show starting, compiling, ready, refreshing, and error states honestly.
- Refresh after successful file changes.
- Capture runtime errors and route them to the Error/Fixer loop.
- Do not mark preview ready if broken.

## 17. Checkpoint and Rollback Plan

- Create checkpoint before file edits.
- Store task graph and agent state under .agent/.
- Store applied patches under .agent/applied-patches.json.
- Roll back to the latest checkpoint only after user confirmation.

## 18. UI State Completion Pass

Check the generated project for:

- Main state.
- Empty state.
- Loading state.
- Error state.
- Disabled state.
- Hover state.
- Focus state.
- Mobile layout.
- Tablet layout.
- Desktop layout.
- Accessibility labels.
- Smooth animation.
- No layout jumps.
- Consistent glassy Clyra style.

## 19. Diff Risk Plan

Risk classification:

- Safe: isolated component, style, or generated project file changes.
- Medium: package.json, routing, preview, or validation changes.
- High: deletes, env files, lockfiles, auth, data schemas, or app shell rewrites.

Current expected risk: Medium, because package.json and preview-ready generated files are created inside the saved project sandbox.

Approval required:

- Deleting files or projects.
- Changing host app package manager.
- Editing secrets or .env files.
- Destructive git commands.

## 20. Performance Plan

- Keep animation to opacity and transform.
- Keep panel heights stable.
- Debounce preview refresh.
- Lazy load heavy code/preview panels.
- Avoid global state churn for timers and visible thought text.
- Keep mini code boxes sequential and collapsed after reveal.

## 21. Safety Plan

Never delete files, reset git, overwrite .env files, expose secrets, replace the LLM integration, or run destructive commands without approval.

Commands needing approval:

- rm -rf
- git reset --hard
- git clean
- npm uninstall
- deleting folders
- overwriting .env files

## 22. Final Review Checklist

- plan.md exists.
- AGENTS.md/project rules exist.
- Proposed file tree matches saved output or differences are explained.
- metadata.json exists.
- .agent state exists.
- Project memory is saved.
- Review Agent result is recorded.
- Mini code boxes were emitted for file changes.
- Validation status is recorded.
- Live preview starts or reports a clear failure.
- Checkpoint exists.
- Rollback path is available.
- UI matches the Clyra style.
- No unrelated files changed.

## Build Execution Rules

- Create checkpoint before editing.
- Apply one task at a time.
- Show ThinkingStep before each task.
- Show mini code boxes for file edits.
- Validate after each major task.
- Do not mark task done until validation passes or is clearly reported.

## Final User Summary

Build Complete:

- What was built.
- Files changed.
- plan.md saved.
- Commands run.
- Preview status.
- Checkpoint created.
- Rollback available.
