/**
 * 💍 Three.js Wedding Journey - Ultra Stable Mode
 * (Using Global THREE object from index.html)
 */

const statusDisplay = document.getElementById('status-log');

// --- 0. 안정성 검사 ---
if (typeof THREE === 'undefined') {
    statusDisplay.innerText = "🚨 에러: Three.js 라이브러리가 로드되지 않았습니다.";
    throw new Error("Three.js not found");
} else {
    statusDisplay.innerText = "✅ Three.js 로드 성공! 엔진 가동 중...";
}

// --- 1. Scene SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaccff);
scene.fog = new THREE.Fog(0xaaccff, 10, 80);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. LIGHTS ---
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1.2);
directional.position.set(20, 40, 20);
directional.castShadow = true;
// 그림자 정밀도 설정
directional.shadow.mapSize.width = 2048;
directional.shadow.mapSize.height = 2048;
scene.add(directional);

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

// 환경 (나무)
function createFancyTree(x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1.5), 
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 2.5, 8), 
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    trunk.position.set(x, 0.75, z);
    leaves.position.set(x, 2.5, z);
    trunk.castShadow = true;
    leaves.castShadow = true;
    scene.add(trunk);
    scene.add(leaves);
}

// 나무 심기
for (let i = -5; i < 50; i++) {
    createFancyTree(i * 12, -8 - Math.random() * 5);
    createFancyTree(i * 12, 8 + Math.random() * 5);
}

// --- 4. LOGIC & PHYSICS ---
const keys = {};
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

let velocityY = 0;
const moveSpeed = 0.2;
const gravity = -0.015;
const jumpPower = 0.35;

function animate() {
    requestAnimationFrame(animate);

    // --- 벨트스크롤 조작 (화면 기준 가로/세로 이동) ---
    // D: 오른쪽, A: 왼쪽
    if (keys['KeyD'] || keys['ArrowRight']) groom.position.x += moveSpeed;
    if (keys['KeyA'] || keys['ArrowLeft']) groom.position.x -= moveSpeed;
    
    // W: 위로 (화면 안쪽 -Z), S: 아래로 (화면 바깥쪽 +Z)
    if (keys['KeyW'] || keys['ArrowUp']) groom.position.z -= moveSpeed * 0.7;
    if (keys['KeyS'] || keys['ArrowDown']) groom.position.z += moveSpeed * 0.7;

    // --- 길 경계 제한 (벨트스크롤 범위) ---
    // 바닥 너비(Z) 안에서만 위아래로 움직이도록 제한
    const roadLimit = 14.4; 
    groom.position.z = Math.max(-roadLimit, Math.min(roadLimit, groom.position.z));

    // 점프
    if (keys['Space'] && groom.position.y <= 0.61) {
        velocityY = jumpPower;
    }
    
    velocityY += gravity;
    groom.position.y += velocityY;

    // 바닥 충돌 판정
    if (groom.position.y < 0.6) {
        groom.position.y = 0.6;
        velocityY = 0;
    }

    // --- 벨트스크롤 카메라 (Side-on View with Subtle Z-follow) ---
    // x: 신랑의 가로 위치를 1:1로 따라감
    // y: 일정한 높이 유지 (8)
    // z: 기본 거리 25 + 신랑의 Z 위치를 30%만 반영하여 '살짝' 따라가는 효과
    const zFollowOffset = groom.position.z * 0.3;
    const idealOffset = new THREE.Vector3(groom.position.x, 8, 25 + zFollowOffset);
    camera.position.lerp(idealOffset, 0.1);

    // 카메라 시선: 신랑의 가로 위치를 보되, 세로(Z)도 30% 정도만 반영하여 자연스럽게 시선 고정
    camera.lookAt(groom.position.x + 2, 1, zFollowOffset);

    renderer.render(scene, camera);
}

// 화면 크기 자동 조절
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 마지막 로그
statusDisplay.innerText = "🚀 3D 엔진 가동 중! WASD로 움직여보세요.";
animate();
