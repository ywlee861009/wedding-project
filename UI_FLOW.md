# 🧭 Wedding Project UI Flow & Navigation (v1.0)

본 프로젝트는 하객들이 정보를 쉽게 확인하고 소통할 수 있도록 **심플하고 직관적인 싱글 페이지(Single Page Scroll)** 또는 **탭 기반 네비게이션**을 지향합니다.

## 1. 네비게이션 원칙 (Navigation Principles)
- **User-Centric**: 가장 중요한 정보(일시, 장소)를 최상단에 배치.
- **Visual Journey**: 스크롤을 따라 신랑 신부의 이야기와 사진이 자연스럽게 이어지도록 설계.
- **Action-Oriented**: RSVP 및 축의금 전달 버튼 등은 눈에 띄게 배치.

## 2. 화면 구성 (Site Map)

### [A] Hero Section (메인)
- **Visual**: 메인 웨딩 사진 및 감각적인 타이포그래피.
- **Key Info**: 결혼식 날짜, 시간, 장소 (간략히).
- **Interactive**: 남은 시간 카운트다운.

### [B] Intro Section (인사말)
- **Greeting**: 신랑 신부의 정성 어린 초대 문구.
- **About Us**: 간단한 신랑, 신부 소개 및 사진.

### [C] Information Section (안내)
- **Wedding Info**: 정확한 예식 일시, 예식장 이름 및 홀 정보.
- **Location**: 내장 지도 (Map API) 및 길 찾기 버튼.
- **Transport**: 대중교통 및 주차 안내.

### [D] Gallery Section (사진첩)
- **Grid/Carousel**: 선별된 웨딩 사진들.
- **Detail View**: 사진 터치 시 크게 보기 및 스와이프.

### [E] Interactive Section (RSVP & 방명록)
- **RSVP Form**: 이름, 참석 인원, 식사 여부 선택 및 전송.
- **Guestbook**: 하객들의 축하 메시지 리스트 및 작성 폼.

### [F] Footer Section (마무리)
- **Gifts**: 계좌 번호 안내 및 복사 기능, 송금 서비스 연결.
- **Contact**: 신랑, 신부 및 양가 혼주에게 연락하기 버튼.

## 3. 사용자 흐름 (User Flow)

1.  **링크 접속** -> 메인 비주얼 확인 (D-Day 확인)
2.  **스크롤 다운** -> 초대 문구 및 소개 확인
3.  **정보 확인** -> 식장 위치 및 지도 확인 (필요 시 길 찾기 실행)
4.  **사진 감상** -> 갤러리에서 웨딩 사진 감상
5.  **참여 및 축하** -> RSVP 참여 및 방명록 작성
6.  **마무리** -> 축의금 전달 (필요 시) 및 카카오톡 공유

---
*Last Updated: 2026-03-13*
