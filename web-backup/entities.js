/**
 * 💍 Wedding Journey Entities Module
 */
import { CONFIG } from './config.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- 30년차 케로의 충돌 감지 시스템 (Bounding Box) ---
// 모든 충돌 가능한 엔티티가 가져야 할 기본 로직
const Collidable = (superclass) => class extends superclass {
    setupBoundingBox() {
        this.boundingBox = new THREE.Box3();
        // 모델 로딩이 완료된 후, 또는 매 프레임 업데이트 필요
    }

    updateBoundingBox() {
        if (this.group) {
            this.boundingBox.setFromObject(this.group);
        } else if (this.mesh) {
            this.boundingBox.setFromObject(this.mesh);
        }
    }
};

/**
 * 플레이어(신랑/신부) 클래스 - 3D 모델 및 애니메이션 포함
 */
export class PlayerEntity {
    constructor() {
        this.group = new THREE.Group();
        this.model = null;
        this.mixer = null;
        this.actions = {}; 
        this.currentState = 'idle';

        this.loader = new GLTFLoader();
        this.loadModel();

        // 충돌 감지를 위한 BoundingBox 설정
        this.boundingBox = new THREE.Box3(
            new THREE.Vector3(-0.5, 0, -0.5),
            new THREE.Vector3(0.5, 2, 0.5)
        );
    }

    loadModel() {
        this.loader.load(CONFIG.PLAYER.MODEL_PATH, (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(1.5, 1.5, 1.5);
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.group.add(this.model);
            
            this.mixer = new THREE.AnimationMixer(this.model);
            gltf.animations.forEach((clip) => {
                this.actions[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
            });
            
            if (this.actions['idle']) this.actions['idle'].play();
            else if (gltf.animations.length > 0) this.mixer.clipAction(gltf.animations[0]).play();
            
            this.updateBoundingBox(); // 모델 로드 후 최초 BoundingBox 계산
        }, 
        undefined, 
        (error) => {
            console.warn('⚠️ 3D 모델을 찾을 수 없습니다. 기본 파란 큐브로 대체합니다.', error);
            this.createFallbackModel();
        });
    }
    
    createFallbackModel() {
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.PLAYER.SIZE, CONFIG.PLAYER.SIZE, CONFIG.PLAYER.SIZE),
            new THREE.MeshStandardMaterial({ color: CONFIG.PLAYER.COLOR, roughness: 0.2 })
        );
        cube.castShadow = true;
        this.group.add(cube);
        this.updateBoundingBox(); // 대체 모델 생성 후 BoundingBox 계산
    }
    
    update(delta) {
        if (this.mixer) this.mixer.update(delta);
        this.updateBoundingBox(); // 매 프레임 BoundingBox를 현재 위치로 갱신
    }

    updateBoundingBox() {
        this.group.updateWorldMatrix(true, true);
        this.boundingBox.setFromObject(this.group);
    }
    
    setState(newState) {
        if (this.currentState === newState) return;
        const targetName = newState.toLowerCase();
        const actionKey = Object.keys(this.actions).find(key => key.toLowerCase() === targetName);
        if (!actionKey) return;
        const prevActionKey = Object.keys(this.actions).find(key => key.toLowerCase() === this.currentState.toLowerCase());
        const prevAction = prevActionKey ? this.actions[prevActionKey] : null;
        const nextAction = this.actions[actionKey];
        if (prevAction) prevAction.fadeOut(0.2);
        nextAction.reset().fadeIn(0.2).play();
        this.currentState = newState;
    }

    addTo(scene) { scene.add(this.group); }
}


/**
 * 길거리 소품 (쓰레기통, 쓰레기봉투 등) 클래스
 */
export class PropEntity {
    constructor(x, z, modelPath, scale = 1.0) {
        this.group = new THREE.Group();
        this.loader = new GLTFLoader();
        this.boundingBox = new THREE.Box3(); // BoundingBox 초기화
        
        this.loader.load(modelPath, (gltf) => {
            const model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.group.add(model);
            // 모델이 로드되고 그룹에 추가된 후 BoundingBox를 계산
            this.updateBoundingBox(); 
        }, undefined, (error) => {
            console.warn(`⚠️ 소품 모델 로드 실패 (${modelPath}):`, error);
        });

        this.group.position.set(x, 0, z);
    }

