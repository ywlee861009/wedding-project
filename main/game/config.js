// 게임 밸런스 상수

export const CONFIG = {
  VERSION: {
    major: 1,
    minor: 1,
    patch: 13
  },
  CANVAS: { WIDTH: 800, HEIGHT: 600 },
  WORLD: { TILE_SIZE: 64 },

  PLAYER: {
    youngwoo: {
      hp: 200, speed: 180, attackDamage: 30, attackRange: 220, attackInterval: 0.7, size: 40,
      asset: 'char_youngwoo.png', weddingAsset: 'char_youngwoo2.png'
    },
    moonhee: {
      hp: 200, speed: 150, attackDamage: 40, attackRange: 280, attackInterval: 1.0, size: 40,
      asset: 'char_moonhee.png', weddingAsset: 'char_moonhee2.png'
    },
  },

  KERO: {
    offsetX: -50, offsetY: -30, attackDamage: 20, attackInterval: 0.6, attackRange: 300, size: 30,
    asset: 'char_kero.png'
  },

  PROJECTILE: { speed: 500, size: 7, lifetime: 3.0 },

  ENEMY: {
    solo_1: { name: '솔로 부대원', hp: 12, speed: 85, damage: 2, xp: 5, size: 24, asset: 'mon1.png', gemColor: '#ff7675', pattern: 'basic' },
    solo_2: { name: '질투하는 하객', hp: 25, speed: 75, damage: 3, xp: 8, size: 26, asset: 'mon2.png', gemColor: '#d63031', pattern: 'basic' },
    uncle_1: { name: '술취한 삼촌', hp: 50, speed: 45, damage: 6, xp: 15, size: 32, asset: 'mon3.png', gemColor: '#c0392b', pattern: 'basic' },
    aunt_1: { name: '잔소리 폭격기', hp: 18, speed: 110, damage: 2, xp: 10, size: 22, asset: 'mon4.png', gemColor: '#e17055', pattern: 'basic' },
    relative_1: { name: '엄격한 친척', hp: 80, speed: 55, damage: 10, xp: 25, size: 34, asset: 'mon5.png', gemColor: '#b2bec3', pattern: 'basic' },
    thief_1: { name: '축의금 도둑', hp: 20, speed: 90, damage: 5, xp: 20, size: 24, asset: 'mon6.png', gemColor: '#f1c40f', pattern: 'charge' },
    runner_1: { name: '뷔페 줄 선 사람', hp: 35, speed: 130, damage: 4, xp: 12, size: 28, asset: 'mon7.png', gemColor: '#f39c12', pattern: 'charge' },
    late_1: { name: '지각한 들러리', hp: 30, speed: 100, damage: 7, xp: 16, size: 26, asset: 'mon8.png', gemColor: '#e67e22', pattern: 'charge' },
    guard_1: { name: '예식장 보안팀', hp: 130, speed: 70, damage: 12, xp: 35, size: 36, asset: 'mon9.png', gemColor: '#2d3436', pattern: 'charge' },
    gossip_1: { name: '뒷담화 하객', hp: 18, speed: 65, damage: 4, xp: 12, size: 24, asset: 'mon10.png', gemColor: '#0984e3', pattern: 'ranged' },
    flower_1: { name: '꽃가루 뿌리개', hp: 40, speed: 55, damage: 3, xp: 18, size: 30, asset: 'mon11.png', gemColor: '#fd79a8', pattern: 'area' },
    camera_1: { name: '파파라치', hp: 25, speed: 105, damage: 4, xp: 22, size: 24, asset: 'mon12.png', gemColor: '#636e72', pattern: 'ranged' },
    ex_1: { name: '전 남친/여친', hp: 180, speed: 70, damage: 15, xp: 60, size: 40, asset: 'mon13.png', gemColor: '#6c5ce7', pattern: 'basic' },
    inviter_1: { name: '청첩장 배달원', hp: 12, speed: 140, damage: 2, xp: 25, size: 22, asset: 'mon14.png', gemColor: '#00cec9', pattern: 'basic' },
    debt_1: { name: '축의금 정산원', hp: 220, speed: 100, damage: 10, xp: 90, size: 36, asset: 'mon15.png', gemColor: '#ffeaa7', pattern: 'basic' },
    photog_1: { name: '결혼식 사진가', hp: 160, speed: 80, damage: 8, xp: 70, size: 32, asset: 'mon16.png', gemColor: '#7f8c8d', pattern: 'ranged' },
    manager_1: { name: '예식장 매니저', hp: 300, speed: 60, damage: 20, xp: 120, size: 50, asset: 'boss1.png', gemColor: '#2c3e50', pattern: 'basic' },
    priest_1: { name: '엄격한 주례선생', hp: 700, speed: 35, damage: 25, xp: 350, size: 60, asset: 'boss2.png', gemColor: '#55efc4', pattern: 'boss' },
    wedding_dest: { name: '결혼 파괴자', hp: 400, speed: 80, damage: 20, xp: 180, size: 54, asset: 'boss3.png', gemColor: '#fab1a0', pattern: 'charge' },
    final_boss: { name: '진정한 사랑의 시련', hp: 4000, speed: 55, damage: 35, xp: 1200, size: 80, asset: 'boss4.png', gemColor: '#e84393', pattern: 'boss' },
  },

  WAVE: {
    totalWaves: 40,
    baseDuration: 30,
    spawnIntervalBase: 2.2,
    spawnIntervalMin: 0.35,
    enemyCountMultiplier: 1.3, // 1.15 -> 1.3 (물량 증가)
    bossWaves: [10, 20, 30, 40],
  },

  XP_ORB: { size: 8, pickupRadius: 40, magnetRadius: 65, speed: 300 },
  
  XP: {
    base: 15,        // 35 -> 15 (레벨업 가속)
    increase: 10,    // 25 -> 10 (레벨업 가속)
    multiplier: 1.03 // 1.08 -> 1.03 (완만한 성장)
  },
};

