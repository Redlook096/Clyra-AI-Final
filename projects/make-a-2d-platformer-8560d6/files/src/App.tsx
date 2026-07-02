import { useEffect, useRef, useCallback, useState } from 'react';
import './App.css';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './game/constants';
import {
  createInitialState,
  updateGameState,
  loadLevel,
  type GameState,
  type Screen
} from './game/game';
import { render } from './game/render';
import { setupInput, updateInput } from './game/input';
import { initAudio } from './game/audio';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [showControls, setShowControls] = useState(true);

  const resetGame = useCallback(() => {
    stateRef.current = createInitialState();
    stateRef.current.screen = 'menu';
    setShowControls(false);
  }, []);

  const startGame = useCallback(() => {
    if (!stateRef.current) return;
    stateRef.current = createInitialState();
    stateRef.current.screen = 'playing';
    initAudio();
    setShowControls(false);
  }, []);

  const handleMenuAction = useCallback((action: string) => {
    const state = stateRef.current;
    if (!state) return;
    if (action === 'play') {
      startGame();
    } else if (action === 'howtoplay') {
      state._showHowToPlay = !state._showHowToPlay;
      state._showSettings = false;
    } else if (action === 'settings') {
      state._showSettings = !state._showSettings;
      state._showHowToPlay = false;
    }
  }, [startGame]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const state = stateRef.current;
    if (!state) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    if (state.screen === 'menu') {
      if (mx >= CANVAS_WIDTH / 2 - 130 && mx <= CANVAS_WIDTH / 2 + 130) {
        if (my >= 320 && my <= 366) handleMenuAction('play');
        else if (my >= 375 && my <= 421) handleMenuAction('howtoplay');
        else if (my >= 430 && my <= 476) handleMenuAction('settings');
      }
    } else if (state.screen === 'levelComplete') {
      if (mx >= CANVAS_WIDTH / 2 - 130 && mx <= CANVAS_WIDTH / 2 + 130) {
        const nextBtnY = CANVAS_HEIGHT / 2 + 150;
        const retryBtnY = CANVAS_HEIGHT / 2 + 205;
        if (my >= nextBtnY && my <= nextBtnY + 46) {
          if (state.levelIndex < 2) {
            loadLevel(state, state.levelIndex + 1);
          } else {
            state.screen = 'menu';
          }
        } else if (my >= retryBtnY && my <= retryBtnY + 46) {
          loadLevel(state, state.levelIndex);
        }
      }
    } else if (state.screen === 'gameOver') {
      if (mx >= CANVAS_WIDTH / 2 - 130 && mx <= CANVAS_WIDTH / 2 + 130) {
        const retryBtnY = CANVAS_HEIGHT / 2 + 110;
        const menuBtnY = CANVAS_HEIGHT / 2 + 165;
        if (my >= retryBtnY && my <= retryBtnY + 46) {
          startGame();
        } else if (my >= menuBtnY && my <= menuBtnY + 46) {
          state.screen = 'menu';
        }
      }
    }
  }, [handleMenuAction, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stateRef.current = createInitialState();
    stateRef.current.screen = 'menu';

    const cleanupInput = setupInput(canvas, () => stateRef.current!);

    // Handle key events for menu navigation and overlays
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state) return;

      if (state.screen === 'menu') {
        if (e.key === 'Enter') startGame();
        if (e.key === 'h' || e.key === 'H') handleMenuAction('howtoplay');
        if (e.key === 's' || e.key === 'S') handleMenuAction('settings');
      }

      if (state.screen === 'paused') {
        if (e.key === 'r' || e.key === 'R') {
          loadLevel(state, state.levelIndex);
        }
        if (e.key === 'q' || e.key === 'Q') {
          state.screen = 'menu';
        }
      }

      if (state._showHowToPlay || state._showSettings) {
        if (e.key === 'Escape') {
          state._showHowToPlay = false;
          state._showSettings = false;
        }
        if (state._showSettings && (e.key === 'a' || e.key === 'A')) {
          state.audioEnabled = !state.audioEnabled;
          
          // audio state is toggled in state; render reads it
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const gameLoop = (timestamp: number) => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate delta time
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      // Update input and game state
      updateInput(state.input);

      // Handle pause toggle
      if (state.input.pauseJustPressed) {
        if (state.screen === 'playing') {
          state.screen = 'paused';
        } else if (state.screen === 'paused') {
          state.screen = 'playing';
        }
      }

      updateGameState(state, dt);

      // Render
      render(ctx, state);

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      cleanupInput();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [startGame, handleMenuAction]);

  // Handle window resize
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const handleResize = () => {
      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight;
      const scale = Math.min(maxWidth / CANVAS_WIDTH, maxHeight / CANVAS_HEIGHT);
      setCanvasStyle({
        width: Math.floor(CANVAS_WIDTH * scale) + 'px',
        height: Math.floor(CANVAS_HEIGHT * scale) + 'px',
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={canvasStyle}
        onClick={handleCanvasClick}
        className="game-canvas"
      />
      {showControls && (
        <div className="start-prompt" onClick={startGame}>
          <p>Click or press Enter to play</p>
        </div>
      )}
    </div>
  );
}

export default App;
