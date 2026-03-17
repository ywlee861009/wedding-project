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

    // 이미지 로드
    this.image = new Image();
    this.image.src = `../design/char_${charType}.png`;

    // 케로 펫 (나중에 합류하도록 초기값 null)
    this.kero = null;

    // 무적 시간 (피격 후 잠깐 무적)
    this.invincibleTimer = 0;

    // 마지막 이동 방향 (렌더용)
    this.facing = 1; // 1=right, -1=left

    // 애니메이션 상태
    this.isMoving = false;
    this.animTime = 0;
  }

  move(dir, dt, canvasW, canvasH) {
    const len = Math.hypot(dir.x, dir.y);
    if (len > 0) {
      this.isMoving = true;
      this.animTime += dt * 15; // 애니메이션 속도 조절
      const nx = dir.x / len;
      const ny = dir.y / len;
      this.worldX += nx * this.speed * dt;
      this.worldY += ny * this.speed * dt;
      if (nx !== 0) this.facing = nx > 0 ? 1 : -1;
    } else {
      this.isMoving = false;
      // 멈췄을 때 서서히 애니메이션 초기화 (부드럽게)
      this.animTime = (this.animTime % (Math.PI * 2)) * 0.9;
    }

    // 케로 펫 위치 (합류했을 경우에만 업데이트)
    if (this.kero) {
      const keroTargetX = this.worldX + CONFIG.KERO.offsetX * this.facing;
      const keroTargetY = this.worldY + CONFIG.KERO.offsetY;
      this.kero.worldX += (keroTargetX - this.kero.worldX) * 8 * dt;
      this.kero.worldY += (keroTargetY - this.kero.worldY) * 8 * dt;
    }

    // 무적 타이머
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
  }

  updateAttack(dt, enemies, projectiles) {
    this._attackTimer -= dt;
    if (this._attackTimer > 0) return;

    // 가장 가까운 적 탐색
    const target = this._findNearest(enemies, this.attackRange);
    if (!target) return;

    this._attackTimer = this.attackInterval;
    this._fireAt(target, projectiles);
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
    this.invincibleTimer = 0.5;
    if (this.hp < 0) this.hp = 0;
  }
}

// 케로 펫 (간단한 내부 클래스)
class KeroPet {
  constructor() {
    this.worldX = 0;
    this.worldY = 0;
    this.size = CONFIG.KERO.size;
    this.attackDamage = CONFIG.KERO.attackDamage;
    this.attackRange = CONFIG.KERO.attackRange;
    this.attackInterval = CONFIG.KERO.attackInterval;
    this._attackTimer = 0;

    this.image = new Image();
    this.image.src = '../design/char_kero.png';
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