    // Prop은 정적이므로 BoundingBox를 한 번만 계산하면 됨
    updateBoundingBox() {
        // 모델이 완전히 로드될 때까지 기다렸다가 계산
        this.group.updateWorldMatrix(true, true);
        this.boundingBox.setFromObject(this.group);
    }

    addTo(scene) { scene.add(this.group); }
}


// 이하 BuildingEntity, StationEntity 등 기존 코드는 그대로 유지...
export class BuildingEntity {
    constructor(x, z, config = {}) {
        const { w = 6 + Math.random() * 6, h = 20 + Math.random() * 40, d = 6 + Math.random() * 6 } = config;
        this.group = new THREE.Group();
        
        const colors = CONFIG.COLORS.BUILDING;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d), 
            new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 })
        );
        building.position.y = h / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        this.group.add(building);

        this.addSign(w, h, d);
        this.addWindows(w, h, d);
        this.group.position.set(x, 0, z);
    }

    addSign(w, h, d) {
        const isActimedi = Math.random() > 0.5;
        const signTex = isActimedi ? BuildingEntity.actimediTex : BuildingEntity.fitpetTex;
        const signGeo = new THREE.BoxGeometry(w * 0.9, 4, 1.2); 
        const signMat = new THREE.MeshStandardMaterial({ 
            map: signTex, 
            roughness: 0.2,
            metalness: 0.5
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, h - 5, d / 2 + 0.61); 
        this.group.add(sign);
    }

    addWindows(w, h, d) {
        const winGeo = new THREE.PlaneGeometry(0.6, 0.8);
        const winMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffaa00, emissiveIntensity: 1.5 });
        const rows = Math.floor(h / 3);
        const cols = Math.floor(w / 2);
        for (let r = 1; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.4) {
                    const win = new THREE.Mesh(winGeo, winMat);
                    win.position.set(-w/2 + (c+1)*1.5, r*2.5, d/2 + 0.1);
                    this.group.add(win);
                }
            }
        }
    }

    addTo(scene) { scene.add(this.group); }
}

BuildingEntity.createLogoTexture = function(text, bgColor, textColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor; 
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, 1004, 236);
    ctx.fillStyle = '#000000'; 
    ctx.font = 'bold 165px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif'; 
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 135);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
};

BuildingEntity.actimediTex = BuildingEntity.createLogoTexture('액티메디', '#00ffaa', '#000000');
BuildingEntity.fitpetTex = BuildingEntity.createLogoTexture('핏펫', '#00aaff', '#000000');

export class StationEntity {
    constructor(x, z) {
        this.group = new THREE.Group();
        this.boundingBox = new THREE.Box3(); // 충돌 감지용 BoundingBox

        const platform = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 12), new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.STATION_PLATFORM }));
        platform.position.y = 0.2; platform.receiveShadow = true; this.group.add(platform);

        for (let i = -1; i <= 1; i++) {
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }));
            pillar.position.set(i * 8, 2.5, -4.5); pillar.castShadow = true; this.group.add(pillar);
        }

        const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 10), new THREE.MeshStandardMaterial({ color: 0x2c3e50, transparent: true, opacity: 0.8 }));
        roof.position.set(0, 5, -2.5); roof.rotation.x = Math.PI / 15; this.group.add(roof);

        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d'); 
        ctx.fillStyle = CONFIG.COLORS.STATION; ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = 'white'; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('독산 DOKSAN', 256, 90);
        
        const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 0.3), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas) }));
        sign.position.set(0, 6.2, -2.5); this.group.add(sign);
        this.group.position.set(x, 0, z);

        this.updateBoundingBox();
    }

    updateBoundingBox() {
        this.group.updateWorldMatrix(true, true);
        this.boundingBox.setFromObject(this.group);
    }

    addTo(scene) { scene.add(this.group); }
}

