/**
 * 💍 Wedding Journey Entities Module
 */
import { CONFIG } from './config.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * 플레이어(신랑/신부) 클래스
 */
export class PlayerEntity {
    constructor() {
        this.group = new THREE.Group();
        this.model = null;
        this.mixer = null;
        this.actions = {};
        this.currentState = 'idle';

        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = 1.8;
        this.friction = 0.93;
        this.maxSpeed = CONFIG.PHYSICS.MOVE_SPEED;

        this.loader = new GLTFLoader();
        this.loadModel();

        this.boundingBox = new THREE.Box3(
            new THREE.Vector3(-0.5, 0, -0.5),
            new THREE.Vector3(0.5, 2, 0.5)
        );
    }

    loadModel() {
        this.loader.load(CONFIG.PLAYER.MODEL_PATH, (gltf) => {
            this.model = gltf.scene;
            this.model.scale.set(1.5, 1.5, 1.5);
            this.model.rotation.y = Math.PI; // 모델 정면 방향 보정
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
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;
        if (this.velocity.length() < 0.001) this.velocity.set(0, 0, 0);
        this.updateBoundingBox();
    }

    applyInput(inputX, inputZ) {
        if (inputX !== 0 || inputZ !== 0) {
            this.velocity.x += inputX * this.acceleration * 0.01;
            this.velocity.z += inputZ * this.acceleration * 0.01;
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
    constructor(x, z, radius = 25, color = 0xf5f5f5, options = {}) {
        this.group = new THREE.Group();
        this.radius = radius;
        this.sandRadius = radius + 8;

        // 섬 본체
        const geometry = new THREE.CylinderGeometry(radius, radius, 2, 32);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.0
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = -1;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        // 모래 링 (해변 효과)
        const sandGeo = new THREE.CylinderGeometry(radius + 8, radius + 8, 1.0, 32);
        const sandMat = new THREE.MeshStandardMaterial({
            color: options.sandColor || CONFIG.COLORS.SAND_RING,
            roughness: 0.9
        });
        const sandRing = new THREE.Mesh(sandGeo, sandMat);
        sandRing.position.y = -1.0;
        sandRing.receiveShadow = true;
        this.group.add(sandRing);

        // 섬 아래쪽 암벽
        const rockGeo = new THREE.ConeGeometry(radius * 1.1, 10, 8);
        const rockMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.ROCK_BOTTOM });
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
 * 🌉 다리 엔티티
 */
export class BridgeEntity {
    constructor(startPos, endPos, startRadius, endRadius) {
        this.group = new THREE.Group();
        this.walkableZones = [];

        const dx = endPos.x - startPos.x;
        const dz = endPos.z - startPos.z;
        const totalDist = Math.sqrt(dx * dx + dz * dz);
        const dirX = dx / totalDist;
        const dirZ = dz / totalDist;

        const bridgeLength = Math.max(1, totalDist - startRadius - endRadius);
        const angle = Math.atan2(dx, dz);

        // 다리 시작 위치 (모래 끝에서 시작)
        const midX = startPos.x + dirX * (startRadius + bridgeLength / 2);
        const midZ = startPos.z + dirZ * (startRadius + bridgeLength / 2);

        // 판자
        const plankGeo = new THREE.BoxGeometry(CONFIG.PHYSICS.BRIDGE_WIDTH, 0.4, bridgeLength);
        const plankMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.BRIDGE_PLANK, roughness: 0.9 });
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.set(midX, -0.2, midZ);
        plank.rotation.y = angle;
        plank.receiveShadow = true;
        plank.castShadow = true;
        this.group.add(plank);

        // 난간 (좌/우)
        const railMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.BRIDGE_RAIL, roughness: 0.8 });
        for (const side of [-1, 1]) {
            const railGeo = new THREE.BoxGeometry(0.2, 1.2, bridgeLength);
            const rail = new THREE.Mesh(railGeo, railMat);
            const offsetX = Math.cos(angle) * side * (CONFIG.PHYSICS.BRIDGE_WIDTH / 2);
            const offsetZ = -Math.sin(angle) * side * (CONFIG.PHYSICS.BRIDGE_WIDTH / 2);
            rail.position.set(midX + offsetX, 0.8, midZ + offsetZ);
            rail.rotation.y = angle;
            rail.castShadow = true;
            this.group.add(rail);
        }

        // 장식 기둥
        const postMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.BRIDGE_ROPE, roughness: 0.7 });
        const postCount = Math.max(2, Math.floor(bridgeLength / 15));
        for (let i = 0; i <= postCount; i++) {
            const t = i / postCount;
            const px = startPos.x + dirX * (startRadius + t * bridgeLength);
            const pz = startPos.z + dirZ * (startRadius + t * bridgeLength);

            for (const side of [-1, 1]) {
                const postGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.0, 6);
                const post = new THREE.Mesh(postGeo, postMat);
                const offsetX = Math.cos(angle) * side * (CONFIG.PHYSICS.BRIDGE_WIDTH / 2);
                const offsetZ = -Math.sin(angle) * side * (CONFIG.PHYSICS.BRIDGE_WIDTH / 2);
                post.position.set(px + offsetX, 1.0, pz + offsetZ);
                post.castShadow = true;
                this.group.add(post);
            }
        }

        // 물리 구역: BRIDGE_WIDTH 간격으로 촘촘히 배치 → 구역 반지름이 겹쳐 틈 없음
        const zoneSpacing = CONFIG.PHYSICS.BRIDGE_WIDTH; // 6유닛 간격
        const zoneRadius = CONFIG.PHYSICS.BRIDGE_WIDTH;  // 반지름 6 → 인접 구역과 충분히 겹침
        const zoneCount = Math.max(1, Math.ceil(bridgeLength / zoneSpacing));
        for (let i = 0; i < zoneCount; i++) {
            const t = (i + 0.5) / zoneCount;
            const zx = startPos.x + dirX * (startRadius + t * bridgeLength);
            const zz = startPos.z + dirZ * (startRadius + t * bridgeLength);
            this.walkableZones.push({
                radius: zoneRadius,
                sandRadius: zoneRadius,
                group: { position: new THREE.Vector3(zx, 0, zz) }
            });
        }
    }

    getWalkableZones() { return this.walkableZones; }

    addTo(scene) { scene.add(this.group); }
}

