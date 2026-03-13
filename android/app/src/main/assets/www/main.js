/**
 * @main Game Entry Point
 * Phaser 게임 초기화 및 씬 관리
 */
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    render: {
        pixelArt: true, // 픽셀 아트 최적화 (안티앨리어싱 제거 및 렌더링 최적화)
        roundPixels: true // 좌표를 항상 정수로 반올림하여 덜덜거림 방지
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: GAME_CONFIG.PHYSICS.GRAVITY },
            fps: 60, // 물리 연산 프레임 고정
            debug: false 
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    this.load.image(GAME_CONFIG.ASSETS.BRIDE.key, GAME_CONFIG.ASSETS.BRIDE.path);
    this.load.image(GAME_CONFIG.ASSETS.GROOM.key, GAME_CONFIG.ASSETS.GROOM.path);
}

function create() {
    const { width, height } = this.scale;
    const worldWidth = width * 100;
    const groundY = height * 0.7; // 상단 70% 하늘, 하단 30% 땅

    this.isMeeting = false;
    this.cameras.main.setBounds(0, 0, worldWidth, height);

    // [추가] 대화창 UI 초기화
    this.dialogueUI = new DialogueUI(this);

    // 1. 배경 설정
    const sky = this.add.graphics();
    sky.fillGradientStyle(GAME_CONFIG.THEME.SKY.TOP, GAME_CONFIG.THEME.SKY.TOP, GAME_CONFIG.THEME.SKY.BOTTOM, GAME_CONFIG.THEME.SKY.BOTTOM, 1);
    sky.fillRect(0, 0, width, height);
    sky.setScrollFactor(0).setDepth(-10);

    const ground = this.add.rectangle(-width, groundY, worldWidth + width, height * 0.3, GAME_CONFIG.THEME.GROUND)
        .setOrigin(0, 0).setDepth(-5);
    this.physics.add.existing(ground, true);

    // 2. 팻말 생성 (독립된 함수로 관리 가능)
    createSignpost(this, 100, groundY);

    // 3. 캐릭터 생성 (OOP 클래스 활용)
    this.bride = new Bride(this, 2000, groundY);
    this.groom = new Groom(this, 200, groundY);

    // 4. 물리 설정
    this.physics.add.collider(this.groom, ground);
    this.physics.add.collider(this.bride, ground);

    // [변경] 자동 만남 대신 상호작용 이벤트 리스너 등록
    this.events.on('try-interact', () => {
        const dist = Phaser.Math.Distance.Between(this.groom.x, this.groom.y, this.bride.x, this.bride.y);
        
        // 거리가 가깝고 대화창이 닫혀 있을 때만 대화 시작
        if (dist < 150 && !this.isMeeting && !this.dialogueUI.isOpen) {
            this.dialogueUI.show(
                GAME_CONFIG.DIALOGUE.BRIDE_MEET.TEXT,
                GAME_CONFIG.DIALOGUE.BRIDE_MEET.CHOICES,
                (value) => {
                    if (value) {
                        this.isMeeting = true;
                        console.log("상호작용 성공: 신부와 동행 시작!");
                    } else {
                        console.log("혼자 가기를 선택했습니다.");
                    }
                }
            );
        }
    });

    // 5. 카메라 및 조작
    this.cameras.main.startFollow(this.groom, true, 1.0, 1.0, -200, 0); // Lerp를 1.0으로 설정하여 즉각적으로 따라옴
    this.cameras.main.setRoundPixels(true); // 카메라 레벨에서도 픽셀 반올림 강제
    this.controller = new VirtualController(this);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.addPointer(2);

    // [전역 디버그 로그] 화면 어디를 누르든 로그가 찍혀야 함
    this.input.on('pointerdown', (pointer) => {
        console.log(`Global Touch Input: (${Math.floor(pointer.x)}, ${Math.floor(pointer.y)})`);
    });
}

function update() {
    // 대화창이 열려 있으면 이동 중지
    if (this.dialogueUI.isOpen) {
        this.groom.move(0);
        return;
    }

    // 이동 로직 (조이스틱/키보드 통합)
    let moveDir = 0;
    if (this.cursors.left.isDown || this.controller.joystickPoint.x < -0.3) moveDir = -1;
    else if (this.cursors.right.isDown || this.controller.joystickPoint.x > 0.3) moveDir = 1;

    this.groom.move(moveDir);
    
    // 왼쪽 경계 제한
    if (this.groom.x < 200) {
        this.groom.x = 200;
        this.groom.body.setVelocityX(0);
    }

    // 신부 상호작용 거리 체크 및 느낌표 표시
    if (!this.isMeeting) {
        const dist = Phaser.Math.Distance.Between(this.groom.x, this.groom.y, this.bride.x, this.bride.y);
        this.bride.showIndicator(dist < 150);
    }

    // 신부 따라오기
    this.bride.follow(this.groom, this.isMeeting);

    // 날짜 업데이트
    updateDateDisplay(this.groom.x);
}

// 헬퍼 함수들
function createSignpost(scene, x, y) {
    scene.add.rectangle(x, y - 20, 10, 40, 0x8B4513).setOrigin(0.5, 1).setDepth(-1);
    const board = scene.add.graphics();
    board.fillStyle(0xA0522D, 1).fillRoundedRect(x - 40, y - 80, 80, 45, 10).setDepth(-1);
    scene.add.text(x, y - 58, GAME_CONFIG.ASSETS.SIGNPOST.text, { fontSize: '20px', color: '#fff', fontWeight: 'bold' }).setOrigin(0.5);
}

function updateDateDisplay(playerX) {
    const days = Math.floor(Math.max(0, playerX - 200) / GAME_CONFIG.PHYSICS.PIXELS_PER_DAY);
    const date = new Date(GAME_CONFIG.START_DATE);
    date.setDate(date.getDate() + days);
    
    const display = document.getElementById('date-display');
    if (display) {
        display.innerText = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}
