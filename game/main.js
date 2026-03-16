/**
 * 💍 Wedding Journey — 1/200 서울 맵 (3x 스케일)
 */
import { CONFIG } from './config.js';
import {
    StationEntity, TreeEntity,
    CloudEntity, PlayerEntity, AnimatedPropEntity, FlyingBirdEntity,
    SeoulTerrain, FlowerEntity, BenchEntity, ExclamationMarker,
    DuckFamilyEntity
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
renderer.toneMappingExposure = 1.2;  // 살짝 밝게
document.body.appendChild(renderer.domElement);

// ── 3. POST-PROCESSING ────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 0.18, 0.5, 0.85
);  // strength 낮춰 뿌연 느낌 제거, radius 올려 부드럽게
composer.addPass(bloomPass);

// ── 4. LIGHTS ─────────────────────────────────────────
const ambient = new THREE.AmbientLight(CONFIG.LIGHTS.AMBIENT, CONFIG.LIGHTS.AMBIENT_INTENSITY);
scene.add(ambient);

// HemisphereLight — 하늘(밝은 하늘색) ↔ 땅(따뜻한 황금빛)
const hemi = new THREE.HemisphereLight(0xb8e8fa, 0xd4aa60, 1.1);
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

// ── 6-1. 서울 25개 구 이름 레이블 ─────────────────────
(function addDistrictLabels() {
    // [이름, x, z]  — 3× 스케일 기준, 실제 지리 위치에 근사
    const DISTRICTS = [
        // ── 강북권 ────────────────────────────────────
        ['도봉구',     75, -185],   // 도봉산 서쪽
        ['강북구',    -20, -150],   // 북한산 동쪽
        ['노원구',    180, -165],   // 수락산 서쪽
        ['성북구',     62, -108],   // 북악산 동쪽
        ['은평구',   -115, -120],   // 북한산 서쪽
        // ── 도심권 ────────────────────────────────────
        ['종로구',     -5,  -72],   // 경복궁·광화문
        ['중구',       42,  -22],   // 남산 북쪽
        ['서대문구',  -82,  -60],
        ['동대문구',   95,  -52],
        ['성동구',    130,  -22],
        ['중랑구',    182,  -52],
        ['광진구',    220,  -10],   // 아차산 남쪽
        // ── 한강 인접 ─────────────────────────────────
        ['용산구',     35,   28],   // 남산 남쪽
        ['마포구',    -95,   18],
        // ── 강남권 ────────────────────────────────────
        ['영등포구',  -90,  108],   // 여의도 옆
        ['강서구',   -215,   88],
        ['양천구',   -152,   88],
        ['구로구',   -132,  130],
        ['금천구',   -132,  168],   // 독산역 근처
        ['동작구',    -28,  125],
        ['관악구',     22,  188],   // 관악산 북쪽
        ['서초구',     80,  132],
        ['강남구',    138,  120],
        ['송파구',    205,  132],
        ['강동구',    242,  115],
    ];

    function makeLabel(name) {
        const W = 256, H = 64;
        const canvas = document.createElement('canvas');
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        ctx.font         = 'bold 27px "Malgun Gothic","Apple Gothic","Noto Sans KR",sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        // 외곽선 (stroke) — 먼저 그려야 fill 위에 묻히지 않음
        ctx.strokeStyle = 'rgba(80,50,30,0.55)';
        ctx.lineWidth   = 3.5;
        ctx.lineJoin    = 'round';
        ctx.strokeText(name, W / 2, H / 2);

        // 채우기 (fill)
        ctx.fillStyle = 'rgba(255,252,245,0.82)';
        ctx.fillText(name, W / 2, H / 2);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        const w = name.length * 8 + 6;   // 글자 수에 비례한 너비
        sprite.scale.set(w, 8, 1);
        return sprite;
    }

    for (const [name, x, z] of DISTRICTS) {
        const h   = seoulMap.getHeightAt(x, z);
        const lbl = makeLabel(name);
        lbl.position.set(x, h + 2.5, z);
        scene.add(lbl);
    }
}());

