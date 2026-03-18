import { CONFIG, ABILITIES } from '../config.js';

export class LevelSystem {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.level = 1;
    this.xp = 0;
    this.xpToNext = this._calculateNextXP(1);
  }

  _calculateNextXP(lvl) {
    const { base, increase, multiplier } = CONFIG.XP;
    // 공식: (기본치 + 레벨 * 증가폭) * 승수^레벨
    return Math.floor((base + lvl * increase) * Math.pow(multiplier, lvl));
  }

  addXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this._levelUp();
    }
  }

  _levelUp() {
    this.level++;
    this.xpToNext = this._calculateNextXP(this.level);

    // 3가지 능력 랜덤 선택 (중복 허용하여 계속 강화 가능하게)
    const choices = [];
    const pool = [...ABILITIES];
    for (let i = 0; i < 3; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      choices.push(pool[idx]); // 원본 ABILITIES는 작으므로 중복 선택 가능하도록
    }

    this.game.abilitySelect.show(choices);
    this.game.pauseForLevelUp();
  }

  getXpPercent() {
    return this.xpToNext > 0 ? (this.xp / this.xpToNext) * 100 : 100;
  }
}
