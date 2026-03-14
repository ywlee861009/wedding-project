/**
 * 🎥 CameraManager V3 - Free Orbit & Smart Follow System
 * Coastal World 스타일의 자유 시점 및 스마트 추적 시스템입니다.
 */
export class CameraManager {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target; // 추적 대상 (PlayerEntity.group)

        // 구형 좌표계 설정 (Orbit)
        this.distance = 25;
        this.theta = 0; // 수평 회전
        this.phi = Math.PI / 4; // 수직 회전 (45도)
        
        // 보간용 목표값
        this.targetTheta = 0;
        this.targetPhi = Math.PI / 4;
        this.targetDistance = 25;

        // 제한값
        this.minPhi = 0.1;
        this.maxPhi = Math.PI / 2.1;
        this.minDistance = 10;
        this.maxDistance = 50;

        // 드래그 상태
        this.isDragging = false;
        this.pointerId = null;
        this.lastPointerPos = new THREE.Vector2();

        this.init();
    }

    init() {
        // 화면 오른쪽 절반 드래그로 회전
        window.addEventListener('pointerdown', (e) => {
            if (e.clientX > window.innerWidth / 2) {
                this.isDragging = true;
                this.pointerId = e.pointerId;
                this.lastPointerPos.set(e.clientX, e.clientY);
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || e.pointerId !== this.pointerId) return;

            const deltaX = e.clientX - this.lastPointerPos.x;
            const deltaY = e.clientY - this.lastPointerPos.y;

            this.targetTheta -= deltaX * 0.005;
            this.targetPhi += deltaY * 0.005;
            this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi));

            this.lastPointerPos.set(e.clientX, e.clientY);
        });

        window.addEventListener('pointerup', (e) => {
            if (e.pointerId === this.pointerId) {
                this.isDragging = false;
                this.pointerId = null;
            }
        });

        // 휠 줌 기능
        window.addEventListener('wheel', (e) => {
            this.targetDistance += e.deltaY * 0.05;
            this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
        });
    }

    /**
     * 매 프레임 업데이트하여 카메라 위치를 계산합니다.
     */
    update() {
        if (!this.target) return;

        // 1. 값 보간 (Smoothing)
        this.theta = THREE.MathUtils.lerp(this.theta, this.targetTheta, 0.1);
        this.phi = THREE.MathUtils.lerp(this.phi, this.targetPhi, 0.1);
        this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance, 0.1);

        // 2. 구형 좌표계를 직교 좌표계(XYZ)로 변환
        const x = this.distance * Math.sin(this.phi) * Math.cos(this.theta);
        const y = this.distance * Math.cos(this.phi);
        const z = this.distance * Math.sin(this.phi) * Math.sin(this.theta);

        // 3. 카메라 위치 설정
        const targetWorldPos = new THREE.Vector3();
        this.target.getWorldPosition(targetWorldPos);
        
        this.camera.position.set(
            targetWorldPos.x + x,
            targetWorldPos.y + y,
            targetWorldPos.z + z
        );

        // 4. 캐릭터 주시 (약간 위를 주시하여 발쪽이 아닌 몸쪽을 보게 함)
        const lookAtTarget = targetWorldPos.clone().add(new THREE.Vector3(0, 1.5, 0));
        this.camera.lookAt(lookAtTarget);

        // 5. 스마트 팔로우: 이동 시 캐릭터 뒤쪽으로 서서히 정렬
        // 플레이어의 현재 진행 방향(velocity)을 감지하여 시점 조정 가능 (추가 예정)
    }
}
