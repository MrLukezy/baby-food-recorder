// ============================
// 跟手横滑（Tab 切换 / 子页返回）
// ============================

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { isSheetOpen, subscribeSheetLock } from './sheetLock';

export interface PageFollowSwipeOptions {
  enabled?: boolean;
  /** both | right-only（子页返回） */
  mode?: 'both' | 'right-only';
  /** 能否继续左滑（切下一个） */
  canSwipeLeft?: () => boolean;
  /** 能否继续右滑（切上一个 / 返回） */
  canSwipeRight?: () => boolean;
  /** 确认左滑后的切换（在滑出动画结束后调用） */
  onCommitLeft?: () => void;
  /** 确认右滑后的切换 */
  onCommitRight?: () => void;
  /**
   * switch: 滑出后换页再从对面滑入（Tab）
   * exit: 滑出后直接卸载/返回（子页）
   */
  commitStyle?: 'switch' | 'exit';
  /** 触发确认的位移比例（相对屏宽），默认 0.28 */
  thresholdRatio?: number;
  /** 最小触发位移 px */
  minThreshold?: number;
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
 * 页面跟手横滑：拖动时 translateX 跟随手指，松手后滑出切换或回弹。
 */
export function usePageFollowSwipe(options: PageFollowSwipeOptions): {
  containerRef: RefObject<HTMLDivElement>;
  contentStyle: CSSProperties;
  dragging: boolean;
} {
  const optsRef = useRef(options);
  optsRef.current = options;

  const containerRef = useRef<HTMLDivElement>(null!);
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [withTransition, setWithTransition] = useState(false);

  const offsetRef = useRef(0);
  const draggingRef = useRef(false);
  const lockedRef = useRef<'none' | 'h' | 'v'>('none');
  const animatingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const ignoreRef = useRef(false);
  const widthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 375);

  const setOffset = useCallback((x: number, transition: boolean) => {
    offsetRef.current = x;
    setWithTransition(transition);
    setOffsetX(x);
  }, []);

  const finishCommit = useCallback((dir: 'left' | 'right') => {
    const width = widthRef.current;
    const target = dir === 'left' ? -width : width;
    const style = optsRef.current.commitStyle || 'switch';
    animatingRef.current = true;
    setDragging(false);
    draggingRef.current = false;
    setOffset(target, true);

    window.setTimeout(() => {
      if (dir === 'left') optsRef.current.onCommitLeft?.();
      else optsRef.current.onCommitRight?.();

      if (style === 'exit') {
        animatingRef.current = false;
        setWithTransition(false);
        return;
      }

      // 新页从对面滑入
      setOffset(dir === 'left' ? width * 0.35 : -width * 0.35, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setOffset(0, true);
          window.setTimeout(() => {
            animatingRef.current = false;
            setWithTransition(false);
          }, 280);
        });
      });
    }, 260);
  }, [setOffset]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      const { enabled = true } = optsRef.current;
      if (!enabled || isSheetOpen() || animatingRef.current || e.touches.length !== 1) return;
      ignoreRef.current = shouldIgnoreSwipeTarget(e.target);
      if (ignoreRef.current) return;

      const t = e.touches[0];
      startXRef.current = t.clientX;
      startYRef.current = t.clientY;
      lockedRef.current = 'none';
      widthRef.current = el.getBoundingClientRect().width || window.innerWidth;
      setOffset(0, false);
    };

    const onMove = (e: TouchEvent) => {
      if (isSheetOpen()) {
        // 半屏打开时彻底打断底层横滑
        if (draggingRef.current) {
          draggingRef.current = false;
          setDragging(false);
          setOffset(0, true);
        }
        ignoreRef.current = true;
        lockedRef.current = 'none';
        return;
      }
      if (ignoreRef.current || animatingRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startXRef.current;
      const dy = t.clientY - startYRef.current;

      if (lockedRef.current === 'none') {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.05) {
          lockedRef.current = 'v';
          return;
        }
        if (Math.abs(dx) > Math.abs(dy) * 1.05) {
          lockedRef.current = 'h';
          draggingRef.current = true;
          setDragging(true);
        } else {
          return;
        }
      }

      if (lockedRef.current !== 'h') return;

      const {
        mode = 'both',
        canSwipeLeft,
        canSwipeRight,
      } = optsRef.current;

      let next = dx;
      if (mode === 'right-only' && next < 0) next = next * 0.18;
      if (mode === 'both') {
        if (next < 0 && canSwipeLeft && !canSwipeLeft()) next = next * 0.22;
        if (next > 0 && canSwipeRight && !canSwipeRight()) next = next * 0.22;
      }

      // 跟手
      if (e.cancelable) e.preventDefault();
      setOffset(next, false);
    };

    const onEnd = () => {
      if (isSheetOpen()) {
        ignoreRef.current = false;
        lockedRef.current = 'none';
        draggingRef.current = false;
        setDragging(false);
        if (offsetRef.current !== 0) setOffset(0, true);
        return;
      }
      if (ignoreRef.current || animatingRef.current) {
        ignoreRef.current = false;
        lockedRef.current = 'none';
        return;
      }

      const wasHorizontal = lockedRef.current === 'h';
      lockedRef.current = 'none';
      ignoreRef.current = false;

      if (!wasHorizontal || !draggingRef.current) {
        draggingRef.current = false;
        setDragging(false);
        return;
      }

      const {
        mode = 'both',
        thresholdRatio = 0.28,
        minThreshold = 64,
        canSwipeLeft,
        canSwipeRight,
      } = optsRef.current;

      const x = offsetRef.current;
      const width = widthRef.current;
      const threshold = Math.max(minThreshold, width * thresholdRatio);

      const goLeft = x < -threshold && mode === 'both' && (!canSwipeLeft || canSwipeLeft());
      const goRight = x > threshold && (!canSwipeRight || canSwipeRight()) && (mode === 'both' || mode === 'right-only');

      if (goLeft) {
        finishCommit('left');
        return;
      }
      if (goRight) {
        finishCommit('right');
        return;
      }

      // 回弹
      draggingRef.current = false;
      setDragging(false);
      setOffset(0, true);
      window.setTimeout(() => setWithTransition(false), 280);
    };

    const onSheetLock = () => {
      if (!isSheetOpen()) return;
      ignoreRef.current = true;
      lockedRef.current = 'none';
      draggingRef.current = false;
      setDragging(false);
      if (offsetRef.current !== 0) {
        setOffset(0, false);
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    const unsub = subscribeSheetLock(onSheetLock);

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      unsub();
    };
  }, [finishCommit, setOffset]);

  const contentStyle: CSSProperties = {
    // 仅在有位移/过渡时设置 transform，避免固定弹层被父级 containing block 困住
    transform: offsetX !== 0 || withTransition ? `translate3d(${offsetX}px, 0, 0)` : undefined,
    transition: withTransition ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
    willChange: dragging || withTransition ? 'transform' : undefined,
    touchAction: 'pan-y',
  };

  return { containerRef, contentStyle, dragging };
}

/** @deprecated 保留兼容；新逻辑请用 usePageFollowSwipe */
export function useHorizontalSwipe<T extends HTMLElement = HTMLDivElement>(
  _options: { onSwipeLeft?: () => void; onSwipeRight?: () => void; enabled?: boolean },
): RefObject<T> {
  return useRef<T>(null!);
}
