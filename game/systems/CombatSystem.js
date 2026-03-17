export class CombatSystem {
  constructor(game) {
    this.game = game;
  }

  update(dt) {
    const { player, enemies, projectiles, spawnSystem } = this.game;

    // 투사체 vs 적
    for (const proj of projectiles) {
      if (proj.dead) continue;
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (proj.hitEnemies.has(enemy)) continue;

        if (this._circles(proj.worldX, proj.worldY, proj.size,
                          enemy.worldX, enemy.worldY, enemy.size)) {
          const dmg = proj.damage || 10; // 만약 undefined면 기본값 10이라도 적용
          enemy.takeDamage(dmg);
          proj.onHit(enemy);

          if (enemy.dead) {
            this.game.killCount++;
            spawnSystem.dropXpOrb(enemy);
          }
        }
      }
    }

    // 적 vs 플레이어 (근접 충돌)
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (this._circles(enemy.worldX, enemy.worldY, enemy.size,
                        player.worldX, player.worldY, player.size)) {
        // 초당 데미지가 아니라, 닿는 순간 적의 데미지를 통째로 입힘 (무적 시간이 있으므로 안전)
        player.takeDamage(enemy.damage); 
      }
    }
  }

  _circles(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const minDist = ar + br;
    return (dx * dx + dy * dy) < (minDist * minDist);
  }
}
