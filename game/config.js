/**
 * 💍 Wedding Journey Configuration
 * 모든 물리 상수, 색상, 설정값을 관리합니다.
 */

export const CONFIG = {
    SCENE: {
        BACKGROUND: 0x1a1a2e,
        FOG_NEAR: 20,
        FOG_FAR: 150
    },
    LIGHTS: {
        AMBIENT: 0x444466,
        AMBIENT_INTENSITY: 1.0,
        DIRECTIONAL: 0xffffff,
        DIRECTIONAL_INTENSITY: 1.5,
        FOLLOW_LIGHT: 0xffcc44,
        FOLLOW_INTENSITY: 8.0
    },
    PHYSICS: {
        GRAVITY: -0.015,
        JUMP_POWER: 0.35,
        MOVE_SPEED: 0.2,
        ROAD_LIMIT: 14.4
    },
    PLAYER: {
        COLOR: 0x00aaff,
        SIZE: 1.2,
        START_Y: 0.6,
        MODEL_PATH: './assets/models/groom.glb' // 테스트용 모델 경로
    },
    COLORS: {
        BUILDING: [0x2c3e50, 0x34495e, 0x1a252f, 0x2c3e50],
        STATION: 0x0055aa,
        STATION_PLATFORM: 0x444444,
        TREE_TRUNK: 0x8B4513,
        TREE_LEAVES: 0x228B22
    }
};
