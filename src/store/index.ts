// ============================
// 数据管理层 (LocalStorage)
// ============================

import type { BabyProfile, FoodRecord, ReactionType } from '../types';

const KEY_PROFILE = 'baby_profile';
const KEY_RECORDS = 'food_records';
const KEY_PRESET = 'preset_allergens';

// ============ 宝宝档案 ============

export function getProfile(): BabyProfile | null {
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: BabyProfile): void {
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
}

export function updateProfile(updates: Partial<BabyProfile>): BabyProfile | null {
  const current = getProfile();
  if (!current) return null;
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  saveProfile(updated);
  return updated;
}

// ============ 辅食记录 ============

export function getRecords(): FoodRecord[] {
  try {
    const raw = localStorage.getItem(KEY_RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecords(records: FoodRecord[]): void {
  localStorage.setItem(KEY_RECORDS, JSON.stringify(records));
}

export function addRecord(record: FoodRecord): void {
  const records = getRecords();
  records.push(record);
  saveRecords(records);
}

export function deleteRecord(recordId: string): void {
  const records = getRecords().filter(r => r.id !== recordId);
  saveRecords(records);
}

export function updateRecord(recordId: string, updates: Partial<FoodRecord>): void {
  const records = getRecords().map(r => r.id === recordId ? { ...r, ...updates } : r);
  saveRecords(records);
}

export function getRecordsByDate(date: string): FoodRecord[] {
  return getRecords().filter(r => r.date === date);
}

export function getRecordsByDateRange(startDate: string, endDate: string): FoodRecord[] {
  return getRecords().filter(r => r.date >= startDate && r.date <= endDate);
}

// ============ 预设排敏食物 ============

export function getPresetAllergens(): string[] {
  try {
    const raw = localStorage.getItem(KEY_PRESET);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePresetAllergens(foodIds: string[]): void {
  localStorage.setItem(KEY_PRESET, JSON.stringify(foodIds));
}

// ============ 排敏状态判断（核心逻辑） ============

/**
 * 获取某个食物的排敏状态
 *
 * 规则：
 * - 有任何 allergic 反应 → 'allergic'（过敏）
 * - 连续记录了 3 个不同日期 且无过敏 → 'safe'（排敏完成/不过敏）
 * - 不足 3 天 且无过敏 → 'observing'（排敏中）
 * - 预设食物（无记录）→ 'safe'（默认安全）
 * - 无任何数据 → null
 */
export function getFoodAllergenStatus(foodId: string): ReactionType | null {
  const records = getRecords().filter(r => r.foodId === foodId);

  if (records.length === 0) {
    const presets = getPresetAllergens();
    if (presets.includes(foodId)) return 'safe';
    return null;
  }

  // 有任何一次过敏反应 → 整体判定过敏
  const hasAllergic = records.some(r => r.reaction === 'allergic');
  if (hasAllergic) return 'allergic';

  // 统计不同日期数（去重）
  const uniqueDays = new Set(records.map(r => r.date)).size;

  // 3 天及以上排敏完成
  return uniqueDays >= 3 ? 'safe' : 'observing';
}

/**
 * 获取所有正在排敏中（不足3天）的食物列表
 * 用于检测"同时排敏多个食物"的冲突
 */
export function getObservingFoods(): { foodId: string; foodName: string; dayCount: number }[] {
  const records = getRecords();

  // 按食物分组
  const foodMap = new Map<string, { dates: Set<string>; name: string }>();
  for (const r of records) {
    if (!foodMap.has(r.foodId)) {
      foodMap.set(r.foodId, { dates: new Set(), name: r.foodName });
    }
    foodMap.get(r.foodId)!.dates.add(r.date);
  }

  const observing: { foodId: string; foodName: string; dayCount: number }[] = [];

  for (const [foodId, data] of foodMap) {
    const hasAllergic = records.some(r => r.foodId === foodId && r.reaction === 'allergic');
    const dayCount = data.dates.size;

    // 正在排敏：不足3天 且 无过敏反应
    if (!hasAllergic && dayCount < 3) {
      observing.push({ foodId, foodName: data.name, dayCount });
    }
  }

  return observing;
}

// ============ 统计 ============

export function getStats(): { total: number; safe: number; observing: number; allergic: number } {
  const records = getRecords();
  const presetIds = getPresetAllergens();

  // 按食物分组统计排敏状态
  const foodIds = new Set([
    ...records.map(r => r.foodId),
    ...presetIds,
  ]);

  let safe = 0;
  let observing = 0;
  let allergic = 0;

  for (const foodId of foodIds) {
    const status = getFoodAllergenStatus(foodId);
    if (status === 'safe') safe++;
    else if (status === 'observing') observing++;
    else if (status === 'allergic') allergic++;
  }

  return {
    total: records.length,
    safe,
    observing,
    allergic,
  };
}

/** 获取某个食物的最新反应状态（按 record.reaction 字段） */
export function getFoodLatestReaction(foodId: string): ReactionType | null {
  const records = getRecords()
    .filter(r => r.foodId === foodId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (records.length > 0) return records[0].reaction;

  const presets = getPresetAllergens();
  if (presets.includes(foodId)) return 'safe';

  return null;
}

/** 获取某个食物的食用次数 */
export function getFoodEatCount(foodId: string): number {
  return getRecords().filter(r => r.foodId === foodId).length;
}

/** 清除所有数据 */
export function clearAllData(): void {
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_RECORDS);
  localStorage.removeItem(KEY_PRESET);
}

// ============ UUID 生成 ============

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
