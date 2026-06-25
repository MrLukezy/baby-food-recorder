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

// ============ 统计 ============

export function getStats(): { total: number; safe: number; observing: number; allergic: number } {
  const records = getRecords();
  const presetIds = getPresetAllergens();

  // 统计记录中的反应
  let safe = 0;
  let observing = 0;
  let allergic = 0;

  // 按食物去重统计最新状态
  const foodLatestReaction = new Map<string, ReactionType>();

  // 先加入预设的（默认安全）
  for (const id of presetIds) {
    foodLatestReaction.set(id, 'safe');
  }

  // 按时间排序记录
  const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const r of sorted) {
    foodLatestReaction.set(r.foodId, r.reaction);
  }

  for (const reaction of foodLatestReaction.values()) {
    if (reaction === 'safe') safe++;
    else if (reaction === 'observing') observing++;
    else if (reaction === 'allergic') allergic++;
  }

  return {
    total: records.length + presetIds.length,
    safe,
    observing,
    allergic,
  };
}

/** 获取某个食物的最新反应状态 */
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
