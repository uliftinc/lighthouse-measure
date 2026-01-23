# 구현 TODO List

## 1. 프로젝트 초기 설정
- [x] package.json 생성 (의존성: lighthouse, chrome-launcher, express)
- [x] npm scripts 설정 (serve 명령어)

## 2. 서버 구현 (server.js)
- [x] Express 서버 기본 설정 (포트 3000)
- [x] 정적 파일 제공 설정 (web/ 폴더)
- [x] `POST /api/measure` 엔드포인트 구현
  - [x] Request body에서 url 추출
  - [x] measure.js 호출하여 측정 실행
  - [x] Response: { url, measuredAt, metrics } 반환

## 3. 측정 로직 구현 (measure.js)
- [x] chrome-launcher로 headless Chrome 실행
- [x] Lighthouse 측정 실행
  - [x] 카테고리: Performance만
  - [x] Throttling 비활성화
- [x] 결과에서 LCP, FCP, TBT 추출 (ms 단위)
- [x] Chrome 종료 후 결과 반환

## 4. 프론트엔드 UI (web/index.html)
- [x] URL 입력 필드 + 추가 버튼
- [x] URL 리스트 영역 (동적 렌더링)
- [x] 전체 측정 버튼
- [x] 결과 테이블 영역

## 5. 스타일 (web/index.css)
- [x] 기본 레이아웃 스타일
- [x] URL 리스트 스타일 (삭제 버튼 포함)
- [x] 결과 테이블 스타일
- [x] 측정 중 상태 표시 스타일

## 6. 프론트엔드 로직 (web/index.js)

### localStorage 관리
- [x] URL 목록 로드/저장 (`lighthouse-urls`)
- [x] 측정 결과 로드/저장 (`lighthouse-measurements`)

### URL 관리 기능
- [x] URL 추가 함수 (중복 체크 포함)
- [x] URL 삭제 함수
- [x] URL 리스트 렌더링 함수

### 측정 기능
- [x] 단일 URL 측정 API 호출 함수
- [x] 전체 URL 순차 측정 함수
- [x] 측정 결과 저장 함수

### 결과 계산 및 표시
- [x] URL별 평균값 계산 함수
- [x] 결과 테이블 렌더링 함수
- [x] 측정 횟수 표시

## 7. 테스트 및 검증
- [x] 서버 실행 확인
- [x] URL 추가/삭제 동작 확인
- [x] 측정 API 동작 확인
- [x] localStorage 저장/로드 확인
- [x] 평균값 계산 정확성 확인

## 8. 성능 환경 설정 기능
- [x] Lighthouse 내장 프리셋 활용
  - [x] mobileSlow4G (RTT 150ms, 1.6Mbps, CPU 4x)
  - [x] mobileRegular3G (RTT 300ms, 700Kbps, CPU 4x)
  - [x] desktopDense4G (RTT 40ms, 10Mbps, CPU 1x)
  - [x] No throttling (현재 기본값)
- [x] throttlingMethod 선택 (simulate/devtools/provided)
- [x] UI에 프리셋 선택 드롭다운 추가
- [x] 측정 API에 throttling 옵션 전달

## 9. 측정 기록 저장 및 평균 계산 기능

### 측정 항목 추가
- [x] Lighthouse Performance Score 추가 (0-100)

### 기록 저장 기능
- [x] 1회 측정 = 모든 URL 측정 결과 세트
- [x] 측정 완료 시 자동 저장 (임시 저장소)
- [x] "n번째 기록 저장" 버튼
  - [x] 클릭 시 현재 측정 결과를 n번째 기록으로 확정 저장
  - [x] n은 저장된 기록 수 + 1 (1번째, 2번째, 3번째...)
- [x] 저장된 기록 목록 표시 (1회, 2회, 3회...)

### 평균 계산 기능
- [x] "n회 평균값 계산" 버튼
  - [x] 저장된 모든 회차의 평균 계산
  - [x] n = 저장된 기록 수
- [x] 평균 결과 표시
  - [x] 평균 Lighthouse Score
  - [x] 평균 LCP (ms)
  - [x] 평균 FCP (ms)
  - [x] 평균 TBT (ms)

### localStorage 스키마 변경
- [x] `lighthouse-saved-records` 키 추가
  ```javascript
  [
    {
      recordNumber: 1,
      savedAt: "2024-01-01T12:00:00Z",
      measurements: [
        { url, score, LCP_ms, FCP_ms, TBT_ms }
      ]
    }
  ]
  ```

### 기타 기능
- [x] 기록 초기화 버튼 (모든 저장된 기록 삭제)
