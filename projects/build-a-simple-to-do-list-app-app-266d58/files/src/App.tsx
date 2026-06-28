import React, { useState } from 'react';
import './styles.css';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');

  const addTask = () => {
    if (input.trim() === '') return;
    const newTask: Task = {
      id: Date.now(),
      text: input.trim(),
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setInput('');
  };

  const toggleComplete = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(task => !task.completed));
  };

  return (
    <div className="app">
      <div className="glass-card">
        <h1 className="title">to-do</h1>
        <div className="input-row">
          <input
            type="text"
            placeholder="Add a new task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="task-input"
          />
          <button onClick={addTask} className="add-btn">+</button>
        </div>
        <ul className="task-list">
          {tasks.map(task => (
            <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task.id)}
                  className="check-box"
                />
                <span className="check-custom"></span>
              </label>
              <span className="task-text" onClick={() => toggleComplete(task.id)}>
                {task.text}
              </span>
              <button onClick={() => deleteTask(task.id)} className="delete-btn">✕</button>
            </li>
          ))}
        </ul>
        {tasks.some(t => t.completed) && (
          <button onClick={clearCompleted} className="clear-btn">clear completed</button>
        )}
      </div>
    </div>
  );
};

export default App;
