/**
 * @class VirtualController
 * 가상 조이스틱과 버튼을 관리하는 클래스
 */
class VirtualController {
    constructor(scene) {
        this.scene = scene;
        this.joystickPoint = { x: 0, y: 0 };
        this.joystickPointer = null;
        this.padding = 100;
        this.radius = 30; // 60 -> 30으로 축소
        
        this.setup();
    }

    setup() {
        const { width, height } = this.scene.scale;
        
        // 조이스틱 베이스
        this.base = this.scene.add.circle(this.padding, height - this.padding, this.radius, 0xffffff, 0.4)
            .setStrokeStyle(4, 0x000000, 0.3).setScrollFactor(0).setDepth(100);
        
        // 조이스틱 썸
        this.thumb = this.scene.add.circle(this.padding, height - this.padding, 15, 0xffffff, 0.8) // 30 -> 15로 축소
            .setStrokeStyle(2, 0x000000, 0.5).setScrollFactor(0).setDepth(101);

        // 버튼 A (JUMP)
        this.btnJump = this.scene.add.circle(width - this.padding, height - this.padding, 25, 0xffffff, 0.6)
            .setStrokeStyle(4, 0x000000, 0.5).setScrollFactor(0).setDepth(100).setInteractive();
        
        this.scene.add.text(width - this.padding, height - this.padding, 'JUMP', 
            { fontSize: '14px', color: '#000', fontWeight: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // 버튼 B (TALK)
        this.btnB = this.scene.add.circle(width - (this.padding * 1.6), height - this.padding, 25, 0xffffff, 0.6)
            .setStrokeStyle(4, 0x000000, 0.5).setScrollFactor(0).setDepth(100).setInteractive();
        
        this.scene.add.text(width - (this.padding * 1.6), height - this.padding, 'TALK', 
            { fontSize: '14px', color: '#000', fontWeight: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // 터치 리스너
        this.scene.input.on('pointerdown', (p) => this.handleDown(p));
        this.scene.input.on('pointermove', (p) => this.handleMove(p));
        this.scene.input.on('pointerup', (p) => this.handleUp(p));
        
        // 버튼 이벤트
        this.btnJump.on('pointerdown', () => this.scene.groom.jump());
        this.btnB.on('pointerdown', () => this.scene.events.emit('try-interact'));
    }

    handleDown(p) {
        if (p.x < this.scene.scale.width / 2 && !this.joystickPointer) {
            this.joystickPointer = p;
            this.updateJoystick(p);
        }
    }

    handleMove(p) {
        if (this.joystickPointer && p.id === this.joystickPointer.id) {
            this.updateJoystick(p);
        }
    }

    handleUp(p) {
        if (this.joystickPointer && p.id === this.joystickPointer.id) {
            this.joystickPointer = null;
            this.thumb.x = this.padding;
            this.thumb.y = this.scene.scale.height - this.padding;
            this.joystickPoint = { x: 0, y: 0 };
        }
    }

    updateJoystick(p) {
        const centerX = this.padding;
        const centerY = this.scene.scale.height - this.padding;
        const dist = Phaser.Math.Distance.Between(centerX, centerY, p.x, p.y);
        const angle = Phaser.Math.Angle.Between(centerX, centerY, p.x, p.y);

        if (dist <= this.radius) {
            this.thumb.x = p.x;
            this.thumb.y = p.y;
        } else {
            this.thumb.x = centerX + Math.cos(angle) * this.radius;
            this.thumb.y = centerY + Math.sin(angle) * this.radius;
        }

        this.joystickPoint.x = (this.thumb.x - centerX) / this.radius;
    }
}
