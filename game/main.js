/**
 * 💍 Wedding Journey — 1/200 서울 맵 (3x 스케일)
 */
import { CONFIG } from './config.js';
import {
    StationEntity, TreeEntity,
    CloudEntity, PlayerEntity, AnimatedPropEntity, FlyingBirdEntity,
    SeoulTerrain, FlowerEntity, BenchEntity, ExclamationMarker
} from './entities.js';
import { InputManager } from './InputManager.js';
import { CameraManager } from './CameraManager.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const statusDisplay = document.getElementById('status-log');

// ── 1. SCENE ──────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.SCENE.BACKGROUND);
scene.fog = new THREE.FogExp2(CONFIG.SCENE.FOG_COLOR, CONFIG.SCENE.FOG_DENSITY);

// ── 2. RENDERER / CAMERA ──────────────────────────────
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2400);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

// HemisphereLight — 하늘(파랑)↔땅(황토) 양방향으로 부드러운 입체감
const hemi = new THREE.HemisphereLight(0x87ceeb, 0xc8a86a, 0.9);
scene.add(hemi);

const directional = new THREE.DirectionalLight(CONFIG.LIGHTS.DIRECTIONAL, CONFIG.LIGHTS.DIRECTIONAL_INTENSITY);
directional.position.set(200, 300, 150);
directional.castShadow = true;
directional.shadow.mapSize.width  = 2048;
directional.shadow.mapSize.height = 2048;
directional.shadow.camera.left   = -300;
directional.shadow.camera.right  =  300;
directional.shadow.camera.top    =  300;
directional.shadow.camera.bottom = -300;
scene.add(directional);

const followLight = new THREE.PointLight(0xffffff, 20.0, 30);
scene.add(followLight);

// ── 5. SEOUL TERRAIN ──────────────────────────────────
const seoulMap = new SeoulTerrain();
seoulMap.addTo(scene);

// ── 5-1. 외곽 바다 ────────────────────────────────────
const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(6000, 6000),
    new THREE.MeshStandardMaterial({
        color: CONFIG.COLORS.SEA_SURFACE,
        transparent: true, opacity: 0.85,
        roughness: 0.05, metalness: 0.15
    })
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -0.8;
scene.add(sea);

// ── 5-2. 서울 경계 숲 벨트 (InstancedMesh) ───────────
(function buildForestBelt() {
    const TREE_COUNT = 630;
    const trunkGeo  = new THREE.CylinderGeometry(0.25, 0.35, 2.2, 6);
    const leavesGeo = new THREE.ConeGeometry(2.2, 3.5, 6);
    const trunkMat  = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_TRUNK });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2a6e2a });

    const iTrunks = new THREE.InstancedMesh(trunkGeo,  trunkMat,  TREE_COUNT);
    const iLeaves = new THREE.InstancedMesh(leavesGeo, leavesMat, TREE_COUNT);
    iTrunks.castShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;
    const STEPS = 200;

    for (let i = 0; i < STEPS && idx < TREE_COUNT; i++) {
        const angle = (i / STEPS) * Math.PI * 2;
        for (const rf of [0.84, 0.88, 0.92]) {
            if (idx >= TREE_COUNT) break;
            const fx = Math.cos(angle) * 300 * rf + (Math.random() - 0.5) * 8;
            const fz = Math.sin(angle) * 240 * rf + (Math.random() - 0.5) * 8;
            if (!seoulMap.isInSeoul(fx, fz)) continue;
            const fh = seoulMap.getHeightAt(fx, fz);

            dummy.position.set(fx, fh + 1.1, fz);
            dummy.scale.setScalar(0.8 + Math.random() * 0.5);
            dummy.updateMatrix();
            iTrunks.setMatrixAt(idx, dummy.matrix);

            dummy.position.set(fx, fh + 3.6, fz);
            dummy.updateMatrix();
            iLeaves.setMatrixAt(idx, dummy.matrix);
            idx++;
        }
    }

    iTrunks.count = idx;
    iLeaves.count = idx;
    iTrunks.instanceMatrix.needsUpdate = true;
    iLeaves.instanceMatrix.needsUpdate = true;
    scene.add(iTrunks);
    scene.add(iLeaves);
}());

