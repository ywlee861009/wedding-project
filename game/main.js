/**
 * 💍 Three.js Wedding Journey - Modularized ESM Version
 */
import { CONFIG } from './config.js';
import { 
    StationEntity, BuildingEntity, TreeEntity, 
    CloudEntity, PlayerEntity, PropEntity, InstancedStreetLightEntity, MemoryFragmentEntity
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
const entitiesToUpdate = [];
const collidableEntities = []; // 30년차 케로: 충돌 감지할 엔티티 목록

// 바닥 (길)
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(2000, 30), 
    new THREE.MeshStandardMaterial({ color: 0xf5f5f5 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 플레이어
const player = new PlayerEntity();
player.group.position.set(0, 0.6, 5); // 시작 위치를 약간 이동 (overlap 방지)
player.addTo(scene);
entitiesToUpdate.push(player);

// '기억의 조각'
const memoryFragment1 = new MemoryFragmentEntity(50, 0, 'first_date'); // 50으로 더 멀리 이동
memoryFragment1.addTo(scene);
entitiesToUpdate.push(memoryFragment1);
collidableEntities.push(memoryFragment1); 

// 배치 로직
const doksanStation = new StationEntity(0, -21);
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
        collidableEntities.push(prop); // 길 위 소품을 충돌 목록에 추가
    }
    if (Math.random() > 0.6) {
        const isBag = Math.random() > 0.5;
        const modelPath = isBag ? './assets/models/trash_bag.glb' : './assets/models/trash_can.glb';
        const prop = new PropEntity(lx2 + (Math.random() - 0.5) * 5, lz2 + (isBag ? -(Math.random() * 2 + 1) : -1), modelPath, isBag ? 2.4 : 3.6);
        prop.addTo(scene);
        collidableEntities.push(prop); // 길 위 소품을 충돌 목록에 추가
    }
}
streetlightManager.finalize();

for (let i = 2; i < 150; i++) { if (i % 3 !== 0) { new TreeEntity(i * 15, -18).addTo(scene); new TreeEntity(i * 15, 18).addTo(scene); } }
for (let i = -10; i < 120; i++) { new BuildingEntity(i * 15 + Math.random() * 10, -35 - Math.random() * 10).addTo(scene); new BuildingEntity(i * 18 + Math.random() * 15, -60 - Math.random() * 20).addTo(scene); }
for (let i = -10; i < 60; i++) { new CloudEntity(i * 40 + Math.random() * 30, 45 + Math.random() * 15, -60 - Math.random() * 60).addTo(scene); }

// --- 4. LOGIC & PHYSICS ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

let velocityY = 0;
let lastTime = performance.now();
let frames = 0;
let fps = 0;
const clock = new THREE.Clock(); 

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta(); 
    const now = performance.now();
    frames++;
    if (now >= lastTime + 1000) { fps = Math.round((frames * 1000) / (now - lastTime)); lastTime = now; frames = 0; statusDisplay.innerText = `FPS: ${fps}`; }

    // 30년차 케로의 팁: 물리 연산 전에 모든 엔티티의 상태(애니메이션, BoundingBox)를 먼저 업데이트한다.
    for (const entity of entitiesToUpdate) { entity.update(delta); }

    if (frames === 1) { // 첫 프레임에만 상태 출력
        console.log('Player BoundingBox:', player.boundingBox);
        console.log('Collidable count:', collidableEntities.length);
    }

    const { MOVE_SPEED, GRAVITY, JUMP_POWER, ROAD_LIMIT } = CONFIG.PHYSICS;
    let moveX = 0;
    let moveZ = 0;
    
    if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
    if (keys['KeyW'] || keys['ArrowUp']) moveZ -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ += 1;

    // --- 30년차 케로의 충돌 감지 로직 ---
    if (moveX !== 0 || moveZ !== 0) {
        const moveVector = new THREE.Vector3(moveX * MOVE_SPEED, 0, moveZ * (MOVE_SPEED * 0.7));
        const nextPos = player.group.position.clone().add(moveVector);
        
        // 1. 현재 위치와 다음 위치의 Bounding Box를 계산
        const playerCurrentBox = player.boundingBox;
        const playerNextBox = new THREE.Box3().copy(playerCurrentBox).translate(moveVector);
        let canMove = true;

        // 2. 모든 충돌 가능 오브젝트와 비교
        for (const collidable of collidableEntities) {
            if (!collidable.boundingBox.isEmpty() && !playerCurrentBox.isEmpty()) {
                // 만약 다음 위치에서 부딪힌다면
                if (playerNextBox.intersectsBox(collidable.boundingBox)) {
                    // 30년차 케로의 예외 처리: 만약 이미 겹쳐 있는 상태라면 (끼인 상태), 
                    // 다음 위치가 현재보다 겹치는 정도가 덜하다면 이동을 허용한다.
                    if (playerCurrentBox.intersectsBox(collidable.boundingBox)) {
                        // 이미 끼어있다면 이동을 허용하여 탈출할 수 있게 함
                        continue;
                    }
                    
                    if (canMove) { 
                        console.log('Blocking object found at:', collidable.boundingBox.min, collidable.boundingBox.max);
                    }
                    canMove = false;
                    break;
                }
            }
        }
        
        // 3. 충돌하지 않았을 때만 위치 업데이트
        if (canMove) {
            player.group.position.copy(nextPos);
            player.group.rotation.y = Math.atan2(moveX, moveZ);
            player.setState('walk');
        } else {
            player.setState('idle'); // 부딪혔으면 멈춤
        }
    } else {
        player.setState('idle');
    }

    player.group.position.z = Math.max(-ROAD_LIMIT, Math.min(ROAD_LIMIT, player.group.position.z));
    if (keys['Space'] && player.group.position.y <= CONFIG.PLAYER.START_Y + 0.01) velocityY = JUMP_POWER;
    velocityY += GRAVITY;
    player.group.position.y += velocityY;
    if (player.group.position.y < CONFIG.PLAYER.START_Y) { player.group.position.y = CONFIG.PLAYER.START_Y; velocityY = 0; }

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
