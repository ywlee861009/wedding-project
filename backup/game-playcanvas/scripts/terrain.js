/**
 * 🗺️ SeoulTerrain — PlayCanvas 버전
 * Three.js 버전과 동일한 지형 알고리즘, PlayCanvas 메시로 생성
 */
window.SeoulTerrain = class SeoulTerrain {
    constructor() {
        this._peaks = [
            [ -36, -186, 14, 60],   // 북한산 836m
            [  66, -195, 12, 48],   // 도봉산 739m
            [ 180, -156, 10, 42],   // 수락산 638m
            [ 246,  -24,  6, 36],   // 아차산 295m
            [  42,    6,  9, 30],   // 남산   262m
            [-174,  -36,  6, 30],   // 안산   296m
            [ -54,  -54,  7, 27],   // 인왕산 338m
            [ -15,  -75,  8, 27],   // 북악산 342m
            [  24,  195, 13, 48],   // 관악산 629m
            [ 186,  186, 10, 39],   // 청계산 618m
            [ 195,  -84,  7, 33],   // 용마산 348m
        ];

        this._riverZ  = 72;
        this._riverHW = 27;

        this.riverZMin       = this._riverZ - this._riverHW; // 45
        this.riverZMax       = this._riverZ + this._riverHW; // 99
        this.bridgeHalfWidth = 12;
        this.bridgeXs        = [-264,-135,-96,-54,-9,30,72,120,165,210];

        this.riverEntity = null;
        this._riverMatRef = null;
        this._riverTime   = 0;
    }

    /** 지형 높이 반환 */
    getHeightAt(x, z) {
        let h = 0;
        for (const [cx, cz, ph, sigma] of this._peaks) {
            const d2 = (x-cx)**2 + (z-cz)**2;
            h += ph * Math.exp(-d2 / (2 * sigma * sigma));
        }
        const dr = Math.abs(z - this._riverZ);
        if (dr < this._riverHW + 18) {
            const blend = Math.max(0, 1 - dr / (this._riverHW + 18));
            h *= (1 - blend * 0.96);
        }
        return Math.max(0, h);
    }

    /** 서울 경계 안인지 */
    isInSeoul(x, z) {
        return (x/300)**2 + (z/240)**2 < 1;
    }

    /** 강 건너기 가능 여부 */
    canMoveTo(x, z) {
        const inRiver = z > this.riverZMin && z < this.riverZMax;
        if (!inRiver) return true;
        return this.bridgeXs.some(bx => Math.abs(x - bx) < this.bridgeHalfWidth);
    }

    _vertexColor(x, z, h) {
        const b = (x/300)**2 + (z/240)**2;
        if (b > 1)    return { r:0.290, g:0.439, b:0.251 };
        if (b > 0.88) return { r:0.604, g:0.510, b:0.376 };
        if (h > 8)    return { r:0.145, g:0.376, b:0.125 };
        if (h > 4)    return { r:0.282, g:0.627, b:0.188 };
        if (h > 1.5)  return { r:0.533, g:0.847, b:0.333 };
        return           { r:0.816, g:0.784, b:0.690 };
    }

    /** PlayCanvas 커스텀 메시로 지형 생성 */
    createEntities(app) {
        this._buildTerrain(app);
        this._buildRiver(app);
        this._buildBridges(app);
    }

    _buildTerrain(app) {
        const SEG  = 144;   // 세그먼트 수
        const SIZE = 720;
        const VCOUNT = (SEG+1) * (SEG+1);

        const positions = new Float32Array(VCOUNT * 3);
        const colors    = new Float32Array(VCOUNT * 4); // RGBA
        const uvs       = new Float32Array(VCOUNT * 2);
        const iCount    = SEG * SEG * 6;
        const indices   = new Uint16Array(iCount);

        let vi = 0, ci = 0, ui = 0;
        for (let row = 0; row <= SEG; row++) {
            for (let col = 0; col <= SEG; col++) {
                const wx = (col / SEG - 0.5) * SIZE;
                const wz = (row / SEG - 0.5) * SIZE;
                let h = this.getHeightAt(wx, wz);

                const b = (wx/300)**2 + (wz/240)**2;
                if (b > 1) {
                    h = -3;
                } else if (b > 0.88) {
                    const t = (b - 0.88) / 0.12;
                    h = h * (1 - t) + (-3) * t;
                }

                positions[vi++] = wx;
                positions[vi++] = h;
                positions[vi++] = wz;

                uvs[ui++] = col / SEG;
                uvs[ui++] = row / SEG;

                const c = this._vertexColor(wx, wz, h);
                colors[ci++] = c.r;
                colors[ci++] = c.g;
                colors[ci++] = c.b;
                colors[ci++] = 1.0;
            }
        }

        // 인덱스
        let ii = 0;
        for (let row = 0; row < SEG; row++) {
            for (let col = 0; col < SEG; col++) {
                const a = row * (SEG+1) + col;
                const b = a + 1;
                const c = (row+1) * (SEG+1) + col;
                const d = c + 1;
                indices[ii++] = a; indices[ii++] = c; indices[ii++] = b;
                indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
            }
        }

        // 법선 계산
        const normals = this._computeNormals(positions, indices);

        const device = app.graphicsDevice;
        const mesh = new pc.Mesh(device);
        mesh.setPositions(positions);
        mesh.setNormals(normals);
        mesh.setColors(colors);
        mesh.setUvs(0, uvs);
        mesh.setIndices(indices);
        mesh.update();

        const mat = new pc.StandardMaterial();
        mat.vertexColors = true;
        mat.diffuse      = new pc.Color(1, 1, 1);
        mat.roughness    = 0.82;
        mat.metalness    = 0.0;
        mat.update();

        const mi = new pc.MeshInstance(mesh, mat);
        mi.receiveShadow = true;

        const entity = new pc.Entity('terrain');
        entity.addComponent('render', { meshInstances: [mi], castShadows: false, receiveShadows: true });
        app.root.addChild(entity);
    }

    _buildRiver(app) {
        // 강 평면
        const riverMat = new pc.StandardMaterial();
        riverMat.diffuse       = hexToPC(0x38c8e0);
        riverMat.emissive      = hexToPC(0x0a6080);
        riverMat.emissiveIntensity = 0.18;
        riverMat.opacity       = 0.88;
        riverMat.blendType     = pc.BLEND_NORMAL !== undefined ? pc.BLEND_NORMAL : 3;
        riverMat.depthWrite    = false;
        riverMat.update();
        this._riverMatRef = riverMat;

        const river = new pc.Entity('river');
        river.addComponent('render', { type: 'plane' });
        river.render.material = riverMat;
        river.setLocalPosition(0, 0.3, this._riverZ);
        river.setLocalScale(720, 1, this._riverHW * 2);
        app.root.addChild(river);
        this.riverEntity = river;

        // 여의도
        const yd = new pc.Entity('yeouido');
        yd.addComponent('render', { type: 'cylinder' });
        const ydMat = new pc.StandardMaterial();
        ydMat.diffuse = hexToPC(0x8ab870);
        ydMat.update();
        yd.render.material = ydMat;
        yd.setLocalPosition(-90, 0.35, this._riverZ);
        yd.setLocalScale(42, 0.4, 42); // radius 21 → scale 42
        app.root.addChild(yd);
    }

    _buildBridges(app) {
        const len = this.riverZMax - this.riverZMin;
        const bw  = this.bridgeHalfWidth * 2;

        const plankMat = new pc.StandardMaterial();
        plankMat.diffuse = hexToPC(CONFIG.COLORS.BRIDGE_PLANK);
        plankMat.update();

        const railMat = new pc.StandardMaterial();
        railMat.diffuse = hexToPC(CONFIG.COLORS.BRIDGE_RAIL);
        railMat.update();

        for (const bx of this.bridgeXs) {
            // 데크
            const deck = new pc.Entity('bridge-deck');
            deck.addComponent('render', { type: 'box' });
            deck.render.material = plankMat;
            deck.setLocalPosition(bx, 0.5, this._riverZ);
            deck.setLocalScale(bw, 0.3, len);
            app.root.addChild(deck);

            // 난간 2개
            for (const s of [-1, 1]) {
                const rail = new pc.Entity('bridge-rail');
                rail.addComponent('render', { type: 'box' });
                rail.render.material = railMat;
                rail.setLocalPosition(bx + s * (bw/2 - 0.2), 1.05, this._riverZ);
                rail.setLocalScale(0.4, 1.0, len);
                app.root.addChild(rail);
            }
        }
    }

    /** 법선 계산 (Smooth) */
    _computeNormals(positions, indices) {
        const normals = new Float32Array(positions.length);

        for (let i = 0; i < indices.length; i += 3) {
            const i0 = indices[i]*3, i1 = indices[i+1]*3, i2 = indices[i+2]*3;
            const ax = positions[i1]-positions[i0], ay = positions[i1+1]-positions[i0+1], az = positions[i1+2]-positions[i0+2];
            const bx = positions[i2]-positions[i0], by = positions[i2+1]-positions[i0+1], bz = positions[i2+2]-positions[i0+2];
            const nx = ay*bz - az*by, ny = az*bx - ax*bz, nz = ax*by - ay*bx;
            for (const vi of [indices[i], indices[i+1], indices[i+2]]) {
                normals[vi*3]   += nx;
                normals[vi*3+1] += ny;
                normals[vi*3+2] += nz;
            }
        }

        for (let i = 0; i < normals.length/3; i++) {
            const len = Math.sqrt(normals[i*3]**2 + normals[i*3+1]**2 + normals[i*3+2]**2);
            if (len > 0) { normals[i*3] /= len; normals[i*3+1] /= len; normals[i*3+2] /= len; }
        }
        return normals;
    }

    /** 한강 shimmer 업데이트 (매 프레임) */
    updateRiver(dt) {
        if (!this._riverMatRef) return;
        this._riverTime += dt;
        this._riverMatRef.emissiveIntensity = 0.14 + Math.sin(this._riverTime * 1.8) * 0.06;
        this._riverMatRef.update();
    }
};
