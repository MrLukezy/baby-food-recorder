// ============================
// 引导页 - 选择已排敏食物
// ============================

import React, { useState } from 'react';
import { foodCategories } from '../../config/foodConfig';
import { savePresetAllergens } from '../../store';

interface SelectFoodsProps {
  onBack: () => void;
  onDone: () => void;
}

const SelectFoods: React.FC<SelectFoodsProps> = ({ onBack, onDone }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['vegetable', 'fruit']));

  const toggleFood = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCat = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const toggleAllInCat = (foods: { id: string }[]) => {
    const allSelected = foods.every(f => selectedIds.has(f.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        foods.forEach(f => next.delete(f.id));
      } else {
        foods.forEach(f => next.add(f.id));
      }
      return next;
    });
  };

  const handleDone = () => {
    savePresetAllergens(Array.from(selectedIds));
    onDone();
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-[#FFF8F0]/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-amber-100">
        <button onClick={onBack} className="text-amber-700 text-sm font-medium">
          ← 返回
        </button>
        <span className="text-sm text-amber-500">
          已选 {selectedIds.size} 种
        </span>
      </div>

      {/* 说明 */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold text-amber-900">选择已排敏的食物</h2>
        <p className="text-sm text-amber-600 mt-1">勾选宝宝已经吃过且没有过敏反应的食物</p>
      </div>

      {/* 食物分类列表 */}
      <div className="px-4 space-y-3">
        {foodCategories.map(cat => {
          const isExpanded = expandedCats.has(cat.id);
          const selectedInCat = cat.foods.filter(f => selectedIds.has(f.id)).length;
          const allSelected = cat.foods.every(f => selectedIds.has(f.id));

          return (
            <div key={cat.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
              {/* 分类标题 */}
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-bold text-amber-900">{cat.name}</span>
                  {selectedInCat > 0 && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                      {selectedInCat}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleAllInCat(cat.foods);
                    }}
                    className="text-xs text-orange-400 font-medium"
                  >
                    {allSelected ? '取消全选' : '全选'}
                  </button>
                  <span className="text-amber-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* 食物网格 */}
              {isExpanded && (
                <div className="px-3 pb-3 grid grid-cols-3 gap-2">
                  {cat.foods.map(food => {
                    const isSelected = selectedIds.has(food.id);
                    return (
                      <button
                        key={food.id}
                        onClick={() => toggleFood(food.id)}
                        className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : 'bg-amber-50 text-amber-700 border-2 border-transparent'
                        }`}
                      >
                        {isSelected && <span className="mr-0.5">✓</span>}
                        <span className="mr-0.5">{food.emoji}</span>{food.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部保存按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 px-5 py-3 z-20">
        <button
          onClick={handleDone}
          className="w-full py-3 rounded-xl bg-orange-400 text-white font-bold text-lg active:bg-orange-500 shadow-lg shadow-orange-200"
        >
          保存并开始使用 ✓
        </button>
      </div>
    </div>
  );
};

export default SelectFoods;
