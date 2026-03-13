/**
 * @class VirtualController
 * RexRainbow 가상 조이스틱과 커스텀 버튼을 관리하는 클래스
 */
class VirtualController {
    constructor(scene) {
        this.scene = scene;
        this.padding = 100;
        this.radius = 40;
        
        // 조이스틱 상태 값 (main.js 호환용)
        this.joystickPoint = { x: 0, y: 0 };
        
        this.setup();
    }

    setup() {
        const { width, height } = this.scene.scale;
        
        // 1. Rex 가상 조이스틱 생성
        this.joystick = this.scene.plugins.get('rexVirtualJoystick').add(this.scene, {
            x: this.padding,
            y: height - this.padding,
            radius: this.radius,
            base: this.scene.add.circle(0, 0, this.radius, 0xffffff, 0.4).setStrokeStyle(4, 0x000000, 0.3),
            thumb: this.scene.add.circle(0, 0, 20, 0xffffff, 0.8).setStrokeStyle(2, 0x000000, 0.5),
            dir: '8dir', // 8방향 모드
            forceMin: 16,
            enable: true
        });

        // 조이스틱 객체의 Depth와 ScrollFactor 설정 (UI로 고정)
        this.joystick.base.setScrollFactor(0).setDepth(100);
        this.joystick.thumb.setScrollFactor(0).setDepth(101);

        // 2. 버튼 A (JUMP)
        this.btnJump = this.scene.add.circle(width - this.padding, height - this.padding, 25, 0xffffff, 0.6)
            .setStrokeStyle(4, 0x000000, 0.5).setScrollFactor(0).setDepth(100).setInteractive();
        
        this.scene.add.text(width - this.padding, height - this.padding, 'JUMP', 
            { fontSize: '14px', color: '#000', fontWeight: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // 3. 버튼 B (TALK)
        this.btnB = this.scene.add.circle(width - (this.padding * 1.6), height - this.padding, 25, 0xffffff, 0.6)
            .setStrokeStyle(4, 0x000000, 0.5).setScrollFactor(0).setDepth(100).setInteractive();
        
        this.scene.add.text(width - (this.padding * 1.6), height - this.padding, 'TALK', 
            { fontSize: '14px', color: '#000', fontWeight: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

        // 버튼 이벤트
        this.btnJump.on('pointerdown', () => this.scene.groom.jump());
        this.btnB.on('pointerdown', () => this.scene.events.emit('try-interact'));

        // [Update Loop] 조이스틱 강도(force)를 joystickPoint.x에 매핑
        this.scene.events.on('update', () => {
            if (this.joystick.force > 0) {
                // 각도(Radian)를 사용하여 X축 벡터 계산 (-1 ~ 1)
                this.joystickPoint.x = Math.cos(this.joystick.rotation) * (this.joystick.force / this.radius);
            } else {
                this.joystickPoint.x = 0;
            }
        });
    }

    // 화면 크기 조정(Resize) 시 위치 재정렬이 필요할 경우 호출
    updatePositions() {
        const { width, height } = this.scene.scale;
        this.joystick.setPosition(this.padding, height - this.padding);
        this.btnJump.setPosition(width - this.padding, height - this.padding);
        this.btnB.setPosition(width - (this.padding * 1.6), height - this.padding);
    }
}
