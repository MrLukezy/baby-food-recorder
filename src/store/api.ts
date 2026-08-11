// ============================
// 服务端 API 请求（无本地缓存）
// ============================

export const BASE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:3003/api'
  : '/babyfoodrecorder/api';

const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
  } catch { /* ignore */ }
  return `请求失败 (${res.status})`;
}

function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function') {
    return (AbortSignal as any).timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: init?.signal ?? timeoutSignal(REQUEST_TIMEOUT_MS),
    });
  } catch (e: any) {
    if (e?.name === 'AbortError' || e?.name === 'TimeoutError') {
      throw new ApiError('请求超时，请检查网络后重试', 0);
    }
    throw new ApiError('无法连接服务器，请检查网络', 0);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await rawFetch(path);
      if (!res.ok) throw new ApiError(await parseError(res), res.status);
      try {
        return await res.json() as T;
      } catch {
        throw new ApiError('服务器返回了无效数据', res.status);
      }
    } catch (e) {
      lastError = e;
      // 仅网络类错误重试一次；业务 4xx/5xx 不重试
      if (!(e instanceof ApiError) || e.status !== 0 || attempt === 1) {
        throw e;
      }
    }
  }
  throw lastError;
}

export async function apiPost<T = { ok?: boolean }>(path: string, body: unknown): Promise<T> {
  const res = await rawFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(await parseError(res), res.status);

  const text = await res.text();
  if (!text) {
    throw new ApiError('服务器未返回确认结果', res.status);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('服务器返回了无效数据', res.status);
  }
}
