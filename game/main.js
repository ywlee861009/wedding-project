/**
 * 💍 Wedding Journey 2.0 - High Fidelity Engine
 * Coastal World 스타일의 고성능/고퀄리티 시스템입니다.
 */
import { CONFIG } from './config.js';
import {
    StationEntity, BuildingEntity, TreeEntity, PalmTreeEntity,
    CloudEntity, PlayerEntity, PropEntity, InstancedStreetLightEntity,
    MemoryFragmentEntity, IslandEntity, BridgeEntity, FlowerEntity, BenchEntity
} from './entities.js';
import { InputManager } from './InputManager.js';
import { CameraManager } from './CameraManager.js';

// --- POST-PROCESSING ADDONS ---
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const statusDisplay = document.getElementById('status-log');

// --- 1. Scene SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.SCENE.BACKGROUND);
scene.fog = new THREE.FogExp2(CONFIG.SCENE.FOG_COLOR, CONFIG.SCENE.FOG_DENSITY);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
// 그림자 맵 크기: 기기 성능에 따라 4096 또는 2048
renderer.shadowMap.mapSize = renderer.capabilities.maxTextureSize >= 4096 ? 4096 : 2048;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// --- 1.1 POST-PROCESSING SETUP ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,
    0.4,
    0.9
);
composer.addPass(bloomPass);

// --- 2. LIGHTS ---
const ambient = new THREE.AmbientLight(CONFIG.LIGHTS.AMBIENT, CONFIG.LIGHTS.AMBIENT_INTENSITY);
scene.add(ambient);

const directional = new THREE.DirectionalLight(CONFIG.LIGHTS.DIRECTIONAL, CONFIG.LIGHTS.DIRECTIONAL_INTENSITY);
directional.position.set(150, 180, 80);
directional.castShadow = true;
const shadowMapSize = renderer.capabilities.maxTextureSize >= 4096 ? 4096 : 2048;
directional.shadow.mapSize.width = shadowMapSize;
directional.shadow.mapSize.height = shadowMapSize;
directional.shadow.camera.left = -150;
directional.shadow.camera.right = 150;
directional.shadow.camera.top = 150;
directional.shadow.camera.bottom = -150;
scene.add(directional);

const followLight = new THREE.PointLight(0xffffff, 20.0, 30);
scene.add(followLight);

// --- 3. OBJECTS ---
const entitiesToUpdate = [];
const collidableEntities = [];
const islands = []; // 낙하 체크용

// 🌊 바다
const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000, 64, 64),
    new THREE.MeshStandardMaterial({
        color: CONFIG.COLORS.SEA_SURFACE,
        transparent: true,
        opacity: 0.82,
        roughness: 0.05,
        metalness: 0.2
    })
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -10;
scene.add(sea);

// --- 5개 섬 배치 ---
const homeIsland = new IslandEntity(0, 0, 50, CONFIG.COLORS.ISLAND_HOME);
homeIsland.addTo(scene);
islands.push(homeIsland);

const meetingIsland = new IslandEntity(220, 60, 65, CONFIG.COLORS.ISLAND_MEETING);
meetingIsland.addTo(scene);
islands.push(meetingIsland);

const stationIsland = new IslandEntity(420, -40, 80, CONFIG.COLORS.ISLAND_STATION);
stationIsland.addTo(scene);
islands.push(stationIsland);

const proposalIsland = new IslandEntity(620, 80, 55, CONFIG.COLORS.ISLAND_PROPOSAL);
proposalIsland.addTo(scene);
islands.push(proposalIsland);

const weddingIsland = new IslandEntity(840, 0, 100, CONFIG.COLORS.ISLAND_WEDDING);
weddingIsland.addTo(scene);
islands.push(weddingIsland);

// --- 다리 4개 ---
function islandPos(island) {
    return new THREE.Vector3(
        island.group.position.x,
        0,
        island.group.position.z
    );
}

const bridge1 = new BridgeEntity(islandPos(homeIsland), islandPos(meetingIsland), homeIsland.sandRadius, meetingIsland.sandRadius);
bridge1.addTo(scene);
bridge1.getWalkableZones().forEach(zone => islands.push(zone));

