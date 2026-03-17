import { CONFIG, ABILITIES } from '../config.js';

export class LevelSystem {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.level = 1;
    this.xp = 0;
    this.xpToNext = CONFIG.XP_TABLE[1] || 30;
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
    const nextIdx = Math.min(this.level, CONFIG.XP_TABLE.length - 1);
    this.xpToNext = CONFIG.XP_TABLE[nextIdx] || CONFIG.XP_TABLE[CONFIG.XP_TABLE.length - 1] + this.level * 200;

    // 3가지 능력 랜덤 선택
    const pool = [...ABILITIES];
    const choices = [];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(idx, 1)[0]);
    }

    this.game.abilitySelect.show(choices);
    this.game.pauseForLevelUp();
  }

  getXpPercent() {
    return this.xpToNext > 0 ? (this.xp / this.xpToNext) * 100 : 100;
  }
}
