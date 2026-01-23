// localStorage 키
const STORAGE_KEYS = {
  URLS: 'lighthouse-urls',
  MEASUREMENTS: 'lighthouse-measurements',
  SAVED_RECORDS: 'lighthouse-saved-records'
};

// 현재 측정 결과 (임시 저장)
let currentMeasurements = [];

// DOM 요소
const urlInput = document.getElementById('urlInput');
const addUrlBtn = document.getElementById('addUrlBtn');
const urlList = document.getElementById('urlList');
const presetSelect = document.getElementById('presetSelect');
const measureAllBtn = document.getElementById('measureAllBtn');
const statusSection = document.getElementById('statusSection');
const statusMessage = document.getElementById('statusMessage');
const resultsBody = document.getElementById('resultsBody');
const saveRecordBtn = document.getElementById('saveRecordBtn');
const calculateAvgBtn = document.getElementById('calculateAvgBtn');
const resetRecordsBtn = document.getElementById('resetRecordsBtn');
const savedRecordsList = document.getElementById('savedRecordsList');
const avgResultsSection = document.getElementById('avgResultsSection');

// 초기화
document.addEventListener('DOMContentLoaded', init);

async function init() {
  addUrlBtn.addEventListener('click', addUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addUrl();
  });
  measureAllBtn.addEventListener('click', measureAll);
  saveRecordBtn.addEventListener('click', saveRecord);
  calculateAvgBtn.addEventListener('click', calculateAndShowAverage);
  resetRecordsBtn.addEventListener('click', resetRecords);

  await loadPresets();
  renderUrlList();
  renderResults();
  renderSavedRecords();
  updateRecordButtons();
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

function getSavedRecords() {
  const data = localStorage.getItem(STORAGE_KEYS.SAVED_RECORDS);
  return data ? JSON.parse(data) : [];
}

function saveSavedRecords(records) {
  localStorage.setItem(STORAGE_KEYS.SAVED_RECORDS, JSON.stringify(records));
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

  // 현재 측정 결과 초기화
  currentMeasurements = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    showStatus(`측정 중... (${i + 1}/${urls.length}) ${url}`, 'running');

    try {
      const result = await measureUrlApi(url, preset);
      currentMeasurements.push(result);
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

  // 기록 저장 버튼 활성화
  updateRecordButtons();
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

// ============================================
// 기록 저장 및 평균 계산
// ============================================

function updateRecordButtons() {
  const savedRecords = getSavedRecords();
  const nextRecordNum = savedRecords.length + 1;

  // 저장 버튼: 현재 측정 결과가 있을 때만 활성화
  saveRecordBtn.disabled = currentMeasurements.length === 0;
  saveRecordBtn.textContent = `${nextRecordNum}번째 기록 저장`;

  // 평균 계산 버튼: 저장된 기록이 있을 때만 활성화
  calculateAvgBtn.disabled = savedRecords.length === 0;
  calculateAvgBtn.textContent = `${savedRecords.length}회 평균값 계산`;

  // 초기화 버튼: 저장된 기록이 있을 때만 활성화
  resetRecordsBtn.disabled = savedRecords.length === 0;
}

function saveRecord() {
  if (currentMeasurements.length === 0) return;

  const savedRecords = getSavedRecords();
  const recordNumber = savedRecords.length + 1;

  const newRecord = {
    recordNumber,
    savedAt: new Date().toISOString(),
    measurements: currentMeasurements.map(m => ({
      url: m.url,
      score: m.metrics.score,
      LCP_ms: m.metrics.LCP_ms,
      FCP_ms: m.metrics.FCP_ms,
      TBT_ms: m.metrics.TBT_ms
    }))
  };

  savedRecords.push(newRecord);
  saveSavedRecords(savedRecords);

  // 현재 측정 결과 초기화
  currentMeasurements = [];

  renderSavedRecords();
  updateRecordButtons();
  showStatus(`${recordNumber}번째 기록이 저장되었습니다.`, '');
}

function renderSavedRecords() {
  const savedRecords = getSavedRecords();
  savedRecordsList.innerHTML = '';

  if (savedRecords.length === 0) {
    savedRecordsList.innerHTML = '<li class="no-records">저장된 기록이 없습니다.</li>';
    return;
  }

  savedRecords.forEach(record => {
    const li = document.createElement('li');
    const date = new Date(record.savedAt).toLocaleString('ko-KR');
    const urlCount = record.measurements.length;
    li.innerHTML = `
      <span>${record.recordNumber}회차 - ${urlCount}개 URL (${date})</span>
      <button onclick="deleteRecord(${record.recordNumber})">삭제</button>
    `;
    savedRecordsList.appendChild(li);
  });
}

function deleteRecord(recordNumber) {
  let savedRecords = getSavedRecords();
  savedRecords = savedRecords.filter(r => r.recordNumber !== recordNumber);

  // 기록 번호 재정렬
  savedRecords.forEach((record, index) => {
    record.recordNumber = index + 1;
  });

  saveSavedRecords(savedRecords);
  renderSavedRecords();
  updateRecordButtons();
  hideAvgResults();
}

function resetRecords() {
  if (!confirm('모든 저장된 기록을 삭제하시겠습니까?')) return;

  saveSavedRecords([]);
  renderSavedRecords();
  updateRecordButtons();
  hideAvgResults();
  showStatus('모든 기록이 초기화되었습니다.', '');
}

function calculateAndShowAverage() {
  const savedRecords = getSavedRecords();
  if (savedRecords.length === 0) return;

  const urls = getUrls();
  const avgResults = [];

  urls.forEach(url => {
    let totalScore = 0, totalLCP = 0, totalFCP = 0, totalTBT = 0;
    let count = 0;

    savedRecords.forEach(record => {
      const measurement = record.measurements.find(m => m.url === url);
      if (measurement) {
        totalScore += measurement.score;
        totalLCP += measurement.LCP_ms;
        totalFCP += measurement.FCP_ms;
        totalTBT += measurement.TBT_ms;
        count++;
      }
    });

    if (count > 0) {
      avgResults.push({
        url,
        avgScore: Math.round(totalScore / count),
        avgLCP: Math.round(totalLCP / count),
        avgFCP: Math.round(totalFCP / count),
        avgTBT: Math.round(totalTBT / count),
        count
      });
    }
  });

  renderAvgResults(avgResults, savedRecords.length);
}

function renderAvgResults(avgResults, recordCount) {
  avgResultsSection.style.display = 'block';
  avgResultsSection.innerHTML = `
    <h3>${recordCount}회 측정 평균</h3>
    <table class="avg-table">
      <thead>
        <tr>
          <th>URL</th>
          <th>평균 Score</th>
          <th>평균 LCP (ms)</th>
          <th>평균 FCP (ms)</th>
          <th>평균 TBT (ms)</th>
        </tr>
      </thead>
      <tbody>
        ${avgResults.map(r => `
          <tr>
            <td title="${r.url}">${r.url}</td>
            <td>${r.avgScore}</td>
            <td>${r.avgLCP}</td>
            <td>${r.avgFCP}</td>
            <td>${r.avgTBT}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function hideAvgResults() {
  avgResultsSection.style.display = 'none';
  avgResultsSection.innerHTML = '';
}
