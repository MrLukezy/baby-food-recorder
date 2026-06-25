// ============================
// 首页 Tab
// ============================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { BabyProfile, FoodRecord } from '../../types';
import { getRecords, getStats, getRecordsByDate, getFoodAllergenStatus, getPresetAllergens, getRetestReminders } from '../../store';
import { foodCategories, getFoodEmoji, getAllFoods } from '../../config/foodConfig';
import { today, getWeekDates, formatFriendlyDate, getMonthAge } from '../../utils/date';
import RecordPanel from '../../components/RecordPanel';

interface HomeProps {
  profile: BabyProfile;
  onNavigateCategory: (categoryId: string) => void;
}

// 排敏小贴士（随机展示一条）
const ALLERGY_TIPS = [
  '每次只引入一种新食物，便于判断过敏源',
  '每种新食物建议连续观察 3 天',
  '新食物尽量安排在上午，方便观察',
  '生病或接种疫苗期间不引入新食物',
  '高敏食物（虾、蛋白、花生）需单独排敏',
  '已排敏的食物可以和日常饮食搭配',
  '出现皮疹、腹泻、呕吐应立即停止并记录',
  '排敏失败后等 1-2 个月再微量重试',
  '疑似过敏的食物建议回避 2 周后再做回避触发实验',
  '回避触发实验时从极少量开始，每次只加一种',
];

