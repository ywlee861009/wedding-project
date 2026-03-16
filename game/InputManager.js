/**
 * 🕹️ InputManager V5 - 멀티터치 + pointercancel 지원
 */
export class InputManager {
    constructor() {
        this.keys = {};
        this.moveVector = new THREE.Vector2(0, 0);
        this.isJumping = false;

        // 마우스/터치 상태
        this.isPointerDown = false;
        this.pointerButton = -1;
        this.pointerScreenPos = new THREE.Vector2();

        // 조이스틱 UI
        this.base = document.getElementById('joystick-base');
        this.knob = document.getElementById('joystick-knob');
        this.jumpBtn = document.getElementById('btn-jump');

        // 조이스틱 전용 pointerId (멀티터치 구분)
        this._joystickPointerId = null;
        this._joystickStartPos  = null;

        // 마우스 클릭 이동 전용 pointerId
        this._movePointerId = null;

        this.init();
    }

    init() {
        // ── 키보드 ──────────────────────────────────────
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.isJumping = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.isJumping = false;
        });

        // ── 포인터 다운 ──────────────────────────────────
        window.addEventListener('pointerdown', (e) => {
            // UI 버튼 위에서는 무시 (interact-btn, jump 등)
            if (e.target.closest('button, #dialogue-box')) return;

            if (window.innerWidth <= 900 && e.clientX < window.innerWidth / 2) {
                // 모바일 조이스틱 (왼쪽 절반)
                if (this._joystickPointerId === null) {
                    this._joystickPointerId = e.pointerId;
                    this._joystickStartPos  = new THREE.Vector2(e.clientX, e.clientY);
                    this.base.style.display = 'block';
                    this.base.style.left = `${e.clientX - 50}px`;
                    this.base.style.top  = `${e.clientY - 50}px`;
                }
            } else if (window.innerWidth > 900) {
                // 데스크톱 클릭 이동
                this.isPointerDown = true;
                this.pointerButton = e.button;
                this._movePointerId = e.pointerId;
                this.pointerScreenPos.set(e.clientX, e.clientY);
            }
        });

        // ── 포인터 이동 ──────────────────────────────────
        window.addEventListener('pointermove', (e) => {
            // 조이스틱
            if (e.pointerId === this._joystickPointerId && this._joystickStartPos) {
                const dx   = e.clientX - this._joystickStartPos.x;
                const dy   = e.clientY - this._joystickStartPos.y;
                const dist = Math.hypot(dx, dy);
                const cap  = Math.min(dist, 50);
                const nx   = dx / dist * cap;
                const ny   = dy / dist * cap;
                if (this.knob) this.knob.style.transform = `translate(${nx}px, ${ny}px)`;
                this.moveVector.set(nx / 50, ny / 50);
            }

            // 데스크톱 클릭 이동
            if (e.pointerId === this._movePointerId && this.isPointerDown) {
                this.pointerScreenPos.set(e.clientX, e.clientY);
            }
        });

        // ── 포인터 업 / 캔슬 (동일 처리) ──────────────────
        const releasePointer = (e) => {
            if (e.pointerId === this._joystickPointerId) {
                this._resetJoystick();
            }
            if (e.pointerId === this._movePointerId) {
                this.isPointerDown = false;
                this.pointerButton = -1;
                this._movePointerId = null;
            }
        };
        window.addEventListener('pointerup',     releasePointer);
        window.addEventListener('pointercancel', releasePointer);

        // ── 점프 버튼 (모바일) ────────────────────────────
        if (this.jumpBtn) {
            this.jumpBtn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.isJumping = true;
            });
            this.jumpBtn.addEventListener('pointerup',     () => { this.isJumping = false; });
            this.jumpBtn.addEventListener('pointercancel', () => { this.isJumping = false; });
        }
    }

    _resetJoystick() {
        this._joystickPointerId = null;
        this._joystickStartPos  = null;
        this.moveVector.set(0, 0);
        if (this.base) this.base.style.display = 'none';
        if (this.knob) this.knob.style.transform = 'translate(0,0)';
    }

    update() {
        let x = 0;
        let z = 0;

        // 1. WASD
        if (this.keys['KeyW'] || this.keys['ArrowUp'])    z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown'])  z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft'])  x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

        // 2. 데스크톱 클릭 이동 (왼쪽 버튼 꾹)
        if (this.isPointerDown && this.pointerButton === 0 && window.innerWidth > 900) {
            const dirX = this.pointerScreenPos.x - window.innerWidth  / 2;
            const dirY = this.pointerScreenPos.y - window.innerHeight / 2;
            if (Math.hypot(dirX, dirY) > 20) {
                const angle = Math.atan2(dirY, dirX);
                x = Math.cos(angle);
                z = Math.sin(angle);
            }
        }

        // 3. 모바일 조이스틱
        if (this.moveVector.length() > 0.05) {
            x = this.moveVector.x;
            z = this.moveVector.y;
        }

        // 정규화
        const len = Math.sqrt(x * x + z * z);
        if (len > 0.001) { x /= len; z /= len; }

        return {
            x, z,
            jump: this.isJumping,
            isRightDragging: (this.isPointerDown && this.pointerButton === 2)
        };
    }
}
