# Vibe Coder Agent Rules

## Design

- Use the existing Clyra visual language: white, minimal, rounded, glassy, smooth, and lightweight.
- Prefer opacity and transform animation. Avoid heavy shadows, layout jumping, or noisy panels.
- Do not change unrelated Chat or Clip surfaces.

## Code

- Use existing components before creating new ones.
- Use npm for commands and do not switch package managers without approval.
- Prefer small targeted patches and save generated files under this project folder.

## Preview

- Never mark preview ready unless the server is running and the URL responds.
- Refresh preview after validated UI changes.
- Surface runtime errors clearly instead of hiding them.

## Safety

- Never delete files or projects without confirmation.
- Never overwrite .env files or expose secrets.
- Never run destructive git commands.