const Home: React.FC<HomeProps> = ({ profile, onNavigateCategory }) => {
  const [selectedDate, setSelectedDate] = useState(today());
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, safe: 0, observing: 0, suspected: 0, allergic: 0 });
  const [showPanel, setShowPanel] = useState(false);
  const [prefillFood, setPrefillFood] = useState<{ id: string; name: string } | null>(null);
  const [statFilter, setStatFilter] = useState<string | null>(null);
  const [showAllRecords, setShowAllRecords] = useState(false);

  const refreshData = useCallback(() => {
    setRecords(getRecordsByDate(selectedDate));
    setStats(getStats());
  }, [selectedDate]);

  useEffect(refreshData, [refreshData]);

  const weekDates = getWeekDates(new Date());
  const age = getMonthAge(profile.birthday);
  const weekDayNames = ['一', '二', '三', '四', '五', '六', '日'];

  // 随机展示一条排敏贴士
  const tipIndex = useMemo(() => Math.floor(Math.random() * ALLERGY_TIPS.length), []);

  // 回避触发实验提醒
  const retestReminders = useMemo(() => getRetestReminders(), [records.length, stats.suspected]);

  // 按分类统计（使用新排敏状态）
  const categoryStats = foodCategories.map(cat => {
    let safe = 0, observing = 0, suspected = 0, allergic = 0;
    for (const food of cat.foods) {
      const status = getFoodAllergenStatus(food.id);
      if (status === 'safe') safe++;
      else if (status === 'observing') observing++;
      else if (status === 'suspected') suspected++;
      else if (status === 'allergic') allergic++;
    }
    return { ...cat, safe, observing, suspected, allergic };
  });

  const mealGroups = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
  const mealIcons: Record<string, string> = {
    breakfast: '🌅', lunch: '☀️', snack: '🍪', dinner: '🌙',
  };
  const mealNames: Record<string, string> = {
    breakfast: '早餐', lunch: '午餐', snack: '下午加餐', dinner: '晚餐',
  };

  // ============ 所有排敏记录浮层数据 ============

  const allRecordsData = useMemo(() => {
    if (!showAllRecords) return null;

    const allRecs = getRecords();
    const presets = getPresetAllergens();
    const allFoods = getAllFoods();

    const foodMap = new Map<string, {
      name: string; emoji: string; status: string;
      eatCount: number; days: number; allergenLevel: string;
    }>();

    // 统计记录中的食物
    for (const r of allRecs) {
      if (!foodMap.has(r.foodId)) {
        const info = allFoods.find(f => f.id === r.foodId);
        foodMap.set(r.foodId, {
          name: r.foodName,
          emoji: getFoodEmoji(r.foodId),
          status: 'unknown',
          eatCount: 0,
          days: 0,
          allergenLevel: info?.allergenLevel || 'low',
        });
      }
      const item = foodMap.get(r.foodId)!;
      item.eatCount++;
    }

    // 预设食物
    for (const id of presets) {
      if (!foodMap.has(id)) {
        const info = allFoods.find(f => f.id === id);
        if (info) {
          foodMap.set(id, {
            name: info.name, emoji: info.emoji,
            status: 'safe', eatCount: 0, days: 0,
            allergenLevel: info.allergenLevel,
          });
        }
      }
    }

    // 计算排敏状态
    for (const [foodId, item] of foodMap) {
      const status = getFoodAllergenStatus(foodId) || 'safe';
      const days = new Set(allRecs.filter(r => r.foodId === foodId).map(r => r.date)).size;
      // 预设食物无记录时显示为 3 天（排敏完成）
      item.status = status;
      item.days = (presets.includes(foodId) && days === 0) ? 3 : days;
    }

    return { foods: Array.from(foodMap.values()), total: foodMap.size };
  }, [showAllRecords]);

  // ============ 统计卡片点击处理 ============

  const handleStatClick = (key: string) => {
    if (statFilter === key) {
      setStatFilter(null);
    } else {
      setStatFilter(key);
      if (key === 'total') {
        setShowAllRecords(true);
      } else {
        setShowAllRecords(false);
      }
    }
  };

  // 从记录中点击食物时，预填食物
  const handleAddRecord = (food?: { id: string; name: string }) => {
    setPrefillFood(food ?? null);
    setShowPanel(true);
  };

  const statusLabel = (allergenStatus: string) =>
    allergenStatus === 'safe' ? '已排敏'
    : allergenStatus === 'observing' ? '排敏中'
    : allergenStatus === 'suspected' ? '疑似过敏'
    : allergenStatus === 'allergic' ? '过敏'
    : '';

  const statusColor = (allergenStatus: string) =>
    allergenStatus === 'safe' ? '#7BC67E'
    : allergenStatus === 'observing' ? '#FFB347'
    : allergenStatus === 'suspected' ? '#F59E0B'
    : '#FF6B6B';

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-20">
      {/* 顶部标题 */}
      <div className="bg-gradient-to-b from-orange-100 to-[#FFF8F0] px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold text-amber-900">🍼 宝宝饮食记录</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* 宝宝信息卡片 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl overflow-hidden">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              ) : '👶'}
            </div>
            <div>
              <h2 className="font-bold text-amber-900 text-lg">{profile.name}</h2>
              <p className="text-sm text-amber-500">
                {profile.birthday} 出生 · {age.months}个月{age.days}天
              </p>
            </div>
          </div>
        </div>

        {/* 排敏小贴士 */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-base">💡</span>
          <p className="text-xs text-amber-700 leading-relaxed">{ALLERGY_TIPS[tipIndex]}</p>
        </div>

        {/* 回避触发实验提醒 */}
        {retestReminders.length > 0 && (
          <div className="bg-amber-100 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔔</span>
              <span className="text-sm font-bold text-amber-900">回避触发实验提醒</span>
            </div>
            <p className="text-xs text-amber-700 mb-2">
              以下食物疑似过敏，建议回避 2 周后进行回避触发实验
            </p>
            <div className="space-y-2">
              {retestReminders.map((rem, i) => (
                <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getFoodEmoji(rem.foodId)}</span>
                    <span className="text-sm font-medium text-amber-900">{rem.foodName}</span>
                  </div>
                  <div className="text-right">
                    {rem.isOverdue ? (
                      <div>
                        <div className="text-xs text-orange-600 font-medium">
                          可以开始实验
                        </div>
                        <div className="text-xs text-amber-500">
                          超期 {-rem.daysUntilRetest} 天
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-amber-700">
                          {rem.retestDate}
                        </div>
                        <div className="text-xs text-amber-500">
                          还有 {rem.daysUntilRetest} 天
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
              <span className="flex-shrink-0">ℹ️</span>
              <span>
                实验方法：从极少量（如 1/8 勺）开始添加，观察 2-4 小时。若再次出现过敏症状，确认为过敏，建议回避 1-2 个月后再试；若安全，可纳入常规食谱。
              </span>
            </p>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { key: 'total', label: '总记录', value: stats.total, color: 'bg-orange-50 text-orange-700' },
              { key: 'safe', label: '不过敏', value: stats.safe, color: 'bg-green-50 text-green-700' },
              { key: 'observing', label: '排敏中', value: stats.observing, color: 'bg-yellow-50 text-yellow-700' },
              { key: 'suspected', label: '疑似', value: stats.suspected, color: 'bg-amber-50 text-amber-700' },
              { key: 'allergic', label: '过敏源', value: stats.allergic, color: 'bg-red-50 text-red-700' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => handleStatClick(item.key)}
                className={`p-2 rounded-xl text-center transition-all ${
                  statFilter === item.key ? 'ring-2 ring-orange-300' : ''
                } ${item.color}`}
              >
                <div className="text-xl font-bold">{item.value}</div>
                <div className="text-xs mt-0.5">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 周日历 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 mb-3">本周记录</h3>
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((d, i) => {
              const dateRecords = getRecordsByDate(d);
              const hasRecord = dateRecords.length > 0;
              const hasAllergic = dateRecords.some(r => r.reaction === 'allergic');
              const hasSuspected = dateRecords.some(r => r.reaction === 'suspected');
              const hasObserving = dateRecords.some(r => r.reaction === 'observing');
              const isSelected = d === selectedDate;
              const dayNum = Number(d.split('-')[2]);

              return (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(d); setStatFilter(null); setShowAllRecords(false); }}
                  className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-orange-400 text-white shadow-md'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-amber-400'}`}>
                    周{weekDayNames[i]}
                  </span>
                  <span className="text-base font-bold mt-0.5">{dayNum}</span>
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {hasAllergic ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-red-400'}`} />
                    ) : hasSuspected ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`} />
                    ) : hasObserving ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-yellow-400'}`} />
                    ) : hasRecord ? (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`} />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 选中日期的记录 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 mb-3">
            {formatFriendlyDate(selectedDate)}的辅食记录
          </h3>

          {records.length === 0 ? (
            <div className="text-center py-6 text-amber-400">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm">暂无记录，点击底部按钮添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mealGroups.map(mealType => {
                const mealRecords = records.filter(r => r.meal === mealType);
                if (mealRecords.length === 0) return null;
                return (
                  <div key={mealType}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span>{mealIcons[mealType]}</span>
                      <span className="text-sm font-medium text-amber-700">{mealNames[mealType]}</span>
                    </div>
                    <div className="space-y-1.5 ml-5">
                      {mealRecords.map(rec => {
                        const allergenStatus = getFoodAllergenStatus(rec.foodId);
                        const sLabel = allergenStatus ? statusLabel(allergenStatus) : '';
                        return (
                          <button
                            key={rec.id}
                            onClick={() => handleAddRecord({ id: rec.foodId, name: rec.foodName })}
                            className="w-full flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 hover:bg-amber-100 transition-colors"
                          >
                            <span className="text-base">{getFoodEmoji(rec.foodId)}</span>
                            <span className="text-sm font-medium text-amber-900">{rec.foodName}</span>
                            {sLabel && allergenStatus && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: statusColor(allergenStatus) }}
                              >
                                {sLabel}
                              </span>
                            )}
                            <span className="text-xs text-amber-400">
                              D{rec.dayCount.replace('day', '')}
                            </span>
                            {rec.note && (
                              <span className="text-xs text-amber-300 truncate max-w-[80px]">
                                {rec.note}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 食物排敏总览 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 mb-3">食物排敏总览</h3>
          <div className="space-y-2">
            {categoryStats.map(cat => (
              <button
                key={cat.id}
                onClick={() => onNavigateCategory(cat.id)}
                className="w-full flex items-center justify-between bg-amber-50 rounded-xl px-3 py-3 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="font-medium text-amber-900">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    ✓{cat.safe}
                  </span>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                    ◎{cat.observing}
                  </span>
                  {cat.suspected > 0 && (
                    <span className="text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      ?{cat.suspected}
                    </span>
                  )}
                  <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                    ✕{cat.allergic}
                  </span>
                  <span className="text-amber-300 text-lg">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 悬浮添加记录按钮（固定在底部 tab bar 上方） */}
      <button
        onClick={() => handleAddRecord()}
        className="fixed right-5 z-[45] flex items-center gap-1.5 bg-orange-400 text-white rounded-full shadow-lg shadow-orange-200 px-4 py-3 font-medium text-sm active:bg-orange-500 active:scale-95 transition-all"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <span className="text-lg">＋</span>
        <span>添加记录</span>
      </button>

      {/* 记录面板 */}
      <RecordPanel
        visible={showPanel}
        defaultDate={selectedDate}
        prefillFood={prefillFood}
        onClose={() => { setShowPanel(false); setPrefillFood(null); }}
        onSaved={refreshData}
      />

      {/* ============ 所有排敏记录浮层 ============ */}
      {showAllRecords && allRecordsData && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => setShowAllRecords(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[60] bg-white rounded-t-2xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-amber-100">
              <h2 className="text-lg font-bold text-amber-900">所有排敏记录</h2>
              <button onClick={() => setShowAllRecords(false)} className="text-gray-400 text-2xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              <p className="text-xs text-amber-400 mb-2">
                共 {allRecordsData.total} 种食物已记录
              </p>

              {(() => {
                const grouped = {
                  safe: allRecordsData.foods.filter(f => f.status === 'safe'),
                  suspected: allRecordsData.foods.filter(f => f.status === 'suspected'),
                  observing: allRecordsData.foods.filter(f => f.status === 'observing'),
                  allergic: allRecordsData.foods.filter(f => f.status === 'allergic'),
                };
                const sections = [
                  { key: 'safe', label: '排敏完成（不过敏）', foods: grouped.safe, color: '#7BC67E' },
                  { key: 'suspected', label: '疑似过敏（待回避触发实验）', foods: grouped.suspected, color: '#F59E0B' },
                  { key: 'observing', label: '排敏中', foods: grouped.observing, color: '#FFB347' },
                  { key: 'allergic', label: '过敏', foods: grouped.allergic, color: '#FF6B6B' },
                ];

                return sections.map(section => {
                  if (section.foods.length === 0) return null;
                  return (
                    <div key={section.key} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: section.color }}
                        />
                        <span className="text-sm font-bold text-amber-800">
                          {section.label}
                          <span className="text-xs text-amber-400 ml-1">({section.foods.length})</span>
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {section.foods
                          .sort((a, b) => b.days - a.days || b.eatCount - a.eatCount)
                          .map((food, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{food.emoji}</span>
                                <span className="text-sm font-medium text-amber-900">{food.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {food.days > 0 && (
                                  <span className="text-xs text-amber-400">
                                    {food.days}天
                                  </span>
                                )}
                                {food.eatCount > 0 && (
                                  <span className="text-xs text-amber-400">×{food.eatCount}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                });
              })()}

              {allRecordsData.total === 0 && (
                <div className="text-center py-8 text-amber-400">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-sm">暂无排敏记录</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
