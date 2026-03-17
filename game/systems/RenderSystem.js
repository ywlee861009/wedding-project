import { CONFIG } from '../config.js';

export class RenderSystem {
  constructor(game) {
    this.game = game;
    // 배경 타일 패턴 색상
    this._bgColors = ['#d4d4d4', '#c8c8c8'];
  }

  render(dt) {
    const { ctx, canvas, camera, player, enemies, projectiles, xpOrbs, state } = this.game;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === 'start' || state === 'gameover') {
      // HTML 화면이 담당
      this._drawBackground(ctx, canvas, camera);
      return;
    }

    this._drawBackground(ctx, canvas, camera);
    this._drawXpOrbs(ctx, xpOrbs, camera);
    this._drawProjectiles(ctx, projectiles, camera);
    this._drawEnemies(ctx, enemies, camera);
    this._drawPlayer(ctx, player, camera);
  }

  _drawBackground(ctx, canvas, camera) {
    const tileSize = CONFIG.WORLD.TILE_SIZE;
    const offsetX = ((-camera.x % tileSize) + tileSize) % tileSize;
    const offsetY = ((-camera.y % tileSize) + tileSize) % tileSize;

    const cols = Math.ceil(canvas.width / tileSize) + 2;
    const rows = Math.ceil(canvas.height / tileSize) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const wx = col * tileSize + offsetX;
        const wy = row * tileSize + offsetY;

        // 월드 좌표로 색 결정 (체커보드)
        const worldCol = Math.floor((wx + camera.x) / tileSize);
        const worldRow = Math.floor((wy + camera.y) / tileSize);
        const colorIdx = (worldCol + worldRow) % 2;
        ctx.fillStyle = this._bgColors[colorIdx];
        ctx.fillRect(wx, wy, tileSize, tileSize);
      }
    }
  }

  _drawXpOrbs(ctx, orbs, camera) {
    ctx.save();
    for (const orb of orbs) {
      const sx = orb.worldX - camera.x;
      const sy = orb.worldY - camera.y;
      // 화면 밖이면 스킵
      if (sx < -20 || sx > this.game.canvas.width + 20 ||
          sy < -20 || sy > this.game.canvas.height + 20) continue;

      ctx.beginPath();
      ctx.arc(sx, sy, orb.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#3498db';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx - orb.size * 0.15, sy - orb.size * 0.15, orb.size * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
    }
    ctx.restore();
  }

  _drawProjectiles(ctx, projectiles, camera) {
    ctx.save();
    for (const p of projectiles) {
      if (p.dead) continue;
      const sx = p.worldX - camera.x;
      const sy = p.worldY - camera.y;
      if (sx < -20 || sx > this.game.canvas.width + 20 ||
          sy < -20 || sy > this.game.canvas.height + 20) continue;

      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#f1c40f';
      ctx.fill();
      // 빛나는 효과
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(241,196,15,0.2)';
      ctx.fill();
    }
    ctx.restore();
  }

  _drawEnemies(ctx, enemies, camera) {
    ctx.save();
    for (const e of enemies) {
      if (e.dead) continue;
      const sx = e.worldX - camera.x;
      const sy = e.worldY - camera.y;
      const cw = this.game.canvas.width;
      const ch = this.game.canvas.height;
      if (sx < -60 || sx > cw + 60 || sy < -60 || sy > ch + 60) continue;

      const isBoss = e.type === 'boss';
      const fillColor = e.hitFlash > 0 ? '#fff' : e.color;

      // 본체
      ctx.beginPath();
      ctx.arc(sx, sy, e.size, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      if (isBoss) {
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // HP 바 (보스는 항상, 일반 적은 피격 후 잠시)
      if (isBoss || e.hitFlash > 0 || e.hp < e.maxHp) {
        const barW = e.size * 2;
        const barH = 4;
        const barX = sx - e.size;
        const barY = sy - e.size - 8;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = isBoss ? '#e74c3c' : '#2ecc71';
        ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH);
      }
    }
    ctx.restore();
  }

  _drawPlayer(ctx, player, camera) {
    if (!player) return;
    const sx = player.worldX - camera.x;
    const sy = player.worldY - camera.y;

    // 무적 중이면 깜빡임
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(sx, sy);
    if (player.facing < 0) ctx.scale(-1, 1);

    if (player.image.complete && player.image.naturalWidth > 0) {
      const s = player.size * 2;
      ctx.drawImage(player.image, -s / 2, -s / 2, s, s);
    } else {
      // 폴백: 원
      ctx.beginPath();
      ctx.arc(0, 0, player.size, 0, Math.PI * 2);
      ctx.fillStyle = '#2ecc71';
      ctx.fill();
    }
    ctx.restore();

    // 케로 펫
    this._drawKero(ctx, player.kero, camera);

    // 공격 범위 시각화 (디버그용, 필요 시 주석 해제)
    // ctx.beginPath();
    // ctx.arc(sx, sy, player.attackRange, 0, Math.PI*2);
    // ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    // ctx.stroke();
  }

  _drawKero(ctx, kero, camera) {
    if (!kero) return;
    const sx = kero.worldX - camera.x;
    const sy = kero.worldY - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    if (kero.image.complete && kero.image.naturalWidth > 0) {
      const s = kero.size * 2;
      ctx.drawImage(kero.image, -s / 2, -s / 2, s, s);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, kero.size, 0, Math.PI * 2);
      ctx.fillStyle = '#27ae60';
      ctx.fill();
    }
    ctx.restore();
  }
}
