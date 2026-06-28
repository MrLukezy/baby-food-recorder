// ============================
// 数据管理层
// localStorage 为主存储 + 首次访问自动从服务端加载
// 每次写入自动同步到服务端
// ============================

import type { BabyProfile, FoodRecord, ReactionType } from '../types';

const KEY_PROFILE = 'baby_profile';
const KEY_RECORDS = 'food_records';
const KEY_PRESET = 'preset_allergens';

const BASE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:3003/api'
  : '/babyfoodrecorder/api';

// ============ 初始化加载：从服务端拉取数据填充 localStorage ============

let loaded = false;

export async function loadDataFromServer(): Promise<void> {
  if (loaded) return;
  loaded = true;

  try {
    const [profileRes, recordsRes, presetsRes] = await Promise.all([
      fetch(`${BASE_URL}/profile`),
      fetch(`${BASE_URL}/records`),
      fetch(`${BASE_URL}/presets`),
    ]);

    // 无论本地是否有数据，都从服务器拉取最新数据覆盖本地
    if (profileRes.ok) {
      const serverProfile = await profileRes.json();
      if (serverProfile && serverProfile.name) {
        localStorage.setItem(KEY_PROFILE, JSON.stringify(serverProfile));
      }
    }

    if (recordsRes.ok) {
      const serverRecords = await recordsRes.json();
      if (Array.isArray(serverRecords)) {
        localStorage.setItem(KEY_RECORDS, JSON.stringify(serverRecords));
      }
    }

    if (presetsRes.ok) {
      const serverPresets = await presetsRes.json();
      if (Array.isArray(serverPresets)) {
        localStorage.setItem(KEY_PRESET, JSON.stringify(serverPresets));
      }
    }

    console.log('从服务端强制刷新加载完成');
  } catch (e) {
    console.warn('服务端加载失败，使用本地数据:', e);
  }
}

// ============ 服务端同步 ============

