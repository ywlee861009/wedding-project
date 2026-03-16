/**
 * 💍 Wedding Journey — 1/200 서울 맵
 */
import { CONFIG } from './config.js';
import {
    StationEntity, TreeEntity, PalmTreeEntity,
    CloudEntity, PlayerEntity, AnimatedPropEntity, FlyingBirdEntity,
    SeoulTerrain, FlowerEntity, BenchEntity
} from './entities.js';
import { InputManager } from './InputManager.js';
import { CameraManager } from './CameraManager.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const statusDisplay = document.getElementById('status-log');

// ── 1. SCENE ───────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.SCENE.BACKGROUND);
scene.fog = new THREE.FogExp2(CONFIG.SCENE.FOG_COLOR, CONFIG.SCENE.FOG_DENSITY);

// ── 2. RENDERER / CAMERA ──────────────────────────────
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 800);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // FPS 보호
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// ── 3. POST-PROCESSING ────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.4, 0.9
);
composer.addPass(bloomPass);

// ── 4. LIGHTS ─────────────────────────────────────────
const ambient = new THREE.AmbientLight(CONFIG.LIGHTS.AMBIENT, CONFIG.LIGHTS.AMBIENT_INTENSITY);
scene.add(ambient);

const directional = new THREE.DirectionalLight(CONFIG.LIGHTS.DIRECTIONAL, CONFIG.LIGHTS.DIRECTIONAL_INTENSITY);
directional.position.set(100, 180, 80);
directional.castShadow = true;
directional.shadow.mapSize.width  = 2048;
directional.shadow.mapSize.height = 2048;
directional.shadow.camera.left   = -150;
directional.shadow.camera.right  =  150;
directional.shadow.camera.top    =  150;
directional.shadow.camera.bottom = -150;
scene.add(directional);

const followLight = new THREE.PointLight(0xffffff, 20.0, 30);
scene.add(followLight);

// ── 5. SEOUL TERRAIN ──────────────────────────────────
const seoulMap = new SeoulTerrain();
seoulMap.addTo(scene);

// ── 6. 랜드마크 & 장식 ────────────────────────────────

// 남산타워 (남산 정상 위)
const nmH = seoulMap.getHeightAt(14, 2);
const towerMat  = new THREE.MeshStandardMaterial({ color: 0xddddcc });
const needleMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 4, 8), towerMat);
const towerNeedle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 3, 8), needleMat);
towerBase.position.set(14, nmH + 2, 2);
towerNeedle.position.set(14, nmH + 5.5, 2);
towerBase.castShadow = true;
scene.add(towerBase);
scene.add(towerNeedle);

// 63빌딩 (여의도)
const b63 = new THREE.Mesh(
    new THREE.BoxGeometry(2, 8, 2),
    new THREE.MeshStandardMaterial({ color: 0xd4a820, metalness: 0.6, roughness: 0.2 })
);
b63.position.set(-30, 4.5, 24);
b63.castShadow = true;
scene.add(b63);

// 남산 주변 나무들
for (const [tx, tz] of [[11,-4],[17,4],[10,6],[18,0],[14,-6]]) {
    const th = seoulMap.getHeightAt(tx, tz);
    const t  = new TreeEntity(tx, tz, CONFIG.COLORS.TREE_LEAVES_LUSH);
    t.group.position.y = th;
    t.addTo(scene);
}

// 북한산 나무들
for (const [tx, tz] of [[-14,-60],[-10,-64],[-16,-65],[-8,-58]]) {
    const th = seoulMap.getHeightAt(tx, tz);
    const t  = new TreeEntity(tx, tz, CONFIG.COLORS.TREE_LEAVES_LUSH);
    t.group.position.y = th;
    t.addTo(scene);
}

// 구름
new CloudEntity(-30, 45, -55).addTo(scene);
new CloudEntity( 40, 40,  60).addTo(scene);
new CloudEntity(-65, 42,  20).addTo(scene);
new CloudEntity( 70, 38, -40).addTo(scene);

// ── 7. 독산역 (SW 서울) ───────────────────────────────
const stH = seoulMap.getHeightAt(-55, 52);
const doksanStation = new StationEntity(-55, 52);
doksanStation.group.position.y = stH;
doksanStation.addTo(scene);

// ── 8. 캐릭터 배치 ────────────────────────────────────
const entitiesToUpdate = [];

// 신부 — 광화문 근처 (중심가)
const brideH = seoulMap.getHeightAt(5, -8);
const bride = new AnimatedPropEntity(5, -8, './assets/models/bride.glb', 1.5);
bride.group.position.y = brideH;
bride.group.rotation.y = Math.PI;
bride.addTo(scene);
entitiesToUpdate.push(bride);

// NPC — 독산역 앞
const npcH = seoulMap.getHeightAt(-50, 50);
const npc1 = new AnimatedPropEntity(-50, 50, './assets/models/npc.glb', 1.5);
npc1.group.position.y = npcH;
npc1.group.rotation.y = -Math.PI * 0.5;
npc1.addTo(scene);
entitiesToUpdate.push(npc1);

// 오리들 (한강변)
for (const [dx, dz] of [[-20,18],[5,30],[40,20],[60,28]]) {
    const dkH = seoulMap.getHeightAt(dx, dz);
    const dk  = new AnimatedPropEntity(dx, dz, './assets/models/duck.glb', 0.8);
    dk.group.position.y = dkH;
    dk.addTo(scene);
    entitiesToUpdate.push(dk);
}

