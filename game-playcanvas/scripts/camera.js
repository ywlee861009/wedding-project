/**
 * 🎥 CameraScript — PlayCanvas 버전
 * 앱 생성 이후에 registerCameraScript(app) 호출 필요
 */
window.registerCameraScript = function (app) {
const CameraScript = pc.createScript('cameraScript', app);

CameraScript.prototype.initialize = function () {
    this.distance       = 25;
    this.theta          = Math.PI / 4;
    this.phi            = Math.PI / 3;
    this.targetTheta    = this.theta;
    this.targetPhi      = this.phi;
    this.targetDistance = this.distance;

    this._dragActive = false;
    this._lastX = 0;
    this._lastY = 0;
    this._dragId = null;

    const canvas = this.app.graphicsDevice.canvas;

    // ── 포인터 드래그 ──────────────────────────────────
    canvas.addEventListener('pointerdown', (e) => {
        if (e.target.closest && e.target.closest('button, #dialogue-box')) return;
        const isMobile   = window.innerWidth <= 900;
        const isRight    = e.clientX > window.innerWidth / 2;
        const isRMouse   = e.button === 2;
        if ((isMobile && isRight) || (!isMobile && isRMouse)) {
            if (this._dragId === null) {
                this._dragId = e.pointerId;
                this._dragActive = true;
                this._lastX = e.clientX;
                this._lastY = e.clientY;
            }
        }
    });

    canvas.addEventListener('pointermove', (e) => {
        if (e.pointerId !== this._dragId) return;
        const speed = window.innerWidth <= 900 ? 0.012 : 0.005;
        this.targetTheta -= (e.clientX - this._lastX) * speed;
        this.targetPhi    = Math.max(0.2, Math.min(Math.PI / 2.2,
            this.targetPhi + (e.clientY - this._lastY) * speed));
        this._lastX = e.clientX;
        this._lastY = e.clientY;
    });

    const release = (e) => {
        if (e.pointerId === this._dragId) {
            this._dragId = null;
            this._dragActive = false;
        }
    };
    canvas.addEventListener('pointerup',     release);
    canvas.addEventListener('pointercancel', release);

    // 마우스 휠 줌
    canvas.addEventListener('wheel', (e) => {
        this.targetDistance = Math.max(10, Math.min(60, this.targetDistance + e.deltaY * 0.05));
    });

    canvas.addEventListener('contextmenu', e => e.preventDefault());
};

CameraScript.prototype.update = function (dt) {
    const player = window.GAME && window.GAME.player;
    if (!player) return;

    // 인트로 중 건너뜀
    if (window.GAME.introActive) return;

    // 이동 중 카메라 자동 정렬
    const vel = window.GAME.playerVelocity;
    if (vel && (Math.abs(vel.x) > 0.05 || Math.abs(vel.z) > 0.05) && !this._dragActive) {
        const movementTheta = Math.atan2(vel.x, vel.z);
        this.targetTheta = this._lerpAngle(this.targetTheta, movementTheta + Math.PI, 0.02);
    }

    // 보간
    const _lerp = (a, b, t) => a + (b - a) * t;
    this.theta    = _lerp(this.theta,    this.targetTheta,   0.05);
    this.phi      = _lerp(this.phi,      this.targetPhi,     0.05);
    this.distance = _lerp(this.distance, this.targetDistance, 0.1);

    const targetPos = player.getPosition();
    const x = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
    const y = this.distance * Math.cos(this.phi);
    const z = this.distance * Math.sin(this.phi) * Math.cos(this.theta);

    this.entity.setPosition(targetPos.x + x, targetPos.y + y, targetPos.z + z);
    this.entity.lookAt(new pc.Vec3(targetPos.x, targetPos.y + 1.5, targetPos.z));
};

CameraScript.prototype._lerpAngle = function (a, b, t) {
    const diff = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
    return a + (diff < -Math.PI ? diff + Math.PI * 2 : diff) * t;
};
}; // end registerCameraScript
