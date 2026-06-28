// === ELEMENTS ===
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreSpan = document.getElementById('score');
const highScoreSpan = document.getElementById('high-score');
const statusEl = document.getElementById('game-status');
const startBtn = document.getElementById('start-btn');

// === CONSTANTS ===
const GRID_SIZE = 20;       // 20x20 cells
const CELL_SIZE = canvas.width / GRID_SIZE;
const TICK_INTERVAL_MS = 130;

// === DIRECTIONS ===
const DIRS = {
    UP:    { x: 0,  y: -1 },
    DOWN:  { x: 0,  y: 1  },
    LEFT:  { x: -1, y: 0  },
    RIGHT: { x: 1,  y: 0  },
};

const OPPOSITE = {
    UP: 'DOWN',
    DOWN: 'UP',
    LEFT: 'RIGHT',
    RIGHT: 'LEFT',
};

// === GAME STATE ===
let snake = [];
let food = { x: 8, y: 10 };
let direction = 'RIGHT';
let nextDirection = 'RIGHT';
let score = 0;
let highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
let gameState = 'idle';     // 'idle' | 'playing' | 'gameover'
let gameLoopId = null;

// === INITIALISATION ===
highScoreSpan.textContent = highScore;

function initGame() {
    const mid = Math.floor(GRID_SIZE / 2);
    snake = [
        { x: mid, y: mid },
        { x: mid - 1, y: mid },
        { x: mid - 2, y: mid },
    ];
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    score = 0;
    scoreSpan.textContent = '0';
    spawnFood();
    gameState = 'idle';
    statusEl.textContent = 'Press "Start Game" or any arrow key to begin';
    draw();
}

function spawnFood() {
    const occupied = new Set(snake.map(c => `${c.x},${c.y}`));
    let freeCells = [];
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (!occupied.has(`${x},${y}`)) freeCells.push({ x, y });
        }
    }
    if (freeCells.length === 0) return;
    const rand = Math.floor(Math.random() * freeCells.length);
    food = freeCells[rand];
}

// === DRAWING ===
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- Grid lines ---
    ctx.strokeStyle = '#1e2d4a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // --- Snake ---
    snake.forEach((seg, idx) => {
        const x = seg.x * CELL_SIZE;
        const y = seg.y * CELL_SIZE;
        const pad = 1;

        // Head
        if (idx === 0) {
            ctx.fillStyle = '#4ade80';
            ctx.shadowColor = '#4ade80';
            ctx.shadowBlur = 10;
            ctx.fillRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2);
            ctx.shadowBlur = 0;

            // Eyes
            ctx.fillStyle = '#111';
            const eyeSize = 3;
            const eyeOffset = 6;
            if (direction === 'RIGHT') {
                ctx.fillRect(x + CELL_SIZE - eyeOffset - eyeSize, y + 5, eyeSize, eyeSize);
                ctx.fillRect(x + CELL_SIZE - eyeOffset - eyeSize, y + CELL_SIZE - 5 - eyeSize, eyeSize, eyeSize);
            } else if (direction === 'LEFT') {
                ctx.fillRect(x + eyeOffset, y + 5, eyeSize, eyeSize);
                ctx.fillRect(x + eyeOffset, y + CELL_SIZE - 5 - eyeSize, eyeSize, eyeSize);
            } else if (direction === 'UP') {
                ctx.fillRect(x + 5, y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(x + CELL_SIZE - 5 - eyeSize, y + eyeOffset, eyeSize, eyeSize);
            } else {
                ctx.fillRect(x + 5, y + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(x + CELL_SIZE - 5 - eyeSize, y + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            }
        } else {
            // Body gradient
            const intensity = 0.5 + (idx / snake.length) * 0.4;
            ctx.fillStyle = `rgb(34, ${160 + Math.floor(80 * intensity)}, 70)`;
            ctx.shadowColor = '#22c55e';
            ctx.shadowBlur = 4;
            ctx.fillRect(x + pad + 0.5, y + pad + 0.5, CELL_SIZE - pad * 2 - 1, CELL_SIZE - pad * 2 - 1);
            ctx.shadowBlur = 0;
        }
    });

    // --- Food (apple) ---
    const fx = food.x * CELL_SIZE;
    const fy = food.y * CELL_SIZE;

    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 16;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(fx + CELL_SIZE / 2, fy + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Stem
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx + CELL_SIZE / 2, fy + 3);
    ctx.lineTo(fx + CELL_SIZE / 2, fy + 8);
    ctx.stroke();

    // Leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(fx + CELL_SIZE / 2 + 4, fy + 5, 4, 2.5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(fx + CELL_SIZE / 2 - 3, fy + CELL_SIZE / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
}

// === GAME LOGIC ===
function tick() {
    if (gameState !== 'playing') return;

    // Apply queued direction (no reversing)
    if (nextDirection && OPPOSITE[nextDirection] !== direction) {
        direction = nextDirection;
    }

    const dir = DIRS[direction];
    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameOver();
        return;
    }

    // Self collision (skip last segment if eating — it gets removed)
    const willEat = (newHead.x === food.x && newHead.y === food.y);
    const checkBody = willEat ? snake : snake.slice(0, -1);
    for (const seg of checkBody) {
        if (seg.x === newHead.x && seg.y === newHead.y) {
            gameOver();
            return;
        }
    }

    // Move
    snake.unshift(newHead);

    if (willEat) {
        score++;
        scoreSpan.textContent = score;
        spawnFood();
        // Check win condition
        const occupied = new Set(snake.map(c => `${c.x},${c.y}`));
        if (occupied.size === GRID_SIZE * GRID_SIZE) {
            gameWon();
            return;
        }
    } else {
        snake.pop();
    }

    draw();
}

