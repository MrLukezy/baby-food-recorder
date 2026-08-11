const http = require('http');
const fs = require('fs');
const path = require('path');
const foodDb = require('./food-database');
const logger = require('./logger');
const recommend = require('./recommend');

const DATA_DIR = path.join(__dirname, 'data');
const PORT = 3003;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  profile: path.join(DATA_DIR, 'baby_profile.json'),
  records: path.join(DATA_DIR, 'food_records.json'),
  presets: path.join(DATA_DIR, 'preset_allergens.json'),
  conversations: path.join(DATA_DIR, 'ai_conversations.json'),
  memories: path.join(DATA_DIR, 'ai_memories.json'),
  customFoods: path.join(DATA_DIR, 'custom_foods.json'),
  recommendation: path.join(DATA_DIR, 'recommendation.json'),
};

// ======== 按文件串行的写队列 ========
const writeQueues = new Map();

function enqueueWrite(filePath, fn) {
  const prev = writeQueues.get(filePath) || Promise.resolve();
  const next = prev
    .catch(() => undefined)
    .then(() => fn());
  writeQueues.set(
    filePath,
    next.catch(() => undefined)
  );
  return next;
}

function readJsonRaw(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function readJson(filePath, defaultVal) {
  try {
    if (fs.existsSync(filePath)) {
      return readJsonRaw(filePath);
    }
  } catch (e) {
    logger.error('读取 JSON 失败', { filePath, error: e.message });
    const bakPath = filePath + '.bak';
    try {
      if (fs.existsSync(bakPath)) {
        logger.warn('尝试从备份恢复', { bakPath });
        return readJsonRaw(bakPath);
      }
    } catch (e2) {
      logger.error('备份读取失败', { bakPath, error: e2.message });
    }
  }
  return defaultVal;
}

function writeJsonSync(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, filePath + '.bak');
    } catch (e) {
      logger.warn('备份失败', { filePath, error: e.message });
    }
  }

  const tmpPath = filePath + '.tmp';
  const payload = JSON.stringify(data, null, 2);
  const fd = fs.openSync(tmpPath, 'w');
  try {
    fs.writeFileSync(fd, payload, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmpPath, filePath);
}

