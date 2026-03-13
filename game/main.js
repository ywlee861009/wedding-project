/**
 * 💍 Three.js Wedding Journey - Modularized ESM Version
 */
import { CONFIG } from './config.js';
import { 
    StationEntity, BuildingEntity, TreeEntity, 
    StreetLightEntity, CloudEntity 
} from './entities.js';

const statusDisplay = document.getElementById('status-log');

// --- 1. Scene SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.SCENE.BACKGROUND);
scene.fog = new THREE.Fog(CONFIG.SCENE.BACKGROUND, CONFIG.SCENE.FOG_NEAR, CONFIG.SCENE.FOG_FAR);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. LIGHTS ---
const ambient = new THREE.AmbientLight(CONFIG.LIGHTS.AMBIENT, 0.8);
scene.add(ambient);

const directional = new THREE.DirectionalLight(CONFIG.LIGHTS.DIRECTIONAL, 1.2);
directional.position.set(50, 100, 50);
directional.castShadow = true;
scene.add(directional);

const followLight = new THREE.PointLight(CONFIG.LIGHTS.FOLLOW_LIGHT, 5, 40);
scene.add(followLight);

// --- 3. OBJECTS ---
// 바닥 (길)
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 30), 
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 신랑 (Groom Entity - 향후 별도 클래스 분리 가능)
const groom = new THREE.Mesh(
    new THREE.BoxGeometry(CONFIG.PLAYER.SIZE, CONFIG.PLAYER.SIZE, CONFIG.PLAYER.SIZE),
    new THREE.MeshStandardMaterial({ color: CONFIG.PLAYER.COLOR, roughness: 0.2 })
);
groom.position.y = CONFIG.PLAYER.START_Y;
groom.castShadow = true;
scene.add(groom);

// 배치 로직
new StationEntity(0, 0).addTo(scene);

for (let i = 0; i < 40; i++) {
    new StreetLightEntity(i * 40, -16).addTo(scene);
    new StreetLightEntity(i * 40 + 20, 16).addTo(scene);
}
for (let i = 2; i < 150; i++) {
    if (i % 3 !== 0) { 
        new TreeEntity(i * 15, -18).addTo(scene); 
        new TreeEntity(i * 15, 18).addTo(scene); 
    }
}
for (let i = -10; i < 120; i++) {
    new BuildingEntity(i * 15 + Math.random() * 10, -35 - Math.random() * 10).addTo(scene);
    new BuildingEntity(i * 18 + Math.random() * 15, -60 - Math.random() * 20).addTo(scene);
}
for (let i = -10; i < 60; i++) {
    new CloudEntity(i * 40 + Math.random() * 30, 45 + Math.random() * 15, -60 - Math.random() * 60).addTo(scene);
}

// --- 4. LOGIC & PHYSICS ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// 모바일 감지 및 터치 컨트롤 설정
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);

if (isMobile) {
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) mobileControls.style.display = 'flex';

    const setupTouchBtn = (id, keyCode) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyCode] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyCode] = false; });
        btn.addEventListener('mousedown', (e) => { keys[keyCode] = true; }); // 마우스 클릭 테스트용
        btn.addEventListener('mouseup', (e) => { keys[keyCode] = false; });
    };

    setupTouchBtn('btn-up', 'KeyW');
    setupTouchBtn('btn-down', 'KeyS');
    setupTouchBtn('btn-left', 'KeyA');
    setupTouchBtn('btn-right', 'KeyD');
    setupTouchBtn('btn-jump', 'Space');
}

let velocityY = 0;
let lastTime = performance.now();
let frames = 0;
let fps = 0;

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    frames++;
    if (now >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (now - lastTime));
        lastTime = now;
        frames = 0;
        statusDisplay.innerText = `FPS: ${fps}`;
    }

    // 이동 로직
    const { MOVE_SPEED, GRAVITY, JUMP_POWER, ROAD_LIMIT } = CONFIG.PHYSICS;
    
    if (keys['KeyD'] || keys['ArrowRight']) groom.position.x += MOVE_SPEED;
    if (keys['KeyA'] || keys['ArrowLeft']) groom.position.x -= MOVE_SPEED;
    if (keys['KeyW'] || keys['ArrowUp']) groom.position.z -= MOVE_SPEED * 0.7;
    if (keys['KeyS'] || keys['ArrowDown']) groom.position.z += MOVE_SPEED * 0.7;

    groom.position.z = Math.max(-ROAD_LIMIT, Math.min(ROAD_LIMIT, groom.position.z));

    if (keys['Space'] && groom.position.y <= CONFIG.PLAYER.START_Y + 0.01) velocityY = JUMP_POWER;
    velocityY += GRAVITY;
    groom.position.y += velocityY;
    if (groom.position.y < CONFIG.PLAYER.START_Y) { 
        groom.position.y = CONFIG.PLAYER.START_Y; 
        velocityY = 0; 
    }

    followLight.position.set(groom.position.x, 8, groom.position.z);

    const zFollowOffset = groom.position.z * 0.3;
    camera.position.lerp(new THREE.Vector3(groom.position.x - 12, 8, 25 + zFollowOffset), 0.1);
    camera.lookAt(groom.position.x + 5, 1, zFollowOffset);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

statusDisplay.innerText = "🚀 모듈화 완료! 시스템 가동 중.";
animate();