async function syncToServer(path: string, body: any): Promise<void> {
  try {
    await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch { /* 同步失败不影响本地 */ }
}

// ============ 宝宝档案 ============

export function getProfile(): BabyProfile | null {
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveProfile(profile: BabyProfile): void {
  localStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
  syncToServer('/profile', profile);
}

export function updateProfile(updates: Partial<BabyProfile>): BabyProfile | null {
  const current = getProfile();
  if (!current) return null;
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  saveProfile(updated);
  return updated;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ============ 辅食记录 ============

export function getRecords(): FoodRecord[] {
  try {
    const raw = localStorage.getItem(KEY_RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveRecords(records: FoodRecord[]): void {
  localStorage.setItem(KEY_RECORDS, JSON.stringify(records));
  syncToServer('/records', { action: 'replace', records });
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
  } catch { return []; }
}

export function savePresetAllergens(foodIds: string[]): void {
  localStorage.setItem(KEY_PRESET, JSON.stringify(foodIds));
  syncToServer('/presets', foodIds);
}

// ============ 排敏状态判断（纯函数） ============

export function getFoodAllergenStatus(
  foodId: string,
  records?: FoodRecord[],
  presets?: string[]
): ReactionType | null {
  const recs = records ?? getRecords();
  const pres = presets ?? getPresetAllergens();
  const foodRecords = recs.filter(r => r.foodId === foodId);

  if (foodRecords.length === 0) {
    if (pres.includes(foodId)) return 'safe';
    return null;
  }

  const hasAllergic = foodRecords.some(r => r.reaction === 'allergic');
  if (hasAllergic) return 'allergic';
  const hasSuspected = foodRecords.some(r => r.reaction === 'suspected');
  if (hasSuspected) return 'suspected';
  const hasDay3Complete = foodRecords.some(r => r.dayCount === 'day3' && r.reaction === 'safe');
  if (hasDay3Complete) return 'safe';
  const days = new Set(foodRecords.map(r => r.date)).size;
  return days >= 3 ? 'safe' : 'observing';
}

export function getFoodObservingDays(foodId: string, records?: FoodRecord[]): number {
  const recs = records ?? getRecords();
  return new Set(recs.filter(r => r.foodId === foodId).map(r => r.date)).size;
}

export function isFoodStillObserving(foodId: string, records?: FoodRecord[]): boolean {
  const recs = records ?? getRecords();
  const foodRecords = recs.filter(r => r.foodId === foodId);
  if (foodRecords.length === 0) return false;
  if (foodRecords.some(r => r.reaction === 'allergic' || r.reaction === 'suspected')) return false;
  if (foodRecords.some(r => r.dayCount === 'day3' && r.reaction === 'safe')) return false;
  const days = new Set(foodRecords.map(r => r.date)).size;
  return days > 0 && days < 3;
}

export function getObservingFoods(records?: FoodRecord[]): { foodId: string; foodName: string; dayCount: number }[] {
  const recs = records ?? getRecords();
  const foodMap = new Map<string, { dates: Set<string>; name: string }>();
  for (const r of recs) {
    if (!foodMap.has(r.foodId)) {
      foodMap.set(r.foodId, { dates: new Set(), name: r.foodName });
    }
    foodMap.get(r.foodId)!.dates.add(r.date);
  }

  const observing: { foodId: string; foodName: string; dayCount: number }[] = [];
  for (const [foodId, data] of foodMap) {
    const hasAllergic = recs.some(r => r.foodId === foodId && r.reaction === 'allergic');
    const hasSuspected = recs.some(r => r.foodId === foodId && r.reaction === 'suspected');
    const dayCount = data.dates.size;
    if (recs.some(r => r.foodId === foodId && r.dayCount === 'day3' && r.reaction === 'safe')) continue;
    if (!hasAllergic && !hasSuspected && dayCount < 3) {
      observing.push({ foodId, foodName: data.name, dayCount });
    }
  }
  return observing;
}

export function getSuspectedRetestDate(foodId: string, records?: FoodRecord[]): string | null {
  const recs = records ?? getRecords();
  const suspected = recs
    .filter(r => r.foodId === foodId && r.reaction === 'suspected')
    .sort((a, b) => a.date.localeCompare(b.date));
  if (suspected.length === 0) return null;
  const retest = new Date(suspected[0].date);
  retest.setDate(retest.getDate() + 14);
  return retest.toISOString().split('T')[0];
}

export function getRetestReminders(records?: FoodRecord[]): { foodId: string; foodName: string; retestDate: string; daysLeft: number; isOverdue: boolean; daysUntilRetest: number }[] {
  const recs = records ?? getRecords();
  const today = new Date().toISOString().split('T')[0];
  const reminders: any[] = [];
  const processed = new Set<string>();

  for (const r of recs) {
    if (r.reaction !== 'suspected') continue;
    if (processed.has(r.foodId)) continue;
    processed.add(r.foodId);
    const retestDate = getSuspectedRetestDate(r.foodId, recs);
    if (retestDate && retestDate <= today) {
      const diff = Math.ceil((new Date(retestDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      reminders.push({
        foodId: r.foodId,
        foodName: r.foodName,
        retestDate,
        daysLeft: diff,
        isOverdue: diff < 0,
        daysUntilRetest: diff,
      });
    }
  }
  return reminders;
}

export function getStats(): { total: number; safe: number; observing: number; suspected: number; allergic: number } {
  const records = getRecords();
  const presets = getPresetAllergens();
  const foodIds = new Set([...records.map(r => r.foodId), ...presets]);
  let safe = 0, observing = 0, suspected = 0, allergic = 0;

  for (const foodId of foodIds) {
    const status = getFoodAllergenStatus(foodId, records, presets);
    if (status === 'safe') safe++;
    else if (status === 'observing') observing++;
    else if (status === 'suspected') suspected++;
    else if (status === 'allergic') allergic++;
  }

  return { total: records.length, safe, observing, suspected, allergic };
}

export function getFoodEatCount(foodId: string, records?: FoodRecord[]): number {
  return (records ?? getRecords()).filter(r => r.foodId === foodId).length;
}

export function clearAllData(): void {
  localStorage.removeItem(KEY_PROFILE);
  localStorage.removeItem(KEY_RECORDS);
  localStorage.removeItem(KEY_PRESET);
  syncToServer('/records', { action: 'replace', records: [] });
  syncToServer('/profile', {});
  syncToServer('/presets', []);
}
