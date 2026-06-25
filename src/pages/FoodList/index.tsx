// ============================
// 食物 Tab
// ============================

import { useState, useCallback } from 'react';
import { REACTION_OPTIONS } from '../../types';
import { getRecords, getPresetAllergens, getFoodLatestReaction, getFoodEatCount } from '../../store';
import { foodCategories, getAllFoods } from '../../config/foodConfig';
import RecordPanel from '../../components/RecordPanel';
import { today } from '../../utils/date';

interface FoodListProps {
  onNavigateCategory: (categoryId: string) => void;
}

const FoodList: React.FC<FoodListProps> = ({ onNavigateCategory }) => {
  const [, setRefresh] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  const forceRefresh = useCallback(() => setRefresh(n => n + 1), []);

  const allRecords = getRecords();
  const presets = getPresetAllergens();

  // 已出现过的食物 ID 集合
  const appearedFoodIds = new Set([
    ...allRecords.map(r => r.foodId),
    ...presets,
  ]);

  const allFoods = getAllFoods();

  // 未排敏的食物
  const untestedFoods = allFoods
    .filter(f => !appearedFoodIds.has(f.id))
    .filter(f => !searchQuery || f.name.includes(searchQuery))
    .sort((a, b) => parseInt(a.recommendedAge) - parseInt(b.recommendedAge));

  // 已排敏的食物（按食用次数排序）
  const testedFoods = allFoods
    .filter(f => appearedFoodIds.has(f.id))
    .filter(f => !searchQuery || f.name.includes(searchQuery))
    .map(f => ({
      ...f,
      eatCount: getFoodEatCount(f.id) + (presets.includes(f.id) ? 1 : 0),
      reaction: getFoodLatestReaction(f.id),
    }))
    .sort((a, b) => b.eatCount - a.eatCount);

  const handleFoodClick = (_foodId: string, _foodName: string) => {
    setShowPanel(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-20">
      {/* 标题 */}
      <div className="bg-gradient-to-b from-orange-100 to-[#FFF8F0] px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold text-amber-900">🍎 食物</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* 搜索 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 搜索食物..."
            className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-amber-900 placeholder-amber-300 shadow-sm"
          />
        </div>

        {/* 未排敏食物 */}
        {untestedFoods.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-amber-800">尚未排敏的食物</span>
              <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                {untestedFoods.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {untestedFoods.slice(0, 20).map(food => (
                <button
                  key={food.id}
                  onClick={() => handleFoodClick(food.id, food.name)}
                  className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2.5 hover:bg-amber-100 transition-colors text-left"
                >
                  <span className="text-base">{food.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-amber-900">{food.name}</div>
                    <div className="text-xs text-amber-400">
                      {food.allergenLevel === 'low' ? '低敏' : food.allergenLevel === 'medium' ? '中敏' : '高敏'}
                      {' '}{food.recommendedAge}月
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {untestedFoods.length > 20 && (
              <p className="text-xs text-amber-400 text-center mt-2">
                还有 {untestedFoods.length - 20} 种，使用搜索查找
              </p>
            )}
          </div>
        )}

        {/* 分类快捷入口 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 mb-3">食物分类</h3>
          <div className="grid grid-cols-4 gap-2">
            {foodCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onNavigateCategory(cat.id)}
                className="flex flex-col items-center bg-amber-50 rounded-xl py-3 hover:bg-amber-100 transition-colors"
              >
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs text-amber-700 font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 全部食物（按食用次数排序） */}
        {testedFoods.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-amber-800 mb-3">
              已食用食物
              <span className="text-xs text-amber-400 ml-2">按食用次数排序</span>
            </h3>
            <div className="space-y-2">
              {testedFoods.map(food => {
                const reactionOpt = REACTION_OPTIONS.find(o => o.value === food.reaction);
                return (
                  <button
                    key={food.id}
                    onClick={() => handleFoodClick(food.id, food.name)}
                    className="w-full flex items-center justify-between bg-amber-50 rounded-xl px-3 py-3 hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{food.emoji}</span>
                      <span className="font-medium text-amber-900">{food.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {reactionOpt && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: reactionOpt.color }}
                        >
                          {reactionOpt.label}
                        </span>
                      )}
                      <span className="text-sm text-amber-400">×{food.eatCount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 记录面板 */}
      <RecordPanel
        visible={showPanel}
        defaultDate={today()}
        onClose={() => setShowPanel(false)}
        onSaved={forceRefresh}
      />
    </div>
  );
};

export default FoodList;
