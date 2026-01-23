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
- [ ] chrome-launcher로 headless Chrome 실행
- [ ] Lighthouse 측정 실행
  - [ ] 카테고리: Performance만
  - [ ] Throttling 비활성화
- [ ] 결과에서 LCP, FCP, TBT 추출 (ms 단위)
- [ ] Chrome 종료 후 결과 반환

## 4. 프론트엔드 UI (web/index.html)
- [ ] URL 입력 필드 + 추가 버튼
- [ ] URL 리스트 영역 (동적 렌더링)
- [ ] 전체 측정 버튼
- [ ] 결과 테이블 영역

## 5. 스타일 (web/index.css)
- [ ] 기본 레이아웃 스타일
- [ ] URL 리스트 스타일 (삭제 버튼 포함)
- [ ] 결과 테이블 스타일
- [ ] 측정 중 상태 표시 스타일

## 6. 프론트엔드 로직 (web/index.js)

### localStorage 관리
- [ ] URL 목록 로드/저장 (`lighthouse-urls`)
- [ ] 측정 결과 로드/저장 (`lighthouse-measurements`)

### URL 관리 기능
- [ ] URL 추가 함수 (중복 체크 포함)
- [ ] URL 삭제 함수
- [ ] URL 리스트 렌더링 함수

### 측정 기능
- [ ] 단일 URL 측정 API 호출 함수
- [ ] 전체 URL 순차 측정 함수
- [ ] 측정 결과 저장 함수

### 결과 계산 및 표시
- [ ] URL별 평균값 계산 함수
- [ ] 결과 테이블 렌더링 함수
- [ ] 측정 횟수 표시

## 7. 테스트 및 검증
- [ ] 서버 실행 확인
- [ ] URL 추가/삭제 동작 확인
- [ ] 측정 API 동작 확인
- [ ] localStorage 저장/로드 확인
- [ ] 평균값 계산 정확성 확인
