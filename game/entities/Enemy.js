import { CONFIG } from '../config.js';

export class Enemy {
  constructor(type, worldX, worldY, waveScale = 1) {
    const base = CONFIG.ENEMY[type];

    this.type = type;
    this.worldX = worldX;
    this.worldY = worldY;

    this.maxHp = Math.floor(base.hp * waveScale);
    this.hp = this.maxHp;
    this.speed = base.speed * (1 + (waveScale - 1) * 0.2); // 속도는 완만하게 증가
    this.damage = Math.floor(base.damage * waveScale);
    this.xp = base.xp;
    this.size = base.size;
    this.color = base.color;
    this.pattern = base.pattern || 'basic';

    this.dead = false;
    this.facing = 1;
    this.animTime = Math.random() * Math.PI * 2; // 각자 다른 타이밍으로 시작

    // 패턴용 타이머
    this.stateTimer = 0;
    this.state = 'idle'; // charge 패턴용: idle -> ready -> dash
    
    // 피격 효과
    this.hitFlash = 0;
  }

  update(dt, player) {
    if (this.dead) return;
    this.animTime += dt * 10;

    const dx = player.worldX - this.worldX;
    const dy = player.worldY - this.worldY;
    const dist = Math.hypot(dx, dy);

    // 패턴별 AI 로직
    switch (this.pattern) {
      case 'charge':
        this._updateChargePattern(dt, dx, dy, dist);
        break;
      case 'ranged':
        this._updateRangedPattern(dt, dx, dy, dist);
        break;
      case 'boss':
        this._updateBossPattern(dt, dx, dy, dist);
        break;
      default: // 'basic', 'area'
        this._moveTowards(dx, dy, dist, this.speed, dt);
        break;
    }

    if (this.hitFlash > 0) this.hitFlash -= dt;
  }

  _moveTowards(dx, dy, dist, speed, dt) {
    if (dist > 1) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.worldX += nx * speed * dt;
      this.worldY += ny * speed * dt;
      this.facing = nx >= 0 ? 1 : -1;
    }
  }

  _updateChargePattern(dt, dx, dy, dist) {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      if (this.state === 'idle') {
        this.state = 'ready';
        this.stateTimer = 0.8; // 0.8초간 준비 (부들부들)
      } else if (this.state === 'ready') {
        this.state = 'dash';
        this.stateTimer = 0.4; // 0.4초간 돌진
        const invDist = 1 / (dist || 1);
        this.dashDirX = dx * invDist;
        this.dashDirY = dy * invDist;
      } else {
        this.state = 'idle';
        this.stateTimer = 1.5 + Math.random(); // 1.5~2.5초 대기
      }
    }

    if (this.state === 'dash') {
      this.worldX += this.dashDirX * this.speed * 3.5 * dt;
      this.worldY += this.dashDirY * this.speed * 3.5 * dt;
      this.facing = this.dashDirX >= 0 ? 1 : -1;
    } else if (this.state === 'idle') {
      this._moveTowards(dx, dy, dist, this.speed * 0.5, dt);
    }
    // 'ready' 상태에서는 멈춤
  }

  _updateRangedPattern(dt, dx, dy, dist) {
    const targetDist = 180;
    if (dist > targetDist + 20) {
      this._moveTowards(dx, dy, dist, this.speed, dt);
    } else if (dist < targetDist - 20) {
      this._moveTowards(-dx, -dy, dist, this.speed, dt); // 뒤로 도망
    } else {
      // 거리 유지하며 횡이동 (Kero's Pro Tip)
      const nx = -dy / dist;
      const ny = dx / dist;
      this.worldX += nx * this.speed * 0.6 * dt;
      this.worldY += ny * this.speed * 0.6 * dt;
      this.facing = dx >= 0 ? 1 : -1;
    }
  }

  _updateBossPattern(dt, dx, dy, dist) {
    // 보스는 기본 추적 + 주기적 돌진
    this._moveTowards(dx, dy, dist, this.speed, dt);
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.stateTimer = 5 + Math.random() * 3;
      this._dashRemaining = 0.6;
      const invDist = 1 / (dist || 1);
      this.dashDirX = dx * invDist;
      this.dashDirY = dy * invDist;
    }
    if (this._dashRemaining > 0) {
      this._dashRemaining -= dt;
      this.worldX += this.dashDirX * this.speed * 4 * dt;
      this.worldY += this.dashDirY * this.speed * 4 * dt;
    }
  }

  takeDamage(dmg) {
    const validDmg = Number(dmg) || 0;
    this.hp -= validDmg;
    this.hitFlash = 0.12;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
  }

  // XP 오브 생성용 데이터 반환
  getDropData() {
    return {
      x: this.worldX,
      y: this.worldY,
      amount: this.xp,
    };
  }
}

// XP 오브
export class XpOrb {
  constructor(worldX, worldY, amount) {
    this.worldX = worldX;
    this.worldY = worldY;
    this.amount = amount;
    this.collected = false;
    this.size = CONFIG.XP_ORB.size;
  }

  update(dt, player) {
    const dx = player.worldX - this.worldX;
    const dy = player.worldY - this.worldY;
    const dist = Math.hypot(dx, dy);

    const magnetRadius = CONFIG.XP_ORB.magnetRadius * (1 + (player.xpMagnetBonus || 0));
    const pickupRadius = CONFIG.XP_ORB.pickupRadius;

    if (dist < pickupRadius) {
      this.collected = true;
      return;
    }

    if (dist < magnetRadius) {
      const speed = CONFIG.XP_ORB.speed;
      this.worldX += (dx / dist) * speed * dt;
      this.worldY += (dy / dist) * speed * dt;
    }
  }
}
