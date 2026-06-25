// ============================
// 首页 Tab
// ============================

import React, { useState, useEffect, useCallback } from 'react';
import type { BabyProfile, FoodRecord } from '../../types';
import { REACTION_OPTIONS } from '../../types';
import { getRecords, getStats, getRecordsByDate } from '../../store';
import { foodCategories, getFoodEmoji } from '../../config/foodConfig';
import { today, getWeekDates, formatFriendlyDate, getMonthAge } from '../../utils/date';
import RecordPanel from '../../components/RecordPanel';

interface HomeProps {
  profile: BabyProfile;
  onNavigateCategory: (categoryId: string) => void;
}

const Home: React.FC<HomeProps> = ({ profile, onNavigateCategory }) => {
  const [selectedDate, setSelectedDate] = useState(today());
  const [records, setRecords] = useState<FoodRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, safe: 0, observing: 0, allergic: 0 });
  const [showPanel, setShowPanel] = useState(false);
  const [statFilter, setStatFilter] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    setRecords(getRecordsByDate(selectedDate));
    setStats(getStats());
  }, [selectedDate]);

  useEffect(refreshData, [refreshData]);

  const weekDates = getWeekDates(new Date());
  const age = getMonthAge(profile.birthday);
  const weekDayNames = ['一', '二', '三', '四', '五', '六', '日'];

  // 按分类统计
  const categoryStats = foodCategories.map(cat => {
    const allRecs = getRecords();
    const foodReactions = new Map<string, string>();
    for (const food of cat.foods) {
      const foodRecs = allRecs
        .filter(r => r.foodId === food.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (foodRecs.length > 0) {
        foodReactions.set(food.id, foodRecs[0].reaction);
      }
    }
    let safe = 0, observing = 0, allergic = 0;
    for (const reaction of foodReactions.values()) {
      if (reaction === 'safe') safe++;
      else if (reaction === 'observing') observing++;
      else if (reaction === 'allergic') allergic++;
    }
    return { ...cat, safe, observing, allergic, total: foodReactions.size };
  });

  // 按日期筛选记录（用于统计弹窗）
  const filteredRecords = statFilter
    ? records.filter(r => r.reaction === statFilter || (statFilter === 'total'))
    : records;

  const mealGroups = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
  const mealIcons: Record<string, string> = {
    breakfast: '🌅', lunch: '☀️', snack: '🍪', dinner: '🌙',
  };
  const mealNames: Record<string, string> = {
    breakfast: '早餐', lunch: '午餐', snack: '下午加餐', dinner: '晚餐',
  };

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

        {/* 统计卡片 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'total', label: '总记录', value: stats.total, color: 'bg-orange-50 text-orange-700' },
              { key: 'safe', label: '不过敏', value: stats.safe, color: 'bg-green-50 text-green-700' },
              { key: 'observing', label: '观察中', value: stats.observing, color: 'bg-yellow-50 text-yellow-700' },
              { key: 'allergic', label: '过敏源', value: stats.allergic, color: 'bg-red-50 text-red-700' },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setStatFilter(statFilter === item.key ? null : item.key)}
                className={`p-2 rounded-xl text-center transition-all ${
                  statFilter === item.key ? 'ring-2 ring-orange-300' : ''
                } ${item.color}`}
              >
                <div className="text-2xl font-bold">{item.value}</div>
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
              const hasObserving = dateRecords.some(r => r.reaction === 'observing');
              const isSelected = d === selectedDate;
              const dayNum = Number(d.split('-')[2]);

              return (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(d); setStatFilter(null); }}
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

          {(statFilter ? filteredRecords : records).length === 0 ? (
            <div className="text-center py-6 text-amber-400">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm">暂无记录，点击下方按钮添加</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mealGroups.map(mealType => {
                const mealRecords = (statFilter ? filteredRecords : records).filter(r => r.meal === mealType);
                if (mealRecords.length === 0) return null;
                return (
                  <div key={mealType}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span>{mealIcons[mealType]}</span>
                      <span className="text-sm font-medium text-amber-700">{mealNames[mealType]}</span>
                    </div>
                    <div className="space-y-1.5 ml-5">
                      {mealRecords.map(rec => {
                        const reactionOpt = REACTION_OPTIONS.find(o => o.value === rec.reaction);
                        return (
                          <div
                            key={rec.id}
                            className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2"
                          >
                            <span className="text-base">{getFoodEmoji(rec.foodId)}</span>
                            <span className="text-sm font-medium text-amber-900">{rec.foodName}</span>
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: reactionOpt?.color }}
                            >
                              {reactionOpt?.label}
                            </span>
                            <span className="text-xs text-amber-400">
                              D{rec.dayCount.replace('day', '')}
                            </span>
                          </div>
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
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                    ✓{cat.safe}
                  </span>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">
                    ◎{cat.observing}
                  </span>
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

      {/* 底部添加记录按钮（横向） */}
      <div className="px-4 pb-24 pt-2">
        <button
          onClick={() => setShowPanel(true)}
          className="w-full py-3.5 bg-orange-400 text-white rounded-xl font-bold text-base active:bg-orange-500 shadow-md shadow-orange-200 flex items-center justify-center gap-2"
        >
          <span className="text-xl">＋</span> 添加记录
        </button>
      </div>

      {/* 记录面板 */}
      <RecordPanel
        visible={showPanel}
        defaultDate={selectedDate}
        onClose={() => setShowPanel(false)}
        onSaved={refreshData}
      />
    </div>
  );
};

export default Home;
