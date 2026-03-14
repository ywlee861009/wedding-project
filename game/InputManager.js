/**
 * 🕹️ InputManager V4 - Coastal World Standard
 * WASD + Click-to-Move + Orbit Drag를 통합한 하이엔드 입력 시스템입니다.
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.moveVector = new THREE.Vector2(0, 0);
        this.isJumping = false;

        // 마우스/터치 상태
        this.isPointerDown = false;
        this.pointerButton = -1; // 0: Left, 2: Right
        this.pointerScreenPos = new THREE.Vector2();
        
        // 조이스틱 UI (모바일용은 유지)
        this.base = document.getElementById('joystick-base');
        this.knob = document.getElementById('joystick-knob');
        this.jumpBtn = document.getElementById('btn-jump');

        this.init();
    }

    init() {
        // 키보드
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.isJumping = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.isJumping = false;
        });

        // 포인터 이벤트 (마우스/터치 통합)
        window.addEventListener('pointerdown', (e) => {
            this.isPointerDown = true;
            this.pointerButton = e.button;
            this.pointerScreenPos.set(e.clientX, e.clientY);
            
            // 모바일 조이스틱 처리 (왼쪽 절반)
            if (window.innerWidth <= 768 && e.clientX < window.innerWidth / 2) {
                this.base.style.display = 'block';
                this.base.style.left = `${e.clientX - 50}px`;
                this.base.style.top = `${e.clientY - 50}px`;
                this.joystickStartPos = new THREE.Vector2(e.clientX, e.clientY);
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isPointerDown) return;
            this.pointerScreenPos.set(e.clientX, e.clientY);

            // 모바일 조이스틱 이동 계산
            if (window.innerWidth <= 768 && this.joystickStartPos) {
                const dist = Math.hypot(e.clientX - this.joystickStartPos.x, e.clientY - this.joystickStartPos.y);
                const angle = Math.atan2(e.clientY - this.joystickStartPos.y, e.clientX - this.joystickStartPos.x);
                const moveDist = Math.min(dist, 50);
                const moveX = Math.cos(angle) * moveDist;
                const moveY = Math.sin(angle) * moveDist;
                this.knob.style.transform = `translate(${moveX}px, ${moveY}px)`;
                this.moveVector.set(moveX / 50, moveY / 50);
            }
        });

        window.addEventListener('pointerup', () => {
            this.isPointerDown = false;
            this.pointerButton = -1;
            this.base.style.display = 'none';
            this.moveVector.set(0, 0);
            this.joystickStartPos = null;
        });

        // 점프 버튼 (모바일)
        if (this.jumpBtn) {
            this.jumpBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.isJumping = true;
            });
            this.jumpBtn.addEventListener('pointerup', () => this.isJumping = false);
        }
    }

    update() {
        let x = 0;
        let z = 0;

        // 1. WASD 입력
        if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

        // 2. 마우스 클릭 이동 (Coastal World 스타일)
        // 왼쪽 마우스 버튼(0)을 꾹 누르고 있을 때
        if (this.isPointerDown && this.pointerButton === 0 && window.innerWidth > 768) {
            // 화면 중심에서 마우스 위치까지의 방향 계산
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const dirX = this.pointerScreenPos.x - centerX;
            const dirY = this.pointerScreenPos.y - centerY;
            
            // 일정 거리 이상일 때만 이동 (Deadzone)
            if (Math.hypot(dirX, dirY) > 20) {
                const angle = Math.atan2(dirY, dirX);
                x = Math.cos(angle);
                z = Math.sin(angle);
            }
        }

        // 3. 모바일 조이스틱 입력
        if (window.innerWidth <= 768 && this.moveVector.length() > 0) {
            x = this.moveVector.x;
            z = this.moveVector.y;
        }

        // 입력 벡터 정규화
        if (x !== 0 || z !== 0) {
            const len = Math.sqrt(x * x + z * z);
            x /= len; z /= len;
        }

        return { x, z, jump: this.isJumping, isRightDragging: (this.isPointerDown && this.pointerButton === 2) };
    }
}