export const ABILITIES = [
  { id: 'proj_count', name: '멀티샷', icon: '🔫', desc: '투사체 +1발 추가 발사', apply: (player) => { player.projectileCount = (player.projectileCount || 1) + 1; } },
  { id: 'attack_speed', name: '속사', icon: '⚡', desc: '공격 속도 20% 증가', apply: (player) => { player.attackInterval = Math.max(0.05, player.attackInterval * 0.8); } },
  { id: 'move_speed', name: '질풍', icon: '💨', desc: '이동 속도 15% 증가', apply: (player) => { player.speed = Math.min(600, player.speed * 1.15); } },
  { id: 'hp_up', name: '강인함', icon: '❤️', desc: '최대 HP +50, 현재 HP +50', apply: (player) => { player.maxHp += 50; player.hp = Math.min(player.hp + 50, player.maxHp); } },
  { id: 'damage_up', name: '파괴력', icon: '💥', desc: '공격력 25% 증가', apply: (player) => { player.attackDamage *= 1.25; } },
  { id: 'range_up', name: '저격수', icon: '🎯', desc: '공격 사거리 30% 증가', apply: (player) => { player.attackRange *= 1.3; } },
  { id: 'pierce', name: '관통', icon: '🏹', desc: '투사체가 적을 관통함', apply: (player) => { player.pierce = (player.pierce || 0) + 1; } },
  { id: 'regen', name: '재생', icon: '🌿', desc: '초당 5HP 회복', apply: (player) => { player.regen = (player.regen || 0) + 5; } },
  { id: 'xp_magnet', name: '인력', icon: '🧲', desc: 'XP 오브 흡수 범위 50% 증가', apply: (player) => { player.xpMagnetBonus = (player.xpMagnetBonus || 0) + 0.5; } },
  { id: 'xp_boost', name: '축복', icon: '✨', desc: '경험치 획득량 20% 증가', apply: (player) => { player.xpMultiplier = (player.xpMultiplier || 1) + 0.2; } },
  { id: 'crit_chance', name: '치명타', icon: '🎯', desc: '치명타 확률 10% 증가 (2배 대미지)', apply: (player) => { player.critChance = (player.critChance || 0) + 0.1; } },
];
