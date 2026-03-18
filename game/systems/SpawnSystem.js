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
      
      // 한 번에 나오는 마리 수 조절 (난이도 하향)
      const count = Math.floor(1 + this.wave * 0.5); 
      for (let i = 0; i < count; i++) {
        this._spawnEnemy();
      }
    }
  }

  _nextWave() {
    this.wave++;
    
    // 40웨이브 종료 체크
    if (this.wave > CONFIG.WAVE.totalWaves) {
      // 마지막 보스까지 잡아야 하므로 일단 웨이브만 멈춤
      return;
    }

    this._waveScale = 1 + (this.wave - 1) * 0.25;
    this._spawnInterval = Math.max(
      CONFIG.WAVE.spawnIntervalMin,
      CONFIG.WAVE.spawnIntervalBase / (1 + (this.wave - 1) * 0.3)
    );

    // 보스 웨이브 체크
    if (CONFIG.WAVE.bossWaves.includes(this.wave)) {
      this._spawnBoss();
      this.game.showBossAlert();
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
    
    // 웨이브별 적 조합 (20종류 분산)
    if (w === 1) return 'solo_1';
    if (w === 2) return r < 0.6 ? 'solo_1' : 'solo_2';
    if (w === 3) return r < 0.4 ? 'solo_1' : r < 0.8 ? 'solo_2' : 'thief_1';
    if (w === 4) return r < 0.5 ? 'solo_2' : r < 0.8 ? 'thief_1' : 'aunt_1';
    if (w === 5) return r < 0.4 ? 'uncle_1' : r < 0.7 ? 'runner_1' : 'gossip_1';
    if (w === 6) return r < 0.3 ? 'relative_1' : r < 0.6 ? 'late_1' : 'flower_1';
    if (w === 7) return r < 0.4 ? 'guard_1' : r < 0.7 ? 'camera_1' : 'ex_1';
    if (w === 8) return r < 0.3 ? 'inviter_1' : r < 0.6 ? 'manager_1' : 'debt_1';
    if (w === 9) return r < 0.4 ? 'photog_1' : r < 0.7 ? 'wedding_dest' : 'solo_2';
    
    // 10웨이브 이후엔 무작위 엘리트 조합
    const elites = ['manager_1', 'debt_1', 'photog_1', 'wedding_dest', 'ex_1', 'guard_1'];
    return elites[Math.floor(Math.random() * elites.length)];
  }

  _spawnBoss() {
    const { worldX, worldY } = this.game.player;
    const ex = worldX + (this.game.canvas.width / 2 + 100) * (Math.random() > 0.5 ? 1 : -1);
    const ey = worldY;

    let bossType = 'priest_1';
    if (this.wave >= 15) bossType = 'final_boss';
    else if (this.wave >= 10) bossType = 'wedding_dest';

    this.game.enemies.push(new Enemy(bossType, ex, ey, this._waveScale));
  }

  // 적이 죽을 때 XP 오브 드롭 (외부에서 호출)
  dropXpOrb(enemy) {
    this.game.xpOrbs.push(new XpOrb(enemy.worldX, enemy.worldY, enemy.xp, enemy.gemColor));
  }
}
