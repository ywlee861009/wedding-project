(async () => {
    // 1. Pixi Application 초기화
    const app = new PIXI.Application();
    await app.init({
        resizeTo: window,
        backgroundColor: 0xfdfdfd,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
    });
    document.getElementById('game-container').appendChild(app.canvas);

    // 2. 2.5D 레이어 구성
    const layers = {
        sky: new PIXI.Container(),     
        far: new PIXI.Container(),     
        mid: new PIXI.Container(),     
        main: new PIXI.Container(),    
        near: new PIXI.Container()     
    };
    Object.values(layers).forEach(layer => app.stage.addChild(layer));

    // 3. 바닥(Ground)과 배경 요소 추가 (움직임을 느끼기 위해)
    const groundHeight = 100;
    const ground = new PIXI.Graphics()
        .rect(0, 0, 100000, groundHeight)
        .fill({ color: 0xeeeeee });
    ground.y = window.innerHeight - groundHeight;
    layers.main.addChild(ground);

    // 가로등/나무 같은 참조 포인트들 생성 (일정한 간격으로)
    for (let i = 0; i < 100; i++) {
        const refPoint = new PIXI.Graphics()
            .rect(0, 0, 10, 200)
            .fill({ color: 0xdddddd });
        refPoint.x = i * 800;
        refPoint.y = window.innerHeight - groundHeight - 200;
        layers.mid.addChild(refPoint);
    }

    // 4. 캐릭터 생성 (위치 조정)
    const groom = new PIXI.Graphics()
        .rect(-30, -120, 60, 120)
        .fill({ color: 0x818cf8 }); 
    
    const bride = new PIXI.Graphics()
        .rect(-30, -120, 60, 120)
        .fill({ color: 0xf472b6 }); 

    groom.x = 300;
    groom.y = window.innerHeight - groundHeight;
    bride.x = 400;
    bride.y = window.innerHeight - groundHeight;

    layers.main.addChild(groom, bride);

    // 5. 컨트롤 시스템 (Wheel + Keyboard)
    let targetScrollX = 0;
    let currentScrollX = 0;
    const keys = {};

    window.addEventListener('keydown', (e) => { keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });

    window.addEventListener('wheel', (e) => {
        targetScrollX += e.deltaY;
        if (targetScrollX < 0) targetScrollX = 0;
    });

    // 6. 게임 루프 (애니메이션)
    app.ticker.add((ticker) => {
        // 키보드 입력 처리
        if (keys['ArrowRight'] || keys['KeyD']) targetScrollX += 15;
        if (keys['ArrowLeft'] || keys['KeyA']) targetScrollX -= 15;
        
        if (targetScrollX < 0) targetScrollX = 0;

        // 부드러운 이동 (Lerp)
        currentScrollX += (targetScrollX - currentScrollX) * 0.1;

        // 레이어별 패럴랙스 (2.5D 효과)
        layers.sky.x = -currentScrollX * 0.05;
        layers.far.x = -currentScrollX * 0.2;
        layers.mid.x = -currentScrollX * 0.5;
        layers.main.x = -currentScrollX * 1.0;
        layers.near.x = -currentScrollX * 1.5;

        // 캐릭터 애니메이션 (움직일 때 살짝 위아래로 흔들림)
        const moveDiff = Math.abs(targetScrollX - currentScrollX);
        if (moveDiff > 1) {
            const bounce = Math.sin(Date.now() * 0.01) * 5;
            groom.y = window.innerHeight - groundHeight + bounce;
            bride.y = window.innerHeight - groundHeight + bounce;
        } else {
            groom.y = window.innerHeight - groundHeight;
            bride.y = window.innerHeight - groundHeight;
        }

        // 날짜 업데이트
        updateDate(currentScrollX);
    });

    // 7. 날짜 업데이트 로직
    const startDate = new Date('2018-02-15');
    const dateEl = document.getElementById('current-date');

    function updateDate(distance) {
        const daysToAdd = Math.floor(distance / 100); 
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + daysToAdd);
        
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        
        dateEl.innerText = `${y}. ${m}. ${d}`;
    }

    // 창 크기 조절 대응
    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        ground.y = window.innerHeight - groundHeight;
        groom.y = window.innerHeight - groundHeight;
        bride.y = window.innerHeight - groundHeight;
    });

})();
