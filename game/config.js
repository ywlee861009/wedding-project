/**
 * 💍 Wedding Journey Configuration
 * 모든 물리 상수, 색상, 설정값을 관리합니다.
 */

export const CONFIG = {
    SCENE: {
        BACKGROUND: 0x87ceeb,
        FOG_COLOR:  0xa8d8ea,
        FOG_DENSITY: 0.004
    },
    LIGHTS: {
        AMBIENT: 0xfff5e0,
        AMBIENT_INTENSITY: 1.4,
        DIRECTIONAL: 0xfffacd,
        DIRECTIONAL_INTENSITY: 2.8,
        FOLLOW_LIGHT: 0xffcc44,
        FOLLOW_INTENSITY: 8.0
    },
    PHYSICS: {
        GRAVITY: -0.015,
        JUMP_POWER: 0.35,
        MOVE_SPEED: 0.2,
        ROAD_LIMIT: 14.4,
        BRIDGE_WIDTH: 6
    },
    PLAYER: {
        COLOR: 0x00aaff,
        SIZE: 1.2,
        START_Y: 0.6,
        MODEL_PATH: './assets/models/groom.glb'
    },
    COLORS: {
        // 기존
        BUILDING: [0x2c3e50, 0x34495e, 0x1a252f, 0x2c3e50],
        STATION: 0x0055aa,
        STATION_PLATFORM: 0x444444,
        TREE_TRUNK: 0x8B4513,
        TREE_LEAVES: 0x228B22,

        // 섬 바이옴 색상
        ISLAND_HOME:     0x7dc87a,
        ISLAND_MEETING:  0xd4956a,
        ISLAND_STATION:  0x7a8fa6,
        ISLAND_PROPOSAL: 0xe8a0b4,
        ISLAND_WEDDING:  0xf5e6c8,

        SAND_RING:   0xf2d16b,
        ROCK_BOTTOM: 0x7a6a55,

        SEA_SURFACE: 0x2ab5c8,

        BRIDGE_PLANK: 0xa0785a,
        BRIDGE_RAIL:  0x7a5a42,
        BRIDGE_ROPE:  0xc8a87a,

        TREE_LEAVES_LUSH: 0x3ab86e,
        TREE_LEAVES_WARM: 0xe8a050,
        TREE_LEAVES_PINK: 0xf4a0c0,
        TREE_LEAVES_GOLD: 0xf0d070,

        FLOWER_PINK:  0xff6b9d,
        FLOWER_WHITE: 0xfff5e1,
        FLOWER_GOLD:  0xffd700,

        BENCH_WOOD:  0x9b6b3a,
        BENCH_METAL: 0x708090
    }
};