const bridge2 = new BridgeEntity(islandPos(meetingIsland), islandPos(stationIsland), meetingIsland.sandRadius, stationIsland.sandRadius);
bridge2.addTo(scene);
bridge2.getWalkableZones().forEach(zone => islands.push(zone));

const bridge3 = new BridgeEntity(islandPos(stationIsland), islandPos(proposalIsland), stationIsland.sandRadius, proposalIsland.sandRadius);
bridge3.addTo(scene);
bridge3.getWalkableZones().forEach(zone => islands.push(zone));

const bridge4 = new BridgeEntity(islandPos(proposalIsland), islandPos(weddingIsland), proposalIsland.sandRadius, weddingIsland.sandRadius);
bridge4.addTo(scene);
bridge4.getWalkableZones().forEach(zone => islands.push(zone));

// --- 시작 섬 장식 ---
[[-15, -10], [10, -20], [-5, 20]].forEach(([dx, dz]) => {
    new TreeEntity(dx, dz, CONFIG.COLORS.TREE_LEAVES_LUSH).addTo(scene);
});
new PalmTreeEntity(20, 15, CONFIG.COLORS.TREE_LEAVES_LUSH).addTo(scene);
new BenchEntity(-10, 5, Math.PI / 4).addTo(scene);
new CloudEntity(0, 30, 0).addTo(scene);

// --- 첫 만남 섬 장식 ---
new PalmTreeEntity(215, 45, CONFIG.COLORS.TREE_LEAVES_WARM).addTo(scene);
new PalmTreeEntity(230, 75, CONFIG.COLORS.TREE_LEAVES_WARM).addTo(scene);
new BenchEntity(218, 62, 0).addTo(scene);
new FlowerEntity(212, 55, CONFIG.COLORS.FLOWER_PINK).addTo(scene);
new FlowerEntity(225, 68, CONFIG.COLORS.FLOWER_PINK).addTo(scene);

// --- 독산역 섬 장식 ---
const doksanStation = new StationEntity(420, -60);
doksanStation.addTo(scene);
collidableEntities.push(doksanStation);
new TreeEntity(400, -55, CONFIG.COLORS.TREE_LEAVES).addTo(scene);
new TreeEntity(440, -25, CONFIG.COLORS.TREE_LEAVES).addTo(scene);

// --- 프로포즈 섬 장식 ---
[[-10, 0], [5, 15], [15, -10]].forEach(([dx, dz]) => {
    new PalmTreeEntity(620 + dx, 80 + dz, CONFIG.COLORS.TREE_LEAVES_PINK).addTo(scene);
});
new BenchEntity(622, 82, Math.PI / 6).addTo(scene);
[[-8, -5], [8, -8], [-5, 10], [10, 5]].forEach(([dx, dz], i) => {
    const color = i % 2 === 0 ? CONFIG.COLORS.FLOWER_PINK : CONFIG.COLORS.FLOWER_WHITE;
    new FlowerEntity(620 + dx, 80 + dz, color).addTo(scene);
});

// --- 결혼식 섬 장식 ---
[[-20, -15], [20, -15], [-20, 15], [20, 15]].forEach(([dx, dz]) => {
    new PalmTreeEntity(840 + dx, dz, CONFIG.COLORS.TREE_LEAVES_GOLD).addTo(scene);
});
new BenchEntity(830, -5, 0).addTo(scene);
new BenchEntity(850, 5, Math.PI).addTo(scene);
[[-10, -10], [10, -10], [-10, 10], [10, 10]].forEach(([dx, dz], i) => {
    const color = i % 2 === 0 ? CONFIG.COLORS.FLOWER_GOLD : CONFIG.COLORS.FLOWER_WHITE;
    new FlowerEntity(840 + dx, dz, color).addTo(scene);
});

// 기억의 조각 (첫 만남 섬)
const memoryFragment1 = new MemoryFragmentEntity(220, 60, 'first_date');
memoryFragment1.addTo(scene);
entitiesToUpdate.push(memoryFragment1);
collidableEntities.push(memoryFragment1);

// 플레이어
const player = new PlayerEntity();
player.group.position.set(0, 0.6, 0);
player.addTo(scene);
entitiesToUpdate.push(player);

// 시스템 매니저 초기화
const input = new InputManager();
const cameraManager = new CameraManager(camera, player.group);

