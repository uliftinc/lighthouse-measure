import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { throttling as lighthouseThrottling } from 'lighthouse/core/config/constants.js';

// Throttling 프리셋
export const THROTTLING_PRESETS = {
  none: {
    name: 'No Throttling',
    throttlingMethod: 'provided',
    throttling: {
      rttMs: 0,
      throughputKbps: 0,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0
    }
  },
  desktopDense4G: {
    name: 'Desktop (Fast 4G)',
    throttlingMethod: 'simulate',
    throttling: lighthouseThrottling.desktopDense4G
  },
  mobileSlow4G: {
    name: 'Mobile (Slow 4G)',
    throttlingMethod: 'simulate',
    throttling: lighthouseThrottling.mobileSlow4G
  },
  mobileRegular3G: {
    name: 'Mobile (3G)',
    throttlingMethod: 'simulate',
    throttling: lighthouseThrottling.mobileRegular3G
  }
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
 * @param {string} preset - throttling 프리셋 (none, desktopDense4G, mobileSlow4G, mobileRegular3G)
 * @returns {Promise<{url: string, measuredAt: string, preset: string, metrics: {score: number, LCP_ms: number, FCP_ms: number, TBT_ms: number}}>}
 */
export async function measureUrl(url, preset = 'none') {
  // 프리셋 설정 가져오기
  const presetConfig = THROTTLING_PRESETS[preset] || THROTTLING_PRESETS.none;

  // Chrome 실행
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });

  try {
    // Lighthouse 측정 실행
    const result = await lighthouse(url, {
      ...baseLighthouseOptions,
      throttlingMethod: presetConfig.throttlingMethod,
      throttling: presetConfig.throttling,
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
      preset,
      metrics
    };
  } finally {
    // Chrome 종료
    await chrome.kill();
  }
}