/**
 * 🐦 하늘을 나는 새 엔티티
 * - 섬 중심을 기준으로 원형 비행
 * - 상하 보빙(bobbing) + 진행 방향으로 자동 회전
 */
export class FlyingBirdEntity {
    constructor(centerX, centerZ, modelPath, options = {}) {
        this.group = new THREE.Group();
        this.mixer = null;

        this.centerX = centerX;
        this.centerZ = centerZ;
        this.orbitRadius = options.orbitRadius || 25;
        this.height     = options.height      || 20;
        this.speed      = options.speed       || 0.4; // rad/s
        this.angle      = options.startAngle  || (Math.random() * Math.PI * 2);

        const scale = options.scale || 0.02;
        const loader = new GLTFLoader();

        loader.load(modelPath, (gltf) => {
            const model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.traverse((child) => {
                if (child.isMesh) child.castShadow = true;
            });
            this.group.add(model);

            if (gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(model);
                this.mixer.clipAction(gltf.animations[0]).play();
            }
        }, undefined, (err) => {
            console.warn(`FlyingBirdEntity load failed (${modelPath})`, err);
        });

        // 초기 위치
        this._updatePosition();
    }

    _updatePosition() {
        const x = this.centerX + Math.cos(this.angle) * this.orbitRadius;
        const z = this.centerZ + Math.sin(this.angle) * this.orbitRadius;
        const y = this.height  + Math.sin(this.angle * 3) * 2.5; // 상하 보빙
        this.group.position.set(x, y, z);
    }

    update(delta) {
        if (this.mixer) this.mixer.update(delta);

        const prevX = this.group.position.x;
        const prevZ = this.group.position.z;

        this.angle += this.speed * delta;
        this._updatePosition();

        // 진행 방향으로 부드럽게 회전
        const dx = this.group.position.x - prevX;
        const dz = this.group.position.z - prevZ;
        if (Math.abs(dx) > 0.0001 || Math.abs(dz) > 0.0001) {
            this.group.rotation.y = Math.atan2(dx, dz);
        }
    }

    addTo(scene) { scene.add(this.group); }
}

/**
 * 🌸 꽃 엔티티
 */
export class FlowerEntity {
    constructor(x, z, color = CONFIG.COLORS.FLOWER_PINK) {
        this.group = new THREE.Group();

        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a8a3a });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.3;
        this.group.add(stem);

        const petalGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const petalMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.scale.y = 0.5;
        petal.position.y = 0.65;
        this.group.add(petal);

        this.group.position.set(x, 0, z);
    }

    addTo(scene) { scene.add(this.group); }
}

/**
 * 🪑 벤치 엔티티
 */