// ── 9. 새들 (하늘 비행) ───────────────────────────────

// 한강 위 플라밍고 2마리
const flamingo1 = new FlyingBirdEntity(-15, 24, './assets/models/flamingo.glb',
    { orbitRadius: 18, height: 14, speed:  0.3, scale: 0.02 });
flamingo1.addTo(scene); entitiesToUpdate.push(flamingo1);

const flamingo2 = new FlyingBirdEntity( 35, 24, './assets/models/flamingo.glb',
    { orbitRadius: 22, height: 18, speed: -0.25, scale: 0.02, startAngle: Math.PI });
flamingo2.addTo(scene); entitiesToUpdate.push(flamingo2);

// 남산 위 앵무새
const parrot1 = new FlyingBirdEntity(14, 2, './assets/models/parrot.glb',
    { orbitRadius: 16, height: nmH + 12, speed: 0.45, scale: 0.018 });
parrot1.addTo(scene); entitiesToUpdate.push(parrot1);

// 북한산 위 플라밍고
const flamingo3 = new FlyingBirdEntity(-12, -62, './assets/models/flamingo.glb',
    { orbitRadius: 22, height: 28, speed: 0.35, scale: 0.02, startAngle: Math.PI * 0.5 });
flamingo3.addTo(scene); entitiesToUpdate.push(flamingo3);

// 관악산 위 앵무새
const parrot2 = new FlyingBirdEntity(8, 65, './assets/models/parrot.glb',
    { orbitRadius: 20, height: 24, speed: -0.4, scale: 0.018, startAngle: Math.PI });
parrot2.addTo(scene); entitiesToUpdate.push(parrot2);

// ── 10. 플레이어 ──────────────────────────────────────
// 시작 위치: 경복궁 근처 (광화문 북쪽)
const startX = -5, startZ = -35;
const startH = seoulMap.getHeightAt(startX, startZ);
const player = new PlayerEntity();
player.group.position.set(startX, startH + CONFIG.PLAYER.START_Y, startZ);
player.addTo(scene);
entitiesToUpdate.push(player);

const input = new InputManager();
const cameraManager = new CameraManager(camera, player.group);

// ── 11. PHYSICS CONSTANTS ─────────────────────────────
const BOUND_X = 100; // 서울 타원형 경계 반축
const BOUND_Z = 80;

let lastTime  = performance.now();
let frames    = 0;
let fps       = 0;
let velocityY = 0;
const clock   = new THREE.Clock();

// ── 12. ANIMATE LOOP ──────────────────────────────────
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const now   = performance.now();
    frames++;
    if (now >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (now - lastTime));
        lastTime = now; frames = 0;
        statusDisplay.innerText = `FPS: ${fps}`;
    }

    // 엔티티 업데이트
    for (const e of entitiesToUpdate) e.update(delta);

    const { GRAVITY, JUMP_POWER } = CONFIG.PHYSICS;
    const inputData = input.update();

    // 입력 → 이동
    if (inputData.x !== 0 || inputData.z !== 0) {
        const cameraRot = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        const angle     = cameraRot.y;
        const rotX = inputData.x * Math.cos(angle) + inputData.z * Math.sin(angle);
        const rotZ = -inputData.x * Math.sin(angle) + inputData.z * Math.cos(angle);
        player.applyInput(rotX, rotZ);

        const targetRot = Math.atan2(rotX, rotZ);
        const curRot    = player.group.rotation.y;
        let diff = targetRot - curRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        player.group.rotation.y = curRot + diff * 0.15;
        player.setState('walk');
    } else {
        player.setState('idle');
    }

    // 수평 이동 + 서울 경계 체크
    if (player.velocity.length() > 0.001) {
        const next = player.group.position.clone().add(player.velocity);
        const bx   = next.x / (BOUND_X + 1);
        const bz   = next.z / (BOUND_Z + 1);
        if (bx * bx + bz * bz < 1) {
            player.group.position.x = next.x;
            player.group.position.z = next.z;
        } else {
            // 경계 충돌 → 속도 제거
            player.velocity.set(0, 0, 0);
        }
    }

    // 지형 높이 추적 + 중력
    const px = player.group.position.x;
    const pz = player.group.position.z;
    const terrainH = seoulMap.getHeightAt(px, pz);
    const groundY  = terrainH + CONFIG.PLAYER.START_Y;

    const isOnGround = player.group.position.y <= groundY + 0.05;

    if (inputData.jump && isOnGround) {
        velocityY = JUMP_POWER;
    }

    velocityY += GRAVITY;
    player.group.position.y += velocityY;

    if (player.group.position.y <= groundY) {
        player.group.position.y = groundY;
        velocityY = 0;
    }

    // 방향광 플레이어 추적 (그림자 품질 유지)
    directional.position.set(px + 100, 200, pz + 100);
    directional.target.position.copy(player.group.position);
    directional.target.updateMatrixWorld();

    followLight.position.set(px, player.group.position.y + 5, pz);
    cameraManager.update(player.velocity);

    composer.render();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});

statusDisplay.innerText = '🗺️ Seoul Map 1/200 : 가동 중';
animate();
