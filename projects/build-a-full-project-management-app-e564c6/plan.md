# Clyra Project Manager

## Goal
Build a full-featured, premium project management application with a glassmorphism UI, allowing users to create boards, lists, and cards, manage tasks via drag-and-drop, and collaborate in real-time.

## Requirements
- **Boards**: Users can create multiple projects (boards).
- **Lists**: Within each board, users can add lists (e.g., To Do, In Progress, Done).
- **Cards**: Cards represent tasks; each card has a title, description, due date, assignee, labels, and comments.
- **Drag & Drop**: Cards can be dragged between lists; lists can be reordered.
- **Real-time Sync**: Optional – use WebSockets or Firebase for multi-user updates.
- **Search & Filter**: Search cards by title, filter by assignee/label.
- **Responsive**: Works on desktop and mobile.
- **Polished UI**: Glassmorphism effects, smooth transitions, minimal design.

## Execution Gates
1. **Foundation** – Set up Vite + React + TypeScript; define data models (Board, List, Card).
2. **Board View** – Render a board with columns; allow adding lists.
3. **Card Management** – Create, edit, delete cards with modal forms.
4. **Drag & Drop** – Implement drag-and-drop using `@dnd-kit/core` between lists.
5. **Search & Filter** – Add a search bar and filter controls.
6. **Persistence** – Store data in local storage (or backend).
7. **Polish** – Animate list and card transitions, refine glassmorphism, add dark mode.
8. **Real-time** – Integrate Firebase or WebSockets for collaboration.

## Technologies
- React 18
- TypeScript
- Vite
- @dnd-kit/core (drag & drop)
- Lucide React (icons)
- Tailwind CSS (utility classes)
- Custom CSS for glassmorphism

## Architecture
- `App.tsx` – Root with theme and state context
- `components/` – Board, List, Card, Modal, SearchBar
- `hooks/` – useBoard, useDrag, useLocalStorage
- `types/` – TypeScript interfaces
- `utils/` – helpers for date formatting, ID generation

## Deliverables
Starter files: `src/App.tsx`, `src/styles.css` with polished glassmorphic layout.