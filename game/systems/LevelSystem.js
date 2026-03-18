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

    // 3가지 고유 능력 랜덤 선택
    const choices = [];
    const pool = [...ABILITIES]; // 원본 보존을 위해 복사
    
    for (let i = 0; i < 3 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      // 선택된 항목을 pool에서 꺼내어(splice) 중복 방지
      choices.push(pool.splice(idx, 1)[0]);
    }

    this.game.abilitySelect.show(choices);
    this.game.pauseForLevelUp();
  }

  getXpPercent() {
    return this.xpToNext > 0 ? (this.xp / this.xpToNext) * 100 : 100;
  }
}
