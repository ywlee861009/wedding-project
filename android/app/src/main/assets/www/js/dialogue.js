/**
 * @class DialogueUI
 * 대화창 및 선택지를 관리하는 UI 컴포넌트
 */
class DialogueUI {
    constructor(scene) {
        this.scene = scene;
        this.elements = []; // 컨테이너 대신 배열로 개별 관리
        this.isOpen = false;
    }

    show(text, choices, onSelect) {
        if (this.isOpen) return;
        this.isOpen = true;
        console.log("Dialogue System: Attempting to show dialogue");

        const { width, height } = this.scene.scale;
        const depth = 3000; // 매우 높은 우선순위

        // 1. 대화창 배경
        const bg = this.scene.add.graphics().setDepth(depth).setScrollFactor(0);
        bg.fillStyle(0x000000, 0.9);
        bg.fillRoundedRect(width * 0.1, height - 220, width * 0.8, 180, 20);
        bg.lineStyle(4, 0xffffff, 0.8);
        bg.strokeRoundedRect(width * 0.1, height - 220, width * 0.8, 180, 20);
        this.elements.push(bg);

        // 2. 대사 텍스트
        const dialogText = this.scene.add.text(width * 0.15, height - 190, text, {
            fontSize: '22px',
            color: '#ffffff',
            wordWrap: { width: width * 0.7 },
            lineSpacing: 10
        }).setDepth(depth + 1).setScrollFactor(0);
        this.elements.push(dialogText);

        // 3. 선택지 버튼 생성
        choices.forEach((choice, index) => {
            const btnWidth = 160;
            const btnHeight = 60;
            const btnX = width * 0.5 + (index === 0 ? -100 : 100);
            const btnY = height - 85;

            // 버튼 배경 (Rectangle이 터치 인식이 가장 정확함)
            const btnBg = this.scene.add.rectangle(btnX, btnY, btnWidth, btnHeight, 0xffffff)
                .setDepth(depth + 2)
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true });
            
            const btnText = this.scene.add.text(btnX, btnY, choice.label, {
                fontSize: '20px',
                color: '#000000',
                fontWeight: 'bold'
            }).setOrigin(0.5).setDepth(depth + 3).setScrollFactor(0);

            this.elements.push(btnBg, btnText);

            // [Critical] 클릭 이벤트 로그 강화
            btnBg.on('pointerdown', (pointer) => {
                console.log(`Button Clicked: ${choice.label} at (${pointer.x}, ${pointer.y})`);
                this.hide();
                if (onSelect) onSelect(choice.value);
            });

            // 시각적 효과
            btnBg.on('pointerover', () => btnBg.setFillStyle(0xeeeeee));
            btnBg.on('pointerout', () => btnBg.setFillStyle(0xffffff));
        });
    }

    hide() {
        if (!this.isOpen) return;
        console.log("Dialogue System: Hiding elements");
        this.elements.forEach(el => el.destroy());
        this.elements = [];
        this.isOpen = false;
    }
}
