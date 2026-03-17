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

  // 적 기본값
  ENEMY: {
    basic: {
      hp: 30,
      speed: 70,
      damage: 10,
      xp: 5,
      size: 20,
      color: '#e74c3c',
    },
    fast: {
      hp: 15,
      speed: 130,
      damage: 6,
      xp: 8,
      size: 14,
      color: '#e67e22',
    },
    tank: {
      hp: 150,
      speed: 40,
      damage: 20,
      xp: 20,
      size: 32,
      color: '#8e44ad',
    },
    boss: {
      hp: 800,
      speed: 50,
      damage: 40,
      xp: 100,
      size: 48,
      color: '#c0392b',
    },
  },

  // 웨이브 설정
  WAVE: {
    // 각 웨이브 시작 시간 (초)
    // waveIndex: 0-based
    baseDuration: 60,      // 웨이브 당 60초
    spawnIntervalBase: 2.0, // 기본 스폰 주기 (초)
    spawnIntervalMin: 0.4,  // 최소 스폰 주기
    enemyCountMultiplier: 1.3, // 웨이브마다 적 수 배율
    bossWaves: [3, 6, 9],   // 보스 출현 웨이브 (0-based)
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
