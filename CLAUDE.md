# Lighthouse 성능 측정 도구

## 목적
웹페이지의 Core Web Vitals(LCP, FCP, TBT)를 측정하고, 여러 번 측정한 결과의 평균값을 도출한다.

## 핵심 기능

### 1. URL 관리
- **URL 추가**: 입력 필드에 URL을 입력하면 측정 대상 리스트에 추가
- **URL 제거**: 리스트에서 개별 URL 삭제 가능
- URL 목록은 브라우저 localStorage에 저장 (유저별 독립)

### 2. 성능 측정
- **전체 측정 버튼**: 리스트의 모든 URL에 대해 Lighthouse 측정 실행
- **측정 항목**:
  - LCP (Largest Contentful Paint) - ms
  - FCP (First Contentful Paint) - ms
  - TBT (Total Blocking Time) - ms

### 3. 결과 저장 및 평균 계산
- 1회 측정 완료 시 결과를 localStorage에 저장
- 저장된 결과들을 기반으로 n회 측정 후 평균값 자동 계산
- URL별 측정 히스토리 관리

## 아키텍처

### 서버 (server.js)
- 측정 API만 제공
- 상태 저장 없음 (stateless)

### 클라이언트 (web/)
- URL 목록 관리 (localStorage)
- 측정 결과 저장 (localStorage)
- 평균 계산 및 UI 렌더링

## 프로젝트 구조
```
measure-lighthouse/
├── package.json          # 의존성 및 npm scripts
├── measure.js            # 측정 로직 (Lighthouse Node API)
├── server.js             # Express 서버 (측정 API)
├── CLAUDE.md             # 프로젝트 문서
└── web/
    ├── index.html        # 대시보드 UI
    ├── index.css         # 스타일
    └── index.js          # 프론트엔드 로직 + localStorage 관리
```

## API 엔드포인트

### 측정
- `POST /api/measure` - 단일 URL 측정
  - Request: `{ url: string }`
  - Response: `{ url, measuredAt, metrics: { LCP_ms, FCP_ms, TBT_ms } }`

## localStorage 스키마

### Key: `lighthouse-urls`
```javascript
["https://example.com", "https://example2.com"]
```

### Key: `lighthouse-measurements`
```javascript
[
  {
    url: "https://example.com",
    measuredAt: "2024-01-01T12:00:00Z",
    metrics: {
      LCP_ms: 1200,
      FCP_ms: 800,
      TBT_ms: 150
    }
  }
]
```

## 측정 조건
- Lighthouse 카테고리: Performance
- Throttling: 비활성화 (실제 네트워크/CPU 성능)
- 실행 모드: headless Chrome

## 실행 방법
```bash
# 의존성 설치
npm install

# 서버 실행
npm run serve

# 브라우저에서 확인
open http://localhost:3000
```

## 대시보드 UI 구성
1. **URL 입력 영역**: 텍스트 입력 + 추가 버튼
2. **URL 리스트**: 등록된 URL 목록 (삭제 버튼 포함)
3. **전체 측정 버튼**: 클릭 시 모든 URL 순차 측정
4. **결과 테이블**: URL별 최근 측정값 + 평균값 (측정 횟수 표시)

## 의존성
- lighthouse
- chrome-launcher
- express
