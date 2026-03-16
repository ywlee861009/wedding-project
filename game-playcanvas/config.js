/**
 * 💍 Wedding Journey — PlayCanvas Config
 */
window.CONFIG = {
    SCENE: {
        BACKGROUND: 0x87ceeb,
        FOG_COLOR:  0xa8d8ea,
        FOG_DENSITY: 0.0013
    },
    PHYSICS: {
        GRAVITY:      -18,
        JUMP_POWER:    7,
        MOVE_SPEED:    0.5,
        BRIDGE_WIDTH:  6
    },
    PLAYER: {
        COLOR:      0x00aaff,
        SIZE:       1.2,
        START_Y:    0.6,
        MODEL_PATH: './assets/models/groom.glb'
    },
    COLORS: {
        SEA_SURFACE:      0x2ab5c8,
        TREE_TRUNK:       0x8B4513,
        TREE_LEAVES:      0x228B22,
        TREE_LEAVES_LUSH: 0x3ab86e,
        BRIDGE_PLANK:     0xa0785a,
        BRIDGE_RAIL:      0x7a5a42,
        STATION_PLATFORM: 0x444444,
        STATION:          0x0055aa
    }
};

/** hex integer → pc.Color */
window.hexToPC = function(hex) {
    return new pc.Color(
        ((hex >> 16) & 0xff) / 255,
        ((hex >> 8)  & 0xff) / 255,
        ( hex        & 0xff) / 255
    );
};

/** hex integer → { r, g, b } floats 0-1 */
window.hexToRgb = function(hex) {
    return {
        r: ((hex >> 16) & 0xff) / 255,
        g: ((hex >> 8)  & 0xff) / 255,
        b: ( hex        & 0xff) / 255
    };
};

/** 프리미티브 엔티티 생성 헬퍼 */
window.makePrimitive = function(app, type, hexColor, px, py, pz, sx, sy, sz, rotY) {
    const e = new pc.Entity();
    e.addComponent('render', { type });
    const mat = new pc.StandardMaterial();
    mat.diffuse = hexToPC(hexColor);
    mat.update();
    e.render.material = mat;
    e.setLocalPosition(px, py, pz);
    e.setLocalScale(sx, sy, sz);
    if (rotY !== undefined) e.setLocalEulerAngles(0, rotY, 0);
    app.root.addChild(e);
    return e;
};
