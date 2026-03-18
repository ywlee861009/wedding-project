import { CONFIG } from '../config.js';
import { Projectile } from './Projectile.js';

export class Player {
  constructor(charType, screenX, screenY) {
    const base = CONFIG.PLAYER[charType];

    // 월드 좌표
    this.worldX = 0;
    this.worldY = 0;

    this.charType = charType;
    this.size = base.size;

    // 스탯
    this.maxHp = base.hp;
    this.hp = base.hp;
    this.speed = base.speed;
    this.attackDamage = base.attackDamage;
    this.attackRange = base.attackRange;
    this.attackInterval = base.attackInterval;
    this.projectileCount = 1;
    this.pierce = 0;
    this.regen = 0;
    this.xpMagnetBonus = 0;

    // 공격 쿨다운
    this._attackTimer = 0;

    this.image = new Image();
    this.image.src = `../design/${base.asset}`;

    // 동료 시스템 (영우, 케로 등)
    this.companions = [];

    // 무적 시간 (피격 후 잠깐 무적)
    this.invincibleTimer = 0;
    this.facing = 1;

    // 애니메이션 상태
    this.isMoving = false;
    this.animTime = 0;
  }

  addCompanion(type) {
    // 중복 추가 방지
    if (this.companions.find(c => c.type === type)) return;
    
    let companion;
    if (type === 'youngwoo') {
      companion = new Companion('youngwoo', CONFIG.PLAYER.youngwoo);
    } else if (type === 'kero') {
      companion = new Companion('kero', CONFIG.KERO);
    }
    
    if (companion) {
      companion.worldX = this.worldX;
      companion.worldY = this.worldY;
      this.companions.push(companion);
    }
  }

  transformToWedding() {
    // 플레이어(문희) 변신
    const base = CONFIG.PLAYER[this.charType];
    this.image.src = `../design/${base.weddingAsset}`;
    
    // 동료(영우) 변신
    const youngwoo = this.companions.find(c => c.type === 'youngwoo');
    if (youngwoo) {
      youngwoo.image.src = `../design/${CONFIG.PLAYER.youngwoo.weddingAsset}`;
    }
  }

  move(dir, dt, canvasW, canvasH) {
    const len = Math.hypot(dir.x, dir.y);
    if (len > 0) {
      this.isMoving = true;
      this.animTime += dt * 15;
      const nx = dir.x / len;
      const ny = dir.y / len;
      this.worldX += nx * this.speed * dt;
      this.worldY += ny * this.speed * dt;
      if (nx !== 0) this.facing = nx > 0 ? 1 : -1;
    } else {
      this.isMoving = false;
      this.animTime = (this.animTime % (Math.PI * 2)) * 0.9;
    }

    // 동료들 위치 업데이트 (부드럽게 따라오기)
    this.companions.forEach((c, idx) => {
      // 각 동료마다 다른 오프셋 부여
      const offsetDir = (idx % 2 === 0) ? -1 : 1;
      const targetX = this.worldX + (40 + idx * 20) * -this.facing;
      const targetY = this.worldY + (20 + idx * 10) * offsetDir;
      
      c.worldX += (targetX - c.worldX) * 5 * dt;
      c.worldY += (targetY - c.worldY) * 5 * dt;
    });

    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
  }

  updateAttack(dt, enemies, projectiles) {
    this._attackTimer -= dt;
    
    // 플레이어 본체 공격
    if (this._attackTimer <= 0) {
      const target = this._findNearest(enemies, this.attackRange);
      if (target) {
        this._attackTimer = this.attackInterval;
        this._fireAt(target, projectiles);
      }
    }

    // 동료들 공격
    this.companions.forEach(c => c.updateAttack(dt, enemies, projectiles));
  }

  _findNearest(enemies, range) {
    let best = null;
    let bestDist = range * range;
    for (const e of enemies) {
      const dx = e.worldX - this.worldX;
      const dy = e.worldY - this.worldY;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        best = e;
      }
    }
    return best;
  }

  _fireAt(target, projectiles) {
    const angle = Math.atan2(target.worldY - this.worldY, target.worldX - this.worldX);
    const spread = (Math.PI / 12); // 15도 간격
    const count = this.projectileCount;
    const offset = ((count - 1) / 2) * spread;

    for (let i = 0; i < count; i++) {
      const a = angle + (i * spread) - offset;
      projectiles.push(new Projectile(
        this.worldX, this.worldY,
        Math.cos(a), Math.sin(a),
        this.attackDamage,
        this.pierce,
        'player'
      ));
    }
  }

  takeDamage(dmg) {
    if (this.invincibleTimer > 0) return;
    this.hp -= dmg;
    this.invincibleTimer = 0.25; // 0.5초에서 0.25초로 단축 (타이트한 생존)
    if (this.hp < 0) this.hp = 0;
  }
}

// 동료 클래스 (영우, 케로 공용)
class Companion {
  constructor(type, config) {
    this.type = type;
    this.worldX = 0;
    this.worldY = 0;
    this.size = config.size;
    this.attackDamage = config.attackDamage;
    this.attackRange = config.attackRange;
    this.attackInterval = config.attackInterval;
    this._attackTimer = 0;

    this.image = new Image();
    this.image.src = `../design/${config.asset}`;
  }

  updateAttack(dt, enemies, projectiles) {
    this._attackTimer -= dt;
    if (this._attackTimer > 0) return;

    const target = this._findNearest(enemies);
    if (!target) return;

    this._attackTimer = this.attackInterval;
    const angle = Math.atan2(target.worldY - this.worldY, target.worldX - this.worldX);
    projectiles.push(new Projectile(
      this.worldX, this.worldY,
      Math.cos(angle), Math.sin(angle),
      this.attackDamage,
      0,
      'player'
    ));
  }

  _findNearest(enemies) {
    let best = null;
    let bestDist = this.attackRange * this.attackRange;
    for (const e of enemies) {
      const dx = e.worldX - this.worldX;
      const dy = e.worldY - this.worldY;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        best = e;
      }
    }
    return best;
  }
}
