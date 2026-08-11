// ============================
// 半屏弹层打开时锁定底层页面滚动/横滑
// ============================

let openCount = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => {
    try { fn(); } catch { /* ignore */ }
  });
}

export function isSheetOpen(): boolean {
  return openCount > 0;
}

export function subscribeSheetLock(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** 弹层挂载时调用，卸载时自动释放 */
export function acquireSheetLock(): () => void {
  openCount += 1;
  if (openCount === 1) {
    const body = document.body;
    const html = document.documentElement;
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    body.dataset.sheetLockPrevOverflow = prevBody;
    html.dataset.sheetLockPrevOverflow = prevHtml;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    notify();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) {
      const body = document.body;
      const html = document.documentElement;
      body.style.overflow = body.dataset.sheetLockPrevOverflow || '';
      html.style.overflow = html.dataset.sheetLockPrevOverflow || '';
      delete body.dataset.sheetLockPrevOverflow;
      delete html.dataset.sheetLockPrevOverflow;
      notify();
    }
  };
}
