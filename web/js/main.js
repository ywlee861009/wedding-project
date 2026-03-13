/**
 * 🏁 MAIN.js (Debug Mode)
 */
import { Engine } from './engine.js';
import { Player, World } from './entities.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.engine = new Engine();
        this.player = new Player();
        this.world = new World(this.engine);
        this.ui = new UI();
    }

    async start() {
        await this.engine.init('game-container');

        this.world.createPlatforms();
        this.world.createDecorations();
        this.engine.layers.main.addChild(this.player.sprite);

        // 🔍 디버깅 로그: 초기 상태 확인
        console.log("=== DEBUG START ===");
        console.log("Window Height:", window.innerHeight);
        console.log("Canvas Height:", this.engine.app.renderer.height);
        console.log("Player Y:", this.player.sprite.y);
        console.log("Ground Y:", this.player.groundY);
        console.log("====================");

        setTimeout(() => {
            this.ui.showUI();
        }, 1000);

        this.engine.app.ticker.add(() => {
            this.player.update(this.engine.keys);
            this.engine.updateCamera(this.player.sprite.x);
            this.ui.updateDate(this.player.sprite.x);

            // 🔍 실시간 로그 (필요시 주석 해제하여 사용)
            // if (Math.abs(this.player.vy) > 0) {
            //     console.log("Player Moving Y:", Math.floor(this.player.sprite.y));
            // }
        });
    }
}

const game = new Game();
game.start();