export class TreeEntity {
    constructor(x, z) {
        this.group = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5), new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_TRUNK }));
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 8), new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_LEAVES }));
        trunk.position.y = 0.75; leaves.position.y = 2.5;
        trunk.castShadow = true; leaves.castShadow = true;
        this.group.add(trunk); this.group.add(leaves);
        this.group.position.set(x, 0, z);
    }
    addTo(scene) { scene.add(this.group); }
}

// 30년차 케로의 최적화: InstancedMesh를 사용한 가로등 엔티티
export class InstancedStreetLightEntity {
    constructor(scene, maxCount = 200) {
        // 1. 재료 준비 (단 한번만 생성)
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 8);
        const headGeo = new THREE.BoxGeometry(2, 0.4, 1);
        const bulbGeo = new THREE.SphereGeometry(0.3, 8, 8);

        const postMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2.5 });

        // 2. InstancedMesh 생성 (각 파트별로)
        this.posts = new THREE.InstancedMesh(postGeo, postMat, maxCount);
        this.heads = new THREE.InstancedMesh(headGeo, headMat, maxCount);
        this.bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, maxCount);

        this.posts.castShadow = true;
        this.posts.receiveShadow = true;

        scene.add(this.posts);
        scene.add(this.heads);
        scene.add(this.bulbs);

        this.count = 0;
        this.dummy = new THREE.Object3D(); // 위치/회전/크기 설정을 위한 임시 객체
    }

    // 3. 가로등 '설치' 함수
    addInstance(x, z) {
        if (this.count >= this.posts.count) return;

        const dummy = this.dummy;

        // 기둥 위치 설정
        dummy.position.set(x, 4, z);
        dummy.updateMatrix();
        this.posts.setMatrixAt(this.count, dummy.matrix);

        // 헤드 위치 설정
        dummy.position.set(x + 0.8, 8, z);
        dummy.updateMatrix();
        this.heads.setMatrixAt(this.count, dummy.matrix);

        // 전구 위치 설정
        dummy.position.set(x + 1.5, 7.7, z);
        dummy.updateMatrix();
        this.bulbs.setMatrixAt(this.count, dummy.matrix);

        this.count++;
    }

    // 4. 모든 인스턴스의 위치 정보를 한번에 GPU로 전송
    finalize() {
        this.posts.count = this.count;
        this.heads.count = this.count;
        this.bulbs.count = this.count;
        this.posts.instanceMatrix.needsUpdate = true;
        this.heads.instanceMatrix.needsUpdate = true;
        this.bulbs.instanceMatrix.needsUpdate = true;
    }
}

export class CloudEntity {
    constructor(x, y, z) {
        this.group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        for (let i = 0; i < 4; i++) {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 4, 16, 16), mat);
            sphere.position.set(i * 3, Math.random() * 2, Math.random() * 2);
            this.group.add(sphere);
        }
        this.group.position.set(x, y, z);
    }
    addTo(scene) { scene.add(this.group); }
}


export class MemoryFragmentEntity {
    constructor(x, z, infoId) {
        this.infoId = infoId; 
        this.group = new THREE.Group(); // Mesh 대신 Group 사용 (통일성)
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            emissive: 0xffd700, 
            emissiveIntensity: 1.2,
            metalness: 0.2,
            roughness: 0.5,
        });

        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 2.5; // 로컬 높이 설정
        this.mesh.castShadow = true;
        this.group.add(this.mesh);

        this.group.position.set(x, 0, z); // 그룹 위치 설정

        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
    }

    update(delta) {
        this.mesh.rotation.y += delta * 0.5;
        this.updateBoundingBox(); // 매 프레임 업데이트 (회전/이동 대응)
    }

    updateBoundingBox() {
        this.group.updateWorldMatrix(true, true);
        this.boundingBox.setFromObject(this.group);
    }

    addTo(scene) {
        scene.add(this.group);
    }
}
