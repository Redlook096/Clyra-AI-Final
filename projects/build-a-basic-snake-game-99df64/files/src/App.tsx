import React, { useState, useEffect, useCallback, useRef } from 'react';
import './styles.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = 'RIGHT';
const SPEED = 200; // ms

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const App: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);

  // Sync refs with state
  useEffect(() => { directionRef.current = direction; }, [direction]);
  useEffect(() => { snakeRef.current = snake; }, [snake]);

  // Generate random food not on snake
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      const currentSnake = snakeRef.current;
      const currentDir = directionRef.current;

      const head = currentSnake[0];
      let newHead: Position = { ...head };
      switch (currentDir) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Collision with walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        clearInterval(interval);
        return;
      }

      // Check if snake eats food
      const ateFood = newHead.x === food.x && newHead.y === food.y;
      const newSnake = [newHead, ...currentSnake];
      if (!ateFood) newSnake.pop();
      else {
        setScore(prev => prev + 1);
        setFood(generateFood(newSnake));
      }

      // Self collision check
      const headCollision = newSnake.slice(1).some(seg => seg.x === newHead.x && seg.y === newHead.y);
      if (headCollision) {
        setGameOver(true);
        clearInterval(interval);
        return;
      }

      setSnake(newSnake);
    }, SPEED);

    return () => clearInterval(interval);
  }, [gameOver, food, generateFood]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const current = directionRef.current;
      let newDir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': if (current !== 'DOWN') newDir = 'UP'; break;
        case 'ArrowDown': if (current !== 'UP') newDir = 'DOWN'; break;
        case 'ArrowLeft': if (current !== 'RIGHT') newDir = 'LEFT'; break;
        case 'ArrowRight': if (current !== 'LEFT') newDir = 'RIGHT'; break;
        default: return;
      }
      if (newDir) setDirection(newDir);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch swipe support
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 30) return; // too short

      const current = directionRef.current;
      let newDir: Direction | null = null;
      if (absDx > absDy) {
        if (dx > 0 && current !== 'LEFT') newDir = 'RIGHT';
        else if (dx < 0 && current !== 'RIGHT') newDir = 'LEFT';
      } else {
        if (dy > 0 && current !== 'UP') newDir = 'DOWN';
        else if (dy < 0 && current !== 'DOWN') newDir = 'UP';
      }
      if (newDir) setDirection(newDir);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const restart = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 15, y: 15 });
    setScore(0);
    setGameOver(false);
  };

  const grid = Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, col) => {
      const isHead = snake[0]?.x === col && snake[0]?.y === row;
      const isBody = snake.some((seg, idx) => idx !== 0 && seg.x === col && seg.y === row);
      const isFood = food.x === col && food.y === row;
      let className = 'cell';
      if (isHead) className += ' cell-head';
      else if (isBody) className += ' cell-body';
      if (isFood) className += ' cell-food';
      return <div key={`${row}-${col}`} className={className} />;
    })
  );

  return (
    <div className="app">
      <div className="game-container">
        <div className="game-header">
          <h1 className="game-title">Snake</h1>
          <p className="game-score">Score: {score}</p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {grid}
        </div>
        {gameOver && (
          <div className="overlay">
            <div className="overlay-content">
              <h2>Game Over</h2>
              <p>Final Score: {score}</p>
              <button className="restart-btn" onClick={restart}>Restart</button>
            </div>
          </div>
        )}
        <p className="instructions">Use arrow keys or swipe to move</p>
      </div>
    </div>
  );
};

export default App;