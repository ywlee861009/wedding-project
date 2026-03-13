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
        sky: new PIXI.Container(),     // 가장 먼 배경 (구름)
        far: new PIXI.Container(),     // 먼 배경 (도시 실루엣)
        mid: new PIXI.Container(),     // 중간 배경 (독산역, 건물)
        main: new PIXI.Container(),    // 캐릭터와 메인 도로
        near: new PIXI.Container()     // 전경 (나무, 가로등)
    };

    Object.values(layers).forEach(layer => app.stage.addChild(layer));

    // 3. 임시 캐릭터 생성 (실제 에셋 로딩 전 사각형으로 대체)
    const groom = new PIXI.Graphics()
        .rect(-40, -80, 80, 160)
        .fill({ color: 0x818cf8 }); // Indigo 400
    
    const bride = new PIXI.Graphics()
        .rect(-40, -80, 80, 160)
        .fill({ color: 0xf472b6 }); // Pink 400

    groom.x = 200;
    groom.y = window.innerHeight * 0.7;
    bride.x = 300;
    bride.y = window.innerHeight * 0.7;

    layers.main.addChild(groom, bride);

    // 4. 스크롤 시스템 (Travel Control)
    let targetScrollX = 0;
    let currentScrollX = 0;
    const scrollSpeed = 0.5;

    window.addEventListener('wheel', (e) => {
        targetScrollX += e.deltaY;
        // 여정의 시작(독산역) 전으로는 못 가게 제한
        if (targetScrollX < 0) targetScrollX = 0;
    });

    // 5. 게임 루프 (애니메이션)
    app.ticker.add(() => {
        // 부드러운 이동 (Lerp)
        currentScrollX += (targetScrollX - currentScrollX) * 0.1;

        // 레이어별 패럴랙스 (2.5D 효과의 핵심!)
        layers.sky.x = -currentScrollX * 0.05;
        layers.far.x = -currentScrollX * 0.2;
        layers.mid.x = -currentScrollX * 0.5;
        layers.main.x = -currentScrollX * 1.0;
        layers.near.x = -currentScrollX * 1.5;

        // 날짜 업데이트 (거리 비례)
        updateDate(currentScrollX);
    });

    // 6. 날짜 업데이트 로직
    const startDate = new Date('2018-02-15');
    const dateEl = document.getElementById('current-date');

    function updateDate(distance) {
        const daysToAdd = Math.floor(distance / 50); // 50px 당 1일 흐름
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + daysToAdd);
        
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        
        dateEl.innerText = `${y}. ${m}. ${d}`;
    }

    // 창 크기 조절 대응
    window.addEventListener('resize', () => {
        groom.y = window.innerHeight * 0.7;
        bride.y = window.innerHeight * 0.7;
    });

})();
