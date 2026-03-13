// Phaser 3: Wedding Journey (2018-02-15 ~ )
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 } }
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
let player;
let bgLayers = [];
const startDate = new Date("2018-02-15");
const dateDisplay = document.getElementById('date-display');

function preload() {
    this.load.svg('bride', '../design/bride_160_cute.svg');
    this.load.svg('groom', '../design/groom_160_cute.svg');
}

function create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. 패럴랙스 배경 레이어 생성 (가장 먼 곳부터)
    // Layer 0: 하늘 (그라데이션 느낌)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x001a33, 0x001a33, 0x003366, 0x003366, 1);
    sky.fillRect(0, 0, width * 10, height);
    bgLayers.push({ obj: sky, speed: 0 });

    // Layer 1: 아주 먼 건물 실루엣 (독산역 인근 공장지대 느낌)
    for (let i = 0; i < 20; i++) {
        const h = 100 + Math.random() * 200;
        const b = this.add.rectangle(i * 300, height - h - 100, 200, h, 0x1a1a2e).setOrigin(0, 0);
        bgLayers.push({ obj: b, speed: 0.2 });
    }

    // Layer 2: 중간 건물 (디테일 추가)
    for (let i = 0; i < 15; i++) {
        const h = 150 + Math.random() * 150;
        const b = this.add.rectangle(i * 500, height - h - 50, 300, h, 0x16213e).setOrigin(0, 0);
        bgLayers.push({ obj: b, speed: 0.5 });
    }

    // Layer 3: 바닥/플랫폼 (독산역 승강장)
    const ground = this.add.rectangle(0, height - 100, width * 10, 100, 0x333333).setOrigin(0, 0);
    this.physics.add.existing(ground, true);
    bgLayers.push({ obj: ground, speed: 1 });

    // 2. 캐릭터 그룹 생성 (신랑, 신부)
    // 캐릭터들을 하나의 컨테이너에 담아 같이 움직이게 합니다.
    this.playerContainer = this.add.container(200, height - 180);
    const groomImg = this.add.image(-40, 0, 'groom').setScale(0.8);
    const brideImg = this.add.image(40, 0, 'bride').setScale(0.8);
    this.playerContainer.add([groomImg, brideImg]);
    
    // 물성치 부여
    this.physics.world.enable(this.playerContainer);
    this.playerContainer.body.setCollideWorldBounds(false);

    // 3. 조작 설정
    cursors = this.input.keyboard.createCursorKeys();

    // 카메라 설정 (캐릭터를 따라다니되, X축만 따라감)
    this.cameras.main.startFollow(this.playerContainer, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(-200, 0);
}

function update() {
    const moveSpeed = 5;
    let isMoving = false;

    // 키보드 입력 처리
    if (cursors.left.isDown) {
        this.playerContainer.x -= moveSpeed;
        isMoving = true;
    } else if (cursors.right.isDown) {
        this.playerContainer.x += moveSpeed;
        isMoving = true;
    }

    // 패럴랙스 효과 적용
    bgLayers.forEach(layer => {
        // 카메라의 이동량에 맞춰 레이어마다 다른 속도로 이동
        if (layer.speed > 0) {
            // 레이어의 위치를 카메라의 위치와 반비례하게 조절
            // 실제 구현 시에는 TileSprite를 쓰면 더 좋지만 일단 원리를 위해 이렇게 구현
        }
    });

    // 캐릭터 호흡 애니메이션
    const time = this.time.now / 300;
    this.playerContainer.list[0].y = Math.sin(time) * 3; // 신랑
    this.playerContainer.list[1].y = Math.cos(time) * 3; // 신부

    // 이동 시 걷는 애니메이션 느낌 (살짝 좌우로 흔들림)
    if (isMoving) {
        this.playerContainer.angle = Math.sin(this.time.now / 50) * 2;
    } else {
        this.playerContainer.angle = 0;
    }

    // 상단 날짜 업데이트 로직
    updateDateDisplay(this.playerContainer.x);
}

function updateDateDisplay(playerX) {
    // 거리에 비례하여 날짜 계산 (10px 당 1일 정도로 설정)
    const daysToAdd = Math.floor(Math.max(0, playerX - 200) / 10);
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + daysToAdd);

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    if (dateDisplay) {
        dateDisplay.innerText = `${year}-${month}-${day}`;
    }
}
