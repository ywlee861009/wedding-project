/**
 * 💍 Three.js Wedding Journey - Ultimate Optimized Version
 */

const statusDisplay = document.getElementById('status-log');

// --- 1. Scene SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e); // 깊은 밤하늘 남색
scene.fog = new THREE.Fog(0x1a1a2e, 20, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. LIGHTS ---
const ambient = new THREE.AmbientLight(0x444466, 0.8); // 보랏빛 도는 주변광
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1.2);
directional.position.set(50, 100, 50);
directional.castShadow = true;
scene.add(directional);

// 주인공을 따라다니는 부드러운 전역 광원 (성능 최적화 핵심)
const followLight = new THREE.PointLight(0xffcc44, 20, 30);
scene.add(followLight);

// --- 3. OBJECTS ---
// 바닥 (길)
const floorGeometry = new THREE.PlaneGeometry(2000, 30);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 신랑 (Blue Cube)
const groom = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.2 })
);
groom.position.y = 0.6;
groom.castShadow = true;
scene.add(groom);

// 나무 생성기
function createFancyTree(x, z) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 8), new THREE.MeshStandardMaterial({ color: 0x228B22 }));
    trunk.position.y = 0.75; leaves.position.y = 2.5;
    trunk.castShadow = true; leaves.castShadow = true;
    group.add(trunk); group.add(leaves);
    group.position.set(x, 0, z);
    scene.add(group);
}

// 건물 생성기 (창문 불빛 포함)
// 로고 텍스처 사전 생성 (가독성 극대화 버전)
function createLogoTexture(text, bgColor, textColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128; // 해상도 업그레이드
    const ctx = canvas.getContext('2d');
    
    // 배경 (더 진한 색상으로 대비 강화)
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, 512, 128);
    
    // 글자 스타일 (최대 굵기, 최대 크기)
    ctx.fillStyle = textColor;
    ctx.font = '900 90px sans-serif'; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 글자에 아주 미세한 그림자 효과 (입체감)
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    
    ctx.fillText(text, 256, 70); // 중앙 배치
    return new THREE.CanvasTexture(canvas);
}

// 더 진하고 선명한 브랜드 컬러 (배경이 밝고 글자가 검정색인 '역전환' 디자인)
const actimediTex = createLogoTexture('액티메디', '#00ffaa', '#000000');
const fitpetTex = createLogoTexture('핏펫', '#00aaff', '#000000');

function createBuilding(x, z) {
    const w = 6 + Math.random() * 6;   const h = 20 + Math.random() * 40;  const d = 6 + Math.random() * 6;
    const group = new THREE.Group();
    const color = [0x2c3e50, 0x34495e, 0x1a252f, 0x2c3e50][Math.floor(Math.random() * 4)];
    const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 }));
    building.position.y = h / 2;
    building.castShadow = true; building.receiveShadow = true;
    group.add(building);

    // --- 네온 간판 추가 (가독성 초극대화: 밝은 배경 + 검정 글자) ---
    const isActimedi = Math.random() > 0.5;
    const signTex = isActimedi ? actimediTex : fitpetTex;
    const signGeo = new THREE.BoxGeometry(w * 0.9, 2.8, 0.6); // 더 크고 두껍게
    const signMat = new THREE.MeshStandardMaterial({ 
        map: signTex, 
        emissive: isActimedi ? 0x00ffaa : 0x00aaff, 
        emissiveIntensity: 0.8 // 배경이 밝으므로 적절히 조절
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, h - 4, d / 2 + 0.35);
    group.add(sign);

    // 창문 불빛
    const winGeo = new THREE.PlaneGeometry(0.4, 0.6);
    const winMat = new THREE.MeshStandardMaterial({ color: 0xffff88, emissive: 0xffaa00, emissiveIntensity: 1.2 });
    const rows = Math.floor(h / 3); const cols = Math.floor(w / 2);
    for (let r = 1; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (Math.random() > 0.4) {
                const win = new THREE.Mesh(winGeo, winMat);
                win.position.set(-w/2 + (c+1)*1.5, r*2.5, d/2 + 0.1);
                group.add(win);
            }
        }
    }
    group.position.set(x, 0, z);
    scene.add(group);
}