// ── 6. 랜드마크 ───────────────────────────────────────

// 남산타워 (42, 6)
const nmH = seoulMap.getHeightAt(42, 6);
const towerBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xddddcc })
);
const towerNeedle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.3, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
);
towerBase.position.set(42, nmH + 2, 6);
towerNeedle.position.set(42, nmH + 5.5, 6);
towerBase.castShadow = true;
scene.add(towerBase);
scene.add(towerNeedle);

// 63빌딩 (여의도)
const b63 = new THREE.Mesh(
    new THREE.BoxGeometry(4, 10, 4),
    new THREE.MeshStandardMaterial({ color: 0xd4a820, metalness: 0.6, roughness: 0.2 })
);
b63.position.set(-90, 5.5, 72);
b63.castShadow = true;
scene.add(b63);

// 남산 주변 나무
for (const [tx, tz] of [[33,-12],[51,12],[30,18],[54,0],[42,-18]]) {
    const th = seoulMap.getHeightAt(tx, tz);
    const t  = new TreeEntity(tx, tz, CONFIG.COLORS.TREE_LEAVES_LUSH);
    t.group.position.y = th;
    t.addTo(scene);
}

// 북한산 나무
for (const [tx, tz] of [[-42,-180],[-30,-192],[-48,-195],[-24,-174]]) {
    const th = seoulMap.getHeightAt(tx, tz);
    const t  = new TreeEntity(tx, tz, CONFIG.COLORS.TREE_LEAVES_LUSH);
    t.group.position.y = th;
    t.addTo(scene);
}

// 구름
new CloudEntity( -90, 45, -165).addTo(scene);
new CloudEntity( 120, 40,  180).addTo(scene);
new CloudEntity(-195, 42,   60).addTo(scene);
new CloudEntity( 210, 38, -120).addTo(scene);

// ── 7. 독산역 ─────────────────────────────────────────
const stH = seoulMap.getHeightAt(-165, 156);
const doksanStation = new StationEntity(-165, 156);
doksanStation.group.position.y = stH;
doksanStation.addTo(scene);

// ── 8. 캐릭터·소품 ────────────────────────────────────
const entitiesToUpdate = [];

// 신부 — 광화문 (15, -24)
const brideH = seoulMap.getHeightAt(15, -24);
const bride = new AnimatedPropEntity(15, -24, './assets/models/bride.glb', 1.5);
bride.group.position.y = brideH;
bride.group.rotation.y = Math.PI;
bride.addTo(scene);
entitiesToUpdate.push(bride);

// 신부 머리 위 느낌표
const exclamation = new ExclamationMarker();
exclamation.setPosition(15, brideH + 7, -24);
exclamation.addTo(scene);
entitiesToUpdate.push(exclamation);

// NPC — 독산역 앞
const npcH = seoulMap.getHeightAt(-150, 150);
const npc1 = new AnimatedPropEntity(-150, 150, './assets/models/npc.glb', 1.5);
npc1.group.position.y = npcH;
npc1.group.rotation.y = -Math.PI * 0.5;
npc1.addTo(scene);
entitiesToUpdate.push(npc1);

// 오리 — 한강변
for (const [dx, dz] of [[-60,54],[15,90],[120,60],[180,84]]) {
    const dkH = seoulMap.getHeightAt(dx, dz);
    const dk  = new AnimatedPropEntity(dx, dz, './assets/models/duck.glb', 0.8);
    dk.group.position.y = dkH;
    dk.addTo(scene);
    entitiesToUpdate.push(dk);
}

// ── 9. 새들 ───────────────────────────────────────────

// 한강 위 플라밍고 2마리
const flamingo1 = new FlyingBirdEntity(-45, 72, './assets/models/flamingo.glb',
    { orbitRadius: 54, height: 14, speed:  0.3,  scale: 0.02 });
flamingo1.addTo(scene); entitiesToUpdate.push(flamingo1);