function writeJson(filePath, data) {
  return enqueueWrite(filePath, () => {
    writeJsonSync(filePath, data);
  });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(Object.assign(new Error('Invalid JSON'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  if (res.writableEnded) return;
  const origin = res.req?.headers?.origin || '*';
  const headers = corsHeaders(origin);
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

function sendJsonFile(res, filePath, defaultVal) {
  const origin = res.req?.headers?.origin || '*';
  const data = readJson(filePath, defaultVal);
  res.writeHead(200, {
    'Access-Control-Allow-Origin': origin,
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
}

// DeepSeek key：仅服务端使用。优先读环境变量，避免硬编码扩散。
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_KEY || '';

const https = require('https');

const routes = {
  'GET /api/health': (req, res) => {
    sendJson(res, 200, {
      ok: true,
      service: 'baby-food-recorder-api',
      time: new Date().toISOString(),
    });
  },

  // 查询历史日志（最新在前）
  'GET /api/logs': (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const type = url.searchParams.get('type') || 'error'; // error | access | app
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const fileMap = {
      error: 'error.log',
      access: 'access.log',
      app: 'app.log',
    };
    const fileName = fileMap[type] || 'error.log';
    const entries = logger.readTail(fileName, limit);
    sendJson(res, 200, {
      ok: true,
      type,
      file: fileName,
      count: entries.length,
      files: logger.listFiles(),
      entries,
    });
  },

  // 前端上报客户端错误
  'POST /api/client-logs': async (req, res) => {
    const body = await parseBody(req);
    const level = body.level === 'warn' ? 'warn' : 'error';
    const entry = logger[level](body.message || 'client error', {
      source: 'client',
      path: body.path || '',
      status: body.status ?? null,
      stack: body.stack ? String(body.stack).slice(0, 2000) : undefined,
      userAgent: (req.headers['user-agent'] || '').slice(0, 300),
      extra: body.extra && typeof body.extra === 'object' ? body.extra : undefined,
    });
    sendJson(res, 200, { ok: true, id: entry.time });
  },

  'GET /api/profile': (req, res) => {
    sendJsonFile(res, FILES.profile, {});
  },
  'POST /api/profile': async (req, res) => {
    const body = await parseBody(req);
    await writeJson(FILES.profile, body);
    sendJson(res, 200, { ok: true, data: body });
  },

  'GET /api/records': (req, res) => {
    sendJsonFile(res, FILES.records, []);
  },
  'POST /api/records': async (req, res) => {
    const body = await parseBody(req);

    await enqueueWrite(FILES.records, () => {
      const records = readJson(FILES.records, []);

      if (body.action === 'add') {
        records.push(body.record);
        writeJsonSync(FILES.records, records);
        sendJson(res, 200, { ok: true, data: records });
        return;
      }
      if (body.action === 'delete') {
        const newRecords = records.filter(r => r.id !== body.recordId);
        writeJsonSync(FILES.records, newRecords);
        sendJson(res, 200, { ok: true, data: newRecords });
        return;
      }
      if (body.action === 'update') {
        const newRecords = records.map(r =>
          r.id === body.recordId ? { ...r, ...body.updates } : r
        );
        writeJsonSync(FILES.records, newRecords);
        sendJson(res, 200, { ok: true, data: newRecords });
        return;
      }
      if (body.action === 'replace' || (body.action === 'set' && body.records)) {
        const next = Array.isArray(body.records) ? body.records : [];
        writeJsonSync(FILES.records, next);
        sendJson(res, 200, { ok: true, data: next });
        return;
      }

      writeJsonSync(FILES.records, records);
      sendJson(res, 200, { ok: true, data: records });
    });
  },

  'GET /api/presets': (req, res) => {
    sendJsonFile(res, FILES.presets, []);
  },
  'POST /api/presets': async (req, res) => {
    const body = await parseBody(req);
    await writeJson(FILES.presets, body);
    sendJson(res, 200, { ok: true, data: body });
  },

  'GET /api/custom-foods': (req, res) => {
    sendJsonFile(res, FILES.customFoods, []);
  },
  'POST /api/custom-foods': async (req, res) => {
    const body = await parseBody(req);
    const next = Array.isArray(body) ? body : [];
    await writeJson(FILES.customFoods, next);
    sendJson(res, 200, { ok: true, data: next });
  },

  'GET /api/conversations': (req, res) => {
    sendJsonFile(res, FILES.conversations, []);
  },
  'POST /api/conversations': async (req, res) => {
    const body = await parseBody(req);
    await enqueueWrite(FILES.conversations, () => {
      if (body.action === 'replace') {
        writeJsonSync(FILES.conversations, Array.isArray(body.data) ? body.data : []);
        sendJson(res, 200, { ok: true });
        return;
      }
      if (body.action === 'update') {
        const all = readJson(FILES.conversations, []);
        const idx = all.findIndex(c => c.id === body.convId);
        if (idx >= 0) {
          all[idx] = { ...all[idx], ...body.updates, updatedAt: new Date().toISOString() };
        } else {
          all.unshift({ ...body.data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
        writeJsonSync(FILES.conversations, all);
        sendJson(res, 200, { ok: true });
        return;
      }
      sendJson(res, 200, { ok: true });
    });
  },

  'GET /api/memories': (req, res) => {
    sendJsonFile(res, FILES.memories, []);
  },
  'POST /api/memories': async (req, res) => {
    const body = await parseBody(req);
    await enqueueWrite(FILES.memories, () => {
      if (body.action === 'append') {
        const all = readJson(FILES.memories, []);
        all.push({
          id: 'mem_' + Date.now(),
          type: body.type || 'daily_note',
          content: body.content,
          date: body.date || new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        });
        writeJsonSync(FILES.memories, all);
        sendJson(res, 200, { ok: true, count: all.length });
        return;
      }
      if (body.action === 'query') {
        const all = readJson(FILES.memories, []);
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const limit = body.limit || 20;
        sendJson(res, 200, { memories: all.slice(0, limit), count: all.length });
        return;
      }
      writeJsonSync(FILES.memories, body);
      sendJson(res, 200, { ok: true });
    });
  },

  'POST /api/baby-memo': async (req, res) => {
    const body = await parseBody(req);
    await enqueueWrite(FILES.memories, () => {
      const all = readJson(FILES.memories, []);
      all.push({
        id: 'mem_' + Date.now(),
        type: body.type || 'daily_note',
        content: body.content,
        tags: body.tags || [],
        date: body.date || new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      });
      writeJsonSync(FILES.memories, all);
      sendJson(res, 200, { ok: true, count: all.length });
    });
  },
  'GET /api/baby-memo': (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const typeFilter = url.searchParams.get('type') || '';
    const all = readJson(FILES.memories, []);
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let filtered = all;
    if (typeFilter) {
      filtered = all.filter(m => m.type === typeFilter);
    }
    sendJson(res, 200, { memories: filtered.slice(0, limit), count: all.length });
  },

  'GET /api/food-database': (req, res) => {
    sendJson(res, 200, {
      categories: foodDb.foodDatabase,
      allFoods: foodDb.getAllFoods(),
      byLevel: foodDb.getFoodsByAllergenLevel(),
    });
  },

  'GET /api/recommendation': async (req, res) => {
    const result = await recommend.getRecommendation({
      profile: readJson(FILES.profile, null),
      records: readJson(FILES.records, []),
      presets: readJson(FILES.presets, []),
      cache: readJson(FILES.recommendation, null),
      apiKey: DEEPSEEK_KEY,
      saveCache: (data) => writeJson(FILES.recommendation, data),
    });
    sendJson(res, 200, {
      ok: true,
      foodId: result.foodId,
      foodName: result.foodName,
      summary: result.summary,
      analysis: result.analysis,
      cycleKey: result.cycleKey,
      shouldAutoOpen: !!result.shouldAutoOpen,
      fromCache: !!result.fromCache,
      createdAt: result.createdAt || null,
      noMore: !!result.noMore,
      message: result.message || null,
    });
  },

  'POST /api/recommendation/another': async (req, res) => {
    const body = await parseBody(req).catch(() => ({}));
    const cache = readJson(FILES.recommendation, null);
    const excludeIds = [
      ...(Array.isArray(cache?.excludedIds) ? cache.excludedIds : []),
      cache?.foodId,
      body?.excludeFoodId,
    ].filter(Boolean);

    const result = await recommend.getRecommendation({
      profile: readJson(FILES.profile, null),
      records: readJson(FILES.records, []),
      presets: readJson(FILES.presets, []),
      cache,
      apiKey: DEEPSEEK_KEY,
      forceRefresh: true,
      excludeIds,
      saveCache: (data) => writeJson(FILES.recommendation, {
        ...data,
        excludedIds: [...new Set([...(data.excludedIds || []), ...excludeIds])],
      }),
    });

    if (result.noMore || !result.foodId) {
      sendJson(res, 200, {
        ok: false,
        noMore: true,
        message: result.message || '暂无其他可推荐食材',
        foodId: cache?.foodId || null,
        foodName: cache?.foodName || null,
        summary: cache?.summary || null,
        analysis: cache?.analysis || null,
        shouldAutoOpen: false,
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      foodId: result.foodId,
      foodName: result.foodName,
      summary: result.summary,
      analysis: result.analysis,
      cycleKey: result.cycleKey,
      shouldAutoOpen: false,
      fromCache: false,
      createdAt: result.createdAt || null,
    });
  },

  'POST /api/deepseek/chat': async (req, res) => {
    const body = await parseBody(req);
    if (!DEEPSEEK_KEY) {
      logger.error('DeepSeek API key 未配置');
      sendJson(res, 500, { error: 'DeepSeek API key not configured' });
      return;
    }

    const postData = JSON.stringify({
      model: body.model || 'deepseek-chat',
      messages: body.messages,
      max_tokens: body.max_tokens || 10,
      temperature: body.temperature ?? 0.1,
      stream: false,
    });

    const options = {
      hostname: 'api.deepseek.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': DEEPSEEK_KEY.startsWith('Bearer ') ? DEEPSEEK_KEY : `Bearer ${DEEPSEEK_KEY}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    await new Promise((resolve) => {
      const proxyReq = https.request(options, (proxyRes) => {
        let rawData = '';
        proxyRes.on('data', (chunk) => { rawData += chunk; });
        proxyRes.on('end', () => {
          const origin = req.headers.origin || '*';
          if ((proxyRes.statusCode || 200) >= 400) {
            logger.error('DeepSeek 代理返回错误', {
              status: proxyRes.statusCode,
              body: String(rawData).slice(0, 500),
            });
          }
          if (!res.writableEnded) {
            res.writeHead(proxyRes.statusCode || 200, {
              'Access-Control-Allow-Origin': origin,
              'Content-Type': 'application/json',
            });
            res.end(rawData);
          }
          resolve();
        });
      });

      proxyReq.on('error', (e) => {
        logger.error('DeepSeek 代理失败', { error: e.message });
        sendJson(res, 500, { error: 'DeepSeek proxy error: ' + e.message });
        resolve();
      });

      proxyReq.write(postData);
      proxyReq.end();
    });
  },
};

const server = http.createServer((req, res) => {
  const started = Date.now();

  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '*';
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const routeKey = `${req.method} ${url.pathname}`;
  const handler = routes[routeKey];

  const originalEnd = res.end.bind(res);
  res.end = function patchedEnd(...args) {
    if (!res.__logged) {
      res.__logged = true;
      const ms = Date.now() - started;
      const status = res.statusCode || 0;
      const entry = {
        method: req.method,
        path: url.pathname,
        status,
        ms,
        ip: req.headers['x-real-ip'] || req.socket.remoteAddress || '',
      };
      if (status >= 500) {
        logger.error('request failed', entry);
      } else if (status >= 400) {
        logger.warn('request client error', entry);
        logger.access(entry);
      } else if (url.pathname !== '/api/health' && url.pathname !== '/api/logs' && url.pathname !== '/api/recommendation') {
        logger.access(entry);
      }
    }
    return originalEnd(...args);
  };

  if (!handler) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  res.req = req;
  Promise.resolve()
    .then(() => handler(req, res))
    .catch((err) => {
      logger.error('API 未捕获异常', {
        route: routeKey,
        error: err?.message || String(err),
        stack: err?.stack ? String(err.stack).slice(0, 2000) : undefined,
        statusCode: err?.statusCode || 500,
      });
      const status = err?.statusCode || 500;
      const message = err?.statusCode === 400 ? (err.message || 'Bad Request') : 'Internal Server Error';
      sendJson(res, status, { error: message });
    });
});

server.listen(PORT, '127.0.0.1', () => {
  logger.info(`Baby Food Recorder API running on http://127.0.0.1:${PORT}`, {
    logDir: logger.LOG_DIR,
  });
  Object.keys(routes).forEach(k => logger.info(`route ${k}`));
});