// ============================
// 食物 Tab
// ============================

import { useState, useCallback } from 'react';
import { REACTION_OPTIONS } from '../../types';
import { getRecords, getPresetAllergens, getFoodAllergenStatus, getFoodEatCount } from '../../store';
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
  const [prefillFood, setPrefillFood] = useState<{ id: string; name: string } | null>(null);
  const [listTab, setListTab] = useState<'tested' | 'untested'>('tested');

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
    .sort((a, b) => {
      // 先按致敏等级排序（低→中→高），再按月龄
      const levelOrder = { low: 0, medium: 1, high: 2 };
      const levelDiff = levelOrder[a.allergenLevel] - levelOrder[b.allergenLevel];
      if (levelDiff !== 0) return levelDiff;
      return parseInt(a.recommendedAge) - parseInt(b.recommendedAge);
    });

  // 已排敏的食物（使用新排敏状态）
  const testedFoods = allFoods
    .filter(f => appearedFoodIds.has(f.id))
    .filter(f => !searchQuery || f.name.includes(searchQuery))
    .map(f => {
      const recordDays = new Set(allRecords.filter(r => r.foodId === f.id).map(r => r.date)).size;
      // 预设食物无记录时显示为 3 天（排敏完成）
      const daysTested = recordDays > 0 ? recordDays : (presets.includes(f.id) ? 3 : 0);
      return {
        ...f,
        eatCount: getFoodEatCount(f.id) + (presets.includes(f.id) ? 1 : 0),
        allergenStatus: getFoodAllergenStatus(f.id),
        daysTested,
      };
    })
    .sort((a, b) => b.eatCount - a.eatCount);

  const handleFoodClick = (foodId: string, foodName: string) => {
    setPrefillFood({ id: foodId, name: foodName });
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

        {/* Tab 切换 */}
        <div className="flex gap-2">
          <button
            onClick={() => setListTab('tested')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              listTab === 'tested'
                ? 'bg-orange-400 text-white'
                : 'bg-white text-amber-700 border border-amber-200'
            }`}
          >
            已食用 ({testedFoods.length})
          </button>
          <button
            onClick={() => setListTab('untested')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              listTab === 'untested'
                ? 'bg-orange-400 text-white'
                : 'bg-white text-amber-700 border border-amber-200'
            }`}
          >
            未排敏 ({untestedFoods.length})
          </button>
        </div>

        {/* 已食用食物列表 */}
        {listTab === 'tested' && testedFoods.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-amber-800 mb-3">
              已食用食物
              <span className="text-xs text-amber-400 ml-2">3天排敏即完成</span>
            </h3>
            <div className="space-y-2">
              {testedFoods.map(food => {
                const reactionOpt = REACTION_OPTIONS.find(o => o.value === food.allergenStatus);
                // 状态标签：3天完成 → 不过敏；< 3天 → 排敏中；过敏 → 过敏
                const statusLabel = food.allergenStatus === 'safe'
                  ? '已排敏 ✓'
                  : food.allergenStatus === 'observing'
                    ? `排敏中 ${food.daysTested}/3天`
                    : food.allergenStatus === 'suspected'
                      ? '疑似过敏 ?'
                      : food.allergenStatus === 'allergic'
                        ? '过敏 ✕'
                        : '';

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
                      {/* 排敏天数进度 */}
                      {food.allergenStatus === 'observing' && (
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map(d => (
                            <span
                              key={d}
                              className={`w-2 h-2 rounded-full ${
                                d <= food.daysTested ? 'bg-yellow-400' : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {food.allergenStatus && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: reactionOpt?.color }}
                        >
                          {statusLabel}
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

        {listTab === 'tested' && testedFoods.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-amber-400">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-sm">还没有食用记录，添加后在这里查看</p>
          </div>
        )}

        {/* 未排敏食物 */}
        {listTab === 'untested' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-amber-800">尚未排敏的食物</span>
              <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                {untestedFoods.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {untestedFoods.slice(0, 30).map(food => (
                <button
                  key={food.id}
                  onClick={() => handleFoodClick(food.id, food.name)}
                  className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2.5 hover:bg-amber-100 transition-colors text-left"
                >
                  <span className="text-base">{food.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-amber-900">{food.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-xs px-1 py-0.5 rounded ${
                        food.allergenLevel === 'high' ? 'bg-red-50 text-red-500' :
                        food.allergenLevel === 'medium' ? 'bg-yellow-50 text-yellow-500' :
                        'bg-green-50 text-green-500'
                      }`}>
                        {food.allergenLevel === 'low' ? '低敏' : food.allergenLevel === 'medium' ? '中敏' : '高敏'}
                      </span>
                      <span className="text-xs text-amber-400">{food.recommendedAge}月</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {untestedFoods.length > 30 && (
              <p className="text-xs text-amber-400 text-center mt-2">
                还有 {untestedFoods.length - 30} 种，使用搜索查找
              </p>
            )}
          </div>
        )}
      </div>

      {/* 记录面板 */}
      <RecordPanel
        visible={showPanel}
        defaultDate={today()}
        prefillFood={prefillFood}
        onClose={() => { setShowPanel(false); setPrefillFood(null); }}
        onSaved={forceRefresh}
      />
    </div>
  );
};

export default FoodList;
