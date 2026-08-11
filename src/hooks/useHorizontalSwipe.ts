// ============================
// 横向滑动手势（Tab 切换 / 子页返回）
// ============================

import { useEffect, useRef, type RefObject } from 'react';

export interface HorizontalSwipeOptions {
  /** 手指左滑（dx < 0） */
  onSwipeLeft?: () => void;
  /** 手指右滑（dx > 0） */
  onSwipeRight?: () => void;
  enabled?: boolean;
  /** 触发阈值（px） */
  threshold?: number;
  /** 水平需明显大于垂直，默认 1.2 */
  directionRatio?: number;
}

function shouldIgnoreSwipeTarget(target: EventTarget | null): boolean {
  let node = target instanceof HTMLElement ? target : null;
  while (node && node !== document.body) {
    if (node.dataset.swipeIgnore === 'true' || node.dataset.swipeIgnore === '') {
      return true;
    }

    const style = window.getComputedStyle(node);
    const ox = style.overflowX;
    if ((ox === 'auto' || ox === 'scroll') && node.scrollWidth > node.clientWidth + 4) {
      return true;
    }
    if (node.classList.contains('overflow-x-auto') || node.classList.contains('overflow-x-scroll')) {
      return true;
    }

    // 全屏遮罩 / 底部浮层上不触发页面级横滑
    if (
      style.position === 'fixed' &&
      (node.classList.contains('inset-0') ||
        (node.classList.contains('inset-x-0') && node.classList.contains('bottom-0')))
    ) {
      return true;
    }

    node = node.parentElement;
  }
  return false;
}

/**
 * 在元素上监听触摸横滑。返回 ref，挂到容器即可。
 */
export function useHorizontalSwipe<T extends HTMLElement = HTMLDivElement>(
  options: HorizontalSwipeOptions,
): RefObject<T> {
  const ref = useRef<T>(null!);
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let ignore = false;

    const onStart = (e: TouchEvent) => {
      const { enabled = true } = optsRef.current;
      if (!enabled || e.touches.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
      ignore = shouldIgnoreSwipeTarget(e.target);
    };

    const onMove = (_e: TouchEvent) => {
      // 不 preventDefault，避免打断纵向滚动；仅在结束时判定
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      if (ignore) return;

      const {
        enabled = true,
        threshold = 72,
        directionRatio = 1.2,
        onSwipeLeft,
        onSwipeRight,
      } = optsRef.current;
      if (!enabled) return;

      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < threshold) return;
      if (absX < absY * directionRatio) return;

      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    };

    const onCancel = () => {
      tracking = false;
      ignore = false;
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onCancel);
    };
  }, []);

  return ref;
}
