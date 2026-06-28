import React, { useState, useEffect } from 'react';
import './styles.css';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const App: React.FC = () => {
  const [todos, setTodos] = useState<Task[]>(() => {
    const saved = localStorage.getItem('clyra-todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    localStorage.setItem('clyra-todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const newTodo: Task = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
    };
    setTodos(prev => [newTodo, ...prev]);
    setInput('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <div className="app">
      <div className="glass-container">
        <header>
          <h1>Clyra Tasks</h1>
          <p className="subtitle">Stay organized with style</p>
        </header>

        <form className="input-group" onSubmit={addTodo}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Add a new task..."
            maxLength={200}
            autoFocus
          />
          <button type="submit" aria-label="Add task">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </form>

        <ul className="task-list">
          {todos.length === 0 ? (
            <li className="empty-state">
              <p>No tasks yet. Add one above!</p>
            </li>
          ) : (
            todos.map(todo => (
              <li key={todo.id} className={`task-item ${todo.completed ? 'completed' : ''}`}>
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                  />
                  <span className="checkmark" />
                </label>
                <span className="task-text" onClick={() => toggleTodo(todo.id)}>
                  {todo.text}
                </span>
                <button className="delete-btn" onClick={() => deleteTodo(todo.id)} aria-label="Delete task">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </li>
            ))
          )}
        </ul>

        <footer>
          <span>{todos.length} {todos.length === 1 ? 'task' : 'tasks'}</span>
        </footer>
      </div>
    </div>
  );
};

export default App;