import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

// Lighthouse 옵션 (throttling 비활성화)
const lighthouseOptions = {
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
  },
  throttlingMethod: 'provided',
  throttling: {
    rttMs: 0,
    throughputKbps: 0,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0
  }
};

/**
 * 단일 URL의 성능을 측정하고 결과를 반환
 * @param {string} url - 측정할 URL
 * @returns {Promise<{url: string, measuredAt: string, metrics: {LCP_ms: number, FCP_ms: number, TBT_ms: number}}>}
 */
export async function measureUrl(url) {
  // Chrome 실행
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });

  try {
    // Lighthouse 측정 실행
    const result = await lighthouse(url, {
      ...lighthouseOptions,
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
      metrics
    };
  } finally {
    // Chrome 종료
    await chrome.kill();
  }
}
