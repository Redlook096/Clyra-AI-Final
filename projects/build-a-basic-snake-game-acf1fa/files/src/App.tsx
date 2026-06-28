import React, { useState, useEffect, useCallback } from 'react';
import './styles.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const TICK_INTERVAL = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Position { x: number; y: number; }

const initialSnake: Position[] = [{ x: 10, y: 10 }];
const initialDirection: Direction = 'RIGHT';
const initialFood: Position = { x: 15, y: 15 };

const generateFood = (snake: Position[]): Position => {
  let newFood: Position;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
  return newFood;
};

const App: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>(initialSnake);
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const [food, setFood] = useState<Position>(initialFood);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      let newHead: Position;
      switch (direction) {
        case 'UP':    newHead = { x: head.x, y: head.y - 1 }; break;
        case 'DOWN':  newHead = { x: head.x, y: head.y + 1 }; break;
        case 'LEFT':  newHead = { x: head.x - 1, y: head.y }; break;
        case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
        default:      newHead = head;
      }

      // Collision with walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        return prevSnake;
      }

      // Self collision
      if (prevSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const ateFood = newHead.x === food.x && newHead.y === food.y;
      const newSnake = [newHead, ...prevSnake];
      if (!ateFood) {
        newSnake.pop();
      } else {
        setFood(generateFood(newSnake));
        setScore(s => s + 1);
      }
      return newSnake;
    });
  }, [direction, food]);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(moveSnake, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [moveSnake, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.replace('Arrow', '').toUpperCase() as Direction;
      if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(key)) {
        e.preventDefault();
        setDirection(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const restart = () => {
    setSnake(initialSnake);
    setDirection(initialDirection);
    setFood(initialFood);
    setGameOver(false);
    setScore(0);
  };

  const renderCell = (row: number, col: number) => {
    const isSnake = snake.some(seg => seg.x === col && seg.y === row);
    const isHead = snake[0]?.x === col && snake[0]?.y === row;
    const isFood = food.x === col && food.y === row;
    let className = 'cell';
    if (isSnake) className += isHead ? ' head' : ' snake';
    if (isFood) className += ' food';
    return <div key={`${row}-${col}`} className={className} />;
  };

  return (
    <div className="game-container">
      <div className="score-panel">
        <span>Score: {score}</span>
      </div>
      <div className="board" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)` }}>
        {Array.from({ length: GRID_SIZE }).map((_, row) =>
          Array.from({ length: GRID_SIZE }).map((_, col) => renderCell(row, col))
        )}
      </div>
      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-card">
            <h2>Game Over</h2>
            <p>Score: {score}</p>
            <button onClick={restart} className="restart-btn">Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;