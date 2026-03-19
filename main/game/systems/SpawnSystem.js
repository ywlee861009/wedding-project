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
    // 웨이브 타이머는 항상 진행 (보스전 중에도 다음 웨이브 준비)
    this._waveTimer += dt;
    if (this._waveTimer >= CONFIG.WAVE.baseDuration) {
      this._waveTimer = 0;
      this._nextWave();
    }

    // 보스 웨이브이면 일반 적 스폰만 중단
    if (CONFIG.WAVE.bossWaves.includes(this.wave)) {
      return;
    }

    // 일반 스폰
    this._spawnTimer -= dt;
    if (this._spawnTimer <= 0) {
      this._spawnTimer = this._spawnInterval;
      // 20웨이브 이후부터 물량이 급격히 증가
      const count = Math.floor(1 + this.wave * 0.5 + Math.max(0, this.wave - 20) * 1.5); 
      for (let i = 0; i < count; i++) {
        this._spawnEnemy();
      }
    }
  }

  _nextWave() {
    this.wave++;
    if (this.wave > CONFIG.WAVE.totalWaves) return;

    // 15웨이브 이후부터는 난이도가 더 가파르게 상승 (레벨 30 부근 대비)
    const baseScale = 1 + (this.wave - 1) * 0.5;
    const spike = Math.pow(Math.max(0, this.wave - 15), 1.2) * 0.6;
    this._waveScale = baseScale + spike; 

    this._spawnInterval = Math.max(
      CONFIG.WAVE.spawnIntervalMin,
      CONFIG.WAVE.spawnIntervalBase / (1 + (this.wave - 1) * 0.4)
    );

    // 보스 웨이브 체크: 보스만 딱 1마리 스폰!
    if (CONFIG.WAVE.bossWaves.includes(this.wave)) {
      this._spawnBoss();
      this.game.showBossAlert();
    }
  }

  _spawnEnemy() {
    const { worldX, worldY } = this.game.player;
    const margin = 80;
    const side = Math.floor(Math.random() * 4);
    let ex, ey;
    const hw = this.game.canvas.width / 2 + margin;
    const hh = this.game.canvas.height / 2 + margin;

    switch (side) {
      case 0: ex = worldX + (Math.random() * 2 - 1) * hw; ey = worldY - hh; break;
      case 1: ex = worldX + hw;  ey = worldY + (Math.random() * 2 - 1) * hh; break;
      case 2: ex = worldX + (Math.random() * 2 - 1) * hw; ey = worldY + hh; break;
      default: ex = worldX - hw; ey = worldY + (Math.random() * 2 - 1) * hh; break;
    }

    const type = this._pickType();
    // 생성 시점의 웨이브(this.wave)를 5번째 인자로 넘깁니다.
    this.game.enemies.push(new Enemy(type, ex, ey, this._waveScale, this.wave));
  }

  _pickType() {
    const w = this.wave;
    const r = Math.random();
    if (w === 1) return 'solo_1';
    if (w === 2) return r < 0.6 ? 'solo_1' : 'solo_2';
    if (w === 3) return r < 0.4 ? 'solo_1' : r < 0.8 ? 'solo_2' : 'thief_1';
    if (w === 4) return r < 0.5 ? 'solo_2' : r < 0.8 ? 'thief_1' : 'aunt_1';
    if (w === 5) return r < 0.4 ? 'uncle_1' : r < 0.7 ? 'runner_1' : 'gossip_1';
    if (w === 6) return r < 0.3 ? 'relative_1' : r < 0.6 ? 'late_1' : 'flower_1';
    if (w === 7) return r < 0.4 ? 'guard_1' : r < 0.7 ? 'camera_1' : 'ex_1';
    if (w === 8) return r < 0.3 ? 'inviter_1' : r < 0.6 ? 'manager_1' : 'debt_1';
    if (w === 9) return r < 0.4 ? 'photog_1' : r < 0.7 ? 'wedding_dest' : 'solo_2';
    const elites = ['manager_1', 'debt_1', 'photog_1', 'wedding_dest', 'ex_1', 'guard_1'];
    return elites[Math.floor(Math.random() * elites.length)];
  }

  _spawnBoss() {
    const { worldX, worldY } = this.game.player;
    const ex = worldX + (this.game.canvas.width / 2 + 100) * (Math.random() > 0.5 ? 1 : -1);
    const ey = worldY;

    let bossType = 'priest_1'; // W10
    if (this.wave === 20) bossType = 'manager_1';
    else if (this.wave === 30) bossType = 'wedding_dest';
    else if (this.wave === 40) bossType = 'final_boss';

    this.game.enemies.push(new Enemy(bossType, ex, ey, this._waveScale, this.wave));
  }

  // 보스 처치 후 즉시 다음 웨이브로 넘기기 위한 함수
  startNextWave() {
    this._waveTimer = 0;
    this._nextWave();
  }

  dropXpOrb(enemy) {
    this.game.xpOrbs.push(new XpOrb(enemy.worldX, enemy.worldY, enemy.xp, enemy.gemColor));
  }
}
