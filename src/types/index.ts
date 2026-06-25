// ============================
// 宝宝辅食排敏记录 - 类型定义
// ============================

/** 宝宝档案 */
export interface BabyProfile {
  id: string;
  name: string;
  birthday: string; // YYYY-MM-DD
  avatar?: string; // base64 头像图片
  createdAt: string;
  updatedAt: string;
}

/** 餐次 */
export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

/** 排敏反应 */
export type ReactionType = 'safe' | 'observing' | 'suspected' | 'allergic';

/** 排敏天数 */
export type DayCount = 'day1' | 'day2' | 'day3';

/** 食物记录 */
export interface FoodRecord {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  foodId: string;
  foodName: string;
  reaction: ReactionType;
  dayCount: DayCount;
  note: string;
  createdAt: string;
  // 疑似过敏相关字段
  suspectedAt?: string; // 首次标记疑似过敏的日期
  retestDate?: string; // 回避触发实验建议日期
  retestResult?: 'confirmed_allergic' | 'confirmed_safe' | 'pending'; // 回避实验结果
}

/** 食物项 */
export interface FoodItem {
  id: string;
  name: string;
  emoji: string; // 专属 emoji 图标
  allergenLevel: 'low' | 'medium' | 'high';
  recommendedAge: string; // 如 "6+"
}

/** 食物分类 */
export interface FoodCategory {
  id: string;
  name: string;
  icon: string;
  foods: FoodItem[];
}

// ============ 常量映射 ============

export const MEAL_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'snack', label: '下午加餐' },
  { value: 'dinner', label: '晚餐' },
];

export const REACTION_OPTIONS: { value: ReactionType; label: string; color: string }[] = [
  { value: 'safe', label: '不过敏', color: '#7BC67E' },
  { value: 'observing', label: '观察中', color: '#FFB347' },
  { value: 'suspected', label: '疑似过敏', color: '#F59E0B' },
  { value: 'allergic', label: '过敏', color: '#FF6B6B' },
];

export const DAY_OPTIONS: { value: DayCount; label: string }[] = [
  { value: 'day1', label: '第一天' },
  { value: 'day2', label: '第二天' },
  { value: 'day3', label: '第三天' },
];

export const ALLERGEN_LEVEL_LABELS: Record<string, string> = {
  low: '低敏',
  medium: '中敏',
  high: '高敏',
};

export const ALLERGEN_LEVEL_COLORS: Record<string, string> = {
  low: '#7BC67E',
  medium: '#FFB347',
  high: '#FF6B6B',
};
