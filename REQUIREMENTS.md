# 📋 REQUIREMENTS.md: Wedding Survivors 기능 명세

## 1. 핵심 게임 루프
1. **생존**: 몰려오는 적들로부터 10~20분간 버티기.
2. **성장**: 경험치 보석(축의금)을 획득하여 레벨업 및 무기 선택.
3. **입장**: 최종 보스 처치 후 신랑/신부 동시 입장(승리).

## 2. 주요 시스템 (Kero's Architecture)
- **고성능 렌더링**: `Three.js`의 `InstancedMesh`를 활용하여 수천 개의 적 유닛을 하나의 드로우 콜로 처리.
- **엔티티 관리**: `Object Pooling`을 적용하여 총알(Projectile)과 적 유닛의 생성/삭제 시 발생하는 GC(Garbage Collection) 부하 최소화.
- **스킬 시스템**: 무기별 레벨(1~8레벨) 및 진화(Evolution) 시스템 구현.

## 3. 캐릭터 및 적 구성
- **플레이어**: Kero(신랑), Moonhee(신부), Youngwoo(사회자) 중 선택.
- **적(Enemy)**: 솔로 부대, 잔소리하는 친척, 술 취한 하객 등.
- **보스**: 전 여친/남친(농담), 엄격한 주례 선생님 등.

## 4. 조작
- **Mobile-First**: 원터치 조이스틱 또는 Tap-to-Move.
- **Auto-Aim**: 모든 공격은 자동으로 타겟팅.
