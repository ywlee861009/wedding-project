// Phaser 3: Wedding Journey (2018-02-15 ~ )
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#ffffff', // 기본 배경을 흰색으로 변경
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 1000 }, // 중력 추가
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

// 전역 변수 설정
let cursors;
let groom;
let bride;
let bgLayers = [];
let isMeeting = false; // 신부를 만났는지 여부

// --- 가상 컨트롤러 변수 ---
let joystickBase;
let joystickThumb;
let buttonA;
let buttonB;
let joystickPoint = { x: 0, y: 0 };
let joystickPointer = null; // 조이스틱을 잡은 특정 포인터 저장
const joystickRadius = 60;
// -----------------------

// --- 게임 밸런스 조절 변수 ---
const moveSpeed = 4;           // 캐릭터 이동 속도
const pixelsPerDay = 20;       // 1일이 흐르기 위해 이동해야 하는 픽셀 거리
// -----------------------

const startDate = new Date("2018-02-15");
const dateDisplay = document.getElementById('date-display');

function preload() {
    this.load.svg('bride', 'assets/bride_160_cute.svg');
    this.load.svg('groom', 'assets/groom_160_cute.svg');
}

function create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. 패럴랙스 배경 레이어 (밝은 하늘색 그라데이션)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xE0F7FA, 0xE0F7FA, 1); // SkyBlue -> LightCyan
    sky.fillRect(0, 0, width * 20, height);
    bgLayers.push({ obj: sky, speed: 0 });

    // 2. 바닥 (밝은 회색 승강장)
    const ground = this.add.rectangle(0, height - 100, width * 20, 100, 0xeeeeee).setOrigin(0, 0);
    this.physics.add.existing(ground, true); // 정적 물리 객체로 생성

    // 3. 신부 배치
    bride = this.add.image(2000, height - 180, 'bride').setScale(0.8);
    this.physics.add.existing(bride);
    bride.body.setAllowGravity(false); // 신부는 아직 중력의 영향을 받지 않게 함
    bride.alpha = 0.5;

    // 4. 신랑 등장
    groom = this.add.image(200, height - 180, 'groom').setScale(0.8);
    this.physics.add.existing(groom);
    groom.body.setCollideWorldBounds(false); // 카메라이동을 위해 월드 바운드 충돌은 끔

    // 바닥과의 충돌 설정
    this.physics.add.collider(groom, ground);
    this.physics.add.collider(bride, ground);
    
    // 5. 카메라 설정
    this.cameras.main.startFollow(groom, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(-200, 0);

    // 6. 충돌/만남 감지
    this.physics.add.overlap(groom, bride, () => {
        if (!isMeeting) {
            isMeeting = true;
            bride.alpha = 1.0;
        }
    });

    // 7. 가상 컨트롤러 생성 (UI는 카메라에 고정되어야 함)
    setupVirtualController.call(this);

    cursors = this.input.keyboard.createCursorKeys();
}

