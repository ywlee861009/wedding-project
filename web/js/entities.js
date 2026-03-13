/**
 * 👫 ENTITIES.js (Fixed Height & Position)
 */
import { CONFIG } from './config.js';

export class Player {
    constructor() {
        this.sprite = new PIXI.Graphics()
            .rect(-25, -110, 50, 110)
            .fill({ color: CONFIG.COLORS.PLAYER, alpha: 0.9 });
        
        this.sprite.x = 400;
        // 바닥 위로 초기 위치 설정 (화면 하단에서 150px 위)
        this.groundY = window.innerHeight - 150;
        this.sprite.y = this.groundY;
        
        this.vx = 0;
        this.vy = 0;
        this.isJumping = false;
    }

    update(keys) {
        // 1. 좌우 이동
        if (keys['ArrowRight'] || keys['KeyD']) this.vx += 1.2;
        if (keys['ArrowLeft'] || keys['KeyA']) this.vx -= 1.2;
        this.vx *= CONFIG.PHYSICS.FRICTION;

        // 2. 점프 (중력 영향 강화)
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && !this.isJumping) {
            this.vy = CONFIG.PHYSICS.JUMP_FORCE;
            this.isJumping = true;
        }

        this.vy += CONFIG.PHYSICS.GRAVITY;

        // 3. 위치 업데이트
        this.sprite.x += this.vx;
        this.sprite.y += this.vy;

        // 4. 바닥 충돌 (Ground Collision)
        if (this.sprite.y >= this.groundY) {
            this.sprite.y = this.groundY;
            this.vy = 0;
            this.isJumping = false;
        }

        this.sprite.rotation = this.vx * 0.02;
    }
}

export class World {
    constructor(engine) {
        this.engine = engine;
        this.platforms = [];
    }

    createPlatforms() {
        const groundHeight = 500;
        const groundY = window.innerHeight - 150;

        // 실제 눈에 보이는 바닥 (주인공 발밑에 딱 붙음)
        const mainGround = new PIXI.Graphics()
            .rect(0, 0, 100000, groundHeight)
            .fill({ color: CONFIG.COLORS.GROUND });
        mainGround.y = groundY;
        this.engine.layers.main.addChild(mainGround);

        // 점프용 발판 위치 조정 (화면 중앙 근처)
        for (let i = 0; i < 20; i++) {
            const plat = new PIXI.Graphics()
                .rect(0, 0, 300, 20)
                .fill({ color: 0x1a1a20 });
            plat.x = 1200 + i * 1500;
            plat.y = groundY - 250; // 바닥 위 250px 지점
            this.engine.layers.main.addChild(plat);
        }
    }

    createDecorations() {
        const groundY = window.innerHeight - 150;
        for (let i = 0; i < 40; i++) {
            this.createLamp(i * 1200 + 600, groundY);
        }
    }

    createLamp(x, groundY) {
        const lamp = new PIXI.Container();
        const pole = new PIXI.Graphics().rect(0, 0, 4, 300).fill({ color: 0x111115 });
        const light = new PIXI.Graphics();
        for(let i=0; i<6; i++) {
            light.circle(2, 0, 40 + i*40).fill({ color: CONFIG.COLORS.LIGHT, alpha: 0.12 - i*0.02 });
        }
        lamp.addChild(pole, light);
        lamp.x = x;
        lamp.y = groundY - 300;
        this.engine.layers.bgMid.addChild(lamp);
    }
}