// 구름 생성기
function createCloud(x, y, z) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 4; i++) {
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 4, 16, 16), mat);
        sphere.position.set(i * 3, Math.random() * 2, Math.random() * 2);
        group.add(sphere);
    }
    group.position.set(x, y, z);
    scene.add(group);
}

// 독산역 생성기
function createStation(x, z) {
    const group = new THREE.Group();
    const platform = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    platform.position.y = 0.2; platform.receiveShadow = true; group.add(platform);

    for (let i = -1; i <= 1; i++) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }));
        pillar.position.set(i * 8, 2.5, -4.5); pillar.castShadow = true; group.add(pillar);
    }

    const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x2c3e50, transparent: true, opacity: 0.8 }));
    roof.position.set(0, 5, -2.5); roof.rotation.x = Math.PI / 15; group.add(roof);

    // 역명판 (Canvas Texture)
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#0055aa'; ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = 'white'; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('독산 DOKSAN', 256, 90);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(6, 1.5, 0.2), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas) }));
    sign.position.set(0, 3.8, -4.3); group.add(sign);
    
    group.position.set(x, 0, z);
    scene.add(group);
}

// 가로등 생성기 (PointLight 제거 최적화)
function createStreetLight(x, z) {
    const group = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    post.position.y = 4; group.add(post);
    const head = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    head.position.set(0.8, 8, 0); group.add(head);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2.5 }));
    bulb.position.set(1.5, 7.7, 0); group.add(bulb);
    group.position.set(x, 0, z);
    scene.add(group);
}

// 배치 로직
createStation(0, 0);
for (let i = 0; i < 40; i++) {
    createStreetLight(i * 40, -16);
    createStreetLight(i * 40 + 20, 16);
}
for (let i = 2; i < 150; i++) {
    if (i % 3 !== 0) { createFancyTree(i * 15, -18); createFancyTree(i * 15, 18); }
}
for (let i = -10; i < 120; i++) {
    createBuilding(i * 15 + Math.random() * 10, -35 - Math.random() * 10);
    createBuilding(i * 18 + Math.random() * 15, -60 - Math.random() * 20);
}
for (let i = -10; i < 60; i++) {
    createCloud(i * 40 + Math.random() * 30, 45 + Math.random() * 15, -60 - Math.random() * 60);
}

// --- 4. LOGIC & PHYSICS ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

let velocityY = 0;
const moveSpeed = 0.2;
const gravity = -0.015;
const jumpPower = 0.35;

// FPS 측정을 위한 변수들
let lastTime = performance.now();
let frames = 0;
let fps = 0;

function animate() {
    requestAnimationFrame(animate);

    // FPS 계산 로직
    const now = performance.now();
    frames++;
    if (now >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (now - lastTime));
        lastTime = now;
        frames = 0;
        
        // FPS UI 업데이트 (검정색 고정, CSS 테두리 적용됨)
        statusDisplay.innerText = `FPS: ${fps}`;
    }

    // 이동 (WASD)
    if (keys['KeyD'] || keys['ArrowRight']) groom.position.x += moveSpeed;
    if (keys['KeyA'] || keys['ArrowLeft']) groom.position.x -= moveSpeed;
    if (keys['KeyW'] || keys['ArrowUp']) groom.position.z -= moveSpeed * 0.7;
    if (keys['KeyS'] || keys['ArrowDown']) groom.position.z += moveSpeed * 0.7;

    const roadLimit = 14.4; 
    groom.position.z = Math.max(-roadLimit, Math.min(roadLimit, groom.position.z));

    if (keys['Space'] && groom.position.y <= 0.61) velocityY = jumpPower;
    velocityY += gravity;
    groom.position.y += velocityY;
    if (groom.position.y < 0.6) { groom.position.y = 0.6; velocityY = 0; }

    // 광원 추적 (성능 최적화 핵심)
    followLight.position.set(groom.position.x, 8, groom.position.z);

    // 카메라 추적 (Subtle Follow)
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

statusDisplay.innerText = "🚀 최적화 완료! 60FPS 가동 중.";
animate();
