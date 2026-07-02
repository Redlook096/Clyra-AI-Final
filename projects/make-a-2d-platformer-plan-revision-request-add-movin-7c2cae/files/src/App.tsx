import { useEffect, useMemo, useRef, useState } from "react";
import { level } from "./game/levels";
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, clampPlayer, intersects, resolvePlatforms } from "./game/physics";
import type { Coin, Player } from "./game/types";

type GameStatus = "ready" | "playing" | "paused" | "won" | "lost";

const playerStart = (): Player => ({
  x: level.start.x,
  y: level.start.y,
  width: 34,
  height: 42,
  vx: 0,
  vy: 0,
  grounded: false,
});

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef(new Set<string>());
  const playerRef = useRef<Player>(playerStart());
  const coinsRef = useRef<Coin[]>(level.coins.map((coin) => ({ ...coin })));
  const statusRef = useRef<GameStatus>("ready");
  const [status, setStatus] = useState<GameStatus>("ready");
  const [coins, setCoins] = useState(0);
  const [attempts, setAttempts] = useState(1);

  const message = useMemo(() => {
    if (status === "won") return "Portal reached. Run it back cleaner?";
    if (status === "lost") return "Spikes caught you. Reset and try again.";
    if (status === "paused") return "Paused. Press P to resume.";
    if (status === "ready") return "Collect every coin and reach the portal.";
    return "Move with arrows or A/D. Jump with space.";
  }, [status]);

  function setGameStatus(next: GameStatus) {
    statusRef.current = next;
    setStatus(next);
  }

  function resetGame() {
    playerRef.current = playerStart();
    coinsRef.current = level.coins.map((coin) => ({ ...coin }));
    setCoins(0);
    setAttempts((count) => count + 1);
    setGameStatus("playing");
  }

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w", "p", "r"].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === "r") resetGame();
      if (event.key === "p" && statusRef.current === "playing") setGameStatus("paused");
      else if (event.key === "p" && statusRef.current === "paused") setGameStatus("playing");
      if (statusRef.current === "ready" && (event.key === "Enter" || event.key === " ")) setGameStatus("playing");
      keysRef.current.add(event.key.toLowerCase());
    };
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;

    const drawRect = (x: number, y: number, width: number, height: number, color: string, radius = 10) => {
      context.fillStyle = color;
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
      context.fill();
    };

    const render = () => {
      context.clearRect(0, 0, level.width, level.height);
      const gradient = context.createLinearGradient(0, 0, level.width, level.height);
      gradient.addColorStop(0, "#eef6ff");
      gradient.addColorStop(1, "#ffffff");
      context.fillStyle = gradient;
      context.fillRect(0, 0, level.width, level.height);

      context.fillStyle = "rgba(96,165,250,.18)";
      context.beginPath();
      context.arc(165, 120, 96, 0, Math.PI * 2);
      context.fill();

      for (const platform of level.platforms) drawRect(platform.x, platform.y, platform.width, platform.height, "#1f2937", 9);
      for (const hazard of level.hazards) drawRect(hazard.x, hazard.y, hazard.width, hazard.height, "#fb7185", 7);
      drawRect(level.goal.x, level.goal.y, level.goal.width, level.goal.height, "#2563eb", 16);

      for (const coin of coinsRef.current) {
        if (coin.collected) continue;
        context.fillStyle = "#facc15";
        context.beginPath();
        context.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, 10 + Math.sin(frame / 14) * 1.5, 0, Math.PI * 2);
        context.fill();
      }

      const player = playerRef.current;
      drawRect(player.x, player.y, player.width, player.height, "#06b6d4", 12);
      context.fillStyle = "#ffffff";
      context.fillRect(player.x + 21, player.y + 11, 5, 5);
    };

    const tick = () => {
      frame += 1;
      if (statusRef.current === "playing") {
        const keys = keysRef.current;
        const player = { ...playerRef.current };
        player.vx = 0;
        if (keys.has("arrowleft") || keys.has("a")) player.vx = -MOVE_SPEED;
        if (keys.has("arrowright") || keys.has("d")) player.vx = MOVE_SPEED;
        if ((keys.has("arrowup") || keys.has(" ") || keys.has("w")) && player.grounded) {
          player.vy = JUMP_FORCE;
          player.grounded = false;
        }
        player.vy += GRAVITY;
        player.x += player.vx;
        player.y += player.vy;
        playerRef.current = clampPlayer(resolvePlatforms(player, level.platforms), level.width, level.height);

        coinsRef.current = coinsRef.current.map((coin) => {
          if (!coin.collected && intersects(playerRef.current, coin)) {
            setCoins((count) => count + 1);
            return { ...coin, collected: true };
          }
          return coin;
        });
        if (level.hazards.some((hazard) => intersects(playerRef.current, hazard))) setGameStatus("lost");
        if (intersects(playerRef.current, level.goal)) setGameStatus("won");
      }
      render();
      requestAnimationFrame(tick);
    };
    tick();
  }, []);

  return (
    <main className="page">
      <section className="game-shell">
        <div className="game-header">
          <div>
            <span>Skybound Runner</span>
            <h1>2D Platformer</h1>
          </div>
          <button onClick={resetGame}>{status === "ready" ? "Start" : "Restart"}</button>
        </div>
        <canvas ref={canvasRef} width={level.width} height={level.height} aria-label="Playable 2D platformer" />
        <div className="hud">
          <span>Status: {status}</span>
          <span>Coins: {coins}/{level.coins.length}</span>
          <span>Attempt: {attempts}</span>
        </div>
        <p className="message">{message}</p>
      </section>
    </main>
  );
}
