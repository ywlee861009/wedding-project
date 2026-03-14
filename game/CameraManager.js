/**
 * 🎥 CameraManager V4 - Coastal World Spring-Arm System
 * 캐릭터 이동에 반응하는 스마트 팔로우 및 자유 시점 시스템입니다.
 */
export class CameraManager {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;

        // 구형 좌표계 상태
        this.distance = 25;
        this.theta = Math.PI / 4; // 수평 각도
        this.phi = Math.PI / 3;   // 수직 각도 (약간 내려다봄)
        
        // 목표값 (보간용)
        this.targetTheta = this.theta;
        this.targetPhi = this.phi;
        this.targetDistance = this.distance;

        // 속도 및 댐핑 설정
        this.orbitSpeed = 0.005;
        this.followSpeed = 0.08; // 캐릭터를 따라가는 속도
        this.rotationSmoothing = 0.05; // 시점 회전 부드러움

        // 드래그 상태
        this.isDragging = false;
        this.pointerId = null;
        this.lastPointerPos = new THREE.Vector2();

        this.init();
    }

    init() {
        // 화면 오른쪽 드래그로 회전 (마우스 왼쪽/오른쪽 통합 지원)
        window.addEventListener('pointerdown', (e) => {
            // 모바일이 아니고 화면 오른쪽이거나, 마우스 오른쪽 버튼(2)인 경우
            if (e.clientX > window.innerWidth / 2 || e.button === 2) {
                this.isDragging = true;
                this.pointerId = e.pointerId;
                this.lastPointerPos.set(e.clientX, e.clientY);
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDragging || e.pointerId !== this.pointerId) return;

            const deltaX = e.clientX - this.lastPointerPos.x;
            const deltaY = e.clientY - this.lastPointerPos.y;

            this.targetTheta -= deltaX * this.orbitSpeed;
            this.targetPhi += deltaY * this.orbitSpeed;
            
            // 수직 회전 제한 (바닥 아래나 정수리 위로 못 가게 함)
            this.targetPhi = Math.max(0.2, Math.min(Math.PI / 2.2, this.targetPhi));

            this.lastPointerPos.set(e.clientX, e.clientY);
        });

        window.addEventListener('pointerup', () => {
            this.isDragging = false;
            this.pointerId = null;
        });

        window.addEventListener('wheel', (e) => {
            this.targetDistance += e.deltaY * 0.05;
            this.targetDistance = Math.max(10, Math.min(60, this.targetDistance));
        });

        // 우클릭 메뉴 방지 (시점 회전을 위해)
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * 매 프레임 업데이트
     */
    update(playerVelocity) {
        if (!this.target) return;

        // 1. 스마트 팔로우 로직: 캐릭터가 빠르게 움직이면 카메라 각도를 캐릭터 뒤로 정렬
        if (playerVelocity && playerVelocity.length() > 0.05 && !this.isDragging) {
            const movementTheta = Math.atan2(playerVelocity.x, playerVelocity.z);
            // 현재 타겟 각도를 캐릭터 뒤쪽(movementTheta + PI)으로 서서히 보간
            // 이 로직은 Coastal World에서 이동 시 카메라가 정렬되는 느낌을 줍니다.
            this.targetTheta = this.lerpAngle(this.targetTheta, movementTheta + Math.PI, 0.02);
        }

        // 2. 값 보간 (Smoothing)
        this.theta = THREE.MathUtils.lerp(this.theta, this.targetTheta, this.rotationSmoothing);
        this.phi = THREE.MathUtils.lerp(this.phi, this.targetPhi, this.rotationSmoothing);
        this.distance = THREE.MathUtils.lerp(this.distance, this.targetDistance, 0.1);

        // 3. 구형 좌표계 -> XYZ 변환
        const x = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
        const y = this.distance * Math.cos(this.phi);
        const z = this.distance * Math.sin(this.phi) * Math.cos(this.theta);

        // 4. 위치 적용
        const targetPos = new THREE.Vector3();
        this.target.getWorldPosition(targetPos);
        
        this.camera.position.set(
            targetPos.x + x,
            targetPos.y + y,
            targetPos.z + z
        );

        // 5. 캐릭터 주시
        const lookAtTarget = targetPos.clone().add(new THREE.Vector3(0, 1.5, 0));
        this.camera.lookAt(lookAtTarget);
    }

    /**
     * 각도 보간 (360도 점프 방지용)
     */
    lerpAngle(a, b, t) {
        const diff = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
        return a + (diff < -Math.PI ? diff + Math.PI * 2 : diff) * t;
    }
}
