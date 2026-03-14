/**
 * 🕹️ InputManager V3 - Floating Joystick & Unified System
 * Coastal World 스타일의 플로팅 조이스틱과 키보드 통합 시스템입니다.
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.moveVector = new THREE.Vector2(0, 0);
        this.isJumping = false;

        // 조이스틱 DOM 요소
        this.base = document.getElementById('joystick-base');
        this.knob = document.getElementById('joystick-knob');
        this.jumpBtn = document.getElementById('btn-jump');

        // 상태 변수
        this.active = false;
        this.touchId = null;
        this.startPos = new THREE.Vector2();
        this.maxDist = 50;

        this.init();
    }

    init() {
        // PC 키보드 설정
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.isJumping = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.isJumping = false;
        });

        // 모바일 터치 및 PC 마우스 드래그 통합 (조이스틱)
        window.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));

        // 점프 버튼 (모바일 전용)
        if (this.jumpBtn) {
            if (window.innerWidth <= 768) this.jumpBtn.style.display = 'flex';
            this.jumpBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.isJumping = true;
            });
            this.jumpBtn.addEventListener('pointerup', () => this.isJumping = false);
        }
    }

    onPointerDown(e) {
        // 화면 왼쪽 절반만 조이스틱 영역으로 설정
        if (e.clientX < window.innerWidth / 2) {
            this.active = true;
            this.pointerId = e.pointerId;
            this.startPos.set(e.clientX, e.clientY);

            // 조이스틱 베이스 위치 설정 및 표시
            this.base.style.display = 'block';
            this.base.style.left = `${e.clientX - 50}px`;
            this.base.style.top = `${e.clientY - 50}px`;
            this.knob.style.transform = `translate(0px, 0px)`;
        }
    }

    onPointerMove(e) {
        if (!this.active || e.pointerId !== this.pointerId) return;

        const dist = Math.hypot(e.clientX - this.startPos.x, e.clientY - this.startPos.y);
        const angle = Math.atan2(e.clientY - this.startPos.y, e.clientX - this.startPos.x);
        
        const moveDist = Math.min(dist, this.maxDist);
        const moveX = Math.cos(angle) * moveDist;
        const moveY = Math.sin(angle) * moveDist;

        this.knob.style.transform = `translate(${moveX}px, ${moveY}px)`;

        // 이동 벡터 정규화 (-1 ~ 1)
        this.moveVector.x = moveX / this.maxDist;
        this.moveVector.y = moveY / this.maxDist;
    }

    onPointerUp(e) {
        if (e.pointerId !== this.pointerId) return;
        this.active = false;
        this.base.style.display = 'none';
        this.moveVector.set(0, 0);
    }

    update() {
        // 조이스틱이 활성화되어 있으면 조이스틱 값 우선
        if (this.active) {
            return { x: this.moveVector.x, z: this.moveVector.y, jump: this.isJumping };
        }

        // 키보드 입력 처리
        let x = 0;
        let z = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

        if (x !== 0 && z !== 0) {
            const len = Math.sqrt(x * x + z * z);
            x /= len; z /= len;
        }

        return { x, z, jump: this.isJumping };
    }
}
