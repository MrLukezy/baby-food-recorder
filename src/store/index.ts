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
 * - 有 suspected 反应，且无 allergic → 'suspected'（疑似过敏）
 * - 标记了 day3（排敏完成）且无过敏/疑似 → 'safe'（排敏完成/不过敏）
 * - 连续记录了 3 个不同日期 且无过敏/疑似 → 'safe'（排敏完成/不过敏）
 * - 不足 3 天 且无过敏/疑似 → 'observing'（排敏中）
 * - 预设食物（无记录）→ 'safe'（默认安全，视为已完成3天排敏）
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

  // 有疑似过敏反应，但无确认过敏 → 'suspected'
  const hasSuspected = records.some(r => r.reaction === 'suspected');
  if (hasSuspected) return 'suspected';

  // 如果手动标记了第3天（排敏完成）→ 直接判定排敏完成
  const hasDay3Complete = records.some(r => r.dayCount === 'day3' && r.reaction === 'safe');
  if (hasDay3Complete) return 'safe';

  // 统计不同日期数（去重）
  const uniqueDays = new Set(records.map(r => r.date)).size;

  // 3 天及以上排敏完成
  return uniqueDays >= 3 ? 'safe' : 'observing';
}

/**
 * 获取某个食物的已观察天数（去重日期数）
 * 返回 0 表示无任何记录
 */
export function getFoodObservingDays(foodId: string): number {
  const records = getRecords().filter(r => r.foodId === foodId);
  if (records.length === 0) return 0;
  return new Set(records.map(r => r.date)).size;
}

/**
 * 检查某食物是否处于"观察中"状态且还未有任何过敏/疑似过敏记录
 * 即：所有现有记录都是 safe 反应，但天数不足 3 天且未手动标记排敏完成
 */
export function isFoodStillObserving(foodId: string): boolean {
  const records = getRecords().filter(r => r.foodId === foodId);
  if (records.length === 0) return false;
  const hasSeriousReaction = records.some(r => r.reaction === 'allergic' || r.reaction === 'suspected');
  if (hasSeriousReaction) return false;
  // 手动标记了 day3 排敏完成
  const hasDay3Complete = records.some(r => r.dayCount === 'day3' && r.reaction === 'safe');
  if (hasDay3Complete) return false;
  const days = new Set(records.map(r => r.date)).size;
  return days > 0 && days < 3;
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
    const hasSuspected = records.some(r => r.foodId === foodId && r.reaction === 'suspected');
    const dayCount = data.dates.size;

    // 跳过已手动标记排敏完成的食物
    const hasDay3Complete = records.some(r => r.foodId === foodId && r.dayCount === 'day3' && r.reaction === 'safe');
    if (hasDay3Complete) continue;
    if (!hasAllergic && !hasSuspected && dayCount < 3) {
      observing.push({ foodId, foodName: data.name, dayCount });
    }
  }

  return observing;
}

// ============ 疑似过敏回避触发实验 ============

/**
 * 获取某个食物的疑似过敏回避实验建议日期
 * 规则：从首次标记为疑似过敏之日起，建议回避 2 周（14天），然后进行回避触发实验
 */
export function getSuspectedRetestDate(foodId: string): string | null {
  const records = getRecords()
    .filter(r => r.foodId === foodId && r.reaction === 'suspected')
    .sort((a, b) => a.date.localeCompare(b.date));

  if (records.length === 0) return null;

  const firstSuspectedDate = records[0].date;
  const retestDate = new Date(firstSuspectedDate);
  retestDate.setDate(retestDate.getDate() + 14);

  return retestDate.toISOString().split('T')[0];
}

/**
 * 获取所有需要回避触发实验的食物列表
 * 返回：食物ID、食物名、首次疑似过敏日期、建议实验日期、是否已过期
 */
export function getRetestReminders(): {
  foodId: string;
  foodName: string;
  suspectedDate: string;
  retestDate: string;
  isOverdue: boolean;
  daysUntilRetest: number;
}[] {
  const records = getRecords();
  const today = new Date().toISOString().split('T')[0];

  // 找出所有有疑似过敏记录的食物
  const suspectedFoods = new Map<string, { dates: string[]; name: string }>();
  for (const r of records) {
    if (r.reaction === 'suspected') {
      if (!suspectedFoods.has(r.foodId)) {
        suspectedFoods.set(r.foodId, { dates: [], name: r.foodName });
      }
      suspectedFoods.get(r.foodId)!.dates.push(r.date);
    }
  }

  const reminders: {
    foodId: string;
    foodName: string;
    suspectedDate: string;
    retestDate: string;
    isOverdue: boolean;
    daysUntilRetest: number;
  }[] = [];

  for (const [foodId, data] of suspectedFoods) {
    // 检查是否已有确认结果（过敏或安全）
    const latestStatus = getFoodAllergenStatus(foodId);
    if (latestStatus === 'allergic' || latestStatus === 'safe') continue;

    const firstSuspectedDate = data.dates.sort()[0];
    const retestDateObj = new Date(firstSuspectedDate);
    retestDateObj.setDate(retestDateObj.getDate() + 14);
    const retestDateStr = retestDateObj.toISOString().split('T')[0];

    const daysUntilRetest = Math.floor(
      (retestDateObj.getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    );

    reminders.push({
      foodId,
      foodName: data.name,
      suspectedDate: firstSuspectedDate,
      retestDate: retestDateStr,
      isOverdue: daysUntilRetest < 0,
      daysUntilRetest,
    });
  }

  return reminders.sort((a, b) => a.retestDate.localeCompare(b.retestDate));
}

// ============ 统计 ============

export function getStats(): { total: number; safe: number; observing: number; suspected: number; allergic: number } {
  const records = getRecords();
  const presetIds = getPresetAllergens();

  // 按食物分组统计排敏状态
  const foodIds = new Set([
    ...records.map(r => r.foodId),
    ...presetIds,
  ]);

  let safe = 0;
  let observing = 0;
  let suspected = 0;
  let allergic = 0;

  for (const foodId of foodIds) {
    const status = getFoodAllergenStatus(foodId);
    if (status === 'safe') safe++;
    else if (status === 'observing') observing++;
    else if (status === 'suspected') suspected++;
    else if (status === 'allergic') allergic++;
  }

  return {
    total: records.length,
    safe,
    observing,
    suspected,
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
