// ============================
// 下次排敏推荐
// ============================

import { BASE_URL } from './api';

export interface RecommendationResult {
  ok: boolean;
  foodId: string | null;
  foodName: string | null;
  summary: string | null;
  analysis: string | null;
  cycleKey?: string;
  shouldAutoOpen: boolean;
  fromCache?: boolean;
  createdAt?: string | null;
}

export async function fetchRecommendation(): Promise<RecommendationResult> {
  const res = await fetch(`${BASE_URL}/recommendation`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`加载推荐失败 (${res.status})`);
  }
  const data = await res.json();
  return {
    ok: !!data.ok,
    foodId: data.foodId ?? null,
    foodName: data.foodName ?? null,
    summary: data.summary ?? null,
    analysis: data.analysis ?? null,
    cycleKey: data.cycleKey,
    shouldAutoOpen: !!data.shouldAutoOpen,
    fromCache: !!data.fromCache,
    createdAt: data.createdAt ?? null,
  };
}