function setupVirtualController() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const padding = 100; // 구석에서의 여백
    
    // 조이스틱 베이스 (고정)
    joystickBase = this.add.circle(padding, height - padding, joystickRadius, 0xffffff, 0.4)
        .setStrokeStyle(4, 0x000000, 0.3) // 연한 검정 테두리 추가
        .setScrollFactor(0)
        .setDepth(100);
    
    // 조이스틱 썸 (움직임)
    joystickThumb = this.add.circle(padding, height - padding, 30, 0xffffff, 0.8)
        .setStrokeStyle(2, 0x000000, 0.5) // 테두리 추가
        .setScrollFactor(0)
        .setDepth(101);

    // 버튼 A -> JUMP (우측 하단)
    buttonA = this.add.circle(width - padding, height - padding, 45, 0xffffff, 0.6)
        .setStrokeStyle(4, 0x000000, 0.5)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive();
    this.add.text(width - padding, height - padding, 'JUMP', { 
        fontSize: '24px', // 글자 수가 늘어나서 폰트 크기 살짝 조정
        color: '#000',
        fontWeight: 'bold' 
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(101);

    // 버튼 A(JUMP) 클릭 이벤트
    buttonA.on('pointerdown', () => {
        if (groom.body.touching.down || groom.body.blocked.down) {
            groom.body.setVelocityY(-550); // 위로 점프
        }
    });

    // 버튼 B (우측 하단 옆)
    buttonB = this.add.circle(width - (padding * 2) - 20, height - padding, 45, 0xffffff, 0.6)
        .setStrokeStyle(4, 0x000000, 0.5) // 테두리 추가
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive();
    this.add.text(width - (padding * 2) - 20, height - padding, 'B', { 
        fontSize: '36px', 
        color: '#000', // 검정색 글자로 변경
        fontWeight: 'bold' 
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(101);

    // 터치 이벤트 리스너
    this.input.on('pointerdown', (pointer) => {
        // 왼쪽 화면 터치 시 조이스틱 활성화
        if (pointer.x < width / 2 && joystickPointer === null) {
            joystickPointer = pointer;
            updateJoystick(pointer);
        }
    });

    this.input.on('pointermove', (pointer) => {
        // 조이스틱 포인터가 존재하고, 해당 포인터의 움직임일 때만 업데이트
        if (joystickPointer && pointer.id === joystickPointer.id) {
            updateJoystick(pointer);
        }
    });

    this.input.on('pointerup', (pointer) => {
        // 조이스틱을 잡았던 포인터가 떼어졌을 때만 초기화
        if (joystickPointer && pointer.id === joystickPointer.id) {
            joystickPointer = null;
            joystickThumb.x = padding;
            joystickThumb.y = height - padding;
            joystickPoint = { x: 0, y: 0 };
        }
    });

    function updateJoystick(pointer) {
        const centerX = padding;
        const centerY = height - padding;
        const dist = Phaser.Math.Distance.Between(centerX, centerY, pointer.x, pointer.y);
        const angle = Phaser.Math.Angle.Between(centerX, centerY, pointer.x, pointer.y);

        if (dist <= joystickRadius) {
            joystickThumb.x = pointer.x;
            joystickThumb.y = pointer.y;
        } else {
            joystickThumb.x = centerX + Math.cos(angle) * joystickRadius;
            joystickThumb.y = centerY + Math.sin(angle) * joystickRadius;
        }

        // 정규화된 방향 벡터 (-1 ~ 1)
        joystickPoint.x = (joystickThumb.x - centerX) / joystickRadius;
        joystickPoint.y = (joystickThumb.y - centerY) / joystickRadius;
    }
}

function update() {
    let isMoving = false;
    let velocityX = 0;

    // 1. 이동 제어 (조이스틱 또는 키보드)
    if (cursors.left.isDown || joystickPoint.x < -0.3) {
        velocityX = -moveSpeed * 60; // 속도 기반 이동으로 변경
        groom.flipX = true;
        isMoving = true;
    } else if (cursors.right.isDown || joystickPoint.x > 0.3) {
        velocityX = moveSpeed * 60;
        groom.flipX = false;
        isMoving = true;
    }

    groom.body.setVelocityX(velocityX);

    // 키보드 스페이스바 점프 추가
    if (cursors.space.isDown && (groom.body.touching.down || groom.body.blocked.down)) {
        groom.body.setVelocityY(-550);
    }

    // 1-1. 왼쪽 이동 제한 (시작 지점 200보다 왼쪽으로 못 가게 함)
    if (groom.x < 200) {
        groom.x = 200;
        isMoving = false; // 벽에 막혔으므로 이동 중이 아님으로 처리
    }

    // 2. 신부를 만났다면 같이 이동
    if (isMeeting) {
        bride.body.setAllowGravity(true); // 만난 후에는 신부도 중력 적용
        
        // 신랑의 좌우에 따라 신부 위치 조정
        const targetX = groom.x + (groom.flipX ? 80 : -80);
        bride.x = Phaser.Math.Linear(bride.x, targetX, 0.2); // 부드럽게 따라오게 함
        bride.flipX = groom.flipX;
    }

    // 3. 애니메이션
    if (isMoving && (groom.body.touching.down || groom.body.blocked.down)) {
        // 바닥에 있을 때만 걷기 애니메이션 (각도 흔들기)
        groom.angle = Math.sin(this.time.now / 50) * 3;
    } else {
        groom.angle = 0;
    }

    updateDateDisplay(groom.x);
}

function updateDateDisplay(playerX) {
    const daysToAdd = Math.floor(Math.max(0, playerX - 200) / pixelsPerDay);
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + daysToAdd);

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    if (dateDisplay) {
        dateDisplay.innerText = `${year}-${month}-${day}`;
    }
}