// ── 6-2. 꽃·벤치 배치 ────────────────────────────────
(function spreadDecoration() {
    // 헬퍼: 꽃 1개 추가 (지형 높이 자동 적용)
    function addFlower(x, z, color) {
        const f = new FlowerEntity(x, z, color);
        f.group.position.y = seoulMap.getHeightAt(x, z);
        f.addTo(scene);
    }
    // 헬퍼: 벤치 1개 추가
    function addBench(x, z, rotY = 0) {
        const b = new BenchEntity(x, z, rotY);
        b.group.position.y = seoulMap.getHeightAt(x, z);
        b.addTo(scene);
    }

    const { FLOWER_PINK, FLOWER_WHITE, FLOWER_GOLD } = CONFIG.COLORS;

    // ── 한강 북쪽 강변 — 핑크·흰 꽃 + 벤치 ──────────
    for (let x = -195; x <= 195; x += 10) {
        const jx = x + (Math.random() - 0.5) * 6;
        const jz = 41 + (Math.random() - 0.5) * 2;
        addFlower(jx, jz, Math.random() < 0.6 ? FLOWER_PINK : FLOWER_WHITE);
    }
    for (let x = -160; x <= 160; x += 45) {
        addBench(x + (Math.random()-0.5)*8, 42, Math.random() * Math.PI * 2);
    }

    // ── 한강 남쪽 강변 — 골드·핑크 꽃 + 벤치 ─────────
    for (let x = -195; x <= 195; x += 10) {
        const jx = x + (Math.random() - 0.5) * 6;
        const jz = 101 + (Math.random() - 0.5) * 2;
        addFlower(jx, jz, Math.random() < 0.5 ? FLOWER_GOLD : FLOWER_PINK);
    }
    for (let x = -150; x <= 150; x += 50) {
        addBench(x + (Math.random()-0.5)*8, 102, Math.random() * Math.PI * 2);
    }

    // ── 남산 일대 — 벚꽃 핑크 군집 ────────────────────
    for (let i = 0; i < 30; i++) {
        addFlower(
            10 + Math.random() * 55,
            -22 + Math.random() * 44,
            FLOWER_PINK
        );
    }
    addBench(35, -10, 0);
    addBench(52,   8, Math.PI / 3);

    // ── 경복궁·광화문 주변 — 흰 꽃 ───────────────────
    for (let i = 0; i < 20; i++) {
        addFlower(
            -38 + Math.random() * 58,
            -88 + Math.random() * 42,
            FLOWER_WHITE
        );
    }
    addBench(-10, -68, -Math.PI / 6);
    addBench( 18, -72,  Math.PI / 5);

    // ── 도봉구 (플레이어 시작) — 야생화 골드 ──────────
    for (let i = 0; i < 18; i++) {
        addFlower(
            40 + Math.random() * 70,
            -200 + Math.random() * 40,
            Math.random() < 0.5 ? FLOWER_GOLD : FLOWER_WHITE
        );
    }

    // ── 관악산 기슭 — 골드 꽃 ─────────────────────────
    for (let i = 0; i < 18; i++) {
        addFlower(
            -18 + Math.random() * 55,
            158 + Math.random() * 40,
            FLOWER_GOLD
        );
    }

    // ── 금천구 (신부 위치) 주변 — 핑크 꽃 ─────────────
    for (let i = 0; i < 15; i++) {
        addFlower(
            -155 + Math.random() * 50,
            148 + Math.random() * 36,
            FLOWER_PINK
        );
    }
    addBench(-132, 160, Math.PI / 2);
}());

// ── 6-3. 구역별 저폴리 빌딩 ──────────────────────────
const buildingBoxes = [];   // AABB 충돌용 [{x, z, hw, hd}]

