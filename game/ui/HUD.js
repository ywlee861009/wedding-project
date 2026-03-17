export class HUD {
  constructor() {
    this._hpBar = document.getElementById('hp-bar');
    this._hpText = document.getElementById('hp-text');
    this._xpBar = document.getElementById('xp-bar');
    this._levelText = document.getElementById('level-text');
    this._timerDisplay = document.getElementById('timer-display');
    this._waveDisplay = document.getElementById('wave-display');
    this._killCount = document.getElementById('kill-count');
  }

  reset() {
    this.update(null, 0, 1, 0);
  }

  update(player, elapsedTime, wave, kills) {
    // 타이머
    const mm = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const ss = String(Math.floor(elapsedTime % 60)).padStart(2, '0');
    this._timerDisplay.textContent = `${mm}:${ss}`;

    // 웨이브
    this._waveDisplay.textContent = `Wave ${wave}`;

    // 처치 수
    this._killCount.textContent = `처치: ${kills}`;

    if (!player) return;

    // HP
    const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
    this._hpBar.style.width = `${hpPct}%`;
    this._hpText.textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;

    // HP 색상
    if (hpPct < 25) {
      this._hpBar.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
    } else if (hpPct < 50) {
      this._hpBar.style.background = 'linear-gradient(90deg, #e67e22, #f39c12)';
    } else {
      this._hpBar.style.background = 'linear-gradient(90deg, #e74c3c, #ff6b6b)';
    }

    // XP (LevelSystem을 통해 퍼센트 계산)
    const game = window.game;
    if (game && game.levelSystem) {
      const xpPct = game.levelSystem.getXpPercent();
      this._xpBar.style.width = `${xpPct}%`;
      this._levelText.textContent = `Lv.${game.levelSystem.level}`;
    }
  }
}
