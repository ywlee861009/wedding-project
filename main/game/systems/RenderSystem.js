import { CONFIG } from '../config.js';

export class RenderSystem {
  constructor(game) {
    this.game = game;
    this._createBackgroundPattern();
  }

  // 고급스러운 대리석 예식장 바닥 패턴 생성
  _createBackgroundPattern() {
    const size = 128; // 타일 크기
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 1. 기본 대리석 색상 (연한 아이보리/화이트)
    ctx.fillStyle = '#fdfcf0';
    ctx.fillRect(0, 0, size, size);

    // 2. 미세한 대리석 질감 (노이즈)
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const alpha = Math.random() * 0.05;
      ctx.fillStyle = `rgba(200, 180, 150, ${alpha})`;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }

    // 3. 타일 줄눈 (금색/베이지색 라인)
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)'; // 은은한 금색
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    // 4. 모서리 포인트 (고급스러운 느낌)
    ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
    const dotSize = 4;
    ctx.fillRect(0, 0, dotSize, dotSize);
    ctx.fillRect(size - dotSize, 0, dotSize, dotSize);
    ctx.fillRect(0, size - dotSize, dotSize, dotSize);
    ctx.fillRect(size - dotSize, size - dotSize, dotSize, dotSize);

    this._bgPattern = this.game.ctx.createPattern(canvas, 'repeat');
  }

  render(dt) {
    const { ctx, canvas, camera, player, enemies, projectiles, xpOrbs, state } = this.game;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === 'start' || state === 'gameover') {
      // 배경만 그리기
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
    ctx.save();
    // 카메라 좌표만큼 패턴 오프셋 적용 (음수 방향)
    // 패턴 채우기는 월드 좌표계를 따라가도록 translate 사용
    ctx.translate(-camera.x, -camera.y);
    ctx.fillStyle = this._bgPattern;
    // 화면 전체를 덮도록 월드 좌표 범위 지정
    ctx.fillRect(camera.x, camera.y, canvas.width, canvas.height);
    ctx.restore();
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

    // 플레이어 머리 위 체력바 (데미지/회복 시 1초간 표시)
    if (player.hpTimer > 0) {
      const barW = player.size * 2.5;
      const barH = 6;
      const barX = sx - barW / 2;
      const barY = sy - player.size * 2 - 15;
      
      ctx.save();
      ctx.globalAlpha = 0.8;
      // 배경
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      // 체력 (빨간색)
      const hpPercent = Math.max(0, player.hp / player.maxHp);
      ctx.fillStyle = '#ff3860';
      ctx.fillRect(barX, barY, barW * hpPercent, barH);
      ctx.restore();
    }

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