const flamingo2 = new FlyingBirdEntity(105, 72, './assets/models/flamingo.glb',
    { orbitRadius: 66, height: 18, speed: -0.25, scale: 0.02, startAngle: Math.PI });
flamingo2.addTo(scene); entitiesToUpdate.push(flamingo2);

// 남산 위 앵무새
const parrot1 = new FlyingBirdEntity(42, 6, './assets/models/parrot.glb',
    { orbitRadius: 48, height: nmH + 12, speed: 0.45, scale: 0.018 });
parrot1.addTo(scene); entitiesToUpdate.push(parrot1);

// 북한산 위 플라밍고
const flamingo3 = new FlyingBirdEntity(-36, -186, './assets/models/flamingo.glb',
    { orbitRadius: 66, height: 30, speed: 0.35, scale: 0.02, startAngle: Math.PI * 0.5 });
flamingo3.addTo(scene); entitiesToUpdate.push(flamingo3);

// 관악산 위 앵무새
const parrot2 = new FlyingBirdEntity(24, 195, './assets/models/parrot.glb',
    { orbitRadius: 60, height: 26, speed: -0.4, scale: 0.018, startAngle: Math.PI });
parrot2.addTo(scene); entitiesToUpdate.push(parrot2);

// ── 10. 플레이어 ──────────────────────────────────────
const startX = -15, startZ = -105; // 경복궁 북쪽
const startH = seoulMap.getHeightAt(startX, startZ);
const player = new PlayerEntity();
player.group.position.set(startX, startH + CONFIG.PLAYER.START_Y, startZ);
player.addTo(scene);
entitiesToUpdate.push(player);

const input = new InputManager();
const cameraManager = new CameraManager(camera, player.group);

// ── 11. PHYSICS CONSTANTS ─────────────────────────────
const BOUND_X = 300;
const BOUND_Z = 240;

function canMoveTo(x, z) {
    const inRiver = z > seoulMap.riverZMin && z < seoulMap.riverZMax;
    if (!inRiver) return true;
    return seoulMap.bridgeXs.some(bx => Math.abs(x - bx) < seoulMap.bridgeHalfWidth);
}

// ── 12. 대화 시스템 ───────────────────────────────────
const BRIDE_DIALOGUE = [
    { speaker: '신부 💍', text: '드디어 왔군요... 오늘 이 길을 함께 걷게 되어 기뻐요.' },
    { speaker: '신부 💍', text: '우리가 처음 만났던 그 날을 기억하나요? 작은 카페, 창문 너머로 스며들던 햇살...' },
    { speaker: '신부 💍', text: '그날부터 지금까지, 당신과 함께 걸어온 이 서울의 골목골목이 모두 소중해요.' },
    { speaker: '신부 💍', text: '이제 우리 함께 마지막 섬까지 가요. 거기서 영원을 시작해요. 💕' },
];

let dialogueActive  = false;
let dialogueIndex   = 0;
let typewriterTimer = null;

// 대화 UI 생성
const dlgBox = document.createElement('div');
dlgBox.id = 'dialogue-box';
dlgBox.style.cssText = [
    'display:none',
    'position:fixed',
    'bottom:80px',
    'left:50%',
    'transform:translateX(-50%)',
    'width:min(680px,90vw)',
    'background:rgba(255,248,252,0.96)',
    'border:2.5px solid #e07fa8',
    'border-radius:16px',
    'padding:20px 24px 16px',
    'box-shadow:0 8px 32px rgba(180,60,100,0.18)',
    'z-index:200',
    'font-family:\'Segoe UI\',sans-serif',
    'pointer-events:auto',
    'user-select:none',
].join(';');

const dlgSpeaker = document.createElement('div');
dlgSpeaker.style.cssText = 'font-size:15px;font-weight:700;color:#c0366a;margin-bottom:8px;letter-spacing:0.05em;';

const dlgText = document.createElement('div');
dlgText.style.cssText = 'font-size:16px;color:#3a2030;line-height:1.65;min-height:50px;';

