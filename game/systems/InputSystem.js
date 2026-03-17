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
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    if (!base || !knob) return;

    const maxDist = 36; // 최대 이동 반경 (px)
    let active = false;
    let startX = 0, startY = 0;

    const onStart = (cx, cy) => {
      active = true;
      const rect = base.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    };

    const onMove = (cx, cy) => {
      if (!active) return;
      let dx = cx - startX;
      let dy = cy - startY;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      this._joystick.x = dx / maxDist;
      this._joystick.y = dy / maxDist;
    };

    const onEnd = () => {
      active = false;
      knob.style.transform = 'translate(-50%, -50%)';
      this._joystick.x = 0;
      this._joystick.y = 0;
    };

    // Touch
    base.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchend', () => onEnd());

    // Mouse fallback
    base.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => { if (e.buttons) onMove(e.clientX, e.clientY); });
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
