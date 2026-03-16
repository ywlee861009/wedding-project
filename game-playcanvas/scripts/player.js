/**
 * 🧑 PlayerScript — PlayCanvas 버전
 * 앱 생성 이후에 registerPlayerScript(app) 호출 필요
 */
window.registerPlayerScript = function (app) {
const PlayerScript = pc.createScript('playerScript', app);

PlayerScript.prototype.initialize = function () {
    this.keys      = {};
    this.velocityX = 0;
    this.velocityZ = 0;
    this.velocityY = 0;
    this.friction  = 0.93;
    this.maxSpeed  = CONFIG.PHYSICS.MOVE_SPEED;
    this.accel     = 1.8;

    window.addEventListener('keydown', e => { this.keys[e.code] = true;  });
    window.addEventListener('keyup',   e => { this.keys[e.code] = false; });

    // GLB 모델 로드 시도
    this._loadModel();
};

PlayerScript.prototype._loadModel = function () {
    const asset = new pc.Asset('groom', 'container', { url: CONFIG.PLAYER.MODEL_PATH });
    this.app.assets.add(asset);
    asset.ready(() => {
        const modelEntity = asset.resource.instantiateRenderEntity({
            castShadows: true, receiveShadows: true
        });
        modelEntity.setLocalScale(0.012, 0.012, 0.012);
        // PlayCanvas GLB 좌표계 보정 (Blender Z-up → Y-up)
        modelEntity.setLocalEulerAngles(-90, 180, 0);
        this.entity.addChild(modelEntity);
        this._model = modelEntity;
        this._animState = null;

        // idle / walk 애니메이션 찾아서 등록
        const anims = asset.resource.animations;
        if (anims && anims.length > 0) {
            try {
                modelEntity.addComponent('anim', { activate: true });

                // 애니메이션 이름으로 idle / walk 구분
                let idleClip = null, walkClip = null;
                for (const a of anims) {
                    const n = (a.name || '').toLowerCase();
                    if (!idleClip && (n.includes('idle') || n.includes('stand'))) idleClip = a;
                    if (!walkClip && (n.includes('walk') || n.includes('run')))   walkClip = a;
                }
                idleClip = idleClip || anims[0];
                walkClip = walkClip || anims[Math.min(1, anims.length - 1)];

                modelEntity.anim.assignAnimation('idle', idleClip.resource, 1.0, true);
                if (walkClip !== idleClip) {
                    modelEntity.anim.assignAnimation('walk', walkClip.resource, 1.0, true);
                }
                modelEntity.anim.baseLayer.play('idle');
                this._animState = 'idle';
                this._hasWalk   = (walkClip !== idleClip);
            } catch (e) {
                console.warn('Player anim 실패:', e.message);
            }
        }
    });
    asset.on('error', () => {
        // 폴백: 파란 캡슐
        const fallback = new pc.Entity('fallback');
        fallback.addComponent('render', { type: 'capsule' });
        const mat = new pc.StandardMaterial();
        mat.diffuse = hexToPC(CONFIG.PLAYER.COLOR);
        mat.update();
        fallback.render.material = mat;
        fallback.setLocalScale(0.8, 1.2, 0.8);
        fallback.setLocalPosition(0, 0.6, 0);
        this.entity.addChild(fallback);
    });
    this.app.assets.load(asset);
};

PlayerScript.prototype.update = function (dt) {
    if (window.GAME.introActive) return;
    if (window.GAME.dialogueActive) {
        this.velocityX = 0;
        this.velocityZ = 0;
        return;
    }

    const terrain = window.GAME.terrain;
    const camera  = window.GAME.camera;

    // ── 입력 수집 ──────────────────────────────────────
    let ix = 0, iz = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp'])    iz -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown'])  iz += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft'])  ix -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;

    // 조이스틱
    const jv = window.GAME.joystickVector;
    if (jv && (Math.abs(jv.x) > 0.05 || Math.abs(jv.y) > 0.05)) {
        ix = jv.x;
        iz = jv.y;
    }

    // ── 카메라 방향에 상대적 이동 ──────────────────────
    if (ix !== 0 || iz !== 0) {
        const camPos = camera.getPosition();
        const playerPos = this.entity.getPosition();
        const camAngle  = Math.atan2(camPos.x - playerPos.x, camPos.z - playerPos.z);

        const rotX = ix * Math.cos(camAngle) + iz * Math.sin(camAngle);
        const rotZ = -ix * Math.sin(camAngle) + iz * Math.cos(camAngle);

        this.velocityX += rotX * this.accel * 0.01;
        this.velocityZ += rotZ * this.accel * 0.01;

        const speed = Math.sqrt(this.velocityX**2 + this.velocityZ**2);
        if (speed > this.maxSpeed) {
            this.velocityX = (this.velocityX / speed) * this.maxSpeed;
            this.velocityZ = (this.velocityZ / speed) * this.maxSpeed;
        }

        // 진행 방향으로 회전
        const targetRot = Math.atan2(rotX, rotZ) * (180 / Math.PI);
        const curRot    = this.entity.getLocalEulerAngles().y;
        let diff = targetRot - curRot;
        while (diff < -180) diff += 360;
        while (diff >  180) diff -= 360;
        this.entity.setLocalEulerAngles(0, curRot + diff * 0.15, 0);
    }

    // 마찰
    this.velocityX *= this.friction;
    this.velocityZ *= this.friction;
    if (Math.abs(this.velocityX) < 0.001) this.velocityX = 0;
    if (Math.abs(this.velocityZ) < 0.001) this.velocityZ = 0;

    // 전역 velocity 공유 (카메라 자동 정렬용)
    window.GAME.playerVelocity = { x: this.velocityX, z: this.velocityZ };

    // ── 애니메이션 전환 (idle ↔ walk) ─────────────────
    const isMoving = Math.abs(this.velocityX) > 0.01 || Math.abs(this.velocityZ) > 0.01;
    this._switchAnim(isMoving ? 'walk' : 'idle');

    // ── 수평 이동 + 경계/한강 충돌 ────────────────────
    const BOUND_X = 300, BOUND_Z = 240;
    const pos = this.entity.getPosition();
    const nx  = pos.x + this.velocityX;
    const nz  = pos.z + this.velocityZ;

    const outBounds = (nx/( BOUND_X+1))**2 + (nz/(BOUND_Z+1))**2 >= 1;
    const inRiver   = !terrain.canMoveTo(nx, nz);

    if (!outBounds && !inRiver) {
        this.entity.setPosition(nx, pos.y, nz);
    } else if (!outBounds && inRiver) {
        // 강변 슬라이딩
        if (terrain.canMoveTo(pos.x + this.velocityX, pos.z))
            this.entity.setPosition(pos.x + this.velocityX, pos.y, pos.z);
        else if (terrain.canMoveTo(pos.x, pos.z + this.velocityZ))
            this.entity.setPosition(pos.x, pos.y, pos.z + this.velocityZ);
        this.velocityX = 0; this.velocityZ = 0;
    }

    // ── 중력 + 지형 높이 추적 ──────────────────────────
    const curPos   = this.entity.getPosition();
    const terrainH = terrain.getHeightAt(curPos.x, curPos.z);
    const groundY  = terrainH + CONFIG.PLAYER.START_Y;

    // 점프
    if ((this.keys['Space'] || window.GAME.jumpPressed) && curPos.y <= groundY + 0.05) {
        this.velocityY = CONFIG.PHYSICS.JUMP_POWER;
    }
    window.GAME.jumpPressed = false;

    this.velocityY += CONFIG.PHYSICS.GRAVITY * dt;
    const newY = curPos.y + this.velocityY * dt;

    if (newY <= groundY) {
        this.entity.setPosition(curPos.x, groundY, curPos.z);
        this.velocityY = 0;
    } else {
        this.entity.setPosition(curPos.x, newY, curPos.z);
    }
};
PlayerScript.prototype._switchAnim = function (state) {
    if (!this._model || !this._model.anim) return;
    if (state === this._animState) return;
    // walk 클립이 없으면 idle만 재생
    const target = (state === 'walk' && !this._hasWalk) ? 'idle' : state;
    if (target === this._animState) return;
    try {
        this._model.anim.baseLayer.play(target);
        this._animState = target;
    } catch (e) {}
};

}; // end registerPlayerScript
