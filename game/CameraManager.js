/**
 * 🎥 CameraManager - Smooth 3rd Person Follow System
 * 플레이어를 부드럽게 추적하고 회전시키는 카메라 관리 모듈입니다.
 */
export class CameraManager {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target; // 추적 대상 (PlayerEntity.group)

        // 설정값
        this.offset = new THREE.Vector3(-12, 8, 0); // 플레이어 기준 기본 위치
        this.lookAtOffset = new THREE.Vector3(5, 1, 0); // 플레이어 기준 주시점
        this.followSpeed = 0.08; // 카메라 추적 속도 (0 ~ 1, 낮을수록 부드러움)
        
        // 회전 상태
        this.rotationY = 0;
        this.rotationX = -0.3; // 약간 아래를 내려다봄

        this.initEvents();
    }

    initEvents() {
        // 나중에 마우스/터치 드래그로 카메라 회전을 원할 경우 여기서 구현
    }

    /**
     * 매 프레임 업데이트하여 카메라 위치를 보간합니다.
     */
    update() {
        if (!this.target) return;

        // 1. 목표 위치 계산
        // 플레이어의 현재 위치에 오프셋을 더함
        const idealOffset = this.offset.clone();
        // 플레이어의 회전에 맞춰 오프셋도 회전시키고 싶다면 여기에 로직 추가 가능
        
        const targetPos = this.target.position.clone().add(idealOffset);
        
        // 2. 현재 카메라 위치를 목표 위치로 부드럽게 이동 (Lerp)
        this.camera.position.lerp(targetPos, this.followSpeed);

        // 3. 주시점 설정
        const lookAtPos = this.target.position.clone().add(this.lookAtOffset);
        this.camera.lookAt(lookAtPos);
    }
}
