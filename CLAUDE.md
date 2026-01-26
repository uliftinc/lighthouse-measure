# Lighthouse 성능 측정 도구

## 목적
웹페이지의 Core Web Vitals(LCP, FCP, TBT) 및 Performance Score를 측정하고, 여러 번 측정한 결과의 평균값을 도출한다.

## 핵심 기능

### 1. URL 관리
- **URL 추가**: 입력 필드에 URL을 입력하면 측정 대상 리스트에 추가
- **URL 자동 정규화**: 프로토콜 없이 입력 시 `https://` 자동 추가
- **URL 제거**: 리스트에서 개별 URL 삭제 가능
- URL 목록은 브라우저 localStorage에 저장 (유저별 독립)

### 2. 성능 측정
- **전체 측정 버튼**: 리스트의 모든 URL에 대해 Lighthouse 측정 실행
- **측정 항목**:
  - Score (Performance Score) - 0~100
  - LCP (Largest Contentful Paint) - ms
  - FCP (First Contentful Paint) - ms
  - TBT (Total Blocking Time) - ms

### 3. Throttling 설정
- **Network Throttling**: 네트워크 속도 제한 프리셋 선택 (No throttling, Slow 3G, Fast 3G 등)
- **CPU Throttling**: CPU 성능 제한 배수 선택 (1x, 4x, 6x 등)
- Network와 CPU를 독립적으로 설정 가능

### 4. 기록 저장 및 관리
- **기록 저장 버튼**: 현재 측정 결과를 n번째 기록으로 저장
- **저장된 기록 목록**: 회차별 저장된 기록 표시
- **토글 상세보기**: 각 기록을 펼쳐서 URL별 상세 측정값 확인
- **개별 기록 삭제**: 특정 회차 기록만 삭제 (번호 자동 재정렬)
- **전체 초기화**: 모든 데이터(URL, 측정 결과, 저장 기록) 일괄 삭제

### 5. 평균 계산
- **평균값 계산 버튼**: 저장된 기록들을 기반으로 URL별 평균값 계산
- 평균 Score, 평균 LCP, 평균 FCP, 평균 TBT 표시

## 아키텍처

### 서버 (server.js)
- 측정 API 제공
- Throttling 프리셋 목록 제공
- 상태 저장 없음 (stateless)

### 클라이언트 (web/)
- URL 목록 관리 (localStorage)
- 측정 결과 저장 (localStorage)
- 기록 저장/삭제/조회 (localStorage)
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

### 프리셋 조회
- `GET /api/presets` - Throttling 프리셋 목록 조회
  - Response: `{ network: [{ key, name }], cpu: [{ key, name }] }`

### 측정
- `POST /api/measure` - 단일 URL 측정
  - Request: `{ url: string, network?: string, cpu?: string }`
  - Response: `{ url, measuredAt, metrics: { score, LCP_ms, FCP_ms, TBT_ms } }`

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
      score: 85,
      LCP_ms: 1200,
      FCP_ms: 800,
      TBT_ms: 150
    }
  }
]
```

### Key: `lighthouse-saved-records`
```javascript
[
  {
    recordNumber: 1,
    savedAt: "2024-01-01T12:00:00Z",
    measurements: [
      {
        url: "https://example.com",
        score: 85,
        LCP_ms: 1200,
        FCP_ms: 800,
        TBT_ms: 150
      }
    ]
  }
]
```

## 측정 조건
- Lighthouse 카테고리: Performance
- Throttling: 사용자 선택 (Network/CPU 독립 설정)
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
3. **Throttling 선택**: Network/CPU 드롭다운
4. **초기화 버튼**: 모든 데이터 삭제
5. **전체 측정 버튼**: 클릭 시 모든 URL 순차 측정
6. **결과 테이블**: 현재 측정 결과 (Score, LCP, FCP, TBT)
7. **기록 저장 버튼**: 현재 측정 결과를 기록으로 저장
8. **저장된 기록 목록**: 토글로 상세 데이터 확인, 개별 삭제 가능
9. **평균값 계산 버튼**: 저장된 기록들의 평균 계산 및 표시

## 의존성
- lighthouse
- chrome-launcher
- express
