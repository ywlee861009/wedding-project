import { CONFIG } from '../config.js';

export class Projectile {
  constructor(worldX, worldY, dx, dy, damage, pierce, owner) {
    this.worldX = worldX;
    this.worldY = worldY;
    this.dx = dx; // 방향 벡터 (단위)
    this.dy = dy;
    this.damage = damage;
    this.pierce = pierce;   // 관통 횟수 남은 것
    this.owner = owner;     // 'player'
    this.dead = false;

    this.speed = CONFIG.PROJECTILE.speed;
    this.size = CONFIG.PROJECTILE.size;
    this.lifetime = CONFIG.PROJECTILE.lifetime;
    this._age = 0;

    // 이미 맞춘 적 목록 (관통 중복 방지)
    this.hitEnemies = new Set();
  }

  update(dt) {
    this.worldX += this.dx * this.speed * dt;
    this.worldY += this.dy * this.speed * dt;
    this._age += dt;
    if (this._age >= this.lifetime) {
      this.dead = true;
    }
  }

  onHit(enemy) {
    this.hitEnemies.add(enemy);
    if (this.pierce <= 0) {
      this.dead = true;
    } else {
      this.pierce--;
    }
  }
}
