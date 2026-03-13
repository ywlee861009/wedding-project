/**
 * @class Groom
 * 주인공 신랑 캐릭터 클래스
 */
class Groom extends Phaser.GameObjects.Image {
    constructor(scene, x, y) {
        super(scene, x, y, GAME_CONFIG.ASSETS.GROOM.key);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setOrigin(0.5, 1);
        this.applyHeightScale(GAME_CONFIG.ASSETS.GROOM.cmHeight);
        this.body.setCollideWorldBounds(false);
    }

    applyHeightScale(cmHeight) {
        // 기준: 180cm인 사람이 화면 높이의 REFERENCE_RATIO만큼 차지하도록 설정
        const targetPixelHeight = (this.scene.scale.height * GAME_CONFIG.REFERENCE_RATIO) * (cmHeight / GAME_CONFIG.REFERENCE_CM);
        const scale = targetPixelHeight / this.height; // 원본 이미지 높이 대비 스케일 계산
        this.setScale(scale);
    }

    move(direction) {
        const velocity = direction * GAME_CONFIG.PHYSICS.MOVE_SPEED;
        this.body.setVelocityX(velocity);
        
        if (direction !== 0) {
            this.flipX = (direction < 0);
            this.updateAnimation();
        } else {
            this.angle = 0;
        }
    }

    jump() {
        if (this.body.touching.down || this.body.blocked.down) {
            this.body.setVelocityY(GAME_CONFIG.PHYSICS.JUMP_FORCE);
        }
    }

    updateAnimation() {
        // 기존의 angle 흔들림 효과 제거 (0으로 고정)
        this.angle = 0;
    }
}

/**
 * @class Bride
 * 파트너 신부 캐릭터 클래스
 */
class Bride extends Phaser.GameObjects.Image {
    constructor(scene, x, y) {
        super(scene, x, y, GAME_CONFIG.ASSETS.BRIDE.key);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setOrigin(0.5, 1);
        this.applyHeightScale(GAME_CONFIG.ASSETS.BRIDE.cmHeight);
        this.body.setAllowGravity(false);
        this.alpha = 0.5;

        // 상호작용 느낌표 생성 (처음엔 숨김)
        // 스케일에 맞춰 위치 조정 (displayHeight 사용)
        this.indicator = scene.add.text(x, y - this.displayHeight - 20, '!', {
            fontSize: '40px',
            color: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setVisible(false);
    }

    applyHeightScale(cmHeight) {
        const targetPixelHeight = (this.scene.scale.height * GAME_CONFIG.REFERENCE_RATIO) * (cmHeight / GAME_CONFIG.REFERENCE_CM);
        const scale = targetPixelHeight / this.height;
        this.setScale(scale);
    }

    showIndicator(visible) {
        this.indicator.setVisible(visible);
        // 느낌표 위치 업데이트 (신부가 움직일 수 있으므로)
        if (visible) {
            this.indicator.x = this.x;
            this.indicator.y = this.y - this.displayHeight - 20;
            // 둥실둥실 애니메이션 효과
            this.indicator.y += Math.sin(this.scene.time.now / 200) * 5;
        }
    }

    follow(target, isMeeting) {
        if (!isMeeting) return;
        
        this.body.setAllowGravity(true);
        this.alpha = 1.0;
        this.showIndicator(false); // 만나면 느낌표 제거
        
        const offset = target.flipX ? 80 : -80;
        this.x = Phaser.Math.Linear(this.x, target.x + offset, 0.2);
        this.flipX = target.flipX;
    }
}