const dlgHint = document.createElement('div');
dlgHint.style.cssText = 'font-size:12px;color:#b07090;text-align:right;margin-top:10px;';
dlgHint.textContent = '[ F / E / 탭 ] 계속';

dlgBox.appendChild(dlgSpeaker);
dlgBox.appendChild(dlgText);
dlgBox.appendChild(dlgHint);
document.body.appendChild(dlgBox);

// 모바일 상호작용 버튼
const interactBtn = document.createElement('button');
interactBtn.id = 'interact-btn';
interactBtn.textContent = '💬 대화';
interactBtn.style.cssText = [
    'display:none',
    'position:fixed',
    'bottom:20px',
    'left:50%',
    'transform:translateX(-50%)',
    'padding:12px 32px',
    'background:linear-gradient(135deg,#f06090,#e040a0)',
    'color:#fff',
    'border:none',
    'border-radius:30px',
    'font-size:16px',
    'font-weight:700',
    'letter-spacing:0.05em',
    'box-shadow:0 4px 16px rgba(200,60,120,0.35)',
    'z-index:210',
    'cursor:pointer',
].join(';');
interactBtn.addEventListener('click', () => {
    if (!dialogueActive) openDialogue();
    else advanceDialogue();
});
document.body.appendChild(interactBtn);

const INTERACT_RANGE = 22;

function typewrite(text, el) {
    clearTimeout(typewriterTimer);
    el.textContent = '';
    let i = 0;
    function step() {
        if (i < text.length) {
            el.textContent += text[i++];
            typewriterTimer = setTimeout(step, 30);
        }
    }
    step();
}

function openDialogue() {
    dialogueActive = true;
    dialogueIndex  = 0;
    dlgBox.style.display = 'block';
    player.setState('idle');
    player.velocity.set(0, 0, 0);
    showLine(dialogueIndex);
}

function showLine(idx) {
    const line = BRIDE_DIALOGUE[idx];
    dlgSpeaker.textContent = line.speaker;
    typewrite(line.text, dlgText);
    dlgHint.textContent = idx < BRIDE_DIALOGUE.length - 1
        ? '[ F / E / 탭 ] 계속'
        : '[ F / E / 탭 ] 닫기';
}

function advanceDialogue() {
    dialogueIndex++;
    if (dialogueIndex >= BRIDE_DIALOGUE.length) {
        closeDialogue();
    } else {
        showLine(dialogueIndex);
    }
}

function closeDialogue() {
    dialogueActive = false;
    dlgBox.style.display = 'none';
    clearTimeout(typewriterTimer);
}

// 키보드 상호작용 (F / E / Tab)
window.addEventListener('keydown', e => {
    if (e.code === 'KeyF' || e.code === 'KeyE' || e.code === 'Tab') {
        e.preventDefault();
        if (dialogueActive) {
            advanceDialogue();
        } else {
            // 신부 근처에서만 열림 — animate loop에서 체크 후 버튼 표시로도 처리
            const bx = 15, bz = -24;
            const dx = player.group.position.x - bx;
            const dz = player.group.position.z - bz;
            if (Math.sqrt(dx * dx + dz * dz) < INTERACT_RANGE) openDialogue();
        }
    }
});

