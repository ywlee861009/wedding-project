/**
 * 🕹️ InputManager - Keyboard & Virtual Joystick Unified System
 * 30년차 케로의 노하우가 담긴 통합 입력 관리자입니다.
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.moveVector = new THREE.Vector2(0, 0);
        this.isJumping = false;

        // 조이스틱 관련 상태
        this.joystickActive = false;
        this.joystickBasePos = new THREE.Vector2(0, 0);
        this.joystickCurrentPos = new THREE.Vector2(0, 0);
        this.maxJoystickDistance = 50;

        this.initKeyboard();
        this.initJoystick();
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.isJumping = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.isJumping = false;
        });
    }

    initJoystick() {
        const container = document.getElementById('joystick-container');
        const knob = document.getElementById('joystick-knob');
        if (!container || !knob) return;

        // 모바일 터치 이벤트
        const handleTouch = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dist = Math.min(
                this.maxJoystickDistance,
                Math.hypot(touch.clientX - centerX, touch.clientY - centerY)
            );
            const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);

            const moveX = Math.cos(angle) * dist;
            const moveY = Math.sin(angle) * dist;

            knob.style.transform = `translate(${moveX}px, ${moveY}px)`;
            
            // 이동 벡터 정규화 (-1 ~ 1)
            this.moveVector.x = moveX / this.maxJoystickDistance;
            this.moveVector.y = moveY / this.maxJoystickDistance;
            this.joystickActive = true;
        };

        container.addEventListener('touchstart', (e) => {
            container.style.opacity = '1';
            handleTouch(e);
        });

        container.addEventListener('touchmove', handleTouch);

        container.addEventListener('touchend', () => {
            container.style.opacity = '0.5';
            knob.style.transform = `translate(0px, 0px)`;
            this.moveVector.set(0, 0);
            this.joystickActive = false;
        });

        // 점프 버튼 전용 이벤트
        const jumpBtn = document.getElementById('btn-jump');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.isJumping = true;
            });
            jumpBtn.addEventListener('touchend', () => {
                this.isJumping = false;
            });
        }
    }

    /**
     * 매 프레임 업데이트하여 통합된 이동 벡터를 반환합니다.
     */
    update() {
        if (this.joystickActive) {
            return { x: this.moveVector.x, z: this.moveVector.y, jump: this.isJumping };
        }

        let x = 0;
        let z = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

        // 대각선 이동 속도 보정 (정규화)
        if (x !== 0 && z !== 0) {
            const length = Math.sqrt(x * x + z * z);
            x /= length;
            z /= length;
        }

        return { x, z, jump: this.isJumping };
    }
}
