# Clyra To-Do List App

## Goal
Build a premium, minimal to-do list application with a glassy UI, smooth interactions, and local storage persistence.

## Requirements
- Add tasks with a text input and button.
- Delete individual tasks.
- Toggle completion (strikethrough style).
- Persist tasks in browser localStorage.
- Premium minimal design with glassmorphism, subtle shadows, and smooth animations.

## Execution Gates
1. **Gate 1: Setup** – Initialize React project structure (or use provided starter files).
2. **Gate 2: Core UI** – Build the app layout with glass container, input, and task list.
3. **Gate 3: Functionality** – Implement add, delete, toggle, and localStorage.
4. **Gate 4: Polish** – Add hover effects, transitions, responsive design, and edge-case handling (empty state, max length).

## Architecture
- Single component `App` managing state via `useState` and `useEffect` (for localStorage).
- No external dependencies.
- Styling via `styles.css` with CSS variables for easy theming.

## Data Flow
1. User types in input → `value` state updates.
2. On submit → new task object (id, text, completed) added to `todos` array.
3. `useEffect` syncs `todos` to localStorage on change.
4. On mount, load from localStorage.
5. Click task → toggle `completed`.
6. Click delete → remove from array.

## Edge Cases
- Empty input not allowed.
- Max 200 characters per task.
- Empty state shows friendly message.
- Double-click prevention on submit.