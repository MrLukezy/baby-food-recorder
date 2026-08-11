// ============================
// 全局加载态 / 错误提示（无 localStorage）
// ============================

export type FeedbackState = {
  loading: boolean;
  loadingText: string;
  error: string | null;
};

type Listener = (state: FeedbackState) => void;

let loadingCount = 0;
let loadingText = '加载中...';
let error: string | null = null;
const listeners = new Set<Listener>();

function emit() {
  const state: FeedbackState = {
    loading: loadingCount > 0,
    loadingText,
    error,
  };
  listeners.forEach(l => l(state));
}

export function subscribeFeedback(listener: Listener): () => void {
  listeners.add(listener);
  listener({
    loading: loadingCount > 0,
    loadingText,
    error,
  });
  return () => { listeners.delete(listener); };
}

export function beginLoading(text = '保存中...') {
  loadingCount += 1;
  loadingText = text;
  emit();
}

export function endLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  emit();
}

export function showError(message: string) {
  error = message;
  emit();
  // 自动清除，避免挡住后续操作
  window.setTimeout(() => {
    if (error === message) {
      error = null;
      emit();
    }
  }, 3200);
}

export function clearError() {
  error = null;
  emit();
}

/** 包装异步写操作：显示加载 → 失败提示 → 结束加载 */
export async function withFeedback<T>(
  text: string,
  fn: () => Promise<T>
): Promise<T> {
  beginLoading(text);
  try {
    return await fn();
  } catch (e: any) {
    const msg = e?.message || '操作失败，请稍后重试';
    showError(msg);
    throw e;
  } finally {
    endLoading();
  }
}
