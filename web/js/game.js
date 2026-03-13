(async () => {
    const app = new PIXI.Application();
    await app.init({
        resizeTo: window,
        backgroundColor: 0x050508, // 아주 어두운 남색 (심야의 독산역)
        antialias: true,
        resolution: window.devicePixelRatio || 1,
    });
    document.getElementById('game-container').appendChild(app.canvas);

    const layers = {
        sky: new PIXI.Container(),     
        bgFar: new PIXI.Container(),   
        bgMid: new PIXI.Container(),   
        main: new PIXI.Container(),    
        fgNear: new PIXI.Container(),  
        ui: new PIXI.Container()
    };
    Object.values(layers).forEach(layer => app.stage.addChild(layer));

    // 1. 프로시저럴 독산역 구조물 (도형으로 구현)
    function createStation(x) {
        const station = new PIXI.Container();
        // 기둥들
        for(let i=0; i<3; i++) {
            const pillar = new PIXI.Graphics().rect(i*300, 0, 40, 600).fill({ color: 0x111115 });
            station.addChild(pillar);
        }
        // 천장 구조물
        const roof = new PIXI.Graphics().rect(-50, 0, 1000, 60).fill({ color: 0x0a0a0c });
        station.addChild(roof);
        
        station.x = x;
        station.y = window.innerHeight * 0.1;
        return station;
    }
    layers.bgMid.addChild(createStation(500));

    // 2. 가로등 효과 (Glow)
    function createLamp(x) {
        const lamp = new PIXI.Container();
        // 등대 기둥
        const pole = new PIXI.Graphics().rect(0, 0, 4, 300).fill({ color: 0x111111 });
        // 불빛 (그라데이션 대신 여러 겹의 원으로 광원 표현)
        const light = new PIXI.Graphics();
        for(let i=0; i<5; i++) {
            light.circle(2, 0, 20 + i*20).fill({ color: 0xffcc00, alpha: 0.15 - i*0.02 });
        }
        lamp.addChild(pole, light);
        lamp.x = x;
        lamp.y = window.innerHeight * 0.7 - 300;
        return lamp;
    }
    for(let i=0; i<10; i++) layers.bgMid.addChild(createLamp(i * 1200 + 400));

    // 3. 캐릭터 (실루엣 + 은은한 테두리 빛)
    const groom = new PIXI.Graphics().rect(-25, -110, 50, 110).fill({ color: 0x818cf8, alpha: 0.8 });
    const bride = new PIXI.Graphics().rect(-25, -110, 50, 110).fill({ color: 0xf472b6, alpha: 0.8 });
    groom.x = 400; bride.x = 500;
    layers.main.addChild(groom, bride);

    // 4. 정보 팝업 예시 (특정 위치 도달 시 등장할 요소)
    const infoText = new PIXI.Text({
        text: "2018. 02. 15\n독산역에서의 첫 만남",
        style: { fill: "#ffffff", fontSize: 24, fontStyle: 'italic', align: 'center', alpha: 0 }
    });
    infoText.x = 800;
    infoText.y = window.innerHeight * 0.4;
    layers.main.addChild(infoText);

    // 5. 무한 스크롤 및 패럴랙스
    let scrollX = 0;
    let targetScrollX = 0;
    window.addEventListener('wheel', (e) => { targetScrollX += e.deltaY; if(targetScrollX < 0) targetScrollX = 0; });

    app.ticker.add(() => {
        scrollX += (targetScrollX - scrollX) * 0.05;
        
        layers.bgFar.x = -scrollX * 0.2;
        layers.bgMid.x = -scrollX * 0.5;
        layers.main.x = -scrollX * 1.0;
        layers.fgNear.x = -scrollX * 2.5;

        // 특정 위치 도달 시 텍스트 서서히 나타나기 (Fade-in)
        if (scrollX > 400) infoText.alpha += (1 - infoText.alpha) * 0.05;

        // 날짜 업데이트 (상단 UI)
        const days = Math.floor(scrollX / 100);
        const date = new Date('2018-02-15');
        date.setDate(date.getDate() + days);
        document.getElementById('current-date').innerText = 
            `${date.getFullYear()}. ${String(date.getMonth()+1).padStart(2,'0')}. ${String(date.getDate()).padStart(2,'0')}`;
    });

})();
