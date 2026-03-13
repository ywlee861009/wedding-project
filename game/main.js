/**
 * 💍 Three.js Wedding Journey - Modularized ESM Version
 */
import { CONFIG } from './config.js';
import { 
    StationEntity, BuildingEntity, TreeEntity, 
    StreetLightEntity, CloudEntity, PlayerEntity, PropEntity
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
const ambient = new THREE.AmbientLight(CONFIG.LIGHTS.AMBIENT, CONFIG.LIGHTS.AMBIENT_INTENSITY);
scene.add(ambient);

const directional = new THREE.DirectionalLight(CONFIG.LIGHTS.DIRECTIONAL, CONFIG.LIGHTS.DIRECTIONAL_INTENSITY);
directional.position.set(50, 100, 50);
directional.castShadow = true;
scene.add(directional);

const followLight = new THREE.PointLight(CONFIG.LIGHTS.FOLLOW_LIGHT, CONFIG.LIGHTS.FOLLOW_INTENSITY, 40);
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

// 플레이어 (신랑 캐릭터)
const player = new PlayerEntity();
player.addTo(scene);

// 배치 로직
new StationEntity(0, 0).addTo(scene);

for (let i = 0; i < 40; i++) {
    const lx1 = i * 40;
    const lz1 = -16;
    new StreetLightEntity(lx1, lz1).addTo(scene);

    const lx2 = i * 40 + 20;
    const lz2 = 16;
    new StreetLightEntity(lx2, lz2).addTo(scene);

    // 가로등 근처에 쓰레기통/봉투 배치 (50% 확률)
    if (Math.random() > 0.5) {
        const isBag = Math.random() > 0.5;
        const modelPath = isBag ? './assets/models/trash_bag.glb' : './assets/models/trash_can.glb';
        const offsetX = (Math.random() - 0.5) * 5;
        const offsetZ = isBag ? (Math.random() * 2 + 1) : 1; 
        // 크기를 3배로 키움 (봉투: 0.8->2.4, 쓰레기통: 1.2->3.6)
        new PropEntity(lx1 + offsetX, lz1 + offsetZ, modelPath, isBag ? 2.4 : 3.6).addTo(scene);
    }
    if (Math.random() > 0.6) {
        const isBag = Math.random() > 0.5;
        const modelPath = isBag ? './assets/models/trash_bag.glb' : './assets/models/trash_can.glb';
        const offsetX = (Math.random() - 0.5) * 5;
        const offsetZ = isBag ? -(Math.random() * 2 + 1) : -1;
        // 크기를 3배로 키움 (봉투: 0.8->2.4, 쓰레기통: 1.2->3.6)
        new PropEntity(lx2 + offsetX, lz2 + offsetZ, modelPath, isBag ? 2.4 : 3.6).addTo(scene);
    }
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

let velocityY = 0;
let lastTime = performance.now();
let frames = 0;
let fps = 0;
const clock = new THREE.Clock(); // 애니메이션용 클럭

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); // 프레임 간 시간 차이
    const now = performance.now();
    frames++;
    if (now >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (now - lastTime));
        lastTime = now;
        frames = 0;
        statusDisplay.innerText = `FPS: ${fps}`;
    }

    // 이동 로직 (개선된 회전 방식)
    const { MOVE_SPEED, GRAVITY, JUMP_POWER, ROAD_LIMIT } = CONFIG.PHYSICS;
    let moveX = 0;
    let moveZ = 0;
    
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (isMoving) {
        // 이동 및 회전 처리
        player.group.position.x += moveX * MOVE_SPEED;
        player.group.position.z += moveZ * (MOVE_SPEED * 0.7);
        
        // 이동 방향으로 부드럽게 회전 (Math.atan2 사용)
        // Three.js 모델은 기본적으로 +Z를 보므로 이에 맞춰 보정 (+Math.PI)
        const targetRotation = Math.atan2(moveX, moveZ);
        player.group.rotation.y = targetRotation;

        player.setState('walk');
    } else {
        player.setState('idle');
    }

    player.group.position.z = Math.max(-ROAD_LIMIT, Math.min(ROAD_LIMIT, player.group.position.z));

    if (keys['Space'] && player.group.position.y <= CONFIG.PLAYER.START_Y + 0.01) velocityY = JUMP_POWER;
    velocityY += GRAVITY;
    player.group.position.y += velocityY;
    if (player.group.position.y < CONFIG.PLAYER.START_Y) { 
        player.group.position.y = CONFIG.PLAYER.START_Y; 
        velocityY = 0; 
    }

    // 애니메이션 업데이트
    player.update(delta);

    // 캐릭터를 따라다니는 포인트 라이트 (캐릭터 위쪽에서 비춤)
    followLight.position.set(player.group.position.x, 5, player.group.position.z);

    const zFollowOffset = player.group.position.z * 0.3;
    camera.position.lerp(new THREE.Vector3(player.group.position.x - 12, 8, 25 + zFollowOffset), 0.1);
    camera.lookAt(player.group.position.x + 5, 1, zFollowOffset);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

statusDisplay.innerText = "🚀 3D 모델 엔진 준비 완료! 에셋을 넣어주세요.";
animate();
