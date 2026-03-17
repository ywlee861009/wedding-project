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

    this.dead = false;
    this.facing = 1;

    // 피격 효과
    this.hitFlash = 0;

    // 보스 전용 특수 공격 타이머
    this.specialTimer = type === 'boss' ? 5 : Infinity;
  }

  update(dt, player) {
    if (this.dead) return;

    // 플레이어를 향해 이동
    const dx = player.worldX - this.worldX;
    const dy = player.worldY - this.worldY;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.worldX += nx * this.speed * dt;
      this.worldY += ny * this.speed * dt;
      this.facing = nx >= 0 ? 1 : -1;
    }

    if (this.hitFlash > 0) this.hitFlash -= dt;

    // 보스 특수 패턴: 가끔 돌진
    if (this.type === 'boss') {
      this.specialTimer -= dt;
      if (this.specialTimer <= 0) {
        this.specialTimer = 4 + Math.random() * 3;
        // 짧은 순간 빠르게 돌진
        this._dashTimer = 0.4;
        this._dashDx = dx / dist;
        this._dashDy = dy / dist;
      }
      if (this._dashTimer > 0) {
        this._dashTimer -= dt;
        this.worldX += this._dashDx * this.speed * 3 * dt;
        this.worldY += this._dashDy * this.speed * 3 * dt;
      }
    }
  }

  takeDamage(dmg) {
    this.hp -= dmg;
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
