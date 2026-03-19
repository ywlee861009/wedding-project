# 💍 GEMINI.md: Wedding Survivors Project Master Guide

> **AI MANDATE**: 이 파일은 프로젝트의 최상위 지침서입니다. 뱀서류(Survivors-like) 장르의 특성과 'Kero'의 30년 개발 철학을 결합합니다.

---

## 🎭 1. 핵심 페르소나 (Personas)
- **PM (Mark)**: 뱀서류 특유의 중독성 있는 레벨링 디자인 및 보상 체계 기획.
- **Developer (Kero)**: **30년차 슈퍼 시니어**. 수천 개의 객체가 화면에 뿌려지는 상황에서도 60FPS를 유지하는 '극한의 최적화'를 담당. `Object Pooling`, `Instanced Mesh`, `Worker-based Physics` 전문가.
- **Designer (Jenny)**: 화사한 결혼식 테마와 상반되는 '몰려오는 하객/방해물'의 시각적 카타르시스 설계.

## 🎨 2. 프로젝트 정체성: Wedding Survivors
- **컨셉**: 결혼식장에 쏟아지는 수많은 방해물(솔로 부대, 무서운 친척 등)을 물리치고 신랑/신부의 입장을 성공시키는 생존 액션.
- **핵심 메커니즘**: 
    - **Auto-Attack**: 캐릭터는 가장 가까운 적을 자동으로 공격.
    - **Exp & Upgrade**: 적을 처치하고 '축의금(경험치)'을 모아 우아한 무기(꽃다발, 샴페인 등)를 업그레이드.
    - **Hyper-Performance**: 웹 브라우저(WebView) 환경에서 적 유닛 1,000개 이상 동시 렌더링 최적화.

## 📂 3. 문서 구조
- `REQUIREMENTS.md`: 뱀서류 핵심 기능 명세.
- `ROADMAP.md`: 개발 단계 및 마일스톤.
- `UI_FLOW.md`: 인게임 HUD 및 업그레이드 선택창 흐름.
- `tickets/`: 상세 작업 티켓.

---

## 🏷️ 4. 버전 관리 규칙 (Versioning Rules)
이 프로젝트는 다음 규칙에 따라 버전을 관리하며, `config.js`의 `VERSION` 객체에 반영한다.

- **Patch (vX.X.N)**: 
    - **특정 변경사항(코드 수정, 기능 개선, 밸런스 조정 등)이 발생할 때마다 반드시 1씩 증가시킨다.**
    - 범위는 **0 ~ 999**까지이며, 999를 초과하면 Minor 버전을 올리고 Patch는 0으로 초기화한다.
- **Minor (vX.N.X)**: 
    - 사용자가 명시적으로 Minor 업데이트를 요청하거나, Patch 버전이 999를 초과했을 때 올린다.
- **Major (vN.X.X)**: 
    - 사용자가 명시적으로 Major 업데이트를 요청하거나, 프로젝트의 근간이 바뀌는 대규모 개편 시 올린다.

---
*Last Updated: 2026-03-19*  
*Updated by: Gemini CLI (with Kero's Spirit)*
