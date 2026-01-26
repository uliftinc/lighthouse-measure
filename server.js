import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { measureUrl, NETWORK_PRESETS, CPU_PRESETS } from './measure.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4500;

// JSON 파싱 미들웨어
app.use(express.json());

// 정적 파일 서빙 (web/ 폴더)
app.use(express.static(path.join(__dirname, 'web')));

// GET /api/presets - throttling 프리셋 목록
app.get('/api/presets', (req, res) => {
  const network = Object.entries(NETWORK_PRESETS).map(([key, value]) => ({
    key,
    name: value.name
  }));
  const cpu = Object.entries(CPU_PRESETS).map(([key, value]) => ({
    key,
    name: value.name
  }));
  res.json({ network, cpu });
});

// POST /api/measure - 단일 URL 측정
app.post('/api/measure', async (req, res) => {
  const { url, network = 'none', cpu = '1' } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    const result = await measureUrl(url, { network, cpu });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Lighthouse 측정 서버 실행 중: http://localhost:${PORT}`);
});
