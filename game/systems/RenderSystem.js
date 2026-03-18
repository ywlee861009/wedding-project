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

      const r = orb.size / 2;
      
      // 메인 구체
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      ctx.fill();

      // 빛나는 효과 (Glow)
      ctx.beginPath();
      ctx.arc(sx, sy, r * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = orb.color + '33'; // 20% 투명도
      ctx.fill();

      // 하이라이트 (반짝임)
      ctx.beginPath();
      ctx.arc(sx - r * 0.3, sy - r * 0.3, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
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
      ctx.fillStyle = '#000000'; // 검정색 투사체
      ctx.fill();
      // 빛나는 효과 (검정색이므로 그림자 느낌으로 변경)
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
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

      const isBoss = e.pattern === 'boss';
      const fillColor = e.hitFlash > 0 ? '#fff' : e.color;

      // 콩콩 뛰는 애니메이션 (Brotato 스타일)
      const t = e.animTime || 0;
      const jumpY = -Math.abs(Math.sin(t)) * 4;
      const squashX = 1 + Math.sin(t * 2) * 0.08;
      const squashY = 1 / squashX;

      ctx.save();
      ctx.translate(sx, sy + jumpY);
      ctx.scale(e.facing * squashX, squashY);

      if (e.image.complete && e.image.naturalWidth > 0) {
        const s = e.size * 2;
        // 피격 시 하얗게 반짝이는 효과 (필터 사용)
        if (e.hitFlash > 0) {
          ctx.filter = 'brightness(3)'; // 피격 시 강한 밝기
        }
        ctx.drawImage(e.image, -s / 2, -s, s, s);
      } else {
        // 폴백: 원
        ctx.beginPath();
        ctx.arc(0, -e.size, e.size, 0, Math.PI * 2);
        ctx.fillStyle = e.hitFlash > 0 ? '#fff' : (e.color || '#e74c3c');
        ctx.fill();
      }
      
      if (isBoss) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

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

    // 애니메이션 계산 (Brotato 스타일)
    let wobble = 0;
    let squashX = 1;
    let squashY = 1;
    let jumpY = 0;

    if (player.isMoving || player.animTime > 0.1) {
      const t = player.animTime;
      wobble = Math.sin(t) * 0.05; // 0.15 -> 0.05 (미세한 흔들림)
      jumpY = -Math.abs(Math.sin(t)) * 2; // 5 -> 2 (살짝만 뜀)
      squashX = 1 + Math.sin(t * 2) * 0.03; // 0.1 -> 0.03 (부드러운 변형)
      squashY = 1 / squashX;
    }

    ctx.save();
    ctx.translate(sx, sy + jumpY);
    ctx.rotate(wobble);
    ctx.scale(player.facing * squashX, squashY);

    if (player.image.complete && player.image.naturalWidth > 0) {
      const s = player.size * 2;
      // 발끝(Pivot)을 기준으로 회전/스케일이 적용되도록 y축 오프셋 조정
      ctx.drawImage(player.image, -s / 2, -s, s, s);
    } else {
      // 폴백: 원
      ctx.beginPath();
      ctx.arc(0, -player.size, player.size, 0, Math.PI * 2);
      ctx.fillStyle = '#2ecc71';
      ctx.fill();
    }
    ctx.restore();

    // 동료들 그리기 (영우, 케로 등)
    player.companions.forEach((c, idx) => {
      this._drawCompanion(ctx, c, camera, player.animTime + idx * 0.5);
    });

    // 공격 범위 시각화 (디버그용, 필요 시 주석 해제)
    // ctx.beginPath();
    // ctx.arc(sx, sy, player.attackRange, 0, Math.PI*2);
    // ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    // ctx.stroke();
  }

  _drawCompanion(ctx, comp, camera, animTime) {
    if (!comp) return;
    const sx = comp.worldX - camera.x;
    const sy = comp.worldY - camera.y;

    const jumpY = Math.sin(animTime * 0.8) * 3;

    ctx.save();
    ctx.translate(sx, sy + jumpY);
    if (comp.image.complete && comp.image.naturalWidth > 0) {
      const s = comp.size * 2;
      ctx.drawImage(comp.image, -s / 2, -s, s, s);
    } else {
      ctx.beginPath();
      ctx.arc(0, -comp.size, comp.size, 0, Math.PI * 2);
      ctx.fillStyle = '#27ae60';
      ctx.fill();
    }
    ctx.restore();
  }
}
