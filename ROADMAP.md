# 🗺️ Wedding Project Roadmap (v1.0)

## Phase 1: Engine & Architecture (기획 및 고성능 엔진 구축)
- [x] **M1. Concept Setting**: 3D 횡스크롤(벨트스크롤) 여정 및 시간의 흐름 연출 상세 기획.
- [x] **M2. High-Perf Boilerplate**: Three.js + ESM 기반의 제로-오버헤드 프로젝트 구조 구축.
- [x] **M3. Lighting & Environment**: PBR 기반 조명 시스템 및 안개(Fog)를 활용한 최적화된 공간 연출.

## Phase 2: Core Game Logic (핵심 3D 기능 및 물리 구현)
- [ ] **M4. Asset Pipeline**: Low-Poly GLTF 모델(신랑, 신부, 소품) 연동 및 애니메이션 믹서 최적화.
- [ ] **M5. Entity System**: 30년 경력의 게임 루프 기반 상태 머신(State Machine) 및 엔티티 관리 시스템.
- [ ] **M6. Physics & Collision**: 자체 경량 물리 엔진을 통한 프레임 단위 정밀 충돌 처리 및 경계 제한.
- [ ] **M7. Information Blocks**: 3D 월드 내 인터랙티브 오브젝트 및 고성능 팝업 UI 시스템 구축.

## Phase 3: Interactive Features (인터랙션 및 소통)
- [ ] **M8. RSVP System**: 참석 여부 입력 폼 및 데이터 저장 (Firebase 등).
- [ ] **M9. Guestbook**: 축하 메시지 방명록 구현 (실시간 반영).
- [ ] **M10. Utilities**: 카카오톡 공유 기능 및 계좌 번호 복사/링크 추가.

## Phase 4: Extreme Optimization (성능 극한 최적화 및 마무리)
- [ ] **M11. Draw Call Batching**: 인스턴싱(Instancing) 및 정적 모델 병합을 통한 드로우 콜 최소화.
- [ ] **M12. Texture & Asset Compression**: WebP 텍스처 및 GLB 압축을 통한 로딩 속도 극대화.
- [ ] **M13. Memory Leak Check**: 모든 엔티티의 Dispose 로직 검증 및 가비지 컬렉션(GC) 부하 최소화.
- [ ] **M14. 60FPS Verification**: 모바일 WebView 환경에서 상시 60FPS 유지 여부 전수 검증.
- [ ] **M15. Final Delivery**: 고성능 3D 청첩장 최종 배포 및 지인 공유.

---
*Last Updated: 2026-03-14*  
*Updated by: Kero (30-Year Veteran Game Developer)*
