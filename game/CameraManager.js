/**
 * 🎥 CameraManager V6 - 숄더뷰 + 오클루전 투명화
 */
export class CameraManager {
    constructor(camera, target, scene) {
        this.camera = camera;
        this.target = target;
        this._scene = scene;

        // 구형 좌표계
        this.distance      = 13;
        this.theta         = Math.PI / 4;
        this.phi           = Math.PI * 0.37;  // 수평에 가까운 낮은 각도
        this.targetTheta   = this.theta;
        this.targetPhi     = this.phi;
        this.targetDistance = this.distance;

        this.shoulderOffset = 2.8;  // 오른쪽 어깨 오프셋

        this.orbitSpeed        = 0.005;
        this.followSpeed       = 0.08;
        this.rotationSmoothing = 0.07;

        // 오클루전 투명화
        this._raycaster      = new THREE.Raycaster();
        this._occluded       = new Set();   // 현재 투명화된 mesh
        this._savedMaterials = new Map();   // 원본 material 상태 저장

        // InstancedMesh 개별 인스턴스 숨김
        this._occludedInstances    = new Map();  // 'uuid_instanceId' → {mesh, instanceId}
        this._savedInstanceMatrices = new Map(); // 'uuid_instanceId' → Matrix4

        // 드래그 상태 — pointerId로 추적
        this._dragPointerId = null;
        this._lastPos       = new THREE.Vector2();
        this.isDragging     = false;

        this.init();
    }

    init() {
        window.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button, #dialogue-box')) return;

            const isMobile    = window.innerWidth <= 900;
            const isRightHalf = e.clientX > window.innerWidth / 2;
            const isRightMouse = e.button === 2;

            if ((isMobile && isRightHalf) || (!isMobile && isRightMouse)) {
                if (this._dragPointerId === null) {
                    this._dragPointerId = e.pointerId;
                    this.isDragging     = true;
                    this._lastPos.set(e.clientX, e.clientY);
                }
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (e.pointerId !== this._dragPointerId) return;

            const deltaX = e.clientX - this._lastPos.x;
            const deltaY = e.clientY - this._lastPos.y;

            const speed = window.innerWidth <= 900 ? 0.012 : this.orbitSpeed;
            this.targetTheta -= deltaX * speed;
            this.targetPhi    = Math.max(0.22, Math.min(Math.PI * 0.46,
                                    this.targetPhi + deltaY * speed));

            this._lastPos.set(e.clientX, e.clientY);
        });

        const releasePointer = (e) => {
            if (e.pointerId === this._dragPointerId) {
                this._dragPointerId = null;
                this.isDragging     = false;
            }
        };
        window.addEventListener('pointerup',     releasePointer);
        window.addEventListener('pointercancel', releasePointer);

