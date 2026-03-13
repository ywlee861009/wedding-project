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
        this.actions = {}; // 애니메이션 액션 저장소
        this.currentState = 'idle'; // 현재 상태 (idle, walk 등)

        this.loader = new GLTFLoader();
        this.loadModel();
    }

    loadModel() {
        this.loader.load(CONFIG.PLAYER.MODEL_PATH, (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(1.5, 1.5, 1.5); // 모델 크기 조정
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.group.add(this.model);

            // 애니메이션 믹서 설정
            this.mixer = new THREE.AnimationMixer(this.model);
            gltf.animations.forEach((clip) => {
                this.actions[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
            });

            // 기본 동작(idle 또는 첫 번째 애니메이션) 재생
            if (this.actions['idle']) this.actions['idle'].play();
            else if (gltf.animations.length > 0) {
                this.mixer.clipAction(gltf.animations[0]).play();
            }

            console.log('✅ Player Model Loaded:', gltf.animations.map(a => a.name));
        }, 
        undefined, 
        (error) => {
            console.warn('⚠️ 3D 모델을 찾을 수 없습니다. 기본 파란 큐브로 대체합니다.', error);
            this.createFallbackModel();
        });
    }

    // 모델 파일이 없을 때 보여줄 기본 큐브
    createFallbackModel() {
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(CONFIG.PLAYER.SIZE, CONFIG.PLAYER.SIZE, CONFIG.PLAYER.SIZE),
            new THREE.MeshStandardMaterial({ color: CONFIG.PLAYER.COLOR, roughness: 0.2 })
        );
        cube.castShadow = true;
        this.group.add(cube);
    }

    // 애니메이션 프레임 업데이트
    update(delta) {
        if (this.mixer) this.mixer.update(delta);
    }

    // 상태 변경 (예: 걷기 -> 멈춤)
    setState(newState) {
        if (this.currentState === newState) return;
        
        // 대소문자 구분 없이 애니메이션 찾기 (예: walk, Walk, WALK 모두 대응)
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
        const winGeo = new THREE.PlaneGeometry(0.6, 0.8); // 창문 크기도 약간 키움
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
    canvas.width = 1024; canvas.height = 256; // 해상도 2배 확장
    const ctx = canvas.getContext('2d');
    
    // 배경 (브랜드 색상)
    ctx.fillStyle = bgColor; 
    ctx.fillRect(0, 0, 1024, 256);
    
    // 검정 테두리
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, 1004, 236);

    // 아주 검정색 글자
    ctx.fillStyle = '#000000'; 
    ctx.font = 'bold 165px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif'; 
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    
    // 그림자 제거 (깔끔한 검정 글자)
    ctx.fillText(text, 512, 135);
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16; // 텍스처 선명도 향상
    return tex;
};

BuildingEntity.actimediTex = BuildingEntity.createLogoTexture('액티메디', '#00ffaa', '#000000');
BuildingEntity.fitpetTex = BuildingEntity.createLogoTexture('핏펫', '#00aaff', '#000000');

export class StationEntity {
    constructor(x, z) {
        this.group = new THREE.Group();
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

export class StreetLightEntity {
    constructor(x, z) {
        this.group = new THREE.Group();
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0x333333 }));
        post.position.y = 4; this.group.add(post);
        const head = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1), new THREE.MeshStandardMaterial({ color: 0x222222 }));
        head.position.set(0.8, 8, 0); this.group.add(head);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2.5 }));
        bulb.position.set(1.5, 7.7, 0); this.group.add(bulb);
        this.group.position.set(x, 0, z);
    }
    addTo(scene) { scene.add(this.group); }
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

/**
 * 길거리 소품 (쓰레기통, 쓰레기봉투 등) 클래스
 */
export class PropEntity {
    constructor(x, z, modelPath, scale = 1.0) {
        this.group = new THREE.Group();
        this.loader = new GLTFLoader();
        
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
        }, undefined, (error) => {
            console.warn(`⚠️ 소품 모델 로드 실패 (${modelPath}):`, error);
        });

        this.group.position.set(x, 0, z);
    }
    addTo(scene) { scene.add(this.group); }
}
