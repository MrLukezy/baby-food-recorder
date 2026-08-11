// ============================
// 同类食材组（细粒度，非大类）
// ============================

import type { ReactionType } from '../types';
import { getFoodAllergenStatus } from '../store';
import { getFoodById } from './foodConfig';

export interface RelatedFoodGroup {
  id: string;
  name: string;
  foodIds: string[];
}

export const relatedFoodGroups: RelatedFoodGroup[] = [
  { id: 'tuber', name: '薯类', foodIds: ['v_tudou', 'v_hongshu', 'v_shanyao'] },
  { id: 'cruciferous_leaf', name: '十字花科绿叶', foodIds: ['v_xilanhua', 'v_bocai', 'v_baicai', 'v_shengcai'] },
  { id: 'gourd', name: '瓜类蔬菜', foodIds: ['v_nangua', 'v_donggua', 'v_huanggua'] },
  { id: 'citrus', name: '柑橘', foodIds: ['f_chengzi', 'f_youzi'] },
  { id: 'berry', name: '浆果', foodIds: ['f_lanmei', 'f_caomei', 'f_putao', 'f_yingtao'] },
  { id: 'stone_fruit', name: '核果', foodIds: ['f_taozi', 'f_yingtao'] },
  { id: 'poultry', name: '禽肉', foodIds: ['m_jirou', 'm_yarou'] },
  { id: 'livestock', name: '畜肉', foodIds: ['m_zhurou', 'm_niurou', 'm_yangrou'] },
  { id: 'egg', name: '蛋类', foodIds: ['m_jidanhuang', 'm_jidanbai'] },
  { id: 'liver', name: '肝类', foodIds: ['m_zhugan', 'm_jigan'] },
  { id: 'white_fish', name: '白鱼', foodIds: ['s_xueyu', 's_luyu'] },
  { id: 'fish', name: '鱼类', foodIds: ['s_sanwenyu', 's_xueyu', 's_luyu'] },
  { id: 'crustacean', name: '甲壳类', foodIds: ['s_xiaren', 's_xiapi'] },
  { id: 'soy', name: '大豆制品', foodIds: ['bn_doufu', 'bn_doujiang'] },
  { id: 'beans', name: '杂豆', foodIds: ['bn_hongdou', 'bn_lvdou', 'bn_heidou'] },
  { id: 'nuts', name: '坚果', foodIds: ['bn_huasheng', 'bn_hetao', 'bn_yaoguo', 'bn_xingren', 'bn_zhimajiang'] },
  { id: 'dairy', name: '乳制品', foodIds: ['d_suannai', 'd_nailao', 'd_niunai', 'd_huangyou'] },
  { id: 'wheat', name: '小麦制品', foodIds: ['g_xiaomai', 'g_quanmaimianbao'] },
  { id: 'rice', name: '大米系', foodIds: ['g_mifen', 'g_damizhou'] },
];

const foodIdToGroups = new Map<string, RelatedFoodGroup[]>();
for (const group of relatedFoodGroups) {
  for (const foodId of group.foodIds) {
    const list = foodIdToGroups.get(foodId) || [];
    list.push(group);
    foodIdToGroups.set(foodId, list);
  }
}

/** 返回食材所属的第一个同类组（主提示用） */
export function getRelatedGroup(foodId: string): RelatedFoodGroup | null {
  const groups = foodIdToGroups.get(foodId);
  return groups?.[0] || null;
}

export interface RelatedFoodStatusItem {
  foodId: string;
  foodName: string;
  status: ReactionType | null;
  groupId: string;
  groupName: string;
}

/** 同组其他食材的排敏状态（跨所有所属组，去重） */
export function getRelatedFoodStatuses(foodId: string): RelatedFoodStatusItem[] {
  const groups = foodIdToGroups.get(foodId) || [];
  const seen = new Set<string>();
  const result: RelatedFoodStatusItem[] = [];

  for (const group of groups) {
    for (const id of group.foodIds) {
      if (id === foodId || seen.has(id)) continue;
      seen.add(id);
      const info = getFoodById(id);
      result.push({
        foodId: id,
        foodName: info?.name || id,
        status: getFoodAllergenStatus(id),
        groupId: group.id,
        groupName: group.name,
      });
    }
  }

  return result;
}

export interface RelatedHint {
  level: 'info' | 'warn' | 'danger';
  message: string;
  /** 保存时是否需要 confirm */
  requireConfirm: boolean;
  confirmMessage: string;
}

const STATUS_LABEL: Record<string, string> = {
  safe: '已排敏通过',
  observing: '正在排敏中',
  allergic: '曾确认过敏',
  suspected: '曾疑似过敏',
};

/** 根据同组状态生成提示（优先 danger > warn > info） */
export function buildRelatedHint(foodId: string, foodName?: string): RelatedHint | null {
  const currentName = foodName || getFoodById(foodId)?.name || '该食材';
  const related = getRelatedFoodStatuses(foodId).filter(r => r.status);
  if (related.length === 0) return null;

  const allergic = related.filter(r => r.status === 'allergic' || r.status === 'suspected');
  const observing = related.filter(r => r.status === 'observing');
  const safe = related.filter(r => r.status === 'safe');

  if (allergic.length > 0) {
    const item = allergic[0];
    const label = STATUS_LABEL[item.status!] || item.status;
    return {
      level: 'danger',
      message: `同类「${item.groupName}」中的${item.foodName}${label}，引入${currentName}需格外谨慎`,
      requireConfirm: true,
      confirmMessage:
        `⚠️ 同类提醒\n\n同类「${item.groupName}」中的${item.foodName}${label}。\n` +
        `引入${currentName}需格外谨慎，建议少量试吃并密切观察。\n\n确定要继续保存吗？`,
    };
  }

  if (observing.length > 0) {
    const item = observing[0];
    return {
      level: 'warn',
      message: `同类「${item.groupName}」中的${item.foodName}正在排敏中，不建议同时引入${currentName}`,
      requireConfirm: true,
      confirmMessage:
        `💡 同类提醒\n\n同类「${item.groupName}」中的${item.foodName}正在排敏中。\n` +
        `不建议同时引入${currentName}，以免无法判断过敏源。\n\n确定要继续保存吗？`,
    };
  }

  if (safe.length > 0) {
    const item = safe[0];
    const names = safe.slice(0, 3).map(s => s.foodName).join('、');
    return {
      level: 'info',
      message: `同类「${item.groupName}」中的${names}已排敏通过，${currentName}过敏风险通常较低，仍建议少量试吃并观察`,
      requireConfirm: false,
      confirmMessage: '',
    };
  }

  return null;
}

/** 未排敏食材：同组是否已有 safe */
export function hasRelatedSafeFood(foodId: string): { groupName: string; foodName: string } | null {
  const related = getRelatedFoodStatuses(foodId);
  const safe = related.find(r => r.status === 'safe');
  if (!safe) return null;
  return { groupName: safe.groupName, foodName: safe.foodName };
}