        // 줌 제거 — wheel 이벤트 없음

        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // ── 오클루전 투명화 ───────────────────────────────────
    _updateOcclusion(targetPos) {
        if (!this._scene) return;

        // 캐릭터 머리 위치 → 카메라 방향으로 레이 발사
        const origin    = targetPos.clone().add(new THREE.Vector3(0, 1.8, 0));
        const camPos    = this.camera.position;
        const dir       = camPos.clone().sub(origin).normalize();
        const maxDist   = origin.distanceTo(camPos);

        // Sprite 레이캐스트에는 camera 필수
        this._raycaster.camera = this.camera;
        this._raycaster.set(origin, dir);
        const hits = this._raycaster.intersectObjects(this._scene.children, true);

        const nowOccluded          = new Set();
        const nowOccludedInstances = new Map(); // key → {mesh, instanceId}

        for (const hit of hits) {
            if (hit.distance >= maxDist - 0.5) break;
            if (hit.distance < 0.3) continue;   // 발 아래 지형 스킵

            const obj = hit.object;
            if (obj.isSprite) continue;          // 구 이름 레이블 스킵
            if (!obj.isMesh) continue;

            if (obj.isInstancedMesh) {
                // 나무: 개별 인스턴스를 키로 관리
                const key = `${obj.uuid}_${hit.instanceId}`;
                nowOccludedInstances.set(key, { mesh: obj, instanceId: hit.instanceId });
                continue;
            }

            // 원래부터 반투명인 오브젝트(강, 바다 등) 스킵
            if (obj.material.transparent && obj.material.opacity < 0.5) continue;
            nowOccluded.add(obj);
        }

        // ── 일반 Mesh 복원 / 투명화 ───────────────────────────
        for (const obj of this._occluded) {
            if (!nowOccluded.has(obj)) {
                const saved = this._savedMaterials.get(obj);
                if (saved) {
                    obj.material.transparent = saved.transparent;
                    obj.material.opacity     = saved.opacity;
                    obj.material.needsUpdate = true;
                }
                this._savedMaterials.delete(obj);
                this._occluded.delete(obj);
            }
        }
        for (const obj of nowOccluded) {
            if (!this._occluded.has(obj)) {
                this._savedMaterials.set(obj, {
                    transparent: obj.material.transparent,
                    opacity:     obj.material.opacity,
                });
                obj.material.transparent = true;
                obj.material.opacity     = 0.18;
                obj.material.needsUpdate = true;
                this._occluded.add(obj);
            }
        }

        // ── InstancedMesh (나무) 개별 인스턴스 복원 / 숨김 ───
        for (const [key, { mesh, instanceId }] of this._occludedInstances) {
            if (!nowOccludedInstances.has(key)) {
                const saved = this._savedInstanceMatrices.get(key);
                if (saved) {
                    mesh.setMatrixAt(instanceId, saved);
                    mesh.instanceMatrix.needsUpdate = true;
                }
                this._savedInstanceMatrices.delete(key);
                this._occludedInstances.delete(key);
            }
        }
        for (const [key, { mesh, instanceId }] of nowOccludedInstances) {
            if (!this._occludedInstances.has(key)) {
                const mat = new THREE.Matrix4();
                mesh.getMatrixAt(instanceId, mat);
                this._savedInstanceMatrices.set(key, mat.clone());

                // 위치·회전 유지, scale만 0으로 → 사실상 숨김
                const pos = new THREE.Vector3();
                const quat = new THREE.Quaternion();
                const scl = new THREE.Vector3();
                mat.decompose(pos, quat, scl);
                scl.setScalar(0.0001);
                mesh.setMatrixAt(instanceId, new THREE.Matrix4().compose(pos, quat, scl));
                mesh.instanceMatrix.needsUpdate = true;

                this._occludedInstances.set(key, { mesh, instanceId });
            }
        }
    }

    update(playerVelocity) {
        if (!this.target) return;

        // 이동 중 카메라 자동 정렬 (드래그 중 아닐 때만)
        if (playerVelocity && playerVelocity.length() > 0.05 && !this.isDragging) {
            const movementTheta = Math.atan2(playerVelocity.x, playerVelocity.z);
            this.targetTheta = this.lerpAngle(this.targetTheta, movementTheta + Math.PI, 0.02);
        }

        // 보간
        this.theta    = THREE.MathUtils.lerp(this.theta,    this.targetTheta,   this.rotationSmoothing);
        this.phi      = THREE.MathUtils.lerp(this.phi,      this.targetPhi,     this.rotationSmoothing);
        this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance, 0.1);

        // 구형 → XYZ
        const x = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
        const y = this.distance * Math.cos(this.phi);
        const z = this.distance * Math.sin(this.phi) * Math.cos(this.theta);

        // 오른쪽 어깨 오프셋
        const rightX =  Math.cos(this.theta);
        const rightZ = -Math.sin(this.theta);

        const targetPos = new THREE.Vector3();
        this.target.getWorldPosition(targetPos);

        this.camera.position.set(
            targetPos.x + x + rightX * this.shoulderOffset,
            targetPos.y + y,
            targetPos.z + z + rightZ * this.shoulderOffset
        );
        this.camera.lookAt(targetPos.clone().add(new THREE.Vector3(0, 1.8, 0)));

        // 오클루전 체크
        this._updateOcclusion(targetPos);
    }

    lerpAngle(a, b, t) {
        const diff = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
        return a + (diff < -Math.PI ? diff + Math.PI * 2 : diff) * t;
    }
}
