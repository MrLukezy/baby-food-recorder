// ============================
// 辅食记录面板（底部弹出）
// ============================

import React, { useState, useEffect, useRef } from 'react';
import type { FoodRecord, MealType, ReactionType, DayCount } from '../../types';
import { MEAL_OPTIONS, REACTION_OPTIONS, DAY_OPTIONS } from '../../types';
import { searchFoods } from '../../config/foodConfig';
import { addRecord, generateId } from '../../store';
import { today } from '../../utils/date';

interface RecordPanelProps {
  visible: boolean;
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

const RecordPanel: React.FC<RecordPanelProps> = ({ visible, defaultDate, onClose, onSaved }) => {
  const [date, setDate] = useState(defaultDate || today());
  const [meal, setMeal] = useState<MealType>('lunch');
  const [foodQuery, setFoodQuery] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [selectedFoodName, setSelectedFoodName] = useState('');
  const [reaction, setReaction] = useState<ReactionType>('safe');
  const [dayCount, setDayCount] = useState<DayCount>('day1');
  const [note, setNote] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchFoods>>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultDate) setDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    if (foodQuery.trim().length > 0) {
      setSearchResults(searchFoods(foodQuery));
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [foodQuery]);

  // 点击外部关闭搜索
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const resetForm = () => {
    setDate(defaultDate || today());
    setMeal('lunch');
    setFoodQuery('');
    setSelectedFoodId('');
    setSelectedFoodName('');
    setReaction('safe');
    setDayCount('day1');
    setNote('');
    setShowSearch(false);
  };

  const handleSelectFood = (food: { id: string; name: string }) => {
    setSelectedFoodId(food.id);
    setSelectedFoodName(food.name);
    setFoodQuery(food.name);
    setShowSearch(false);
  };

  const handleSave = () => {
    if (!selectedFoodName.trim()) {
      alert('请选择或输入食物名称');
      return;
    }

    const record: FoodRecord = {
      id: generateId(),
      date,
      meal,
      foodId: selectedFoodId || 'custom_' + Date.now(),
      foodName: selectedFoodName.trim(),
      reaction,
      dayCount,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    addRecord(record);
    resetForm();
    onSaved();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={handleCancel} />

      {/* 面板 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* 拖拽条 */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-amber-900">记录新食材</h2>
            <button onClick={handleCancel} className="text-gray-400 text-2xl">✕</button>
          </div>

          {/* 日期 */}
          <div className="mb-4">
            <label className="text-sm text-amber-800 font-medium mb-1 block">日期</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900"
            />
          </div>

          {/* 餐点 */}
          <div className="mb-4">
            <label className="text-sm text-amber-800 font-medium mb-1 block">餐点</label>
            <div className="flex gap-2">
              {MEAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMeal(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    meal === opt.value
                      ? 'bg-orange-400 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 食物选择 */}
          <div className="mb-4 relative" ref={searchRef}>
            <label className="text-sm text-amber-800 font-medium mb-1 block">食物</label>
            <input
              type="text"
              value={foodQuery}
              onChange={e => {
                setFoodQuery(e.target.value);
                if (e.target.value !== selectedFoodName) {
                  setSelectedFoodId('');
                  setSelectedFoodName('');
                }
              }}
              placeholder="搜索或输入食物名称..."
              className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 placeholder-amber-300"
            />
            {showSearch && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-amber-200 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10">
                {searchResults.map(food => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-50 border-b border-amber-100 last:border-0"
                  >
                    <span className="text-amber-900">{food.categoryIcon} {food.name}</span>
                    <span className="text-xs text-amber-400 ml-2">({food.categoryName})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 排敏反应 */}
          <div className="mb-4">
            <label className="text-sm text-amber-800 font-medium mb-1 block">排敏反应</label>
            <div className="flex gap-2">
              {REACTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReaction(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                    reaction === opt.value
                      ? 'text-white border-transparent'
                      : 'bg-white text-amber-700 border-amber-200'
                  }`}
                  style={reaction === opt.value ? { backgroundColor: opt.color } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 天数 */}
          <div className="mb-4">
            <label className="text-sm text-amber-800 font-medium mb-1 block">排敏天数</label>
            <div className="flex gap-2">
              {DAY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDayCount(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    dayCount === opt.value
                      ? 'bg-orange-400 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 备注 */}
          <div className="mb-6">
            <label className="text-sm text-amber-800 font-medium mb-1 block">备注</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="可选，记录宝宝的反应..."
              rows={2}
              className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 placeholder-amber-300 resize-none"
            />
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl text-amber-600 bg-amber-50 border border-amber-200 font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl text-white bg-orange-400 font-medium active:bg-orange-500"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecordPanel;
