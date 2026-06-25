// ============================
// 辅食记录面板（底部弹出）
// ============================

import React, { useState, useEffect, useRef } from 'react';
import type { FoodRecord, MealType, ReactionType, DayCount } from '../../types';
import { MEAL_OPTIONS, REACTION_OPTIONS, DAY_OPTIONS } from '../../types';
import { searchFoods, getAllFoods } from '../../config/foodConfig';
import { addRecord, generateId, getObservingFoods, getSuspectedRetestDate, getFoodAllergenStatus } from '../../store';
import { today } from '../../utils/date';

interface RecordPanelProps {
  visible: boolean;
  defaultDate?: string;
  prefillFood?: { id: string; name: string } | null;
  onClose: () => void;
  onSaved: () => void;
}

const RecordPanel: React.FC<RecordPanelProps> = ({ visible, defaultDate, prefillFood, onClose, onSaved }) => {
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
  const [warningMsg, setWarningMsg] = useState('');
  const [reactionHint, setReactionHint] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultDate) setDate(defaultDate);
  }, [defaultDate]);

  // 预填食物（从食物列表点击跳转时）
  useEffect(() => {
    if (prefillFood && visible) {
      setSelectedFoodId(prefillFood.id);
      setSelectedFoodName(prefillFood.name);
      setFoodQuery(prefillFood.name);

      // 自动检测食物已有的排敏状态，设置合适的默认天数
      const status = getFoodAllergenStatus(prefillFood.id);
      if (status === 'safe') {
        setDayCount('day3');
        setReaction('safe');
      } else if (status === 'observing') {
        // 根据已有记录天数设置
        setReaction('observing');
      } else if (status === 'suspected') {
        setReaction('suspected');
      }
    }
  }, [prefillFood, visible]);

  useEffect(() => {
    if (foodQuery.trim().length > 0) {
      setSearchResults(searchFoods(foodQuery));
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  }, [foodQuery]);

  // 食物选中时自动检测排敏状态
  useEffect(() => {
    setWarningMsg('');
    setReactionHint('');
    if (!selectedFoodId) return;

    const allFoods = getAllFoods();
    const foodInfo = allFoods.find(f => f.id === selectedFoodId);

    // 高敏食物额外提醒
    if (foodInfo?.allergenLevel === 'high') {
      setWarningMsg(`⚠️ ${selectedFoodName} 属于高敏食物，建议格外注意观察宝宝反应`);
    }

    // 如果有疑似过敏记录，显示回避触发实验日期
    const retestDate = getSuspectedRetestDate(selectedFoodId);
    if (retestDate) {
      const todayDate = today();
      const isOverdue = retestDate <= todayDate;
      if (isOverdue) {
        setReactionHint(`🔔 ${selectedFoodName} 可以进行回避触发实验了！从极少量开始添加。`);
      } else {
        setReactionHint(`⏰ ${selectedFoodName} 疑似过敏，建议 ${retestDate} 后进行回避触发实验`);
      }
    }
  }, [selectedFoodId, selectedFoodName]);

  // 选择疑似过敏反应时显示说明
  useEffect(() => {
    if (reaction === 'suspected') {
      setReactionHint(
        '💡 "疑似过敏"表示宝宝可能出现了轻微过敏症状（如轻微皮疹、轻微腹泻等），' +
        '但不确定是否是该食物导致。\n' +
        '建议：回避该食物 2 周，然后从极少量开始做回避触发实验。'
      );
    }
  }, [reaction]);

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
    setWarningMsg('');
    setReactionHint('');
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

    // 同时排敏检测
    const observingFoods = getObservingFoods();
    const isAlreadyObservingThis = observingFoods.some(f => f.foodId === selectedFoodId);

    if (!isAlreadyObservingThis && observingFoods.length > 0 && reaction !== 'suspected' && reaction !== 'allergic') {
      const names = observingFoods.map(f => f.foodName).join('、');
      const confirmed = window.confirm(
        `💡 排敏提醒\n\n` +
        `当前已有食物正在排敏中：\n${names}\n\n` +
        `不建议同时排敏两种食物，这样无法判断过敏源。\n` +
        `建议等当前食物排敏完成（连续3天）后再引入新食物。\n\n` +
        `确定要继续添加吗？`
      );
      if (!confirmed) return;
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
      <div className="fixed inset-0 bg-black/40 z-[55]" onClick={handleCancel} />

      {/* 面板 */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* 拖拽条 */}
        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 标题 */}
        <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-amber-900">记录新食材</h2>
          <button onClick={handleCancel} className="text-gray-400 text-2xl">✕</button>
        </div>

        {/* 可滚动内容 */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* 警告信息 */}
          {warningMsg && (
            <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <span className="text-sm flex-shrink-0">⚠️</span>
              <p className="text-xs text-yellow-700 leading-relaxed">{warningMsg}</p>
            </div>
          )}

          {/* 反应提示（回避触发实验等） */}
          {reactionHint && (
            <div className="mb-3 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-orange-700 leading-relaxed whitespace-pre-line">{reactionHint}</p>
            </div>
          )}

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
                    className="w-full text-left px-4 py-2.5 hover:bg-amber-50 border-b border-amber-100 last:border-0 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-amber-900">{food.categoryIcon} {food.name}</span>
                      <span className="text-xs text-amber-400 ml-2">({food.categoryName})</span>
                    </div>
                    {food.allergenLevel === 'high' && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-500 rounded">高敏</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 排敏反应 */}
          <div className="mb-4">
            <label className="text-sm text-amber-800 font-medium mb-1 block">排敏反应</label>
            <div className="grid grid-cols-2 gap-2">
              {REACTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReaction(opt.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-colors border ${
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
            <p className="text-xs text-amber-400 mt-2">
              {reaction === 'suspected' && '可能出现轻微过敏症状，建议回避 2 周后做回避触发实验'}
              {reaction === 'allergic' && '确认过敏，建议回避 1-2 个月再从微量开始重试'}
              {reaction === 'observing' && '正常排敏观察中，注意观察 2-4 小时'}
              {reaction === 'safe' && '无明显不良反应，继续观察'}
            </p>
          </div>

          {/* 排敏天数 */}
          <div className="mb-4">
            <label className="text-sm text-amber-800 font-medium mb-1 block">排敏天数</label>
            <p className="text-xs text-amber-400 mb-2">连续 3 天无不良反应即为排敏完成</p>
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
          <div className="mb-2">
            <label className="text-sm text-amber-800 font-medium mb-1 block">备注</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="可选，记录宝宝的反应（如：口周小红疹、精神好等）..."
              rows={2}
              className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 placeholder-amber-300 resize-none"
            />
          </div>
        </div>

        {/* 按钮组 - 固定底部 */}
        <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-amber-100 bg-white">
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
