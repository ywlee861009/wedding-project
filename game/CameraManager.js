/**
 * 🎥 CameraManager V5 - 멀티터치 카메라 드래그 분리
 */
export class CameraManager {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;

        // 구형 좌표계
        this.distance      = 25;
        this.theta         = Math.PI / 4;
        this.phi           = Math.PI / 3;
        this.targetTheta   = this.theta;
        this.targetPhi     = this.phi;
        this.targetDistance = this.distance;

        this.orbitSpeed        = 0.005;
        this.followSpeed       = 0.08;
        this.rotationSmoothing = 0.05;

        // 드래그 상태 — pointerId로 추적
        this._dragPointerId = null;
        this._lastPos       = new THREE.Vector2();
        this.isDragging     = false;

        this.init();
    }

    init() {
        window.addEventListener('pointerdown', (e) => {
            // UI 버튼 위에서는 무시
            if (e.target.closest('button, #dialogue-box')) return;

            const isMobile = window.innerWidth <= 900;
            const isRightHalf  = e.clientX > window.innerWidth / 2;
            const isRightMouse = e.button === 2;

            // 모바일: 오른쪽 절반 터치 → 카메라
            // 데스크톱: 우클릭 → 카메라
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

            // 모바일은 픽셀 이동이 작으므로 감도 높임
            const speed = window.innerWidth <= 900 ? 0.012 : this.orbitSpeed;
            this.targetTheta -= deltaX * speed;
            this.targetPhi    = Math.max(0.2, Math.min(Math.PI / 2.2,
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

        window.addEventListener('wheel', (e) => {
            this.targetDistance = Math.max(10, Math.min(60,
                this.targetDistance + e.deltaY * 0.05));
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());
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

        const targetPos = new THREE.Vector3();
        this.target.getWorldPosition(targetPos);

        this.camera.position.set(targetPos.x + x, targetPos.y + y, targetPos.z + z);
        this.camera.lookAt(targetPos.clone().add(new THREE.Vector3(0, 1.5, 0)));
    }

    lerpAngle(a, b, t) {
        const diff = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
        return a + (diff < -Math.PI ? diff + Math.PI * 2 : diff) * t;
    }
}
