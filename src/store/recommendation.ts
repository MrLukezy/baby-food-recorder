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
  noMore?: boolean;
  message?: string | null;
}

function mapRecommendation(data: Record<string, unknown>): RecommendationResult {
  return {
    ok: !!data.ok,
    foodId: (data.foodId as string) ?? null,
    foodName: (data.foodName as string) ?? null,
    summary: (data.summary as string) ?? null,
    analysis: (data.analysis as string) ?? null,
    cycleKey: data.cycleKey as string | undefined,
    shouldAutoOpen: !!data.shouldAutoOpen,
    fromCache: !!data.fromCache,
    createdAt: (data.createdAt as string) ?? null,
    noMore: !!data.noMore,
    message: (data.message as string) ?? null,
  };
}

export async function fetchRecommendation(): Promise<RecommendationResult> {
  const res = await fetch(`${BASE_URL}/recommendation`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`加载推荐失败 (${res.status})`);
  }
  return mapRecommendation(await res.json());
}

/** 换一种推荐（排除当前及本周期已看过的） */
export async function fetchAnotherRecommendation(excludeFoodId?: string | null): Promise<RecommendationResult> {
  const res = await fetch(`${BASE_URL}/recommendation/another`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ excludeFoodId: excludeFoodId || undefined }),
  });
  if (!res.ok) {
    throw new Error(`换推荐失败 (${res.status})`);
  }
  return mapRecommendation(await res.json());
}
