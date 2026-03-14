# 🎫 Wedding Project - High-Performance 3D Tickets

## [ ] T1. GLTF 에셋 최적화 및 파이프라인 (Priority: High)
- **Description**: 현재 GLB 모델들을 분석하여 폴리곤 수를 최적화하고, 텍스처를 WebP 포맷으로 전환하여 로딩 성능 극대화.
- **Acceptance Criteria**:
  - [ ] `assets/models/` 내 모든 모델의 DRACO 압축 여부 확인 및 적용.
  - [ ] 텍스처 해상도 관리 (최대 1024x1024, WebP).
  - [ ] `PlayerEntity` 모델 로딩 시 `Progressive Loading` 처리.

## [ ] T2. 드로우 콜 최적화 (Instancing) (Priority: High)
- **Description**: 씬 내 가로등, 나무, 건물 등 반복적으로 배치되는 오브젝트들을 `InstancedMesh` 또는 `Static Geometry Merging`으로 전환하여 드로우 콜을 50개 이하로 유지.
- **Acceptance Criteria**:
  - [ ] `StreetLightEntity` 및 `TreeEntity`를 인스턴싱 구조로 변경.
  - [ ] 배경 건물을 단일 메시로 병합(Merging) 처리.

## [ ] T3. 고성능 물리 및 충돌 시스템 (Priority: Medium)
- **Description**: 30년차 노하우를 담은 간소화된 물리 엔진 고도화. 프레임 드랍 없이 수백 개의 오브젝트와 상호작용 가능한 구조.
- **Acceptance Criteria**:
  - [ ] OBB(Oriented Bounding Box) 또는 레이캐스팅(Raycasting) 기반의 충돌 감지 로직 구현.
  - [ ] 프레임 독립적(Frame-independent) 물리 업데이트 (Delta Time 활용).

## [ ] T4. 정보 블록 및 인터랙티브 UI (Priority: High)
- **Description**: 여정 중간에 배치될 정보 블록('?') 및 상호작용 시 나타날 팝업 시스템 구축. 3D 씬과 UI 레이어 간의 드로우 콜 분리.
- **Acceptance Criteria**:
  - [ ] 충돌 감지가 가능한 3D 정보 블록 엔티티 생성.
  - [ ] 상호작용 시 성능 부하 없는 HTML/CSS 오버레이 UI 연동.

---
*Updated by: Kero (30-Year Veteran Game Developer)*