export class BenchEntity {
    constructor(x, z, rotY = 0) {
        this.group = new THREE.Group();

        const woodMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.BENCH_WOOD, roughness: 0.8 });
        const metalMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.BENCH_METAL, roughness: 0.5, metalness: 0.6 });

        // 시트
        const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.7), woodMat);
        seat.position.y = 0.6;
        seat.castShadow = true;
        this.group.add(seat);

        // 등받이
        const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.1), woodMat);
        back.position.set(0, 0.95, -0.3);
        back.castShadow = true;
        this.group.add(back);

        // 다리 4개
        for (const [lx, lz] of [[-0.8, 0.25], [0.8, 0.25], [-0.8, -0.25], [0.8, -0.25]]) {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), metalMat);
            leg.position.set(lx, 0.3, lz);
            leg.castShadow = true;
            this.group.add(leg);
        }

        this.group.position.set(x, 0, z);
        this.group.rotation.y = rotY;
    }

    addTo(scene) { scene.add(this.group); }
}

/**
 * 🌴 야자수 엔티티
 */
export class PalmTreeEntity {
    constructor(x, z, leavesColor = CONFIG.COLORS.TREE_LEAVES_LUSH) {
        this.group = new THREE.Group();

        const trunkMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_TRUNK, roughness: 0.9 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 4.0, 8), trunkMat);
        trunk.position.y = 2.0;
        trunk.rotation.z = 0.15;
        trunk.castShadow = true;
        this.group.add(trunk);

        // 캐노피 (넓적한 원뿔)
        const leavesMat = new THREE.MeshStandardMaterial({ color: leavesColor, roughness: 0.7 });
        const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.5, 2.0, 8), leavesMat);
        canopy.position.set(0.6, 5.0, 0);
        canopy.castShadow = true;
        this.group.add(canopy);

        this.group.position.set(x, 0, z);
    }

    addTo(scene) { scene.add(this.group); }
}

/**
 * 🌲 나무 엔티티 (잎 색상 파라미터화)
 */
export class TreeEntity {
    constructor(x, z, leavesColor = CONFIG.COLORS.TREE_LEAVES) {
        this.group = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.5),
            new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.TREE_TRUNK })
        );
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(1.2, 2.5, 8),
            new THREE.MeshStandardMaterial({ color: leavesColor })
        );
        trunk.position.y = 0.75;
        leaves.position.y = 2.5;
        trunk.castShadow = true;
        leaves.castShadow = true;
        this.group.add(trunk);
        this.group.add(leaves);
        this.group.position.set(x, 0, z);
    }
    addTo(scene) { scene.add(this.group); }
}

/**
 * 🐦 애니메이션 소품 (새, 신부 등 첫 번째 애니메이션 자동 재생)
 */
export class AnimatedPropEntity {
    constructor(x, z, modelPath, scale = 1.0) {
        this.group = new THREE.Group();
        this.mixer = null;
        const loader = new GLTFLoader();

        loader.load(modelPath, (gltf) => {
            const model = gltf.scene;
            model.scale.set(scale, scale, scale);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.group.add(model);

            if (gltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(model);
                this.mixer.clipAction(gltf.animations[0]).play();
            }
        }, undefined, (err) => {
            console.warn(`AnimatedPropEntity load failed (${modelPath})`, err);
        });

        this.group.position.set(x, 0, z);
    }

    update(delta) {
        if (this.mixer) this.mixer.update(delta);
    }

    addTo(scene) { scene.add(this.group); }
}

/**
 * 길거리 소품
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
        const signMat = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.2, metalness: 0.5 });
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

        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.4, 12),
            new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.STATION_PLATFORM })
        );
        platform.position.y = 0.2;
        platform.receiveShadow = true;
        this.group.add(platform);

        for (let i = -1; i <= 1; i++) {
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 5),
                new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 })
            );
            pillar.position.set(i * 8, 2.5, -4.5);
            pillar.castShadow = true;
            this.group.add(pillar);
        }

        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(22, 0.3, 10),
            new THREE.MeshStandardMaterial({ color: 0x2c3e50, transparent: true, opacity: 0.8 })
        );
        roof.position.set(0, 5, -2.5);
        roof.rotation.x = Math.PI / 15;
        this.group.add(roof);

        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + CONFIG.COLORS.STATION.toString(16).padStart(6, '0');
        ctx.fillRect(0, 0, 512, 128);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('독산 DOKSAN', 256, 90);

        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 0.3),
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas) })
        );
        sign.position.set(0, 6.2, -2.5);
        this.group.add(sign);
        this.group.position.set(x, 0, z);

        this.updateBoundingBox();
    }

    updateBoundingBox() {
        this.group.updateWorldMatrix(true, true);
        this.boundingBox.setFromObject(this.group);
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
            roughness: 0.5
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

    addTo(scene) { scene.add(this.group); }
}

// ─────────────────────────────────────────────────────────
/**
 * 🗺️ 1/200 서울 지형
 *
 * 좌표계: x = 서→동,  z = 북→남
 * 범위:   x[-100, 100]  z[-80, 80]  (서울 타원형 경계)
 * 스케일: 1 game unit ≈ 200m
 */
