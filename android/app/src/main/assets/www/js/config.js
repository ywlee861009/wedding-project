/**
 * @config Game Configuration & Assets Registry
 * 나중에 에셋 파일명이나 경로가 바뀌면 여기만 수정하면 됩니다.
 */
const GAME_CONFIG = {
    // 1. 에셋 및 캐릭터 키 설정 (cm 단위)
    ASSETS: {
        GROOM: { key: 'groom', path: 'assets/char_youngwoo.png', cmHeight: 180 },
        BRIDE: { key: 'bride', path: 'assets/char_moonhee.png', cmHeight: 165 },
        SIGNPOST: { key: 'signpost', text: '시작' }
    },

    // 화면 대비 캐릭터 크기 비율 (180cm 기준 화면 높이의 25% 차지)
    REFERENCE_RATIO: 0.25, 
    REFERENCE_CM: 180,
    
    // 2. 물리 및 밸런스 설정
    PHYSICS: {
        GRAVITY: 1000,
        MOVE_SPEED: 4 * 60, // Velocity 기반
        JUMP_FORCE: -550,
        PIXELS_PER_DAY: 20
    },
    
    // 3. 색상 및 테마
    THEME: {
        SKY: { TOP: 0x87CEEB, BOTTOM: 0xE0F7FA },
        GROUND: 0xeeeeee,
        JOYSTICK_BASE: 0xffffff,
        JOYSTICK_THUMB: 0xffffff
    },
    
    // 4. 시간 정보
    START_DATE: "2018-02-15",

    // 5. 대화 데이터
    DIALOGUE: {
        BRIDE_MEET: {
            TEXT: "안녕! 여기서 뭐 해?",
            CHOICES: [
                { label: "같이 간다", value: true },
                { label: "혼자 간다", value: false }
            ]
        }
    }
};
