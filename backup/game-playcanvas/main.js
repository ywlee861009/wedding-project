/**
 * 💍 Wedding Journey — PlayCanvas 메인
 */
(function () {
    'use strict';

    // ── PlayCanvas 앱 초기화 ──────────────────────────
    const canvas = document.getElementById('application-canvas');
    const app = new pc.Application(canvas, {
        mouse:    new pc.Mouse(canvas),
        touch:    new pc.TouchDevice(canvas),
        keyboard: new pc.Keyboard(window),
        graphicsDeviceOptions: { antialias: true, alpha: false }
    });
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // ── 스크립트 등록 (반드시 앱 생성 직후) ──────────
    window.registerCameraScript(app);
    window.registerPlayerScript(app);

    // ── 씬 설정 (v1.x / v2.x 호환) ──────────────────
    const fogColor = hexToPC(CONFIG.SCENE.FOG_COLOR);
    if (app.scene.rendering) {
        // PlayCanvas v2.x
        app.scene.rendering.fog         = pc.FOG_EXP2 || 'exp2';
        app.scene.rendering.fogColor    = fogColor;
        app.scene.rendering.fogDensity  = CONFIG.SCENE.FOG_DENSITY;
        try { app.scene.rendering.ambientColor = new pc.Color(1, 0.96, 0.88); } catch(e) {}
    } else {
        // PlayCanvas v1.x
        try { app.scene.fog        = pc.FOG_EXP2; } catch(e) {}
        try { app.scene.fogColor   = fogColor; } catch(e) {}
        try { app.scene.fogDensity = CONFIG.SCENE.FOG_DENSITY; } catch(e) {}
    }
    try { app.scene.ambientLight = new pc.Color(1, 0.96, 0.88); } catch(e) {}

    // ── 전역 게임 상태 ────────────────────────────────
    window.GAME = {
        app,
        terrain:         null,
        player:          null,
        camera:          null,
        playerVelocity:  { x: 0, z: 0 },
        dialogueActive:  false,
        jumpPressed:     false,
        joystickVector:  { x: 0, y: 0 },
        introActive:     true,
        introElapsed:    0,
        INTRO_DURATION:  6.5,
    };

    // ── 지형 ─────────────────────────────────────────
    const terrain = new SeoulTerrain();
    GAME.terrain  = terrain;
    terrain.createEntities(app);

    // ── 바다 ─────────────────────────────────────────
    const BLEND_NORMAL = pc.BLEND_NORMAL !== undefined ? pc.BLEND_NORMAL : 3;
    const seaMat = new pc.StandardMaterial();
    seaMat.diffuse    = hexToPC(CONFIG.COLORS.SEA_SURFACE);
    seaMat.opacity    = 0.85;
    seaMat.blendType  = BLEND_NORMAL;
    seaMat.depthWrite = false;
    seaMat.update();
    const sea = new pc.Entity('sea');
    sea.addComponent('render', { type: 'plane' });
    sea.render.material = seaMat;
    sea.setLocalPosition(0, -0.8, 0);
    sea.setLocalScale(6000, 1, 6000);
    app.root.addChild(sea);

    // ── 조명 ─────────────────────────────────────────
    const dirLight = new pc.Entity('directional');
    dirLight.addComponent('light', {
        type:         'directional',
        color:        new pc.Color(1, 0.98, 0.80),
        intensity:    2.8,
        castShadows:  true,
        shadowMapSize: 2048,
        shadowDistance: 600,
        shadowBias:    0.2,
        normalOffsetBias: 0.05,
    });
    dirLight.setLocalEulerAngles(45, 35, 0);
    app.root.addChild(dirLight);
    GAME.dirLight = dirLight;

    const followLight = new pc.Entity('followLight');
    followLight.addComponent('light', {
        type:      'point',
        color:     new pc.Color(1, 1, 1),
        intensity: 20,
        range:     30,
        castShadows: false,
    });
    app.root.addChild(followLight);

    // ── 카메라 ────────────────────────────────────────
    const cameraEntity = new pc.Entity('camera');
    cameraEntity.addComponent('camera', {
        fov:        75,
        nearClip:   0.1,
        farClip:    2400,
        clearColor: hexToPC(CONFIG.SCENE.BACKGROUND),
    });
    cameraEntity.addComponent('script');
    app.root.addChild(cameraEntity);
    GAME.camera = cameraEntity;

    // ── 숲 벨트 ───────────────────────────────────────
    buildForestBelt(app, terrain);

    // ── 랜드마크 ──────────────────────────────────────
    buildLandmarks(app, terrain);

    // ── 구름 ─────────────────────────────────────────
    buildClouds(app);

    // ── NPC (신부, 오리, 새) ──────────────────────────
    buildNPCs(app, terrain);

    // ── 플레이어 ──────────────────────────────────────
    const startX = -15, startZ = -105;
    const startH = terrain.getHeightAt(startX, startZ);
    const player = new pc.Entity('player');
    player.setLocalPosition(startX, startH + CONFIG.PLAYER.START_Y, startZ);
    player.addComponent('script');
    app.root.addChild(player);
    player.script.create('playerScript');
    GAME.player = player;

    // 카메라 스크립트 (플레이어 생성 후)
    cameraEntity.script.create('cameraScript');

    // ── 모바일 UI ─────────────────────────────────────
    setupMobileUI();

    // ── 대화 시스템 ───────────────────────────────────
    setupDialogue();

    // ── 인트로 카메라 경로 ────────────────────────────
    const introPath = [
        new pc.Vec3(  0, 600,  350),
        new pc.Vec3(-80, 280,   80),
        new pc.Vec3(startX * 0.4, 90, startZ * 0.4 - 60),
        new pc.Vec3(startX, 18, startZ - 25),
    ];
    const introLookStart = new pc.Vec3(0,  0,  0);
    const introLookEnd   = new pc.Vec3(startX, startH, startZ);

    // ── 페이드인 오버레이 ─────────────────────────────
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position:'fixed', inset:'0', background:'#000',
        pointerEvents:'none', zIndex:'100',
        transition:'opacity 1.8s ease-out'
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '0'; });
    setTimeout(() => overlay.remove(), 2500);

    // ── 앱 업데이트 루프 ──────────────────────────────
    let fps = 0, frames = 0, lastTime = performance.now();

    app.on('update', (dt) => {
        // FPS
        frames++;
        const now = performance.now();
        if (now >= lastTime + 1000) {
            fps = Math.round((frames*1000)/(now-lastTime));
            lastTime = now; frames = 0;
            document.getElementById('status-log').textContent = `FPS: ${fps}`;
        }

        // 인트로 카메라
        if (GAME.introActive) {
            GAME.introElapsed += dt;
            const raw = Math.min(GAME.introElapsed / GAME.INTRO_DURATION, 1);
            const t   = 1 - Math.pow(1 - raw, 3); // ease-out cubic

            const camPos  = catmullRom(introPath, t);
            const lookPos = new pc.Vec3(
                introLookStart.x + (introLookEnd.x - introLookStart.x) * t,
                introLookStart.y + (introLookEnd.y - introLookStart.y) * t,
                introLookStart.z + (introLookEnd.z - introLookStart.z) * t
            );
            cameraEntity.setPosition(camPos);
            cameraEntity.lookAt(lookPos);

            if (raw >= 1) GAME.introActive = false;
            return;
        }

        // 한강 shimmer
        terrain.updateRiver(dt);

        // 따라다니는 조명
        const pp = player.getPosition();
        followLight.setPosition(pp.x, pp.y + 5, pp.z);

        // 신부 근접 체크
        const dx_ = pp.x - 15, dz_ = pp.z - (-24);
        const dist = Math.sqrt(dx_*dx_ + dz_*dz_);
        const near = dist < 22;
        const ib = document.getElementById('interact-btn');
        if (ib) ib.style.display = (near && !GAME.dialogueActive) ? 'block' : 'none';
        if (GAME.exclamation) {
            GAME.exclamation._t = (GAME.exclamation._t || 0) + dt;
            const base = GAME.exclamation._baseY || 12;
            GAME.exclamation.setLocalPosition(15, base + Math.sin(GAME.exclamation._t * 3.5) * 0.5, -24);
            GAME.exclamation.enabled = !GAME.dialogueActive;
        }
    });

    app.start();
    document.getElementById('status-log').textContent = '🗺️ Seoul Map PlayCanvas 버전 가동 중';

    // ═══════════════════════════════════════════════
    // 헬퍼 함수들
    // ═══════════════════════════════════════════════

    /** 숲 벨트 (InstancedMesh 대신 개별 엔티티 200개) */
    function buildForestBelt(app, terrain) {
        const trunkMat = new pc.StandardMaterial();
        trunkMat.diffuse = hexToPC(CONFIG.COLORS.TREE_TRUNK);
        trunkMat.update();

        const leavesMat = new pc.StandardMaterial();
        leavesMat.diffuse = hexToPC(CONFIG.COLORS.TREE_LEAVES_LUSH);
        leavesMat.update();

        const STEPS = 140;
        let count = 0;

        for (let i = 0; i < STEPS && count < 200; i++) {
            const angle = (i / STEPS) * Math.PI * 2;
            for (const rf of [0.84, 0.88, 0.92]) {
                if (count >= 200) break;
                const fx = Math.cos(angle) * 300 * rf + (Math.random()-0.5)*8;
                const fz = Math.sin(angle) * 240 * rf + (Math.random()-0.5)*8;
                if (!terrain.isInSeoul(fx, fz)) continue;

                const fh = terrain.getHeightAt(fx, fz);
                const sc = 0.8 + Math.random() * 0.5;
                const ry = Math.random() * 360;

                // 기둥
                const trunk = new pc.Entity('tree-trunk');
                trunk.addComponent('render', { type: 'cylinder' });
                trunk.render.material = trunkMat;
                trunk.setLocalPosition(fx, fh + 1.1 * sc, fz);
                trunk.setLocalScale(0.5*sc, 2.2*sc, 0.7*sc);
                app.root.addChild(trunk);

                // 잎
                const leaves = new pc.Entity('tree-leaves');
                leaves.addComponent('render', { type: 'cone' });
                leaves.render.material = leavesMat;
                leaves.setLocalPosition(fx, fh + 3.6*sc, fz);
                leaves.setLocalScale(4.4*sc, 3.5*sc, 4.4*sc);
                app.root.addChild(leaves);

                count++;
            }
        }

        // 남산 주변 나무
        for (const [tx, tz] of [[33,-12],[51,12],[30,18],[54,0],[42,-18]]) {
            addTree(app, terrain, tx, tz, trunkMat, leavesMat);
        }
        // 북한산 나무
        for (const [tx, tz] of [[-42,-180],[-30,-192],[-48,-195],[-24,-174]]) {
            addTree(app, terrain, tx, tz, trunkMat, leavesMat);
        }
    }

    function addTree(app, terrain, tx, tz, trunkMat, leavesMat) {
        const th = terrain.getHeightAt(tx, tz);
        const trunk = new pc.Entity();
        trunk.addComponent('render', { type: 'cylinder' });
        trunk.render.material = trunkMat;
        trunk.setLocalPosition(tx, th + 0.75, tz);
        trunk.setLocalScale(0.6, 1.5, 0.6);
        app.root.addChild(trunk);

        const leaves = new pc.Entity();
        leaves.addComponent('render', { type: 'cone' });
        leaves.render.material = leavesMat;
        leaves.setLocalPosition(tx, th + 2.5, tz);
        leaves.setLocalScale(2.4, 2.5, 2.4);
        app.root.addChild(leaves);
    }

    /** 랜드마크 */
    function buildLandmarks(app, terrain) {
        // 남산 타워
        const nmH = terrain.getHeightAt(42, 6);
        makePrimitive(app, 'cylinder', 0xddddcc,  42, nmH+2, 6, 1.6, 4, 1.6);
        makePrimitive(app, 'cylinder', 0xff4444,   42, nmH+5.5, 6, 0.6, 3, 0.6);

        // 63빌딩 (여의도)
        makePrimitive(app, 'box', 0xd4a820, -90, 5.5, 72, 4, 10, 4);

        // 독산역
        const stH = terrain.getHeightAt(-165, 156);
        buildStation(app, -165, stH, 156);
    }

    function buildStation(app, x, h, z) {
        const platMat = new pc.StandardMaterial();
        platMat.diffuse = hexToPC(CONFIG.COLORS.STATION_PLATFORM);
        platMat.update();
        const plat = new pc.Entity('station-platform');
        plat.addComponent('render', { type: 'box' });
        plat.render.material = platMat;
        plat.setLocalPosition(x, h+0.2, z);
        plat.setLocalScale(20, 0.4, 12);
        app.root.addChild(plat);

        const roofMat = new pc.StandardMaterial();
        roofMat.diffuse = hexToPC(0x2c3e50);
        roofMat.opacity = 0.8;
        roofMat.blendType = pc.BLEND_NORMAL;
        roofMat.update();
        const roof = new pc.Entity('station-roof');
        roof.addComponent('render', { type: 'box' });
        roof.render.material = roofMat;
        roof.setLocalPosition(x, h+5, z-2.5);
        roof.setLocalScale(22, 0.3, 10);
        app.root.addChild(roof);
    }

    /** 구름 */
    function buildClouds(app) {
        const cloudPositions = [[-90,45,-165],[120,40,180],[-195,42,60],[210,38,-120]];
        const cloudMat = new pc.StandardMaterial();
        cloudMat.diffuse  = new pc.Color(1,1,1);
        cloudMat.opacity  = 0.8;
        cloudMat.blendType = pc.BLEND_NORMAL;
        cloudMat.update();

        for (const [cx, cy, cz] of cloudPositions) {
            const cloud = new pc.Entity('cloud');
            app.root.addChild(cloud);
            cloud.setLocalPosition(cx, cy, cz);
            for (let i = 0; i < 4; i++) {
                const s = new pc.Entity('cloud-sphere');
                s.addComponent('render', { type: 'sphere' });
                s.render.material = cloudMat;
                const r = 3 + Math.random()*4;
                s.setLocalPosition(i*3, Math.random()*2, Math.random()*2);
                s.setLocalScale(r*2, r*1.4, r*2);
                cloud.addChild(s);
            }
        }
    }

    /** NPC들 */
    function buildNPCs(app, terrain) {
        // 신부
        const brideH = terrain.getHeightAt(15, -24);
        const brideEntity = new pc.Entity('bride');
        brideEntity.setLocalPosition(15, brideH, -24);
        brideEntity.setLocalEulerAngles(0, 180, 0);
        app.root.addChild(brideEntity);
        loadGlbOrFallback(app, './assets/models/bride.glb', brideEntity, 0.012, 0xffaabb);

        // 느낌표 마커
        const excl = new pc.Entity('exclamation');
        excl.addComponent('render', { type: 'sphere' });
        const exclMat = new pc.StandardMaterial();
        exclMat.diffuse  = new pc.Color(1, 0.84, 0);
        exclMat.emissive = new pc.Color(0.5, 0.4, 0);
        exclMat.emissiveIntensity = 1.5;
        exclMat.update();
        excl.render.material = exclMat;
        excl.setLocalScale(1.5, 1.5, 1.5);
        excl._baseY = brideH + 7;
        excl._t = 0;
        excl.setLocalPosition(15, brideH + 7, -24);
        app.root.addChild(excl);
        GAME.exclamation = excl;

        // 오리 (한강변)
        for (const [dx, dz] of [[-60,54],[15,90],[120,60],[180,84]]) {
            const dkH = terrain.getHeightAt(dx, dz);
            const dk  = new pc.Entity('duck');
            dk.setLocalPosition(dx, dkH, dz);
            app.root.addChild(dk);
            loadGlbOrFallback(app, './assets/models/duck.glb', dk, 0.006, 0xffcc44);
        }

        // NPC (독산역 앞)
        const npcH = terrain.getHeightAt(-150, 150);
        const npc  = new pc.Entity('npc');
        npc.setLocalPosition(-150, npcH, 150);
        npc.setLocalEulerAngles(0, -90, 0);
        app.root.addChild(npc);
        loadGlbOrFallback(app, './assets/models/npc.glb', npc, 0.012, 0x88ccff);

        // 새 (원형 비행)
        buildFlyingBirds(app, terrain);
    }

    function buildFlyingBirds(app, terrain) {
        const birds = [
            { cx:-45,  cz: 72,   h:14,  r:54,  s: 0.3,  model:'flamingo.glb', color:0xff9bcd },
            { cx: 105, cz: 72,   h:18,  r:66,  s:-0.25, model:'flamingo.glb', color:0xff9bcd },
            { cx:  42, cz:  6,   h:terrain.getHeightAt(42,6)+12, r:48, s:0.45, model:'parrot.glb', color:0x44dd44 },
            { cx: -36, cz:-186,  h:30,  r:66,  s: 0.35, model:'flamingo.glb', color:0xff9bcd },
            { cx:  24, cz: 195,  h:26,  r:60,  s:-0.4,  model:'parrot.glb',   color:0x44dd44 },
        ];

        for (const b of birds) {
            const birdEntity = new pc.Entity('bird');
            birdEntity._orbitR = b.r;
            birdEntity._height = b.h;
            birdEntity._speed  = b.s;
            birdEntity._cx     = b.cx;
            birdEntity._cz     = b.cz;
            birdEntity._angle  = Math.random() * Math.PI * 2;
            app.root.addChild(birdEntity);
            loadGlbOrFallback(app, './assets/models/' + b.model, birdEntity, 0.0015, b.color);

            // 비행 업데이트
            app.on('update', (dt) => {
                birdEntity._angle += b.s * dt;
                const bx = b.cx + Math.cos(birdEntity._angle) * b.r;
                const bz = b.cz + Math.sin(birdEntity._angle) * b.r;
                const by = b.h  + Math.sin(birdEntity._angle * 3) * 2.5;
                const px = birdEntity.getPosition().x;
                const pz = birdEntity.getPosition().z;
                birdEntity.setPosition(bx, by, bz);
                const dx = bx - px, dz = bz - pz;
                if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001)
                    birdEntity.setLocalEulerAngles(0, Math.atan2(dx, dz) * (180/Math.PI), 0);
            });
        }
    }

    /** GLB 로드 또는 폴백 도형 */
    function loadGlbOrFallback(app, url, parentEntity, scale, fallbackColor) {
        const asset = new pc.Asset(url.split('/').pop(), 'container', { url });
        app.assets.add(asset);
        asset.ready(() => {
            const model = asset.resource.instantiateRenderEntity({
                castShadows: true, receiveShadows: true
            });
            model.setLocalScale(scale, scale, scale);
            // GLB 좌표계 보정: PlayCanvas는 Y-up이지만
            // Blender 등에서 내보낸 모델은 Z-up → -90° X 보정 필요
            model.setLocalEulerAngles(-90, 180, 0);
            parentEntity.addChild(model);

            // 첫 번째 애니메이션 자동 재생
            const anims = asset.resource.animations;
            if (anims && anims.length > 0) {
                try {
                    model.addComponent('anim', { activate: true });
                    model.anim.assignAnimation('default', anims[0].resource, 1.0, true);
                    model.anim.baseLayer.play('default');
                } catch (e) {
                    console.warn('Anim(NPC) 실패:', e.message);
                }
            }
        });
        asset.on('error', () => {
            const fb = new pc.Entity('fallback');
            fb.addComponent('render', { type: 'capsule' });
            const mat = new pc.StandardMaterial();
            mat.diffuse = hexToPC(fallbackColor);
            mat.update();
            fb.render.material = mat;
            fb.setLocalScale(scale*0.5, scale, scale*0.5);
            fb.setLocalPosition(0, scale*0.5, 0);
            parentEntity.addChild(fb);
        });
        app.assets.load(asset);
    }

    /** Catmull-Rom 보간 */
    function catmullRom(points, t) {
        const n = points.length - 1;
        const i = Math.min(Math.floor(t * n), n - 1);
        const f = t * n - i;

        const p0 = points[Math.max(0, i-1)];
        const p1 = points[i];
        const p2 = points[Math.min(n, i+1)];
        const p3 = points[Math.min(n, i+2)];

        const f2 = f*f, f3 = f2*f;
        const out = new pc.Vec3();
        ['x','y','z'].forEach(axis => {
            out[axis] = 0.5 * (
                (2*p1[axis]) +
                (-p0[axis]+p2[axis])*f +
                (2*p0[axis]-5*p1[axis]+4*p2[axis]-p3[axis])*f2 +
                (-p0[axis]+3*p1[axis]-3*p2[axis]+p3[axis])*f3
            );
        });
        return out;
    }

    /** 대화 시스템 */
    const BRIDE_DIALOGUE = [
        { speaker:'신부 💍', text:'드디어 왔군요... 오늘 이 길을 함께 걷게 되어 기뻐요.' },
        { speaker:'신부 💍', text:'우리가 처음 만났던 그 날을 기억하나요? 작은 카페, 창문 너머로 스며들던 햇살...' },
        { speaker:'신부 💍', text:'그날부터 지금까지, 당신과 함께 걸어온 이 서울의 골목골목이 모두 소중해요.' },
        { speaker:'신부 💍', text:'이제 우리 함께 마지막 섬까지 가요. 거기서 영원을 시작해요. 💕' },
    ];
    let dlgIndex = 0, twTimer = null;

    function setupDialogue() {
        const dlgBox     = document.getElementById('dialogue-box');
        const dlgSpeaker = document.getElementById('dialogue-speaker');
        const dlgText    = document.getElementById('dialogue-text');
        const dlgHint    = document.getElementById('dialogue-hint');

        function typewrite(text) {
            clearTimeout(twTimer);
            dlgText.textContent = '';
            let i = 0;
            (function step() {
                if (i < text.length) { dlgText.textContent += text[i++]; twTimer = setTimeout(step, 30); }
            })();
        }

        function showLine(idx) {
            dlgSpeaker.textContent = BRIDE_DIALOGUE[idx].speaker;
            typewrite(BRIDE_DIALOGUE[idx].text);
            dlgHint.textContent = idx < BRIDE_DIALOGUE.length-1 ? '[ F / E / 탭 ] 계속' : '[ F / E / 탭 ] 닫기';
        }

        window.openDialogue = function () {
            GAME.dialogueActive = true;
            dlgIndex = 0;
            dlgBox.style.display = 'block';
            showLine(0);
        };

        window.advanceDialogue = function () {
            dlgIndex++;
            if (dlgIndex >= BRIDE_DIALOGUE.length) {
                GAME.dialogueActive = false;
                dlgBox.style.display = 'none';
                clearTimeout(twTimer);
            } else {
                showLine(dlgIndex);
            }
        };

        window.addEventListener('keydown', e => {
            if (e.code === 'KeyF' || e.code === 'KeyE' || e.code === 'Tab') {
                e.preventDefault();
                if (GAME.dialogueActive) {
                    advanceDialogue();
                } else {
                    const pp = GAME.player ? GAME.player.getPosition() : null;
                    if (pp) {
                        const dx = pp.x - 15, dz = pp.z - (-24);
                        if (Math.sqrt(dx*dx + dz*dz) < 22) openDialogue();
                    }
                }
            }
        });

        document.getElementById('interact-btn').addEventListener('click', () => {
            if (!GAME.dialogueActive) openDialogue(); else advanceDialogue();
        });
    }

    /** 모바일 UI (조이스틱 + 점프) */
    function setupMobileUI() {
        const base     = document.getElementById('joystick-base');
        const knob     = document.getElementById('joystick-knob');
        const jumpBtn  = document.getElementById('btn-jump');

        let joyId = null, joyStart = { x:0, y:0 };

        window.addEventListener('pointerdown', e => {
            if (e.target.closest('button, #dialogue-box')) return;
            if (window.innerWidth <= 900 && e.clientX < window.innerWidth/2) {
                if (joyId === null) {
                    joyId = e.pointerId;
                    joyStart = { x: e.clientX, y: e.clientY };
                    base.style.display = 'block';
                    base.style.left = `${e.clientX-50}px`;
                    base.style.top  = `${e.clientY-50}px`;
                }
            }
        });

        window.addEventListener('pointermove', e => {
            if (e.pointerId !== joyId) return;
            const dx   = e.clientX - joyStart.x;
            const dy   = e.clientY - joyStart.y;
            const dist = Math.hypot(dx, dy);
            const cap  = Math.min(dist, 50);
            const nx   = dist > 0 ? dx/dist*cap : 0;
            const ny   = dist > 0 ? dy/dist*cap : 0;
            knob.style.transform = `translate(${nx}px, ${ny}px)`;
            GAME.joystickVector = { x: nx/50, y: ny/50 };
        });

        const resetJoy = e => {
            if (e.pointerId !== joyId) return;
            joyId = null;
            base.style.display = 'none';
            knob.style.transform = 'translate(0,0)';
            GAME.joystickVector = { x:0, y:0 };
        };
        window.addEventListener('pointerup',     resetJoy);
        window.addEventListener('pointercancel', resetJoy);

        if (jumpBtn) {
            jumpBtn.addEventListener('pointerdown', e => { e.stopPropagation(); GAME.jumpPressed = true; });
            jumpBtn.addEventListener('pointerup',   () => { GAME.jumpPressed = false; });
        }
    }
})();
