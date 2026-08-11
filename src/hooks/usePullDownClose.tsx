// ============================
// 半屏弹窗：滑到顶后继续下拉关闭
// ============================

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

function findScrollable(sheet: HTMLElement, from: EventTarget | null): HTMLElement | null {
  let node = from instanceof HTMLElement ? from : null;
  while (node && node !== sheet) {
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    if (
      (oy === 'auto' || oy === 'scroll' || node.classList.contains('overflow-y-auto')) &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }

  const candidates = sheet.querySelectorAll<HTMLElement>('*');
  for (const el of candidates) {
    const style = window.getComputedStyle(el);
    const oy = style.overflowY;
    if (
      (oy === 'auto' || oy === 'scroll' || el.classList.contains('overflow-y-auto')) &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      return el;
    }
  }
  // 整块面板自身可滚动（如 CategoryDetail）
  const selfStyle = window.getComputedStyle(sheet);
  if (
    (selfStyle.overflowY === 'auto' || selfStyle.overflowY === 'scroll' || sheet.classList.contains('overflow-y-auto')) &&
    sheet.scrollHeight > sheet.clientHeight + 1
  ) {
    return sheet;
  }
  return null;
}

export function usePullDownClose(onClose: () => void, enabled = true) {
  const sheetRef = useRef<HTMLDivElement>(null!);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [offsetY, setOffsetY] = useState(0);
  const [withTransition, setWithTransition] = useState(false);
  const offsetRef = useRef(0);
  const pullingRef = useRef(false);
  const ignoreRef = useRef(false);
  const startYRef = useRef(0);
  const closingRef = useRef(false);

  const setOffset = useCallback((y: number, transition: boolean) => {
    offsetRef.current = y;
    setWithTransition(transition);
    setOffsetY(y);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = sheetRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (closingRef.current || e.touches.length !== 1) return;
      ignoreRef.current = false;
      pullingRef.current = false;
      startYRef.current = e.touches[0].clientY;
      setOffset(0, false);
    };

    const onMove = (e: TouchEvent) => {
      if (closingRef.current || ignoreRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dy = t.clientY - startYRef.current;

      if (!pullingRef.current) {
        if (Math.abs(dy) < 10) return;

        const scrollEl = findScrollable(el, e.target);
        const atTop = !scrollEl || scrollEl.scrollTop <= 0;

        // 内容未到顶：交给原生滚动
        if (!atTop) {
          ignoreRef.current = true;
          return;
        }
        // 到顶后继续上滑（看下面内容）：交给原生滚动
        if (dy < 0) {
          ignoreRef.current = true;
          return;
        }
        // 到顶后继续下拉：跟手拖面板
        pullingRef.current = true;
      }

      if (!pullingRef.current) return;
      if (e.cancelable) e.preventDefault();
      setOffset(Math.max(0, dy), false);
    };

    const onEnd = () => {
      if (closingRef.current) return;
      const wasPulling = pullingRef.current;
      pullingRef.current = false;
      ignoreRef.current = false;
      if (!wasPulling) return;

      const y = offsetRef.current;
      const threshold = Math.max(96, (el.getBoundingClientRect().height || 400) * 0.22);

      if (y >= threshold) {
        closingRef.current = true;
        const h = el.getBoundingClientRect().height || window.innerHeight;
        setOffset(h + 40, true);
        window.setTimeout(() => {
          onCloseRef.current();
          closingRef.current = false;
          setOffset(0, false);
        }, 240);
      } else {
        setOffset(0, true);
        window.setTimeout(() => setWithTransition(false), 260);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled, setOffset]);

  const sheetStyle: CSSProperties = {
    transform: offsetY ? `translate3d(0, ${offsetY}px, 0)` : undefined,
    transition: withTransition ? 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
    willChange: offsetY || withTransition ? 'transform' : undefined,
    touchAction: 'pan-y',
  };

  return { sheetRef, sheetStyle, offsetY };
}

/** 半屏底部弹层容器：支持滑到顶后下拉关闭 */
export function PullDownSheet({
  onClose,
  className,
  children,
  enabled = true,
}: {
  onClose: () => void;
  className?: string;
  children: ReactNode;
  enabled?: boolean;
}) {
  const { sheetRef, sheetStyle } = usePullDownClose(onClose, enabled);
  return (
    <div ref={sheetRef} style={sheetStyle} className={className} data-swipe-ignore="">
      {children}
    </div>
  );
}
