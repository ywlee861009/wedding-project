/**
 * 🕹️ InputManager V6 — coastalworld 스타일 플로팅 조이스틱
 *
 * 핵심 수정사항:
 *  1. { passive: false } + preventDefault  → 브라우저 스크롤/줌 개입 차단
 *  2. setPointerCapture                    → 빠른 드래그 시 포인터 추적 유지
 *  3. pointercancel 즉시 복원              → 조이스틱 사라짐 현상 방지
 *  4. 조이스틱 반경(55px) 내 아날로그 입력  → 거리 비례 속도 (정규화 없이 그대로)
 */
export class InputManager {
    constructor() {
        this.keys       = {};
        this.moveVector = new THREE.Vector2(0, 0);
        this.isJumping  = false;

        this.base = document.getElementById('joystick-base');
        this.knob = document.getElementById('joystick-knob');
        this.jumpBtn = document.getElementById('btn-jump');

        this._joystickPointerId = null;
        this._joystickCenter    = new THREE.Vector2();
        this._RADIUS            = 55;   // joystick-base 반지름 (CSS 110px / 2)

        this.init();
    }

    init() {
        // ── 터치 기기 감지 → 점프 버튼 표시 ─────────────────
        if (navigator.maxTouchPoints > 0 || 'ontouchstart' in window) {
            if (this.jumpBtn) this.jumpBtn.style.display = 'flex';
        }

        // ── 키보드 ───────────────────────────────────────────
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.isJumping = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.isJumping = false;
        });

        // ── 포인터 다운 ── { passive: false } 필수 ──────────
        window.addEventListener('pointerdown', (e) => {
            // UI 버튼 위 무시
            if (e.target.closest('button, #dialogue-box')) return;

            const isMobile = e.pointerType === 'touch' || window.innerWidth <= 900;
            if (!isMobile) return;

            // 화면 왼쪽 절반 → 조이스틱
            if (e.clientX < window.innerWidth / 2) {
                if (this._joystickPointerId !== null) return; // 이미 조이스틱 활성

                e.preventDefault();

                this._joystickPointerId = e.pointerId;
                this._joystickCenter.set(e.clientX, e.clientY);

                // 포인터 캡처 → 손가락이 빠르게 움직여도 추적 유지
                try { e.target.setPointerCapture(e.pointerId); } catch (_) {}

                // 조이스틱 베이스 위치 (터치 지점 중앙)
                const r = this._RADIUS;
                this.base.style.left = `${e.clientX - r}px`;
                this.base.style.top  = `${e.clientY - r}px`;
                this.base.classList.add('active');
                // display:block이 필요 (transition이 display none에선 안 작동)
                this.base.style.display = 'block';
                requestAnimationFrame(() => this.base.style.opacity = '1');
            }
        }, { passive: false });

        // ── 포인터 이동 ──────────────────────────────────────
        window.addEventListener('pointermove', (e) => {
            if (e.pointerId !== this._joystickPointerId) return;
            e.preventDefault();

            const dx   = e.clientX - this._joystickCenter.x;
            const dy   = e.clientY - this._joystickCenter.y;
            const dist = Math.hypot(dx, dy);
            const r    = this._RADIUS;
            const cap  = Math.min(dist, r);

            // 노브 위치 (베이스 중앙 기준 translate)
            const nx = dist > 0.01 ? (dx / dist) * cap : 0;
            const ny = dist > 0.01 ? (dy / dist) * cap : 0;
            this.knob.style.transform = `translate(${nx}px, ${ny}px)`;

            // moveVector: -1 ~ 1 (거리 비례 아날로그)
            this.moveVector.set(nx / r, ny / r);
        }, { passive: false });

        // ── 포인터 업 / 캔슬 ─────────────────────────────────
        const release = (e) => {
            if (e.pointerId === this._joystickPointerId) {
                this._resetJoystick();
            }
        };
        window.addEventListener('pointerup',     release);
        window.addEventListener('pointercancel', release);

        // ── 점프 버튼 ────────────────────────────────────────
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
        this.moveVector.set(0, 0);
        if (this.base) {
            this.base.style.opacity = '0';
            // opacity transition(0.08s) 후 display none
            setTimeout(() => {
                if (this._joystickPointerId === null) {
                    this.base.style.display = 'none';
                    this.base.classList.remove('active');
                }
            }, 100);
        }
        if (this.knob) this.knob.style.transform = 'translate(0px, 0px)';
    }

    update() {
        let x = 0, z = 0;

        // 1. WASD / 방향키
        if (this.keys['KeyW'] || this.keys['ArrowUp'])    z -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown'])  z += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft'])  x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

        // 2. 조이스틱 (데드존 0.08 이상일 때만)
        if (this.moveVector.length() > 0.08) {
            x = this.moveVector.x;
            z = this.moveVector.y;
        }

        // 정규화 (대각 이동 속도 보정)
        const len = Math.hypot(x, z);
        if (len > 0.001) { x /= len; z /= len; }

        return { x, z, jump: this.isJumping };
    }
}
