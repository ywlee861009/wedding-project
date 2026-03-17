import { CONFIG } from '../config.js';
import { Enemy, XpOrb } from '../entities/Enemy.js';

export class SpawnSystem {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.wave = 1;
    this._waveTimer = 0;
    this._spawnTimer = 0;
    this._spawnInterval = CONFIG.WAVE.spawnIntervalBase;
    this._waveScale = 1.0;
  }

  update(dt) {
    const game = this.game;

    // 웨이브 타이머
    this._waveTimer += dt;
    if (this._waveTimer >= CONFIG.WAVE.baseDuration) {
      this._waveTimer -= CONFIG.WAVE.baseDuration;
      this._nextWave();
    }

    // 스폰
    this._spawnTimer -= dt;
    if (this._spawnTimer <= 0) {
      this._spawnTimer = this._spawnInterval;
      this._spawnEnemy();
    }
  }

  _nextWave() {
    this.wave++;
    this._waveScale = 1 + (this.wave - 1) * 0.25;
    this._spawnInterval = Math.max(
      CONFIG.WAVE.spawnIntervalMin,
      CONFIG.WAVE.spawnIntervalBase / (1 + (this.wave - 1) * 0.3)
    );

    // 보스 웨이브
    const bossWaves = CONFIG.WAVE.bossWaves; // 0-based indices
    if (bossWaves.includes(this.wave - 1)) {
      this._spawnBoss();
    }
  }

  _spawnEnemy() {
    const { worldX, worldY } = this.game.player;
    const { width, height } = this.game.canvas;
    const margin = 80;

    // 화면 외곽에서 스폰
    const side = Math.floor(Math.random() * 4);
    let ex, ey;
    const hw = width / 2 + margin;
    const hh = height / 2 + margin;

    switch (side) {
      case 0: ex = worldX + (Math.random() * 2 - 1) * hw; ey = worldY - hh; break;
      case 1: ex = worldX + hw;  ey = worldY + (Math.random() * 2 - 1) * hh; break;
      case 2: ex = worldX + (Math.random() * 2 - 1) * hw; ey = worldY + hh; break;
      default: ex = worldX - hw; ey = worldY + (Math.random() * 2 - 1) * hh; break;
    }

    // 웨이브에 따라 등장 타입 비율 변경
    const type = this._pickType();
    this.game.enemies.push(new Enemy(type, ex, ey, this._waveScale));
  }

  _pickType() {
    const w = this.wave;
    const r = Math.random();
    if (w < 2) return 'basic';
    if (w < 4) return r < 0.7 ? 'basic' : 'fast';
    if (w < 6) return r < 0.5 ? 'basic' : r < 0.8 ? 'fast' : 'tank';
    return r < 0.35 ? 'basic' : r < 0.6 ? 'fast' : r < 0.85 ? 'tank' : 'basic';
  }

  _spawnBoss() {
    const { worldX, worldY } = this.game.player;
    const ex = worldX + (this.game.canvas.width / 2 + 100) * (Math.random() > 0.5 ? 1 : -1);
    const ey = worldY;
    this.game.enemies.push(new Enemy('boss', ex, ey, this._waveScale));
  }

  // 적이 죽을 때 XP 오브 드롭 (외부에서 호출)
  dropXpOrb(enemy) {
    this.game.xpOrbs.push(new XpOrb(enemy.worldX, enemy.worldY, enemy.xp));
  }
}
