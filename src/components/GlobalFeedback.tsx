// ============================
// 全局加载遮罩 + 错误提示
// ============================

import React, { useEffect, useState } from 'react';
import { subscribeFeedback, clearError, type FeedbackState } from '../store/feedback';

const GlobalFeedback: React.FC = () => {
  const [state, setState] = useState<FeedbackState>({
    loading: false,
    loadingText: '加载中...',
    error: null,
  });

  useEffect(() => subscribeFeedback(setState), []);

  return (
    <>
      {state.loading && (
        <div className="fixed inset-0 z-[9998] bg-black/25 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-6 py-5 shadow-xl flex flex-col items-center gap-3 min-w-[140px]">
            <div
              className="w-9 h-9 border-[3px] border-orange-200 border-t-orange-500 rounded-full animate-spin"
              aria-hidden
            />
            <p className="text-sm text-amber-800 font-medium">{state.loadingText}</p>
          </div>
        </div>
      )}

      {state.error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-sm w-[90%]">
          <div
            className="bg-red-500 text-white rounded-xl px-4 py-3 shadow-lg flex items-start gap-3"
            role="alert"
          >
            <span className="text-lg leading-none mt-0.5">⚠️</span>
            <p className="text-sm flex-1 leading-snug">{state.error}</p>
            <button
              type="button"
              onClick={clearError}
              className="text-white/80 text-sm font-bold px-1"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalFeedback;
