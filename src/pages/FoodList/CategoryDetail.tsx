// ============================
// 分类详情页
// ============================

import React from 'react';
import { foodCategories } from '../../config/foodConfig';
import { getFoodLatestReaction, getFoodEatCount } from '../../store';
import { REACTION_OPTIONS } from '../../types';

interface CategoryDetailProps {
  categoryId: string;
  onBack: () => void;
}

const CategoryDetail: React.FC<CategoryDetailProps> = ({ categoryId, onBack }) => {
  const category = foodCategories.find(c => c.id === categoryId);

  if (!category) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <p className="text-amber-400">分类未找到</p>
      </div>
    );
  }

  // 统计
  let safeCount = 0, observingCount = 0, allergicCount = 0;
  const foods = category.foods.map(food => {
    const reaction = getFoodLatestReaction(food.id);
    const eatCount = getFoodEatCount(food.id);
    if (reaction === 'safe') safeCount++;
    else if (reaction === 'observing') observingCount++;
    else if (reaction === 'allergic') allergicCount++;
    return { ...food, reaction, eatCount };
  }).sort((a, b) => {
    // 有记录的在前，按次数排序
    if (a.eatCount === 0 && b.eatCount === 0) return 0;
    if (a.eatCount === 0) return 1;
    if (b.eatCount === 0) return -1;
    return b.eatCount - a.eatCount;
  });

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-20">
      {/* 顶部 */}
      <div className="bg-gradient-to-b from-orange-100 to-[#FFF8F0] px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-700"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span>
            <h1 className="text-xl font-bold text-amber-900">{category.name}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* 统计 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="text-green-600">安全 <b>{safeCount}</b>种</span>
            <span className="text-yellow-600">观察 <b>{observingCount}</b>种</span>
            <span className="text-red-600">过敏 <b>{allergicCount}</b>种</span>
            <span className="text-amber-400">未排敏 <b>{foods.length - safeCount - observingCount - allergicCount}</b>种</span>
          </div>
        </div>

        {/* 食物列表 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="space-y-2">
            {foods.map(food => {
              const reactionOpt = REACTION_OPTIONS.find(o => o.value === food.reaction);
              return (
                <div
                  key={food.id}
                  className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{food.emoji}</span>
                    <span className="font-medium text-amber-900">{food.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      food.allergenLevel === 'high' ? 'bg-red-50 text-red-500' :
                      food.allergenLevel === 'medium' ? 'bg-yellow-50 text-yellow-500' :
                      'bg-green-50 text-green-500'
                    }`}>
                      {food.allergenLevel === 'low' ? '低敏' : food.allergenLevel === 'medium' ? '中敏' : '高敏'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {reactionOpt ? (
                      <>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: reactionOpt.color }}
                        >
                          {reactionOpt.label}
                        </span>
                        <span className="text-sm text-amber-400">×{food.eatCount}</span>
                      </>
                    ) : (
                      <span className="text-xs text-amber-300">未食用</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;
