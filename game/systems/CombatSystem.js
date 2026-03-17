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
          enemy.takeDamage(proj.damage);
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
        player.takeDamage(enemy.damage * dt * 2); // 초당 데미지 * 접촉 계수
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
