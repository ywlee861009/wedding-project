/**
 * 💍 Wedding Journey 2.0 - High Fidelity Engine
 * Coastal World 스타일의 고성능/고퀄리티 시스템입니다.
 */
import { CONFIG } from './config.js';
import { 
    StationEntity, BuildingEntity, TreeEntity, 
    CloudEntity, PlayerEntity, PropEntity, InstancedStreetLightEntity, MemoryFragmentEntity
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
scene.background = new THREE.Color(0x1a1a2e); // 깊고 우아한 밤하늘 색
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008); // 좀 더 부드러운 안개

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ReinhardToneMapping; // 시네마틱 톤맵핑
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// --- 1.1 POST-PROCESSING SETUP ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// ✨ 블룸 효과: 밝은 부분에 은은한 광채를 줌
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5, // 강도
    0.4, // 반경
    0.85 // 임계값
);
composer.addPass(bloomPass);

// --- 2. LIGHTS ---
const ambient = new THREE.AmbientLight(0x666699, 0.8); // 보랏빛 은은한 조명
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffccaa, 1.2); // 따뜻한 황금빛 태양
directional.position.set(50, 100, 50);
directional.castShadow = true;
scene.add(directional);

const followLight = new THREE.PointLight(0xffaa44, 15.0, 50); // 캐릭터 주변 광채
scene.add(followLight);

// --- 3. OBJECTS ---
const entitiesToUpdate = [];
const collidableEntities = []; 
const islands = []; // 섬 목록 (낙하 체크용)

// 🌊 바다 (Sea Plane)
const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000), 
    new THREE.MeshStandardMaterial({ 
        color: 0x003366, 
        transparent: true, 
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.5
    })
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -10; // 섬보다 아래에 배치
scene.add(sea);

import { IslandEntity } from './entities.js';

// 첫 번째 섬 (시작점)
const startIsland = new IslandEntity(0, 0, 30, 0xfdfdfd);
startIsland.addTo(scene);
islands.push(startIsland);

// 두 번째 섬 (기억의 조각 1)
const memoryIsland1 = new IslandEntity(120, 0, 40, 0xfffafa);
memoryIsland1.addTo(scene);
islands.push(memoryIsland1);

// 플레이어
const player = new PlayerEntity();
player.group.position.set(0, 0.6, 0); // 섬 중앙에서 시작
player.addTo(scene);
entitiesToUpdate.push(player);

// 시스템 매니저 초기화
const input = new InputManager();
const cameraManager = new CameraManager(camera, player.group);

// '기억의 조각'
const memoryFragment1 = new MemoryFragmentEntity(120, 0, 'first_date');
memoryFragment1.addTo(scene);
entitiesToUpdate.push(memoryFragment1);
collidableEntities.push(memoryFragment1); 

// 배치 로직 (Legacy 지원 - 독산역을 세 번째 섬으로!)
const stationIsland = new IslandEntity(250, 0, 50, 0xf0f0f0);
stationIsland.addTo(scene);
islands.push(stationIsland);

const doksanStation = new StationEntity(250, -10);
doksanStation.addTo(scene);
collidableEntities.push(doksanStation);
const streetlightManager = new InstancedStreetLightEntity(scene);

for (let i = 0; i < 40; i++) {
    const lx1 = i * 40;
    const lz1 = -16;
    streetlightManager.addInstance(lx1, lz1);

    const lx2 = i * 40 + 20;
    const lz2 = 16;
    streetlightManager.addInstance(lx2, lz2);

    if (Math.random() > 0.5) {
        const isBag = Math.random() > 0.5;
        const modelPath = isBag ? './assets/models/trash_bag.glb' : './assets/models/trash_can.glb';
        const prop = new PropEntity(lx1 + (Math.random() - 0.5) * 5, lz1 + (isBag ? (Math.random() * 2 + 1) : 1), modelPath, isBag ? 2.4 : 3.6);
        prop.addTo(scene);
        collidableEntities.push(prop); 
    }
}
streetlightManager.finalize();

for (let i = 2; i < 150; i++) { if (i % 3 !== 0) { new TreeEntity(i * 15, -18).addTo(scene); new TreeEntity(i * 15, 18).addTo(scene); } }
for (let i = -10; i < 120; i++) { new BuildingEntity(i * 15 + Math.random() * 10, -35 - Math.random() * 10).addTo(scene); new BuildingEntity(i * 18 + Math.random() * 15, -60 - Math.random() * 20).addTo(scene); }
for (let i = -10; i < 60; i++) { new CloudEntity(i * 40 + Math.random() * 30, 45 + Math.random() * 15, -60 - Math.random() * 60).addTo(scene); }

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
    if (now >= lastTime + 1000) { fps = Math.round((frames * 1000) / (now - lastTime)); lastTime = now; frames = 0; statusDisplay.innerText = `FPS: ${fps}`; }

    // 모든 엔티티 상태 업데이트 (BoundingBox 포함)
    for (const entity of entitiesToUpdate) { entity.update(delta); }

    const { MOVE_SPEED, GRAVITY, JUMP_POWER, ROAD_LIMIT } = CONFIG.PHYSICS;
    
    // 통합 입력 데이터 획득
    const inputData = input.update();
    
    // 플레이어에게 입력 적용 (가속도 발생)
    player.applyInput(inputData.x, inputData.z);

    // --- 관성 기반 이동 및 충돌 감지 ---
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
            // 부드러운 회전 (Coastal World 스타일)
            const targetRotation = Math.atan2(player.velocity.x, player.velocity.z);
            player.group.rotation.y = THREE.MathUtils.lerp(player.group.rotation.y, targetRotation, 0.15);
            player.setState('walk');
        } else {
            player.velocity.set(0, 0, 0); // 충돌 시 속도 초기화
            player.setState('idle');
        }
    } else {
        player.setState('idle');
    }

    // --- 지면 감지 및 낙하 로직 (30년차 케로의 물리 시스템) ---
    let isOnGround = false;
    for (const island of islands) {
        const dist = Math.hypot(
            player.group.position.x - island.group.position.x, 
            player.group.position.z - island.group.position.z
        );
        // 섬의 반지름 안쪽이고, y축 높이가 지면 근처일 때
        if (dist < island.radius && player.group.position.y >= CONFIG.PLAYER.START_Y - 0.1) {
            isOnGround = true;
            break;
        }
    }

    // 점프 및 중력 처리
    if (inputData.jump && isOnGround && player.group.position.y <= CONFIG.PLAYER.START_Y + 0.01) {
        velocityY = JUMP_POWER;
    }
    
    velocityY += GRAVITY;
    player.group.position.y += velocityY;

    // 지면 착지 처리
    if (isOnGround && player.group.position.y < CONFIG.PLAYER.START_Y) {
        player.group.position.y = CONFIG.PLAYER.START_Y;
        velocityY = 0;
    }

    // 바다로 추락 시 리스폰 (무한 낙하 방지)
    if (player.group.position.y < -30) {
        player.group.position.set(0, 5, 0); // 시작 지점 상공으로 리스폰
        player.velocity.set(0, 0, 0);
        velocityY = 0;
    }

    // 매니저 업데이트
    cameraManager.update();
    followLight.position.set(player.group.position.x, 5, player.group.position.z);

    // ✨ 일반 렌더러 대신 컴포저를 사용하여 포스트 프로세싱 결과 출력
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
