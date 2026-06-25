// ============================
// Excel 导出工具
// ============================

import * as XLSX from 'xlsx';
import type { BabyProfile, FoodRecord } from '../types';
import { MEAL_OPTIONS, REACTION_OPTIONS, DAY_OPTIONS } from '../types';
import { getFoodById } from '../config/foodConfig';
import { getStats } from '../store';
import { getMonthAge } from './date';

export function exportToExcel(profile: BabyProfile) {
  const stats = getStats();
  const age = getMonthAge(profile.birthday);

  // Sheet1: 宝宝信息
  const infoData = [
    ['宝宝辅食排敏记录 - 数据导出'],
    [],
    ['昵称', profile.name],
    ['出生日期', profile.birthday],
    ['当前月龄', `${age.months}个月${age.days}天`],
    ['总记录数', stats.total],
    ['安全（不过敏）', stats.safe],
    ['观察中', stats.observing],
    ['过敏源', stats.allergic],
    ['导出时间', new Date().toLocaleString('zh-CN')],
  ];

  // Sheet2: 辅食记录明细
  const records = JSON.parse(localStorage.getItem('food_records') || '[]') as FoodRecord[];
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  const detailHeaders = ['日期', '餐次', '食物', '食物分类', '排敏反应', '排敏天数', '备注'];
  const detailRows = sorted.map(r => {
    const mealLabel = MEAL_OPTIONS.find(m => m.value === r.meal)?.label || r.meal;
    const reactionLabel = REACTION_OPTIONS.find(react => react.value === r.reaction)?.label || r.reaction;
    const dayLabel = DAY_OPTIONS.find(d => d.value === r.dayCount)?.label || r.dayCount;
    const foodInfo = getFoodById(r.foodId);
    const category = foodInfo?.categoryName || '';

    return [r.date, mealLabel, r.foodName, category, reactionLabel, dayLabel, r.note];
  });

  const detailData = [detailHeaders, ...detailRows];

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(infoData);
  const ws2 = XLSX.utils.aoa_to_sheet(detailData);

  // 设置列宽
  ws2['!cols'] = [
    { wch: 12 }, // 日期
    { wch: 10 }, // 餐次
    { wch: 10 }, // 食物
    { wch: 10 }, // 分类
    { wch: 10 }, // 反应
    { wch: 10 }, // 天数
    { wch: 30 }, // 备注
  ];

  XLSX.utils.book_append_sheet(wb, ws1, '宝宝信息');
  XLSX.utils.book_append_sheet(wb, ws2, '辅食记录明细');

  // 下载
  XLSX.writeFile(wb, `宝宝辅食记录_${profile.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