function gameOver() {
    gameState = 'gameover';
    if (gameLoopId) {
        clearInterval(gameLoopId);
        gameLoopId = null;
    }
    if (score > highScore) {
        highScore = score;
        highScoreSpan.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
    statusEl.textContent = `Game Over! Score: ${score}`;
    drawGameOverOverlay();
}

function gameWon() {
    gameState = 'gameover';
    if (gameLoopId) {
        clearInterval(gameLoopId);
        gameLoopId = null;
    }
    if (score > highScore) {
        highScore = score;
        highScoreSpan.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
    statusEl.textContent = `You Win! Perfect score: ${score}`;
    drawWinOverlay();
}

function drawGameOverOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#aaa';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 24);
}

function drawWinOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU WIN!', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#aaa';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 24);
}

// === CONTROL ===
function startGame() {
    if (gameState === 'playing') return;
    initGame();
    gameState = 'playing';
    statusEl.textContent = 'Playing...';
    if (gameLoopId) clearInterval(gameLoopId);
    gameLoopId = setInterval(tick, TICK_INTERVAL_MS);
    draw();
}

function changeDirection(newDir) {
    if (gameState === 'idle') {
        startGame();
    }
    if (gameState !== 'playing') return;
    // Prevent reversing directly into yourself
    if (OPPOSITE[newDir] !== direction) {
        nextDirection = newDir;
    }
}

// === EVENT LISTENERS ===
startBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    const keyMap = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP', W: 'UP',
        s: 'DOWN', S: 'DOWN',
        a: 'LEFT', A: 'LEFT',
        d: 'RIGHT', D: 'RIGHT',
    };
    const dir = keyMap[e.key];
    if (dir) {
        e.preventDefault();
        changeDirection(dir);
    }
    // Space to start
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        startGame();
    }
});

// Mobile button controls
document.getElementById('up-btn')   .addEventListener('click', () => changeDirection('UP'));
document.getElementById('down-btn') .addEventListener('click', () => changeDirection('DOWN'));
document.getElementById('left-btn') .addEventListener('click', () => changeDirection('LEFT'));
document.getElementById('right-btn').addEventListener('click', () => changeDirection('RIGHT'));

// Prevent scrolling on mobile when pressing arrow buttons
document.querySelectorAll('.arrow-btn').forEach(btn => {
    btn.addEventListener('touchstart', (e) => e.preventDefault());
});

// === BOOT ===
initGame();

