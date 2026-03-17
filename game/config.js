// 게임 밸런스 상수

export const CONFIG = {
  // 캔버스
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 600,
  },

  // 월드 (무한 스크롤 배경)
  WORLD: {
    TILE_SIZE: 64,
  },

  // 플레이어 기본 스탯
  PLAYER: {
    youngwoo: {
      hp: 120,
      speed: 160,
      attackDamage: 20,
      attackRange: 200,
      attackInterval: 0.8,  // 초
      size: 28,
    },
    moonhee: {
      hp: 90,
      speed: 140,
      attackDamage: 35,
      attackRange: 250,
      attackInterval: 1.2,
      size: 28,
    },
  },

  // 케로 펫
  KERO: {
    offsetX: -40,
    offsetY: -20,
    attackDamage: 10,
    attackInterval: 1.0,
    attackRange: 220,
    size: 20,
  },

  // 투사체
  PROJECTILE: {
    speed: 360,
    size: 6,
    lifetime: 2.0, // 초
  },

  // 적 기본값 (20종류 정의)
  ENEMY: {
    // --- Group A: Chasers (추적형) ---
    solo_1: { name: '솔로 부대원', hp: 15, speed: 90, damage: 5, xp: 3, size: 16, color: '#ff7675', pattern: 'basic' },
    solo_2: { name: '질투하는 하객', hp: 30, speed: 80, damage: 8, xp: 6, size: 18, color: '#d63031', pattern: 'basic' },
    uncle_1: { name: '술취한 삼촌', hp: 60, speed: 50, damage: 15, xp: 12, size: 24, color: '#c0392b', pattern: 'basic' },
    aunt_1: { name: '잔소리 폭격기', hp: 20, speed: 120, damage: 7, xp: 8, size: 14, color: '#e17055', pattern: 'basic' },
    relative_1: { name: '엄격한 친척', hp: 100, speed: 60, damage: 20, xp: 20, size: 28, color: '#b2bec3', pattern: 'basic' },

    // --- Group B: Chargers (돌진형) ---
    thief_1: { name: '축의금 도둑', hp: 25, speed: 100, damage: 12, xp: 15, size: 16, color: '#f1c40f', pattern: 'charge' },
    runner_1: { name: '뷔페 줄 선 사람', hp: 40, speed: 140, damage: 10, xp: 10, size: 20, color: '#f39c12', pattern: 'charge' },
    late_1: { name: '지각한 들러리', hp: 35, speed: 110, damage: 15, xp: 14, size: 18, color: '#e67e22', pattern: 'charge' },
    guard_1: { name: '예식장 보안팀', hp: 150, speed: 80, damage: 25, xp: 30, size: 30, color: '#2d3436', pattern: 'charge' },

    // --- Group C: Ranged/Gimmick (원거리/기믹형) ---
    gossip_1: { name: '뒷담화 하객', hp: 20, speed: 70, damage: 10, xp: 10, size: 16, color: '#0984e3', pattern: 'ranged' },
    flower_1: { name: '꽃가루 뿌리개', hp: 45, speed: 60, damage: 5, xp: 15, size: 22, color: '#fd79a8', pattern: 'area' },
    camera_1: { name: '파파라치', hp: 30, speed: 110, damage: 8, xp: 18, size: 18, color: '#636e72', pattern: 'ranged' },
    ex_1: { name: '전 남친/여친', hp: 200, speed: 75, damage: 30, xp: 50, size: 32, color: '#6c5ce7', pattern: 'basic' },
    inviter_1: { name: '청첩장 배달원', hp: 15, speed: 150, damage: 5, xp: 20, size: 14, color: '#00cec9', pattern: 'basic' },

    // --- Group D: Elites & Bosses (강력한 적) ---
    manager_1: { name: '예식장 매니저', hp: 400, speed: 65, damage: 40, xp: 100, size: 40, color: '#2c3e50', pattern: 'basic' },
    priest_1: { name: '엄격한 주례선생', hp: 1000, speed: 40, damage: 50, xp: 300, size: 50, color: '#34495e', pattern: 'boss' },
    wedding_dest: { name: '결혼 파괴자', hp: 500, speed: 90, damage: 35, xp: 150, size: 44, color: '#d63031', pattern: 'charge' },
    debt_1: { name: '축의금 정산원', hp: 250, speed: 110, damage: 20, xp: 80, size: 36, color: '#f1c40f', pattern: 'basic' },
    photog_1: { name: '결혼식 사진가', hp: 180, speed: 85, damage: 15, xp: 60, size: 30, color: '#7f8c8d', pattern: 'ranged' },
    final_boss: { name: '진정한 사랑의 시련', hp: 5000, speed: 60, damage: 60, xp: 1000, size: 80, color: '#e84393', pattern: 'boss' },
  },

  // 웨이브 설정
  WAVE: {
    baseDuration: 30,      // 웨이브 당 30초
    spawnIntervalBase: 1.0, // 기본 스폰 주기
    spawnIntervalMin: 0.1,  // 최소 스폰 주기
    enemyCountMultiplier: 1.5, // 웨이브마다 적 수 배율
    bossWaves: [5, 10, 15],   // 보스 출현 웨이브
  },

  // 경험치 오브
  XP_ORB: {
    size: 8,
    pickupRadius: 40,
    magnetRadius: 100, // 이 범위 안에서 플레이어 쪽으로 끌림
    speed: 200,
  },

  // 레벨업 XP 테이블 (레벨 → 다음 레벨까지 필요 XP)
  XP_TABLE: [0, 30, 70, 130, 210, 320, 460, 640, 860, 1130, 1450],
};

// 능력 풀
export const ABILITIES = [
  {
    id: 'proj_count',
    name: '멀티샷',
    icon: '🔫',
    desc: '투사체 +1발 추가 발사',
    apply: (player) => { player.projectileCount = (player.projectileCount || 1) + 1; },
  },
  {
    id: 'attack_speed',
    name: '속사',
    icon: '⚡',
    desc: '공격 속도 20% 증가',
    apply: (player) => { player.attackInterval *= 0.8; },
  },
  {
    id: 'move_speed',
    name: '질풍',
    icon: '💨',
    desc: '이동 속도 15% 증가',
    apply: (player) => { player.speed *= 1.15; },
  },
  {
    id: 'hp_up',
    name: '강인함',
    icon: '❤️',
    desc: '최대 HP +30, 현재 HP +30',
    apply: (player) => { player.maxHp += 30; player.hp = Math.min(player.hp + 30, player.maxHp); },
  },
  {
    id: 'damage_up',
    name: '파괴력',
    icon: '💥',
    desc: '공격력 25% 증가',
    apply: (player) => { player.attackDamage *= 1.25; },
  },
  {
    id: 'range_up',
    name: '저격수',
    icon: '🎯',
    desc: '공격 사거리 30% 증가',
    apply: (player) => { player.attackRange *= 1.3; },
  },
  {
    id: 'pierce',
    name: '관통',
    icon: '🏹',
    desc: '투사체가 적을 관통함',
    apply: (player) => { player.pierce = (player.pierce || 0) + 1; },
  },
  {
    id: 'regen',
    name: '재생',
    icon: '🌿',
    desc: '초당 2HP 회복',
    apply: (player) => { player.regen = (player.regen || 0) + 2; },
  },
  {
    id: 'xp_magnet',
    name: '인력',
    icon: '🧲',
    desc: 'XP 오브 흡수 범위 50% 증가',
    apply: (player) => { player.xpMagnetBonus = (player.xpMagnetBonus || 0) + 0.5; },
  },
];