// ── 13. ANIMATE LOOP ──────────────────────────────────
let lastTime  = performance.now();
let frames    = 0;
let fps       = 0;
let velocityY = 0;
const clock   = new THREE.Clock();

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

    for (const e of entitiesToUpdate) e.update(delta);

    // ── 인트로 카메라 ────────────────────────────────
    if (introActive) {
        introElapsed += delta;
        const raw = Math.min(introElapsed / INTRO_DURATION, 1);
        // ease-out cubic
        const t = 1 - Math.pow(1 - raw, 3);

        const camPos = introPath.getPoint(t);
        camera.position.copy(camPos);

        const lookTarget = new THREE.Vector3().lerpVectors(introLookStart, introLookEnd, t);
        camera.lookAt(lookTarget);

        if (raw >= 1) {
            introActive = false;
            // CameraManager가 부드럽게 이어받음
        }
        composer.render();
        return; // 인트로 중 게임 로직 스킵
    }

    // ── 한강 shimmer ─────────────────────────────────
    if (seoulMap.riverMesh) {
        seoulMap.riverMesh.material.emissiveIntensity =
            0.14 + Math.sin(clock.elapsedTime * 1.8) * 0.06;
    }

    // ── 신부 근접 체크 ───────────────────────────────
    const distToBride = Math.sqrt(
        Math.pow(player.group.position.x - 15, 2) +
        Math.pow(player.group.position.z - (-24), 2)
    );
    const nearBride = distToBride < INTERACT_RANGE;
    interactBtn.style.display = (nearBride && !dialogueActive) ? 'block' : 'none';
    if (exclamation) exclamation.setVisible(!dialogueActive);

    const { GRAVITY, JUMP_POWER } = CONFIG.PHYSICS;
    const inputData = input.update();

    // 대화 중 이동 금지
    if (dialogueActive) {
        player.setState('idle');
        player.velocity.set(0, 0, 0);
        followLight.position.set(player.group.position.x, player.group.position.y + 5, player.group.position.z);
        cameraManager.update(player.velocity);
        composer.render();
        return;
    }

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

    // 수평 이동 + 경계/한강 체크
    if (player.velocity.length() > 0.001) {
        const next = player.group.position.clone().add(player.velocity);
        const ex   = next.x / (BOUND_X + 1);
        const ez   = next.z / (BOUND_Z + 1);
        const outOfBounds = ex * ex + ez * ez >= 1;
        const inRiver     = !canMoveTo(next.x, next.z);

        if (!outOfBounds && !inRiver) {
            player.group.position.x = next.x;
            player.group.position.z = next.z;
        } else if (!outOfBounds && inRiver) {
            // 강변 슬라이딩
            if (canMoveTo(player.group.position.x + player.velocity.x, player.group.position.z))
                player.group.position.x += player.velocity.x;
            else if (canMoveTo(player.group.position.x, player.group.position.z + player.velocity.z))
                player.group.position.z += player.velocity.z;
            player.velocity.set(0, 0, 0);
        } else {
            player.velocity.set(0, 0, 0);
        }
    }

    // 지형 높이 추적 + 중력
    const px = player.group.position.x;
    const pz = player.group.position.z;
    const terrainH = seoulMap.getHeightAt(px, pz);
    const groundY  = terrainH + CONFIG.PLAYER.START_Y;

    if (inputData.jump && player.group.position.y <= groundY + 0.05) {
        velocityY = JUMP_POWER;
    }
    velocityY += GRAVITY;
    player.group.position.y += velocityY;
    if (player.group.position.y <= groundY) {
        player.group.position.y = groundY;
        velocityY = 0;
    }

    // 방향광 플레이어 추적
    directional.position.set(px + 200, 300, pz + 150);
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

// ── 인트로 오버레이 (검정 페이드 아웃) ───────────────
const overlay = document.createElement('div');
overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:#000',
    'pointer-events:none', 'z-index:100',
    'transition:opacity 1.8s ease-out'
].join(';');
document.body.appendChild(overlay);
requestAnimationFrame(() => { overlay.style.opacity = '0'; });
setTimeout(() => overlay.remove(), 2500);

// ── 인트로 카메라 경로 (서울 조감 → 플레이어 레벨) ──
const INTRO_DURATION = 6.5; // 초
let   introElapsed   = 0;
let   introActive    = true;

const introPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(  0,  600,  350),   // 서울 전체 조감
    new THREE.Vector3(-80,  280,   80),   // 한강 위 하강
    new THREE.Vector3(startX * 0.4, 90, startZ * 0.4 - 60), // 중간
    new THREE.Vector3(startX, 18, startZ - 25),              // 플레이어 수준
]);
const introLookStart = new THREE.Vector3(0, 0, 0);          // 서울 중심
const introLookEnd   = new THREE.Vector3(startX, startH, startZ); // 플레이어

statusDisplay.innerText = '🗺️ Seoul Map 3x : 가동 중';
animate();
