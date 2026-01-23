import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { throttling as lighthouseThrottling } from 'lighthouse/core/config/constants.js';

// Network 프리셋
export const NETWORK_PRESETS = {
  none: {
    name: 'No throttling',
    rttMs: 0,
    throughputKbps: 0,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0
  },
  fast4g: {
    name: 'Fast 4G',
    rttMs: 40,
    throughputKbps: 10240,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0
  },
  slow4g: {
    name: 'Slow 4G',
    rttMs: 150,
    throughputKbps: 1638.4,
    requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.56,
    uploadThroughputKbps: 675
  },
  regular3g: {
    name: '3G',
    rttMs: 300,
    throughputKbps: 700,
    requestLatencyMs: 1125,
    downloadThroughputKbps: 630,
    uploadThroughputKbps: 630
  }
};

// CPU throttling 옵션
export const CPU_PRESETS = {
  '1': { name: 'No throttling', multiplier: 1 },
  '4': { name: '4x slowdown', multiplier: 4 },
  '6': { name: '6x slowdown', multiplier: 6 },
  '20': { name: '20x slowdown', multiplier: 20 }
};

// 기본 Lighthouse 옵션
const baseLighthouseOptions = {
  logLevel: 'error',
  output: 'json',
  onlyCategories: ['performance'],
  formFactor: 'desktop',
  screenEmulation: {
    mobile: false,
    width: 1350,
    height: 940,
    deviceScaleFactor: 1,
    disabled: false
  }
};

/**
 * 단일 URL의 성능을 측정하고 결과를 반환
 * @param {string} url - 측정할 URL
 * @param {object} options - throttling 옵션
 * @param {string} options.network - 네트워크 프리셋 (none, fast4g, slow4g, regular3g)
 * @param {string} options.cpu - CPU slowdown (1, 4, 6, 20)
 * @returns {Promise<{url: string, measuredAt: string, throttling: object, metrics: {score: number, LCP_ms: number, FCP_ms: number, TBT_ms: number}}>}
 */
export async function measureUrl(url, options = {}) {
  const { network = 'none', cpu = '1' } = options;

  // 설정 가져오기
  const networkConfig = NETWORK_PRESETS[network] || NETWORK_PRESETS.none;
  const cpuConfig = CPU_PRESETS[cpu] || CPU_PRESETS['1'];

  // throttling이 적용되는지 확인
  const hasThrottling = network !== 'none' || cpu !== '1';
  const throttlingMethod = hasThrottling ? 'simulate' : 'provided';

  // throttling 설정 구성
  const throttling = {
    rttMs: networkConfig.rttMs,
    throughputKbps: networkConfig.throughputKbps,
    requestLatencyMs: networkConfig.requestLatencyMs,
    downloadThroughputKbps: networkConfig.downloadThroughputKbps,
    uploadThroughputKbps: networkConfig.uploadThroughputKbps,
    cpuSlowdownMultiplier: cpuConfig.multiplier
  };

  // Chrome 실행
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });

  try {
    // Lighthouse 측정 실행
    const result = await lighthouse(url, {
      ...baseLighthouseOptions,
      throttlingMethod,
      throttling,
      port: chrome.port
    });

    const lhr = result.lhr;

    // Performance Score 추출 (0-100)
    const score = Math.round((lhr.categories.performance?.score || 0) * 100);

    // LCP, FCP, TBT 추출 (ms 단위, 반올림)
    const metrics = {
      score,
      LCP_ms: Math.round(lhr.audits['largest-contentful-paint']?.numericValue || 0),
      FCP_ms: Math.round(lhr.audits['first-contentful-paint']?.numericValue || 0),
      TBT_ms: Math.round(lhr.audits['total-blocking-time']?.numericValue || 0)
    };

    return {
      url,
      measuredAt: new Date().toISOString(),
      throttling: { network, cpu },
      metrics
    };
  } finally {
    // Chrome 종료
    await chrome.kill();
  }
}
