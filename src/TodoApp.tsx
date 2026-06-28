import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

type Filter = 'all' | 'active' | 'completed';

// ---------------------------------------------------------------------------
// Local storage helpers
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'clyra-todos';

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Todo[];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Filter button component
// ---------------------------------------------------------------------------
function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
      }`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Persist to local storage whenever todos change
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ---- Derived state ----
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const activeCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  // ---- Actions ----
  function addTodo() {
    const text = input.trim();
    if (!text) return;
    const todo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [todo, ...prev]);
    setInput('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addTodo();
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
  }

  function saveEdit() {
    const text = editText.trim();
    if (!text || !editingId) {
      setEditingId(null);
      return;
    }
    setTodos((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, text } : t)),
    );
    setEditingId(null);
    setEditText('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText('');
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  // ---- Computed stats for display ----
  const totalCount = todos.length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-12 sm:py-20">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extralight tracking-tight text-slate-900">
          todos
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {activeCount > 0
            ? `${activeCount} item${activeCount !== 1 ? 's' : ''} remaining`
            : totalCount > 0
              ? 'All done! ✨'
              : 'Add something to get started'}
        </p>
      </header>

      {/* Add todo form */}
      <div className="mb-6 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition-all placeholder:text-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="button"
          onClick={addTodo}
          disabled={!input.trim()}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {/* Filters */}
      {totalCount > 0 && (
        <div className="mb-4 flex items-center gap-1">
          <FilterBtn label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterBtn
            label="Active"
            active={filter === 'active'}
            onClick={() => setFilter('active')}
          />
          <FilterBtn
            label="Completed"
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
          />
          <div className="ml-auto" />
          {completedCount > 0 && (
            <button
              type="button"
              onClick={clearCompleted}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
            >
              Clear completed
            </button>
          )}
        </div>
      )}

      {/* Todo list */}
      {filteredTodos.length === 0 ? (
        <div className="mt-12 text-center text-sm text-slate-300">
          {filter === 'all'
            ? 'No todos yet. Add one above!'
            : filter === 'active'
              ? 'No active todos. 🎉'
              : 'No completed todos yet.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredTodos.map((todo) => (
            <li
              key={todo.id}
              className={`group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm transition-all ${
                todo.completed ? 'border-slate-100' : 'border-slate-200'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  todo.completed
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-500'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {todo.completed && (
                  <svg className="size-3" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              {/* Text or edit input */}
              {editingId === todo.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={saveEdit}
                  className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none ring-2 ring-slate-200 focus:ring-slate-400"
                />
              ) : (
                <span
                  className={`flex-1 text-sm transition-all ${
                    todo.completed
                      ? 'text-slate-300 line-through'
                      : 'text-slate-700'
                  }`}
                >
                  {todo.text}
                </span>
              )}

              {/* Actions */}
              {editingId !== todo.id && (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => startEdit(todo)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Edit"
                  >
                    <svg className="size-4" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M11.5 1.5L14.5 4.5L6 13H3V10L11.5 1.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Delete"
                  >
                    <svg className="size-4" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M2 4H14M5.5 4V2.5C5.5 2.22386 5.72386 2 6 2H10C10.2761 2 10.5 2.22386 10.5 2.5V4M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      {totalCount > 0 && (
        <footer className="mt-6 text-center text-xs text-slate-300">
          {totalCount} total / {activeCount} active / {completedCount} completed
        </footer>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------
const rootElement = document.getElementById('root')!;
createRoot(rootElement).render(
  <StrictMode>
    <TodoApp />
  </StrictMode>,
);

// Default export for Vite HMR
export default TodoApp;