(function addBuildings() {
    // 팔레트
    const GLASS  = [0x7a9cbc, 0x8aafc8, 0x6888a8, 0x90a8c4, 0xb4ccd8];
    const WARM   = [0xf0d898, 0xe8c478, 0xf5dfa8, 0xddc888, 0xecd09c];
    const PASTEL = [0xf4c8c0, 0xc8d8f4, 0xd0f0d8, 0xf4e8c0, 0xe8c8f4, 0xf0d4e0];
    const APT    = [0xd8e8f8, 0xc8d8f0, 0xe0eef8, 0xccdaee]; // 아파트 연청

    function cluster(cx, cz, count, palette, hMin, hMax, sMin, sMax) {
        for (let i = 0; i < count; i++) {
            const x = cx + (Math.random() - 0.5) * 52;
            const z = cz + (Math.random() - 0.5) * 52;

            // 강 안쪽·경사 심한 곳 스킵
            if (z > seoulMap.riverZMin - 3 && z < seoulMap.riverZMax + 3) continue;
            const gH = seoulMap.getHeightAt(x, z);
            if (gH > 4) continue;

            const bh = hMin + Math.random() * (hMax - hMin);
            const bw = sMin + Math.random() * (sMax - sMin);
            const bd = sMin + Math.random() * (sMax - sMin);
            const col = palette[Math.floor(Math.random() * palette.length)];

            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(bw, bh, bd),
                new THREE.MeshStandardMaterial({ color: col, roughness: 0.72, metalness: 0.08 })
            );
            mesh.position.set(x, gH + bh / 2, z);
            mesh.rotation.y = (Math.random() - 0.5) * 0.25;
            mesh.castShadow    = true;
            mesh.receiveShadow = true;
            scene.add(mesh);

            // 충돌 박스 등록 (플레이어 반경 0.8 + 회전 여유 포함)
            buildingBoxes.push({
                x,  z,
                hw: bw / 2 + 0.8,
                hd: bd / 2 + 0.8,
            });
        }
    }

    // ── 강남권 고층 ──────────────────────────────────
    cluster( 135,  122, 15, GLASS,  8, 20, 5, 9);   // 강남
    cluster( 205,  132, 12, GLASS,  6, 16, 4, 8);   // 송파
    cluster(  80,  133, 12, GLASS,  6, 15, 4, 8);   // 서초
    cluster( -88,  110, 12, GLASS,  8, 18, 5, 9);   // 영등포/여의도

    // ── 도심 중고층 ───────────────────────────────────
    cluster(  42,  -25, 10, WARM,   5, 12, 4, 7);   // 중구
    cluster(  -5,  -70, 12, WARM,   3,  8, 4, 7);   // 종로
    cluster(  95,  -52, 10, WARM,   4, 10, 4, 6);   // 동대문
    cluster( 130,  -22, 10, WARM,   3,  8, 3, 6);   // 성동

    // ── 파스텔 주거 중층 ───────────────────────────────
    cluster( -95,   18, 12, PASTEL, 4,  9, 3, 6);   // 마포
    cluster(-152,   88, 10, PASTEL, 4,  9, 4, 6);   // 양천
    cluster( -28,  125, 10, PASTEL, 3,  8, 3, 6);   // 동작
    cluster( -82,  -60, 10, PASTEL, 3,  7, 3, 5);   // 서대문
    cluster( 220,  -10,  8, PASTEL, 3,  8, 3, 6);   // 광진
    cluster(  60, -108,  8, PASTEL, 3,  7, 3, 5);   // 성북

    // ── 저층 주거 ──────────────────────────────────────
    cluster(-215,   88,  8, WARM,   3,  7, 3, 6);   // 강서
    cluster(-130,  142,  8, WARM,   3,  8, 4, 6);   // 구로/금천
    cluster( 178,  -55, 10, WARM,   3,  8, 3, 5);   // 중랑
    cluster( 240,   80,  8, WARM,   4, 10, 4, 7);   // 강동

    // ── 아파트 단지 (고층 슬림) ────────────────────────
    cluster( 178, -163,  8, APT,   10, 18, 4, 6);   // 노원
    cluster(  75, -185,  8, APT,    6, 14, 4, 6);   // 도봉
    cluster( -20, -150,  8, APT,    4, 10, 3, 5);   // 강북
    cluster(-115, -120,  8, APT,    4,  9, 3, 5);   // 은평
}());

