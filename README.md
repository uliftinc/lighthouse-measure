# Lighthouse Performance Measurement Tool

웹페이지의 Core Web Vitals(LCP, FCP, TBT) 및 Performance Score를 측정하고, 여러 번 측정한 결과의 평균값을 도출하는 도구입니다.

## Features

- **URL 관리**: URL 추가/삭제, 프로토콜 자동 추가 (`https://`)
- **성능 측정**: Lighthouse 기반 Performance Score, LCP, FCP, TBT 측정
- **Throttling 설정**: Network/CPU 독립적 throttling 설정
- **기록 관리**: 측정 결과 저장, 회차별 조회, 개별/전체 삭제
- **평균 계산**: 저장된 기록들의 URL별 평균값 계산

## Installation

```bash
npm install
```

## Usage

```bash
# 서버 실행
npm run serve

# 브라우저에서 접속
open http://localhost:3000
```

## Deployment Limitations

> **Vercel 등 서버리스 환경에서는 사용할 수 없습니다.**

이 도구는 Lighthouse Node API와 Chrome을 사용하여 성능을 측정합니다. Vercel, Netlify 등의 서버리스 플랫폼에서는 다음과 같은 이유로 동작하지 않습니다:

- **Chrome 실행 불가 (근본적 문제)**: 서버리스 환경에는 Chrome 바이너리가 없고, 설치하더라도 실행에 필요한 시스템 리소스와 권한이 없음
- **실행 시간 제한**: Lighthouse 측정은 URL당 10~30초가 소요되나, 서버리스 함수는 실행 시간 제한이 있음 (Vercel Hobby: 10초, Pro: 60초)
- **파일 시스템 제한**: Chrome 실행에 필요한 임시 파일 생성이 제한됨

### 권장 배포 환경

- 로컬 환경 (개발/테스트)
- VPS (AWS EC2, DigitalOcean 등)
- 컨테이너 환경 (Docker)

## API

### GET /api/presets

Throttling 프리셋 목록 조회

```json
{
  "network": [{ "key": "none", "name": "No throttling" }, ...],
  "cpu": [{ "key": "1", "name": "1x" }, ...]
}
```

### POST /api/measure

단일 URL 성능 측정

**Request**
```json
{
  "url": "https://example.com",
  "network": "slow3G",
  "cpu": "4"
}
```

**Response**
```json
{
  "url": "https://example.com",
  "measuredAt": "2024-01-01T12:00:00Z",
  "metrics": {
    "score": 85,
    "LCP_ms": 1200,
    "FCP_ms": 800,
    "TBT_ms": 150
  }
}
```

## Project Structure

```
measure-lighthouse/
├── package.json          # Dependencies & npm scripts
├── measure.js            # Lighthouse measurement logic
├── server.js             # Express server (API)
└── web/
    ├── index.html        # Dashboard UI
    ├── index.css         # Styles
    └── index.js          # Frontend logic + localStorage
```

## Tech Stack

- **Backend**: Node.js, Express
- **Measurement**: Lighthouse, chrome-launcher
- **Frontend**: Vanilla JS, localStorage

## License

MIT
