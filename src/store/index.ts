// ============================
// 数据管理层
// 内存态仅作运行时镜像，读写均以服务端为准；无 localStorage
// ============================

import type { BabyProfile, FoodRecord, ReactionType } from '../types';
import { apiGet, apiPost } from './api';
import { withFeedback } from './feedback';

export interface CustomFood {
  id: string;
  name: string;
  categoryId: string;
  allergenLevel: string;
  createdAt: string;
}

type Memory = {
  profile: BabyProfile | null;
  records: FoodRecord[];
  presets: string[];
  customFoods: CustomFood[];
  ready: boolean;
};

const memory: Memory = {
  profile: null,
  records: [],
  presets: [],
  customFoods: [],
  ready: false,
};

type ChangeListener = () => void;
const changeListeners = new Set<ChangeListener>();

function emitChange() {
  changeListeners.forEach(l => l());
}

/** 订阅内存镜像变化（写成功后通知 UI 刷新） */
export function subscribeStore(listener: ChangeListener): () => void {
  changeListeners.add(listener);
  return () => { changeListeners.delete(listener); };
}

export function isStoreReady(): boolean {
  return memory.ready;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ============ 启动：从服务端拉取全部业务数据 ============

export async function bootstrapFromServer(): Promise<void> {
  return withFeedback('加载数据中...', async () => {
    const [profile, records, presets, customFoods] = await Promise.all([
      apiGet<BabyProfile | Record<string, never>>('/profile'),
      apiGet<FoodRecord[]>('/records'),
      apiGet<string[]>('/presets'),
      apiGet<CustomFood[]>('/custom-foods').catch(() => [] as CustomFood[]),
    ]);

    memory.profile = profile && (profile as BabyProfile).name
      ? (profile as BabyProfile)
      : null;
    memory.records = Array.isArray(records) ? records : [];
    memory.presets = Array.isArray(presets) ? presets : [];
    memory.customFoods = Array.isArray(customFoods) ? customFoods : [];
    memory.ready = true;
    emitChange();
  });
}

// ============ 宝宝档案 ============

export function getProfile(): BabyProfile | null {
  return memory.profile;
}

export async function saveProfile(profile: BabyProfile): Promise<void> {
  return withFeedback('保存档案中...', async () => {
    await apiPost('/profile', profile);
    memory.profile = profile;
    emitChange();
  });
}

export async function updateProfile(updates: Partial<BabyProfile>): Promise<BabyProfile | null> {
  const current = memory.profile;
  if (!current) return null;
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  await saveProfile(updated);
  return updated;
}

// ============ 辅食记录 ============

export function getRecords(): FoodRecord[] {
  return memory.records;
}

export async function saveRecords(records: FoodRecord[]): Promise<void> {
  return withFeedback('保存记录中...', async () => {
    await apiPost('/records', { action: 'replace', records });
    memory.records = records;
    emitChange();
  });
}

export async function addRecord(record: FoodRecord): Promise<void> {
  const records = [...memory.records, record];
  await saveRecords(records);
}

export async function deleteRecord(recordId: string): Promise<void> {
  const records = memory.records.filter(r => r.id !== recordId);
  await saveRecords(records);
}

export async function updateRecord(recordId: string, updates: Partial<FoodRecord>): Promise<void> {
  const records = memory.records.map(r => (r.id === recordId ? { ...r, ...updates } : r));
  await saveRecords(records);
}

export function getRecordsByDate(date: string): FoodRecord[] {
  return memory.records.filter(r => r.date === date);
}

export function getRecordsByDateRange(startDate: string, endDate: string): FoodRecord[] {
  return memory.records.filter(r => r.date >= startDate && r.date <= endDate);
}

// ============ 预设排敏食物 ============

export function getPresetAllergens(): string[] {
  return memory.presets;
}

export async function savePresetAllergens(foodIds: string[]): Promise<void> {
  return withFeedback('保存预设中...', async () => {
    await apiPost('/presets', foodIds);
    memory.presets = foodIds;
    emitChange();
  });
}

// ============ 自定义食材 ============

export function getCustomFoods(): CustomFood[] {
  return memory.customFoods;
}

async function persistCustomFoods(foods: CustomFood[]): Promise<void> {
  return withFeedback('保存食材中...', async () => {
    await apiPost('/custom-foods', foods);
    memory.customFoods = foods;
    emitChange();
  });
}

export async function addCustomFood(
  name: string,
  categoryId: string,
  allergenLevel: string = 'low'
): Promise<void> {
  const foods = [
    ...memory.customFoods,
    {
      id: 'custom_' + Date.now(),
      name: name.trim(),
      categoryId,
      allergenLevel,
      createdAt: new Date().toISOString(),
    },
  ];
  await persistCustomFoods(foods);
}

export async function deleteCustomFood(foodId: string): Promise<void> {
  await persistCustomFoods(memory.customFoods.filter(f => f.id !== foodId));
}

export async function updateCustomFood(foodId: string, newName: string): Promise<void> {
  const foods = memory.customFoods.map(f =>
    f.id === foodId ? { ...f, name: newName.trim() } : f
  );
  await persistCustomFoods(foods);
}

export function getCustomFoodAllergenLevel(foodId: string): string | null {
  return memory.customFoods.find(f => f.id === foodId)?.allergenLevel || null;
}

export function getCustomFoodsByCategory(categoryId: string): CustomFood[] {
  return memory.customFoods.filter(f => f.categoryId === categoryId);
}

export function isCustomFood(foodId: string): boolean {
  return memory.customFoods.some(f => f.id === foodId);
}

// ============ 排敏状态判断（纯函数，读内存镜像） ============

export function getFoodAllergenStatus(
  foodId: string,
  records?: FoodRecord[],
  presets?: string[]
): ReactionType | null {
  const recs = records ?? memory.records;
  const pres = presets ?? memory.presets;
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
  const recs = records ?? memory.records;
  return new Set(recs.filter(r => r.foodId === foodId).map(r => r.date)).size;
}

export function isFoodStillObserving(foodId: string, records?: FoodRecord[]): boolean {
  const recs = records ?? memory.records;
  const foodRecords = recs.filter(r => r.foodId === foodId);
  if (foodRecords.length === 0) return false;
  if (foodRecords.some(r => r.reaction === 'allergic' || r.reaction === 'suspected')) return false;
  if (foodRecords.some(r => r.dayCount === 'day3' && r.reaction === 'safe')) return false;
  const days = new Set(foodRecords.map(r => r.date)).size;
  return days > 0 && days < 3;
}

export function getObservingFoods(records?: FoodRecord[]): { foodId: string; foodName: string; dayCount: number }[] {
  const recs = records ?? memory.records;
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
  const recs = records ?? memory.records;
  const suspected = recs
    .filter(r => r.foodId === foodId && r.reaction === 'suspected')
    .sort((a, b) => a.date.localeCompare(b.date));
  if (suspected.length === 0) return null;
  const retest = new Date(suspected[0].date);
  retest.setDate(retest.getDate() + 14);
  return retest.toISOString().split('T')[0];
}

export function getRetestReminders(records?: FoodRecord[]): {
  foodId: string;
  foodName: string;
  retestDate: string;
  daysLeft: number;
  isOverdue: boolean;
  daysUntilRetest: number;
}[] {
  const recs = records ?? memory.records;
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
  const records = memory.records;
  const presets = memory.presets;
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
  return (records ?? memory.records).filter(r => r.foodId === foodId).length;
}

export async function clearAllData(): Promise<void> {
  return withFeedback('清除数据中...', async () => {
    await Promise.all([
      apiPost('/records', { action: 'replace', records: [] }),
      apiPost('/profile', {}),
      apiPost('/presets', []),
      apiPost('/custom-foods', []).catch(() => undefined),
    ]);
    memory.profile = null;
    memory.records = [];
    memory.presets = [];
    memory.customFoods = [];
    emitChange();
  });
}
