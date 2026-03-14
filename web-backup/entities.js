/**
 * 💍 Wedding Journey Entities Module
 */
import { CONFIG } from './config.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

        // 30년차 케로의 관성 시스템
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = 1.8; // 가속도 (조금 더 상향)
        this.friction = 0.93;   // 마찰력 (자연스러운 감속)
        this.maxSpeed = CONFIG.PHYSICS.MOVE_SPEED;

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
            
            this.updateBoundingBox(); 
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
        this.updateBoundingBox();
    }
    
    update(delta) {
        if (this.mixer) this.mixer.update(delta);

        // 속도에 따른 마찰력 적용 (자연스러운 감속)
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;

        // 정지 상태에 가까워지면 속도를 0으로 고정
        if (this.velocity.length() < 0.001) {
            this.velocity.set(0, 0, 0);
        }

        this.updateBoundingBox(); 
    }

    /**
     * 외부(main.js)에서 입력 방향을 받아 속도를 변화시킵니다.
     */
    applyInput(inputX, inputZ) {
        if (inputX !== 0 || inputZ !== 0) {
            // 입력 방향으로 가속
            this.velocity.x += inputX * this.acceleration * 0.01;
            this.velocity.z += inputZ * this.acceleration * 0.01;

            // 최대 속도 제한
            const speed = this.velocity.length();
            if (speed > this.maxSpeed) {
                this.velocity.divideScalar(speed).multiplyScalar(this.maxSpeed);
            }
        }
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
 * 🏝️ 기억의 섬(Memory Island) 클래스
 */
export class IslandEntity {
    constructor(x, z, radius = 25, color = 0xf5f5f5) {
        this.group = new THREE.Group();
        this.radius = radius; // 낙하 체크를 위해 반지름 저장
        
        // 섬 본체 (원형 플랫폼)
        const geometry = new THREE.CylinderGeometry(radius, radius, 2, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: color, 
            roughness: 0.8,
            metalness: 0.1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = -1; // 상단이 y=0에 오도록 설정
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        // 섬 아래쪽 바위 장식 (디테일)
        const rockGeo = new THREE.ConeGeometry(radius * 1.1, 10, 8);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const bottom = new THREE.Mesh(rockGeo, rockMat);
        bottom.position.y = -6;
        bottom.rotation.x = Math.PI;
        this.group.add(bottom);

        this.group.position.set(x, 0, z);
        
        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        this.group.updateWorldMatrix(true, true);
        this.boundingBox.setFromObject(this.group);
    }

    addTo(scene) { scene.add(this.group); }
}

/**
 * 길거리 소품... (기존 클래스들)
 */
export class PropEntity {
    constructor(x, z, modelPath, scale = 1.0) {
        this.group = new THREE.Group();
        this.loader = new GLTFLoader();
        this.boundingBox = new THREE.Box3(); 
        
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
            this.updateBoundingBox(); 
        }, undefined, (error) => {
            console.warn(`⚠️ 소품 모델 로드 실패 (${modelPath}):`, error);
        });

        this.group.position.set(x, 0, z);
    }

    updateBoundingBox() {
        this.group.updateWorldMatrix(true, true);
        this.boundingBox.setFromObject(this.group);
    }

    addTo(scene) { scene.add(this.group); }
}

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
        this.boundingBox = new THREE.Box3(); 

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

export class InstancedStreetLightEntity {
    constructor(scene, maxCount = 200) {
        const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 8);
        const headGeo = new THREE.BoxGeometry(2, 0.4, 1);
        const bulbGeo = new THREE.SphereGeometry(0.3, 8, 8);

        const postMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const headMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2.5 });

        this.posts = new THREE.InstancedMesh(postGeo, postMat, maxCount);
        this.heads = new THREE.InstancedMesh(headGeo, headMat, maxCount);
        this.bulbs = new THREE.InstancedMesh(bulbGeo, bulbMat, maxCount);

        this.posts.castShadow = true;
        this.posts.receiveShadow = true;

        scene.add(this.posts);
        scene.add(this.heads);
        scene.add(this.bulbs);

        this.count = 0;
        this.dummy = new THREE.Object3D(); 
    }

    addInstance(x, z) {
        if (this.count >= this.posts.count) return;
        const dummy = this.dummy;
        dummy.position.set(x, 4, z);
        dummy.updateMatrix();
        this.posts.setMatrixAt(this.count, dummy.matrix);
        dummy.position.set(x + 0.8, 8, z);
        dummy.updateMatrix();
        this.heads.setMatrixAt(this.count, dummy.matrix);
        dummy.position.set(x + 1.5, 7.7, z);
        dummy.updateMatrix();
        this.bulbs.setMatrixAt(this.count, dummy.matrix);
        this.count++;
    }

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
        this.group = new THREE.Group(); 
        
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            emissive: 0xffd700, 
            emissiveIntensity: 1.2,
            metalness: 0.2,
            roughness: 0.5,
        });

        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 2.5; 
        this.mesh.castShadow = true;
        this.group.add(this.mesh);

        this.group.position.set(x, 0, z); 

        this.boundingBox = new THREE.Box3();
        this.updateBoundingBox();
    }

    update(delta) {
        this.mesh.rotation.y += delta * 0.5;
        this.updateBoundingBox(); 
    }

    updateBoundingBox() {
        this.group.updateWorldMatrix(true, true);
        this.boundingBox.setFromObject(this.group);
    }

    addTo(scene) {
        scene.add(this.group);
    }
}
