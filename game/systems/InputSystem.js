export class InputSystem {
  constructor() {
    this._keys = {};
    this._joystick = { x: 0, y: 0 };

    window.addEventListener('keydown', (e) => {
      this._keys[e.code] = true;
      // 게임 중 스크롤 방지
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this._keys[e.code] = false;
    });

    this._initJoystick();
  }

  _initJoystick() {
    const area = document.getElementById('joystick-area');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    if (!area || !base || !knob) return;

    const maxDist = 45; // 최대 이동 반경 (px)
    let active = false;
    let baseCenterX = 0;
    let baseCenterY = 0;

    const onStart = (cx, cy) => {
      active = true;
      // 조이스틱 베이스를 터치 지점으로 이동
      base.style.display = 'block';
      base.style.left = `${cx}px`;
      base.style.top = `${cy}px`;
      
      baseCenterX = cx;
      baseCenterY = cy;
      
      knob.style.transform = 'translate(-50%, -50%)';
    };

    const onMove = (cx, cy) => {
      if (!active) return;
      let dx = cx - baseCenterX;
      let dy = cy - baseCenterY;
      const dist = Math.hypot(dx, dy);
      
      // 조작 강도 계산 (0 ~ 1)
      const moveDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      
      const targetX = Math.cos(angle) * moveDist;
      const targetY = Math.sin(angle) * moveDist;
      
      knob.style.transform = `translate(calc(-50% + ${targetX}px), calc(-50% + ${targetY}px))`;
      
      // 방향 벡터 설정
      this._joystick.x = targetX / maxDist;
      this._joystick.y = targetY / maxDist;
    };

    const onEnd = () => {
      active = false;
      base.style.display = 'none'; // 손을 떼면 숨김
      this._joystick.x = 0;
      this._joystick.y = 0;
    };

    // 터치 이벤트 (화면 전체 영역)
    area.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!active) return;
      const t = e.changedTouches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      onEnd();
    }, { passive: false });

    // 마우스 지원 (디버그용)
    area.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => { if (active) onMove(e.clientX, e.clientY); });
    window.addEventListener('mouseup', () => onEnd());
  }

  getDirection() {
    let x = this._joystick.x;
    let y = this._joystick.y;

    if (this._keys['KeyA'] || this._keys['ArrowLeft'])  x -= 1;
    if (this._keys['KeyD'] || this._keys['ArrowRight']) x += 1;
    if (this._keys['KeyW'] || this._keys['ArrowUp'])    y -= 1;
    if (this._keys['KeyS'] || this._keys['ArrowDown'])  y += 1;

    return { x, y };
  }
}
