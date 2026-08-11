const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, 'logs');
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB 后轮转
const KEEP_ROTATED = 5;

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function rotateIfNeeded(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    if (stat.size < MAX_FILE_BYTES) return;

    for (let i = KEEP_ROTATED - 1; i >= 1; i--) {
      const src = `${filePath}.${i}`;
      const dest = `${filePath}.${i + 1}`;
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
      }
    }
    fs.renameSync(filePath, `${filePath}.1`);
  } catch (e) {
    console.error('log rotate failed:', e.message);
  }
}

function appendLine(fileName, obj) {
  ensureDir();
  const filePath = path.join(LOG_DIR, fileName);
  rotateIfNeeded(filePath);
  const line = JSON.stringify(obj) + '\n';
  fs.appendFileSync(filePath, line, 'utf8');
}

function baseEntry(level, message, extra) {
  return {
    time: new Date().toISOString(),
    level,
    message: String(message || ''),
    ...(extra && typeof extra === 'object' ? extra : {}),
  };
}

function write(level, message, extra) {
  const entry = baseEntry(level, message, extra);
  const text = `[${entry.time}] ${level.toUpperCase()} ${entry.message}`;
  if (level === 'error') {
    console.error(text, extra || '');
    appendLine('error.log', entry);
    appendLine('app.log', entry);
  } else if (level === 'warn') {
    console.warn(text, extra || '');
    appendLine('app.log', entry);
  } else {
    console.log(text);
    appendLine('app.log', entry);
  }
  return entry;
}

function readTailLines(fileName, limit = 100) {
  ensureDir();
  const filePath = path.join(LOG_DIR, fileName);
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  const slice = lines.slice(-Math.max(1, Math.min(limit, 500)));
  const out = [];
  for (const line of slice) {
    try {
      out.push(JSON.parse(line));
    } catch {
      out.push({ time: null, level: 'raw', message: line });
    }
  }
  return out.reverse(); // 最新在前
}

module.exports = {
  LOG_DIR,
  info: (message, extra) => write('info', message, extra),
  warn: (message, extra) => write('warn', message, extra),
  error: (message, extra) => write('error', message, extra),
  access: (extra) => {
    const entry = baseEntry('access', 'request', extra);
    appendLine('access.log', entry);
    appendLine('app.log', entry);
    return entry;
  },
  readTail: readTailLines,
  listFiles: () => {
    ensureDir();
    return fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.log') || /\.log\.\d+$/.test(f));
  },
};
