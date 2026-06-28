import React, { useState } from 'react';
import './styles.css';

// Temporary mock data
const initialData = {
  boards: [
    {
      id: 'board-1',
      title: 'Project Alpha',
      lists: [
        {
          id: 'list-1',
          title: 'To Do',
          cards: [
            { id: 'card-1', title: 'Design landing page', description: 'Create wireframes and high-fidelity mockups.', dueDate: '2025-04-10', assignee: 'Alice', labels: ['design', 'urgent'] },
            { id: 'card-2', title: 'Set up CI/CD', description: 'Configure GitHub Actions for automated deployment.', dueDate: '2025-04-12', assignee: 'Bob', labels: ['devops'] }
          ]
        },
        {
          id: 'list-2',
          title: 'In Progress',
          cards: [
            { id: 'card-3', title: 'Implement auth', description: 'Add login/signup with JWT.', dueDate: '2025-04-08', assignee: 'Charlie', labels: ['backend'] }
          ]
        },
        {
          id: 'list-3',
          title: 'Done',
          cards: [
            { id: 'card-4', title: 'Database schema', description: 'Design and implement MongoDB schemas.', dueDate: '2025-04-05', assignee: 'Alice', labels: ['backend'] }
          ]
        }
      ]
    }
  ]
};

function App() {
  const [boards] = useState(initialData.boards);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Clyra Project Manager</h1>
        <div className="app-header-actions">
          <button className="glass-button" onClick={() => alert('New Board (placeholder)')}>+ New Board</button>
        </div>
      </header>
      <main className="board-container">
        {boards.map(board => (
          <div key={board.id} className="board">
            <h2 className="board-title">{board.title}</h2>
            <div className="lists">
              {board.lists.map(list => (
                <div key={list.id} className="list glass">
                  <div className="list-header">
                    <h3>{list.title}</h3>
                    <button className="add-card-btn" onClick={() => alert('Add Card (placeholder)')}>+</button>
                  </div>
                  <div className="cards">
                    {list.cards.map(card => (
                      <div key={card.id} className="card glass-card">
                        <div className="card-labels">
                          {card.labels.map(label => (
                            <span key={label} className="label">{label}</span>
                          ))}
                        </div>
                        <h4 className="card-title">{card.title}</h4>
                        <p className="card-description">{card.description}</p>
                        <div className="card-footer">
                          <span className="card-assignee">{card.assignee}</span>
                          <span className="card-due">{card.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;