// ── 7. 독산역 ─────────────────────────────────────────
const stH = seoulMap.getHeightAt(-165, 156);
const doksanStation = new StationEntity(-165, 156);
doksanStation.group.position.y = stH;
doksanStation.addTo(scene);

// ── 8. 캐릭터·소품 ────────────────────────────────────
const entitiesToUpdate = [];

// 신부 — 광화문 (15, -24)
const brideH = seoulMap.getHeightAt(-132, 165);
const bride = new AnimatedPropEntity(-132, 165, './assets/models/bride.glb', 1.5);
bride.group.position.y = brideH;
bride.group.rotation.y = Math.PI;
bride.addTo(scene);
entitiesToUpdate.push(bride);

// 신부 머리 위 느낌표
const exclamation = new ExclamationMarker();
exclamation.setPosition(-132, brideH + 7, 165);
exclamation.addTo(scene);
entitiesToUpdate.push(exclamation);

// NPC — 독산역 앞
const npcH = seoulMap.getHeightAt(-150, 150);
const npc1 = new AnimatedPropEntity(-150, 150, './assets/models/npc.glb', 1.5);
npc1.group.position.y = npcH;
npc1.group.rotation.y = -Math.PI * 0.5;
npc1.addTo(scene);
entitiesToUpdate.push(npc1);

// 오리 가족 — 한강 순찰 (엄마·아빠 + 애기 10마리)
const duckFamily = new DuckFamilyEntity(seoulMap);
duckFamily.addTo(scene);
entitiesToUpdate.push(duckFamily);

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
const startX = 75, startZ = -185; // 도봉구
const startH = seoulMap.getHeightAt(startX, startZ);
const player = new PlayerEntity();
player.group.position.set(startX, startH + CONFIG.PLAYER.START_Y, startZ);
player.addTo(scene);
entitiesToUpdate.push(player);

const input = new InputManager();
const cameraManager = new CameraManager(camera, player.group, scene);

// ── 11. PHYSICS CONSTANTS ─────────────────────────────
const BOUND_X = 300;
const BOUND_Z = 240;

function canMoveTo(x, z) {
    const inRiver = z > seoulMap.riverZMin && z < seoulMap.riverZMax;
    if (!inRiver) return true;
    return seoulMap.bridgeXs.some(bx => Math.abs(x - bx) < seoulMap.bridgeHalfWidth);
}

function collidesWithBuilding(x, z) {
    for (const b of buildingBoxes) {
        if (Math.abs(x - b.x) < b.hw && Math.abs(z - b.z) < b.hd) return true;
    }
    return false;
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
            const bx = -132, bz = 165;
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
        Math.pow(player.group.position.x - (-132), 2) +
        Math.pow(player.group.position.z - 165, 2)
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
        // camera.quaternion 대신 순수 궤도각(theta) 사용 — 숄더 오프셋으로 인한 대각 이동 방지
        const angle = cameraManager.theta;
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

    // 수평 이동 + 경계/한강/빌딩 충돌 체크
    if (player.velocity.length() > 0.001) {
        const next = player.group.position.clone().add(player.velocity);
        const ex   = next.x / (BOUND_X + 1);
        const ez   = next.z / (BOUND_Z + 1);
        const outOfBounds = ex * ex + ez * ez >= 1;
        const blocked     = !canMoveTo(next.x, next.z) || collidesWithBuilding(next.x, next.z);

        if (!outOfBounds && !blocked) {
            player.group.position.x = next.x;
            player.group.position.z = next.z;
        } else if (!outOfBounds) {
            // 슬라이딩: X/Z 축 각각 시도
            const nx = player.group.position.x + player.velocity.x;
            const nz = player.group.position.z + player.velocity.z;
            const canX = canMoveTo(nx, player.group.position.z) && !collidesWithBuilding(nx, player.group.position.z);
            const canZ = canMoveTo(player.group.position.x, nz) && !collidesWithBuilding(player.group.position.x, nz);
            if (canX) player.group.position.x = nx;
            else if (canZ) player.group.position.z = nz;
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