export class SeoulTerrain {
    constructor() {
        this.group = new THREE.Group();

        // [cx, cz, 최고높이, 확산σ]
        this._peaks = [
            [-12, -62, 14, 20],   // 북한산  836m
            [ 22, -65, 12, 16],   // 도봉산  739m
            [ 60, -52, 10, 14],   // 수락산  638m
            [ 82,  -8,  6, 12],   // 아차산  295m
            [ 14,   2,  9, 10],   // 남산    262m
            [-58, -12,  6, 10],   // 안산    296m
            [-18, -18,  7,  9],   // 인왕산  338m
            [ -5, -25,  8,  9],   // 북악산  342m
            [  8,  65, 13, 16],   // 관악산  629m
            [ 62,  62, 10, 13],   // 청계산  618m
            [ 65, -28,  7, 11],   // 용마산  348m
        ];

        this._riverZ  = 24;   // 한강 중심 z
        this._riverHW = 9;    // 한강 반폭

        // 교량 x 위치 (서→동)
        this._bridgeXs = [-88, -45, -32, -18, -3, 10, 24, 40, 55, 70];

        this._buildTerrain();
        this._buildRiver();
        this._buildBridges();
    }

    /** 게임 좌표 (x, z)의 지형 높이 반환 */
    getHeightAt(x, z) {
        let h = 0;
        for (const [cx, cz, ph, sigma] of this._peaks) {
            const d2 = (x - cx) ** 2 + (z - cz) ** 2;
            h += ph * Math.exp(-d2 / (2 * sigma * sigma));
        }
        // 한강 구간 평탄화
        const dr = Math.abs(z - this._riverZ);
        if (dr < this._riverHW + 6) {
            const blend = Math.max(0, 1 - dr / (this._riverHW + 6));
            h *= (1 - blend * 0.96);
        }
        return Math.max(0, h);
    }

    /** 서울 경계 안인지 (타원형) */
    isInSeoul(x, z) {
        return (x / 100) ** 2 + (z / 80) ** 2 < 1;
    }

    _vertexColor(x, z, h) {
        if (!this.isInSeoul(x, z)) return new THREE.Color(0x5a8a3a); // 서울 외 초록
        if (h > 8)   return new THREE.Color(0x2d6e2d); // 산 정상
        if (h > 4)   return new THREE.Color(0x4a8a4a); // 산 중턱
        if (h > 1.5) return new THREE.Color(0x7ab870); // 공원/언덕
        return new THREE.Color(0xa0a090);               // 도심 (회색빛)
    }

    _buildTerrain() {
        const geo = new THREE.PlaneGeometry(240, 240, 128, 128);
        geo.rotateX(-Math.PI / 2);

        const pos  = geo.attributes.position;
        const cols = [];

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const h = this.getHeightAt(x, z);
            pos.setY(i, h);
            const c = this._vertexColor(x, z, h);
            cols.push(c.r, c.g, c.b);
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        geo.computeVertexNormals();

        const mesh = new THREE.Mesh(
            geo,
            new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })
        );
        mesh.receiveShadow = true;
        this.group.add(mesh);
    }

    _buildRiver() {
        // 한강 수면
        const river = new THREE.Mesh(
            new THREE.PlaneGeometry(240, this._riverHW * 2),
            new THREE.MeshStandardMaterial({
                color: 0x2ab5c8, transparent: true, opacity: 0.88,
                roughness: 0.05, metalness: 0.1
            })
        );
        river.rotation.x = -Math.PI / 2;
        river.position.set(0, 0.3, this._riverZ);
        this.group.add(river);

        // 여의도
        const yd = new THREE.Mesh(
            new THREE.CylinderGeometry(7, 7, 0.4, 32),
            new THREE.MeshStandardMaterial({ color: 0x8ab870, roughness: 0.8 })
        );
        yd.position.set(-30, 0.35, this._riverZ);
        this.group.add(yd);
    }

    _buildBridges() {
        const z0  = this._riverZ - this._riverHW;
        const z1  = this._riverZ + this._riverHW;
        const len = z1 - z0;
        const plankMat = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.BRIDGE_PLANK, roughness: 0.8 });
        const railMat  = new THREE.MeshStandardMaterial({ color: CONFIG.COLORS.BRIDGE_RAIL,  roughness: 0.7 });

        for (const bx of this._bridgeXs) {
            const deck = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, len), plankMat);
            deck.position.set(bx, 0.5, this._riverZ);
            deck.castShadow = true;
            this.group.add(deck);
            for (const s of [-1, 1]) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.6, len), railMat);
                rail.position.set(bx + s * 1.6, 0.85, this._riverZ);
                this.group.add(rail);
            }
        }
    }

    addTo(scene) { scene.add(this.group); }
}
