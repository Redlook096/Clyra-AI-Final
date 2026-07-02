/**
 * HUD Manager
 * Updates overlay elements for score, lives, coins, and level.
 */
class HUD {
  constructor() {
    this.scoreElement = document.getElementById('scoreDisplay');
    this.coinElement = document.getElementById('coinDisplay');
    this.livesElement = document.getElementById('livesDisplay');
    this.levelElement = document.getElementById('levelDisplay');
  }

  /** Update all HUD elements */
  update(player, levelName) {
    if (this.scoreElement) {
      this.scoreElement.textContent = `Score: ${player.score}`;
    }
    if (this.coinElement) {
      this.coinElement.textContent = `🪙 ${player.coins}`;
    }
    if (this.livesElement) {
      const hearts = [];
      for (let i = 0; i < player.lives; i++) {
        hearts.push('❤️');
      }
      this.livesElement.textContent = hearts.join(' ') || '💀';
    }
    if (this.levelElement) {
      this.levelElement.textContent = levelName || 'Level 1';
    }
  }

  /** Show/hide overlays */
  showOverlay(id) {
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
    if (id) {
      document.getElementById(id).classList.remove('hidden');
    }
  }

  /** Hide all overlays */
  hideAll() {
    document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  }

  /** Update game over screen with final score */
  showGameOver(score) {
    document.getElementById('finalScore').textContent = `Score: ${score}`;
    this.showOverlay('gameOverScreen');
  }

  /** Update victory screen with score */
  showVictory(score) {
    document.getElementById('victoryScore').textContent = `Score: ${score}`;
    this.showOverlay('victoryScreen');
  }

  /** Show start screen */
  showStart() {
    this.showOverlay('startScreen');
  }
}
