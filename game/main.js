import { CONFIG } from './config.js';
import { Player } from './entities/Player.js';
import { InputSystem } from './systems/InputSystem.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { LevelSystem } from './systems/LevelSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { HUD } from './ui/HUD.js';
import { AbilitySelect } from './ui/AbilitySelect.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.state = 'start'; // 'start' | 'playing' | 'levelup' | 'gameover'
    this.selectedChar = 'moonhee'; // 기본 캐릭터 문희로 설정
    this.elapsedTime = 0;
    this.killCount = 0;

    // 엔티티 풀
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.xpOrbs = [];

    // 카메라 (월드 오프셋)
    this.camera = { x: 0, y: 0 };

    // 시스템
    this.inputSystem = new InputSystem();
    this.spawnSystem = new SpawnSystem(this);
    this.combatSystem = new CombatSystem(this);
    this.levelSystem = new LevelSystem(this);
    this.renderSystem = new RenderSystem(this);
    this.hud = new HUD();
    this.abilitySelect = new AbilitySelect(this);

    this._resize();
    window.addEventListener('resize', () => this._resize());

    this._displayVersion();
    this._bindUI();

    this._lastTime = null;
    requestAnimationFrame((t) => this._loop(t));
  }

  _displayVersion() {
    const v = CONFIG.VERSION;
    const el = document.getElementById('version-display');
    if (el) el.textContent = `v${v.major}.${v.minor}.${v.patch}`;
  }

  _resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  _bindUI() {
    // 게임 시작
    document.getElementById('start-btn').addEventListener('click', () => {
      this._startGame();
    });

    // 재시작
    document.getElementById('restart-btn').addEventListener('click', () => {
      document.getElementById('game-over-screen').classList.add('hidden');
      document.getElementById('start-screen').style.display = 'flex';
      this.state = 'start';
    });
  }

  _startGame() {
    this.selectedChar = 'moonhee'; // 주인공 문희로 고정
    document.getElementById('start-screen').style.display = 'none';

    this.elapsedTime = 0;
    this.killCount = 0;
    this.enemies = [];
    this.projectiles = [];
    this.xpOrbs = [];
    this.camera = { x: 0, y: 0 };

    this.player = new Player(this.selectedChar, this.canvas.width / 2, this.canvas.height / 2);
    this.spawnSystem.reset();
    this.levelSystem.reset();
    this.hud.reset();

    this.state = 'playing';
  }

  _loop(timestamp) {
    if (this._lastTime === null) this._lastTime = timestamp;
    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.1);
    this._lastTime = timestamp;

    if (this.state === 'playing') {
      this._update(dt);
    }

    this.renderSystem.render(dt);
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    this.elapsedTime += dt;

    // 플레이어 이동
    const dir = this.inputSystem.getDirection();
    this.player.move(dir, dt, this.canvas.width, this.canvas.height);

    // 카메라
    this.camera.x = this.player.worldX - this.canvas.width / 2;
    this.camera.y = this.player.worldY - this.canvas.height / 2;

    // 자동 공격
    this.player.updateAttack(dt, this.enemies, this.projectiles);

    // HP 재생
    if (this.player.regen) {
      this.player.hp = Math.min(this.player.hp + this.player.regen * dt, this.player.maxHp);
    }

    // 투사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt);
      if (p.dead) this.projectiles.splice(i, 1);
    }

    // 적 스폰
    this.spawnSystem.update(dt);

    // 적 업데이트
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player);
      if (e.dead) {
        // 보스 격퇴 체크 (출생 웨이브 기준)
        if (e.pattern === 'boss') {
          this._handleBossDefeat(e.originWave);
        }
        this.enemies.splice(i, 1);
      }
    }

    // 전투 (충돌)
    this.combatSystem.update(dt);

    // XP 오브 업데이트
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      orb.update(dt, this.player);
      if (orb.collected) {
        this.levelSystem.addXP(orb.amount);
        this.xpOrbs.splice(i, 1);
      }
    }

    // HUD 갱신
    this.hud.update(this.player, this.elapsedTime, this.spawnSystem.wave, this.killCount);

    // 게임오버 체크
    if (this.player.hp <= 0) {
      this._gameOver();
    }
  }

  _handleBossDefeat(wave) {
    if (wave === 10) {
      this.player.addCompanion('youngwoo');
      this._showFloatingText("신랑 영우 구출 성공!! (합류)");
    } else if (wave === 20) {
      this.player.addCompanion('kero');
      this._showFloatingText("케로 구출 성공!! (합류)");
    } else if (wave === 30) {
      this.player.transformToWedding();
      this._showFloatingText("진정한 사랑의 힘!! (웨딩 진화)");
    } else if (wave === 40) {
      this._winGame();
    }
  }

  showBossAlert() {
    const el = document.createElement('div');
    el.className = 'boss-appear-alert';
    el.textContent = "WARNING: BOSS APPEAR!!";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  _showFloatingText(text) {
    const el = document.createElement('div');
    el.className = 'boss-reward-text';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  _winGame() {
    this.state = 'gameover';
    document.getElementById('result-title').textContent = "축하합니다! 결혼 성공!";
    const mm = String(Math.floor(this.elapsedTime / 60)).padStart(2, '0');
    const ss = String(Math.floor(this.elapsedTime % 60)).padStart(2, '0');
    document.getElementById('result-time').textContent = `${mm}:${ss}`;
    document.getElementById('result-kills').textContent = this.killCount;
    document.getElementById('result-level').textContent = this.levelSystem.level;
    document.getElementById('game-over-screen').classList.remove('hidden');
  }

  _gameOver() {
    this.state = 'gameover';
    document.getElementById('result-title').textContent = "게임 오버";
    const mm = String(Math.floor(this.elapsedTime / 60)).padStart(2, '0');
    const ss = String(Math.floor(this.elapsedTime % 60)).padStart(2, '0');
    document.getElementById('result-time').textContent = `${mm}:${ss}`;
    document.getElementById('result-kills').textContent = this.killCount;
    document.getElementById('result-level').textContent = this.levelSystem.level;
    document.getElementById('game-over-screen').classList.remove('hidden');
  }

  pauseForLevelUp() {
    this.state = 'levelup';
  }

  resumeFromLevelUp() {
    this.state = 'playing';
  }
}

// 게임 인스턴스 생성
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
