// ============================
// Excel 导出工具（含微信浏览器兼容）
// ============================

import * as XLSX from 'xlsx';
import type { BabyProfile, FoodRecord } from '../types';
import { MEAL_OPTIONS, REACTION_OPTIONS, DAY_OPTIONS } from '../types';
import { getFoodById } from '../config/foodConfig';
import { getStats } from '../store';
import { getMonthAge } from './date';

/** 检测是否在微信内置浏览器中 */
export function isWeChatBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}

/** 检测是否在 QQ 内置浏览器中 */
export function isQQBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes(' qq/') && !ua.includes('micromessenger');
}

/** 检测是否为受限内嵌浏览器（无法直接下载文件） */
export function isRestrictedBrowser(): boolean {
  return isWeChatBrowser() || isQQBrowser();
}

/** 生成 CSV 内容字符串 */
function generateCSV(profile: BabyProfile): string {
  const stats = getStats();
  const age = getMonthAge(profile.birthday);
  const records: FoodRecord[] = JSON.parse(localStorage.getItem('food_records') || '[]');
  const sorted = [...records].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );

  const lines: string[] = [];

  // 表头信息区
  lines.push('宝宝辅食排敏记录 - 数据导出');
  lines.push('');
  lines.push('昵称,' + profile.name);
  lines.push('出生日期,' + profile.birthday);
  lines.push('当前月龄,' + age.months + '个月' + age.days + '天');
  lines.push('总记录数,' + stats.total);
  lines.push('安全（不过敏）,' + stats.safe);
  lines.push('观察中,' + stats.observing);
  lines.push('过敏源,' + stats.allergic);
  lines.push('导出时间,' + new Date().toLocaleString('zh-CN'));
  lines.push('');

  // 记录明细
  lines.push('日期,餐次,食物,食物分类,排敏反应,排敏天数,备注');

  for (const r of sorted) {
    const mealLabel = MEAL_OPTIONS.find(m => m.value === r.meal)?.label || r.meal;
    const reactionLabel = REACTION_OPTIONS.find(o => o.value === r.reaction)?.label || r.reaction;
    const dayLabel = DAY_OPTIONS.find(d => d.value === r.dayCount)?.label || r.dayCount;
    const foodInfo = getFoodById(r.foodId);
    const category = foodInfo?.categoryName || '';
    // CSV 转义：包含逗号或引号的字段用双引号包裹
    const escape = (s: string) => s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s;
    lines.push([r.date, mealLabel, r.foodName, category, reactionLabel, dayLabel, escape(r.note || '')].join(','));
  }

  // UTF-8 BOM 让 Excel 正确识别中文
  return '\uFEFF' + lines.join('\n');
}

/** 尝试复制文本到剪贴板 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback: 使用 textarea
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

/** 主导出函数 */
export async function exportToExcel(profile: BabyProfile) {
  if (isRestrictedBrowser()) {
    // 微信/QQ 浏览器：复制 CSV 到剪贴板
    const csv = generateCSV(profile);
    const copied = await copyToClipboard(csv);

    if (copied) {
      alert(
        '当前浏览器不支持直接下载文件。\n\n' +
        '数据已复制为 CSV 格式，你可以：\n' +
        '1. 打开备忘录/微信文件助手 粘贴保存\n' +
        '2. 点击右上角 "..." 选择"在浏览器中打开"后重新导出\n\n' +
        '已将数据复制到剪贴板，请粘贴到任意位置保存。'
      );
    } else {
      // 剪贴板也失败了，提示用户
      alert(
        '当前浏览器不支持文件下载和剪贴板复制。\n\n' +
        '建议：点击右上角 "..." → 选择"在浏览器中打开"后重试导出。'
      );
    }
    return;
  }

  // 正常浏览器：XLSX 下载
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
  const records: FoodRecord[] = JSON.parse(localStorage.getItem('food_records') || '[]');
  const sorted = [...records].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
  );

  const detailHeaders = ['日期', '餐次', '食物', '食物分类', '排敏反应', '排敏天数', '备注'];
  const detailRows = sorted.map(r => {
    const mealLabel = MEAL_OPTIONS.find(m => m.value === r.meal)?.label || r.meal;
    const reactionLabel = REACTION_OPTIONS.find(o => o.value === r.reaction)?.label || r.reaction;
    const dayLabel = DAY_OPTIONS.find(d => d.value === r.dayCount)?.label || r.dayCount;
    const foodInfo = getFoodById(r.foodId);
    const category = foodInfo?.categoryName || '';
    return [r.date, mealLabel, r.foodName, category, reactionLabel, dayLabel, r.note];
  });

  const detailData = [detailHeaders, ...detailRows];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(infoData);
  const ws2 = XLSX.utils.aoa_to_sheet(detailData);

  ws2['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, '宝宝信息');
  XLSX.utils.book_append_sheet(wb, ws2, '辅食记录明细');

  XLSX.writeFile(wb, `宝宝辅食记录_${profile.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
