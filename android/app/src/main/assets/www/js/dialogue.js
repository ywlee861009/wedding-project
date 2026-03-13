/**
 * @class DialogueUI
 * 터치 인식 문제를 완벽히 해결한 순수 Phaser 대화 시스템
 */
class DialogueUI {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.isTyping = false;
        this.fullText = "";
        this.displayIndex = 0;
        
        this.mainContainer = null;
        this.choiceElements = []; // 버튼들을 따로 관리
        this.timer = null;
        this.skipHandler = null; // 리스너 참조 저장
    }

    show(text, choices = [], onSelect) {
        if (this.isOpen) return;
        this.isOpen = true;
        this.fullText = text;
        this.displayIndex = 0;

        const { width, height } = this.scene.scale;
        const padding = 20;
        const boxHeight = 160;
        const boxY = height - boxHeight - 40;

        // 1. 메인 대화창 컨테이너
        this.mainContainer = this.scene.add.container(0, 0).setDepth(3000).setScrollFactor(0);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x000000, 0.5).fillRoundedRect(padding + 5, boxY + 5, width - (padding * 2), boxHeight, 15);
        bg.fillStyle(0x1a1a1a, 0.95).fillRoundedRect(padding, boxY, width - (padding * 2), boxHeight, 15);
        bg.lineStyle(4, 0xffd700, 0.8).strokeRoundedRect(padding, boxY, width - (padding * 2), boxHeight, 15);
        this.mainContainer.add(bg);

        this.textElement = this.scene.add.text(padding + 30, boxY + 30, "", {
            fontSize: '22px', color: '#ffffff',
            wordWrap: { width: width - (padding * 2) - 60 },
            lineSpacing: 10
        });
        this.mainContainer.add(this.textElement);

        this.arrow = this.scene.add.text(width - 60, boxY + boxHeight - 40, "▼", { fontSize: '20px', color: '#ffd700' }).setAlpha(0);
        this.mainContainer.add(this.arrow);

        // 2. 타이핑 및 스킵 핸들러 등록
        this.isTyping = true;
        this.skipHandler = () => {
            if (this.isTyping) {
                this.finishTyping(choices, onSelect);
            }
        };
        this.scene.input.on('pointerdown', this.skipHandler);

        this.startTyping(choices, onSelect);
    }

    startTyping(choices, onSelect) {
        this.timer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                this.displayIndex++;
                this.textElement.setText(this.fullText.substring(0, this.displayIndex));
                if (this.displayIndex >= this.fullText.length) {
                    this.finishTyping(choices, onSelect);
                }
            },
            repeat: this.fullText.length - 1
        });
    }

    finishTyping(choices, onSelect) {
        if (this.timer) this.timer.destroy();
        this.isTyping = false;
        this.textElement.setText(this.fullText);
        
        // 스킵 리스너 확실히 제거
        if (this.skipHandler) {
            this.scene.input.off('pointerdown', this.skipHandler);
            this.skipHandler = null;
        }

        this.scene.tweens.add({ targets: this.arrow, alpha: 1, duration: 500, yoyo: true, repeat: -1 });

        if (choices && choices.length > 0) {
            this.showChoices(choices, onSelect);
        } else {
            // 선택지가 없으면 0.5초 뒤부터 클릭해서 닫기 가능
            this.scene.time.delayedCall(500, () => {
                this.scene.input.once('pointerdown', () => this.hide());
            });
        }
    }

    showChoices(choices, onSelect) {
        const { width, height } = this.scene.scale;
        
        choices.forEach((choice, index) => {
            const btnWidth = 280;
            const btnHeight = 70;
            const x = width / 2;
            const y = (height / 2) + (index - (choices.length - 1) / 2) * 90;

            // 배경 사각형 (인식 범위 극대화를 위해 컨테이너 밖 씬에 직접 배치)
            const bg = this.scene.add.rectangle(x, y, btnWidth, btnHeight, 0xffffff)
                .setStrokeStyle(4, 0xffd700)
                .setDepth(4001)
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true });
            
            const txt = this.scene.add.text(x, y, choice.label, {
                fontSize: '24px', color: '#000000', fontWeight: 'bold'
            }).setOrigin(0.5).setDepth(4002).setScrollFactor(0);

            this.choiceElements.push(bg, txt);

            // 이벤트 핸들링 (즉각적인 로그 추가)
            bg.on('pointerdown', () => {
                console.log(`POINTER DOWN: ${choice.label}`);
                bg.setFillStyle(0xffd700); // 누르는 즉시 금색으로 변함
            });

            bg.on('pointerup', () => {
                console.log(`POINTER UP: ${choice.label}`);
                this.hide();
                if (onSelect) onSelect(choice.value);
            });

            bg.on('pointerout', () => {
                bg.setFillStyle(0xffffff);
            });
        });
    }

    hide() {
        if (this.mainContainer) {
            this.mainContainer.destroy();
            this.mainContainer = null;
        }
        this.choiceElements.forEach(el => el.destroy());
        this.choiceElements = [];
        
        if (this.timer) this.timer.destroy();
        if (this.skipHandler) {
            this.scene.input.off('pointerdown', this.skipHandler);
            this.skipHandler = null;
        }
        
        this.isOpen = false;
        this.isTyping = false;
    }
}
