// localStorage 키
const STORAGE_KEYS = {
  URLS: 'lighthouse-urls',
  MEASUREMENTS: 'lighthouse-measurements'
};

// DOM 요소
const urlInput = document.getElementById('urlInput');
const addUrlBtn = document.getElementById('addUrlBtn');
const urlList = document.getElementById('urlList');
const presetSelect = document.getElementById('presetSelect');
const measureAllBtn = document.getElementById('measureAllBtn');
const statusSection = document.getElementById('statusSection');
const statusMessage = document.getElementById('statusMessage');
const resultsBody = document.getElementById('resultsBody');

// 초기화
document.addEventListener('DOMContentLoaded', init);

async function init() {
  addUrlBtn.addEventListener('click', addUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addUrl();
  });
  measureAllBtn.addEventListener('click', measureAll);

  await loadPresets();
  renderUrlList();
  renderResults();
}

async function loadPresets() {
  try {
    const response = await fetch('/api/presets');
    const presets = await response.json();

    presetSelect.innerHTML = '';
    presets.forEach(preset => {
      const option = document.createElement('option');
      option.value = preset.key;
      option.textContent = preset.name;
      presetSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load presets:', error);
  }
}

// ============================================
// localStorage 관리
// ============================================

function getUrls() {
  const data = localStorage.getItem(STORAGE_KEYS.URLS);
  return data ? JSON.parse(data) : [];
}

function saveUrls(urls) {
  localStorage.setItem(STORAGE_KEYS.URLS, JSON.stringify(urls));
}

function getMeasurements() {
  const data = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
  return data ? JSON.parse(data) : [];
}

function saveMeasurements(measurements) {
  localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(measurements));
}

// ============================================
// URL 관리 기능
// ============================================

function normalizeUrl(input) {
  let url = input.trim();

  // 프로토콜이 없으면 https:// 추가
  if (!url.match(/^https?:\/\//)) {
    url = 'https://' + url;
  }

  return url;
}

function addUrl() {
  let url = urlInput.value.trim();
  if (!url) return;

  // URL 정규화 (https:// 자동 추가)
  url = normalizeUrl(url);

  // URL 유효성 검사
  try {
    new URL(url);
  } catch {
    showStatus('올바른 URL 형식이 아닙니다.', 'error');
    return;
  }

  const urls = getUrls();

  // 중복 체크
  if (urls.includes(url)) {
    showStatus('이미 추가된 URL입니다.', 'error');
    return;
  }

  urls.push(url);
  saveUrls(urls);
  urlInput.value = '';

  renderUrlList();
  hideStatus();
}

function removeUrl(url) {
  let urls = getUrls();
  urls = urls.filter(u => u !== url);
  saveUrls(urls);

  // 해당 URL의 측정 결과도 삭제
  let measurements = getMeasurements();
  measurements = measurements.filter(m => m.url !== url);
  saveMeasurements(measurements);

  renderUrlList();
  renderResults();
}

function renderUrlList() {
  const urls = getUrls();
  urlList.innerHTML = '';

  urls.forEach(url => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span title="${url}">${url}</span>
      <button onclick="removeUrl('${url}')">삭제</button>
    `;
    urlList.appendChild(li);
  });

  // 전체 측정 버튼 활성화/비활성화
  measureAllBtn.disabled = urls.length === 0;
}

// ============================================
// 측정 기능
// ============================================

async function measureUrlApi(url, preset) {
  const response = await fetch('/api/measure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, preset })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
}

async function measureAll() {
  const urls = getUrls();
  if (urls.length === 0) return;

  const preset = presetSelect.value;

  measureAllBtn.disabled = true;
  measureAllBtn.classList.add('running');
  measureAllBtn.textContent = '측정 중...';

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    showStatus(`측정 중... (${i + 1}/${urls.length}) ${url}`, 'running');

    try {
      const result = await measureUrlApi(url, preset);
      saveMeasurement(result);
      renderResults();
    } catch (error) {
      showStatus(`오류: ${url} - ${error.message}`, 'error');
    }
  }

  measureAllBtn.disabled = false;
  measureAllBtn.classList.remove('running');
  measureAllBtn.textContent = '전체 측정';
  showStatus(`측정 완료! (${urls.length}개 URL)`, '');
}

function saveMeasurement(result) {
  const measurements = getMeasurements();
  measurements.push(result);
  saveMeasurements(measurements);
}

// ============================================
// 결과 계산 및 표시
// ============================================

function calculateAverage(url) {
  const measurements = getMeasurements();
  const urlMeasurements = measurements.filter(m => m.url === url);

  if (urlMeasurements.length === 0) {
    return { count: 0, score: '-', LCP_ms: '-', FCP_ms: '-', TBT_ms: '-' };
  }

  const count = urlMeasurements.length;
  const avgScore = Math.round(urlMeasurements.reduce((sum, m) => sum + (m.metrics.score || 0), 0) / count);
  const avgLCP = Math.round(urlMeasurements.reduce((sum, m) => sum + m.metrics.LCP_ms, 0) / count);
  const avgFCP = Math.round(urlMeasurements.reduce((sum, m) => sum + m.metrics.FCP_ms, 0) / count);
  const avgTBT = Math.round(urlMeasurements.reduce((sum, m) => sum + m.metrics.TBT_ms, 0) / count);

  return { count, score: avgScore, LCP_ms: avgLCP, FCP_ms: avgFCP, TBT_ms: avgTBT };
}

function renderResults() {
  const urls = getUrls();
  resultsBody.innerHTML = '';

  if (urls.length === 0) {
    resultsBody.innerHTML = '<tr><td colspan="6" class="no-data">URL을 추가하고 측정을 시작하세요.</td></tr>';
    return;
  }

  urls.forEach(url => {
    const avg = calculateAverage(url);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td title="${url}">${url}</td>
      <td>${avg.score}</td>
      <td>${avg.LCP_ms}</td>
      <td>${avg.FCP_ms}</td>
      <td>${avg.TBT_ms}</td>
      <td>${avg.count}회</td>
    `;
    resultsBody.appendChild(tr);
  });
}

// ============================================
// 상태 표시
// ============================================

function showStatus(message, type) {
  statusSection.style.display = 'block';
  statusMessage.textContent = message;
  statusMessage.className = 'status-message ' + type;
}

function hideStatus() {
  statusSection.style.display = 'none';
}
