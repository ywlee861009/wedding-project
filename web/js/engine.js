/**
 * 🛠️ ENGINE.js (High Visibility Version)
 */
import { CONFIG } from './config.js';

export class Engine {
    constructor() {
        this.app = null;
        this.layers = {};
        this.cameraX = 0;
        this.keys = {};
    }

    async init(containerId) {
        this.app = new PIXI.Application();
        await this.app.init({
            resizeTo: window,
            backgroundColor: CONFIG.COLORS.BG_NIGHT,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
        });
        document.getElementById(containerId).appendChild(this.app.canvas);

        this.createLayers();
        this.setupInput();
        
        this.app.ticker.add(this.update.bind(this));
    }

    createLayers() {
        const layerNames = ['sky', 'bgFar', 'bgMid', 'main', 'fgNear', 'overlay'];
        layerNames.forEach(name => {
            this.layers[name] = new PIXI.Container();
            this.app.stage.addChild(this.layers[name]);
        });
    }

    setupInput() {
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    }

    updateCamera(playerX) {
        // 주인공을 화면 정가운데 오도록 오프셋 수정
        const targetX = playerX - window.innerWidth / 2;
        this.cameraX += (targetX - this.cameraX) * 0.1;

        this.layers.sky.x = -this.cameraX * CONFIG.LAYERS.SKY;
        this.layers.bgFar.x = -this.cameraX * CONFIG.LAYERS.FAR;
        this.layers.bgMid.x = -this.cameraX * CONFIG.LAYERS.MID;
        this.layers.main.x = -this.cameraX * CONFIG.LAYERS.MAIN;
        this.layers.fgNear.x = -this.cameraX * CONFIG.LAYERS.NEAR;
    }

    update() {
        // 카메라 흔들림 최소화
    }
}