// --- 4. LOGIC & PHYSICS ---
let lastTime = performance.now();
let frames = 0;
let fps = 0;
let velocityY = 0;
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const now = performance.now();
    frames++;
    if (now >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (now - lastTime));
        lastTime = now;
        frames = 0;
        statusDisplay.innerText = `FPS: ${fps}`;
    }

    for (const entity of entitiesToUpdate) { entity.update(delta); }

    const { MOVE_SPEED, GRAVITY, JUMP_POWER } = CONFIG.PHYSICS;

    const inputData = input.update();

    if (inputData.x !== 0 || inputData.z !== 0) {
        const cameraRotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        const angle = cameraRotation.y;

        const rotatedX = inputData.x * Math.cos(angle) + inputData.z * Math.sin(angle);
        const rotatedZ = -inputData.x * Math.sin(angle) + inputData.z * Math.cos(angle);

        player.applyInput(rotatedX, rotatedZ);

        const targetRotation = Math.atan2(rotatedX, rotatedZ);
        const currentRot = player.group.rotation.y;
        let diff = targetRotation - currentRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player.group.rotation.y = currentRot + diff * 0.15;

        player.setState('walk');
    } else {
        player.setState('idle');
    }

    // 관성 이동 및 충돌 판정
    if (player.velocity.length() > 0.001) {
        const moveVector = player.velocity.clone();
        const nextPos = player.group.position.clone().add(moveVector);
        const playerCurrentBox = player.boundingBox;
        const playerNextBox = new THREE.Box3().copy(playerCurrentBox).translate(moveVector);
        let canMove = true;

        for (const collidable of collidableEntities) {
            if (!collidable.boundingBox.isEmpty() && !playerCurrentBox.isEmpty()) {
                if (playerNextBox.intersectsBox(collidable.boundingBox)) {
                    if (playerCurrentBox.intersectsBox(collidable.boundingBox)) continue;
                    canMove = false;
                    break;
                }
            }
        }

        if (canMove) {
            player.group.position.copy(nextPos);
        } else {
            player.velocity.set(0, 0, 0);
        }
    }

    // 지면 감지 및 낙하 로직
    let isOnGround = false;
    for (const island of islands) {
        const checkRadius = island.sandRadius || island.radius;
        const dist = Math.hypot(
            player.group.position.x - island.group.position.x,
            player.group.position.z - island.group.position.z
        );
        if (dist < checkRadius && player.group.position.y >= CONFIG.PLAYER.START_Y - 0.1) {
            isOnGround = true;
            break;
        }
    }

    if (inputData.jump && isOnGround && player.group.position.y <= CONFIG.PLAYER.START_Y + 0.01) {
        velocityY = JUMP_POWER;
    }

    velocityY += GRAVITY;
    player.group.position.y += velocityY;

    if (isOnGround && player.group.position.y < CONFIG.PLAYER.START_Y) {
        player.group.position.y = CONFIG.PLAYER.START_Y;
        velocityY = 0;
    }

    if (player.group.position.y < -30) {
        player.group.position.set(0, 5, 0);
        player.velocity.set(0, 0, 0);
        velocityY = 0;
    }

    // 바다 웨이브 애니메이션 (매 2프레임)
    if (frames % 2 === 0) {
        const seaPositions = sea.geometry.attributes.position;
        const time = clock.elapsedTime;
        for (let i = 0; i < seaPositions.count; i++) {
            const x = seaPositions.getX(i);
            const z = seaPositions.getZ(i);
            seaPositions.setY(i,
                Math.sin(x * 0.05 + time * 0.8) * 0.4 +
                Math.sin(z * 0.07 + time * 1.1) * 0.3
            );
        }
        seaPositions.needsUpdate = true;
        sea.geometry.computeVertexNormals();
    }

    // 방향광을 플레이어 추적 (넓은 월드에서도 그림자 유지)
    directional.position.set(
        player.group.position.x + 100,
        200,
        player.group.position.z + 100
    );
    directional.target.position.copy(player.group.position);
    directional.target.updateMatrixWorld();

    cameraManager.update(player.velocity);
    followLight.position.set(player.group.position.x, 5, player.group.position.z);

    composer.render();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});

statusDisplay.innerText = "🚀 Wedding V2 Engine: 가동 중";
animate();
