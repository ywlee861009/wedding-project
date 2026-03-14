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
scene.background = new THREE.Color(0x87ceeb); // 쨍한 하늘색 (Sky Blue)
scene.fog = new THREE.FogExp2(0x87ceeb, 0.005); // 부드러운 대기 안개

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Coastal World 스타일의 풍부한 색감
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// --- 1.1 POST-PROCESSING SETUP ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// ✨ 블룸 효과: 화사한 대낮 느낌을 위해 임계값 조정
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3, // 너무 과하지 않게 줄임
    0.4, 
    0.9  // 밝은 부분만 살짝 번지게
);
composer.addPass(bloomPass);

// --- 2. LIGHTS ---
const ambient = new THREE.AmbientLight(0xffffff, 1.2); // 대폭 밝게 (전체적인 화사함)
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 2.5); // 강한 태양광
directional.position.set(100, 200, 100);
directional.castShadow = true;
// 그림자 품질 향상 (30년차 케로의 노하우)
directional.shadow.mapSize.width = 2048;
directional.shadow.mapSize.height = 2048;
directional.shadow.camera.left = -100;
directional.shadow.camera.right = 100;
directional.shadow.camera.top = 100;
directional.shadow.camera.bottom = -100;
scene.add(directional);

const followLight = new THREE.PointLight(0xffffff, 20.0, 30); // 캐릭터 강조
scene.add(followLight);

// --- 3. OBJECTS ---
const entitiesToUpdate = [];
const collidableEntities = []; 
const islands = []; // 섬 목록 (낙하 체크용)

// 🌊 바다 (Sea Plane) - 더 투명하고 밝게
const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(5000, 5000), 
    new THREE.MeshStandardMaterial({ 
        color: 0x00aaff, 
        transparent: true, 
        opacity: 0.7,
        roughness: 0.05,
        metalness: 0.2
    })
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -10; // 섬보다 아래에 배치
scene.add(sea);

import { IslandEntity } from './entities.js';

// 첫 번째 섬 (시작점) - 크기 확대 및 초록색 적용
const startIsland = new IslandEntity(0, 0, 50, 0x7ba65d);
startIsland.addTo(scene);
islands.push(startIsland);

// 두 번째 섬 (기억의 조각 1) - 훨씬 크게 제작
const memoryIsland1 = new IslandEntity(180, 0, 80, 0x6b9452);
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
const memoryFragment1 = new MemoryFragmentEntity(180, 0, 'first_date');
memoryFragment1.addTo(scene);
entitiesToUpdate.push(memoryFragment1);
collidableEntities.push(memoryFragment1); 

// 배치 로직 (독산역 섬도 광활하게 변경)
const stationIsland = new IslandEntity(400, 0, 100, 0x5a8247);
stationIsland.addTo(scene);
islands.push(stationIsland);

const doksanStation = new StationEntity(400, -20);
doksanStation.addTo(scene);
collidableEntities.push(doksanStation);

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
    
    // 통합 입력 데이터 획득 (WASD + Click-to-Move 통합)
    const inputData = input.update();
    
    // --- Coastal World 스타일 카메라 기반 이동 로직 ---
    if (inputData.x !== 0 || inputData.z !== 0) {
        // 1. 카메라의 현재 수평 회전 각도(Y축 회전) 추출
        // 30년차 케로의 팁: 카메라의 Quaternion에서 직접 각도를 뽑아내는 것이 가장 정확합니다.
        const cameraRotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        const angle = cameraRotation.y;

        // 2. 입력 벡터를 카메라 각도에 맞춰 회전 (표준 회전 행렬 적용)
        // 화면 위쪽 클릭(z=-1) 시 카메라가 보는 정면으로 이동하게 함
        const rotatedX = inputData.x * Math.cos(angle) + inputData.z * Math.sin(angle);
        const rotatedZ = -inputData.x * Math.sin(angle) + inputData.z * Math.cos(angle);

        // 3. 플레이어 가속 적용
        player.applyInput(rotatedX, rotatedZ);

        // 4. 캐릭터 회전 (진행 방향으로 부드럽게)
        const targetRotation = Math.atan2(rotatedX, rotatedZ);
        
        // 회전 값이 튀지 않도록 lerpAngle 로직 적용 (360도 회전 방지)
        const currentRot = player.group.rotation.y;
        let diff = targetRotation - currentRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player.group.rotation.y = currentRot + diff * 0.15;

        player.setState('walk');
    } else {
        player.setState('idle');
    }

    // --- 관성 이동 및 충돌 판정 ---
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

    // --- 지면 감지 및 낙하 로직 ---
    let isOnGround = false;
    for (const island of islands) {
        const dist = Math.hypot(
            player.group.position.x - island.group.position.x, 
            player.group.position.z - island.group.position.z
        );
        if (dist < island.radius && player.group.position.y >= CONFIG.PLAYER.START_Y - 0.1) {
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

    // --- 시스템 매니저 업데이트 ---
    cameraManager.update(player.velocity); // 카메라에 플레이어 속도 전달 (Smart Follow)
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
