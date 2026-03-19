export class HUD {
  constructor() {
    this._xpBarFill = document.getElementById('xp-bar-fill');
    this._xpTextDetail = document.getElementById('xp-text-detail');
    this._levelDisplay = document.getElementById('level-display');
    this._timerDisplay = document.getElementById('timer-display');
    this._waveDisplay = document.getElementById('wave-display');
    this._killCount = document.getElementById('kill-count');
  }

  reset() {
    //
  }

  update(player, elapsedTime, wave, kills) {
    // 타이머
    const mm = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const ss = String(Math.floor(elapsedTime % 60)).padStart(2, '0');
    if (this._timerDisplay) this._timerDisplay.textContent = `${mm}:${ss}`;

    // 웨이브
    if (this._waveDisplay) this._waveDisplay.textContent = `Wave ${wave}`;

    // 처치 수
    if (this._killCount) this._killCount.textContent = `처치: ${kills}`;

    if (!player) return;

    // XP (상단 전체 바)
    const game = window.game;
    if (game && game.levelSystem) {
      const lvl = game.levelSystem;
      const pct = lvl.getXpPercent();
      
      if (this._xpBarFill) this._xpBarFill.style.width = `${pct}%`;
      if (this._xpTextDetail) {
        this._xpTextDetail.textContent = `${Math.floor(lvl.xp)} / ${Math.floor(lvl.xpToNext)} (${Math.floor(pct)}%)`;
      }
      if (this._levelDisplay) {
        this._levelDisplay.textContent = `Lv.${lvl.level}`;
      }
    }
  }
}
