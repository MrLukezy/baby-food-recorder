// ============================
// 客户端错误上报（fire-and-forget）
// ============================

import { BASE_URL } from './api';

let lastSentKey = '';
let lastSentAt = 0;

/** 上报前端错误到服务端，失败静默（避免递归） */
export function reportClientError(message: string, extra?: {
  path?: string;
  status?: number;
  stack?: string;
  extra?: Record<string, unknown>;
}): void {
  try {
    const key = `${message}|${extra?.path || ''}|${extra?.status ?? ''}`;
    const now = Date.now();
    // 3 秒内相同错误去重
    if (key === lastSentKey && now - lastSentAt < 3000) return;
    lastSentKey = key;
    lastSentAt = now;

    void fetch(`${BASE_URL}/client-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        message,
        path: extra?.path || (typeof window !== 'undefined' ? window.location.hash : ''),
        status: extra?.status,
        stack: extra?.stack,
        extra: extra?.extra,
      }),
      // 不阻塞；也不走带超时包装，避免互相干扰
    }).catch(() => undefined);
  } catch {
    // ignore
  }
}

export async function fetchServerLogs(type: 'error' | 'access' | 'app' = 'error', limit = 100): Promise<{
  ok: boolean;
  type: string;
  count: number;
  files: string[];
  entries: Array<{
    time?: string;
    level?: string;
    message?: string;
    path?: string;
    status?: number;
    ms?: number;
    source?: string;
    error?: string;
    stack?: string;
    [key: string]: unknown;
  }>;
}> {
  const res = await fetch(`${BASE_URL}/logs?type=${encodeURIComponent(type)}&limit=${limit}`);
  if (!res.ok) {
    throw new Error(`加载日志失败 (${res.status})`);
  }
  return res.json();
}
