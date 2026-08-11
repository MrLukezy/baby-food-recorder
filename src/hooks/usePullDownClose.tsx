// ============================
// 半屏弹窗：滑到顶后继续下拉关闭
// 通过 Portal 挂到 body，避免父级 transform 破坏 fixed 定位
// ============================

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { acquireSheetLock } from './sheetLock';

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

        if (!atTop) {
          ignoreRef.current = true;
          return;
        }
        if (dy < 0) {
          ignoreRef.current = true;
          return;
        }
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

/** 半屏底部弹层：Portal 到 body + 滑到顶下拉关闭 */
export function PullDownSheet({
  onClose,
  className,
  children,
  enabled = true,
  overlay = true,
  overlayClassName = 'fixed inset-0 bg-black/40 z-[55]',
}: {
  onClose: () => void;
  className?: string;
  children: ReactNode;
  enabled?: boolean;
  /** 是否渲染遮罩（默认 true，已 Portal，无需在外层再写遮罩） */
  overlay?: boolean;
  overlayClassName?: string;
}) {
  const { sheetRef, sheetStyle } = usePullDownClose(onClose, enabled);

  useEffect(() => {
    if (!enabled) return;
    return acquireSheetLock();
  }, [enabled]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {overlay && (
        <div
          className={overlayClassName}
          onClick={onClose}
          data-swipe-ignore=""
          style={{ touchAction: 'none' }}
        />
      )}
      <div
        ref={sheetRef}
        style={sheetStyle}
        className={className}
        data-swipe-ignore=""
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
