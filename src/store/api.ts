// ============================
// 服务端 API 请求（无本地缓存）
// ============================

export const BASE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:3003/api'
  : '/babyfoodrecorder/api';

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

export async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`);
  } catch {
    throw new ApiError('无法连接服务器，请检查网络', 0);
  }
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  return res.json() as Promise<T>;
}

export async function apiPost<T = void>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('无法连接服务器，请检查网络', 0);
  }
  if (!res.ok) throw new ApiError(await parseError(res), res.status);
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}
