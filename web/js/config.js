/**
 * 💍 CONFIG.js (High Visibility Version)
 */
export const CONFIG = {
    PHYSICS: {
        GRAVITY: 0.8,
        JUMP_FORCE: -18,
        MOVE_SPEED: 6,
        FRICTION: 0.8
    },

    COLORS: {
        BG_NIGHT: 0x222222, // 배경을 조금 더 밝은 회색으로
        PLAYER: 0xffff00,   // 주인공을 밝은 노란색으로 (확실히 보이게)
        NPC: 0xf472b6,
        LIGHT: 0xffcc00,
        GROUND: 0x444444    // 바닥을 명확한 회색으로
    },

    STORY: [
        { x: 0, title: 'DOKSAN STATION', desc: 'The day we first met.' },
        { x: 5000, title: 'FIRST TRIP', desc: 'A beautiful memory.' }
    ],

    LAYERS: {
        SKY: 0.1, FAR: 0.3, MID: 0.6, MAIN: 1.0, NEAR: 2.0
    },

    START_DATE: '2018-02-15',
    PIXELS_PER_DAY: 100
};
