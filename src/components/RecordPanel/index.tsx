// ============================
// 辅食记录面板（底部弹出）- 支持新建/编辑/删除
// ============================

import React, { useState, useEffect, useRef } from 'react';
import type { MealType, ReactionType, DayCount } from '../../types';
import { MEAL_OPTIONS, REACTION_OPTIONS } from '../../types';
import { searchFoods, getAllFoods, getFoodById, foodCategories } from '../../config/foodConfig';
import { addRecord, updateRecord, deleteRecord, getRecords, generateId, getObservingFoods, getSuspectedRetestDate, getFoodAllergenStatus } from '../../store';

import { today } from '../../utils/date';

interface RecordPanelProps {
  visible: boolean;
  defaultDate?: string;
  prefillFood?: { id: string; name: string } | null;
  editRecordId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const RecordPanel: React.FC<RecordPanelProps> = ({ visible, defaultDate, prefillFood, editRecordId, onClose, onSaved }) => {
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [recordCategoryId, setRecordCategoryId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  // 判断是否为编辑模式：加载已有记录
  useEffect(() => {
    if (!visible) return;

    if (editRecordId) {
      const existing = getRecords().find(r => r.id === editRecordId);
      if (existing) {
        // 编辑模式：加载已有记录数据
        setDate(existing.date);
        setMeal(existing.meal);
        setSelectedFoodId(existing.foodId);
        setSelectedFoodName(existing.foodName);
        setFoodQuery(existing.foodName);
        setShowSearch(false);
        setReaction(existing.reaction);
        setDayCount(existing.dayCount);
        setNote(existing.note);
        // 加载分类ID
        const foodInfo = getFoodById(existing.foodId);
        setRecordCategoryId(existing.categoryId || foodInfo?.categoryId || '');
        setIsEditMode(true);
        return;
      }
    }

    // 非编辑模式：检查同日期+同食物是否已有记录
    if (prefillFood && defaultDate) {
      const existingRecord = getRecords().find(
        r => r.date === defaultDate && r.foodId === prefillFood.id
      );
      if (existingRecord) {
        // 同食物同日期，自动切换为编辑模式
        setDate(existingRecord.date);
        setMeal(existingRecord.meal);
        setSelectedFoodId(existingRecord.foodId);
        setSelectedFoodName(existingRecord.foodName);
        setFoodQuery(existingRecord.foodName);
        setShowSearch(false);
        setReaction(existingRecord.reaction);
        setDayCount(existingRecord.dayCount);
        setNote(existingRecord.note);
        const foodInfo = getFoodById(existingRecord.foodId);
        setRecordCategoryId(existingRecord.categoryId || foodInfo?.categoryId || '');
        setIsEditMode(true);
        return;
      }
    }

    // 新建模式
    setDate(defaultDate || today());
    setMeal('lunch');
    if (prefillFood) {
      setSelectedFoodId(prefillFood.id);
      setSelectedFoodName(prefillFood.name);
      setFoodQuery(prefillFood.name);
      setShowSearch(false);
      const status = getFoodAllergenStatus(prefillFood.id);
      if (status === 'safe') { setDayCount('day3'); setReaction('safe'); }
      else if (status === 'observing') { setReaction('observing'); }
      else if (status === 'suspected') { setReaction('suspected'); }
      else { setReaction('safe'); setDayCount('day1'); }
    }
    // 预填食物时自动设置分类
    if (prefillFood) {
      const foodInfo = getFoodById(prefillFood.id);
      if (foodInfo?.categoryId) {
        setRecordCategoryId(foodInfo.categoryId);
      } else {
        // 自定义食材从已有记录拿分类
        const existing = getRecords().find(r => r.foodId === prefillFood.id);
        if (existing?.categoryId) {
          setRecordCategoryId(existing.categoryId);
        }
      }
    }
    setIsEditMode(false);
  }, [visible, editRecordId, prefillFood, defaultDate]);

  useEffect(() => {
    const q = foodQuery.trim();
    if (q.length > 0) {
      const results = searchFoods(q);
      setSearchResults(results);
      // 如果未选中食物，尝试自动匹配：搜索列表里有一个完全匹配的食物名
      if (!selectedFoodId || foodQuery !== selectedFoodName) {
        const exactMatch = results.find(f => f.name === q);
        if (exactMatch) {
          // 自动选中
          setSelectedFoodId(exactMatch.id);
          setSelectedFoodName(exactMatch.name);
          const foodInfo = getFoodById(exactMatch.id);
          setRecordCategoryId(foodInfo?.categoryId || '');
          setShowSearch(false);
        } else {
          setShowSearch(true);
        }
      }
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
    // 注意：不要依赖 selectedFoodId/selectedFoodName，否则循环触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodQuery]);

  // 食物选中时自动检测排敏状态
  useEffect(() => {
    setWarningMsg('');
    setReactionHint('');
    if (!selectedFoodId) return;

    const allFoodsList = getAllFoods();
    const foodInfo = allFoodsList.find(f => f.id === selectedFoodId);

    if (foodInfo?.allergenLevel === 'high') {
      setWarningMsg(`⚠️ ${selectedFoodName} 属于高敏食物，建议格外注意观察宝宝反应`);
    }

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
    setRecordCategoryId('');
    setWarningMsg('');
    setReactionHint('');
    setIsEditMode(false);
  };

  const handleSelectFood = (food: { id: string; name: string }) => {
    setSelectedFoodId(food.id);
    setSelectedFoodName(food.name);
    setFoodQuery(food.name);
    setShowSearch(false);
    setReactionHint('');

    // 设置分类ID
    const foodInfo = getFoodById(food.id);
    setRecordCategoryId(foodInfo?.categoryId || '');

    // 切换食物时检查是否同日期已有该食物记录
    if (!editRecordId) {
      const currentDate = date || defaultDate || today();
      const existingRecord = getRecords().find(
        r => r.date === currentDate && r.foodId === food.id
      );
      if (existingRecord) {
        // 自动切换为编辑模式
        setMeal(existingRecord.meal);
        setReaction(existingRecord.reaction);
        setDayCount(existingRecord.dayCount);
        setNote(existingRecord.note);
        setIsEditMode(true);
      } else {
        // 新建模式，用户自由选择天数
        setReaction('safe');
        setDayCount('day1');
      }
    }
  };

  // ============ 保存 ============

  const handleSave = () => {
    // 使用 foodQuery 作为食物名称（支持输入自定义食材）
    const foodName = selectedFoodName.trim() || foodQuery.trim();
    if (!foodName) {
      alert('请选择或输入食物名称');
      return;
    }

    // 检查是否选择了分类，未选则默认为「其他」
    if (!recordCategoryId) {
      setRecordCategoryId('other');
    }

    // 同时排敏检测（仅新建时）
    if (!isEditMode) {
      const observingFoods = getObservingFoods();
      const isAlreadyObservingThis = observingFoods.some(f => f.foodId === selectedFoodId);

      if (!isAlreadyObservingThis && observingFoods.length > 0 && reaction !== 'suspected' && reaction !== 'allergic') {
        const names = observingFoods.map(f => f.foodName).join('、');
        const confirmed = window.confirm(
          `💡 排敏提醒\n\n` +
          `当前已有食物正在排敏中：\n${names}\n\n` +
          `不建议同时排敏两种食物，这样无法判断过敏源。\n` +
          `建议等当前食物排敏完成后再引入新食物。\n\n` +
          `确定要继续添加吗？`
        );
        if (!confirmed) return;
      }
    }

    const foodId = selectedFoodId || 'custom_' + Date.now();
    const saveCategoryId = recordCategoryId;

    // 编辑模式：更新已有记录
    if (editRecordId) {
      updateRecord(editRecordId, {
        date,
        meal,
        foodId,
        foodName: foodName,
        reaction,
        dayCount,
        note: note.trim(),
        categoryId: saveCategoryId,
      });
      resetForm();
      onSaved();
      onClose();
      return;
    }

    // 新建模式：检查是否已有同日期+同食物的记录，如存在则更新（去重）
    const existingRecord = getRecords().find(
      r => r.date === date && r.foodId === foodId
    );

    if (existingRecord) {
      // 更新已有记录
      updateRecord(existingRecord.id, {
        meal,
        foodName: foodName,
        reaction,
        dayCount,
        note: note.trim(),
        categoryId: saveCategoryId,
      });
    } else {
      // 新增记录
      addRecord({
        id: generateId(),
        date,
        meal,
        foodId,
        foodName: foodName,
        reaction,
        dayCount,
        note: note.trim(),
        createdAt: new Date().toISOString(),
        categoryId: saveCategoryId,
      });
    }

    resetForm();
    onSaved();
    onClose();
  };

  // ============ 删除 ============

  // 获取当前编辑的记录 ID（传入的 editRecordId 或自动匹配到的）
  const getCurrentEditId = (): string | null => {
    if (editRecordId) return editRecordId;
    if (selectedFoodId && date) {
      const existing = getRecords().find(
        r => r.date === date && r.foodId === selectedFoodId
      );
      return existing?.id || null;
    }
    return null;
  };

  const handleDelete = () => {
    const currentId = getCurrentEditId();
    if (!currentId) return;
    setDeleteConfirmId(currentId);
    setDeleteConfirmName(selectedFoodName);
  };

  // 确认删除记录
  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    deleteRecord(deleteConfirmId);
    // 如果正在编辑模式（isEditMode）或者删除的正是传入的编辑记录，关闭面板
    const shouldClosePanel = isEditMode || deleteConfirmId === editRecordId;
    setDeleteConfirmId(null);
    setDeleteConfirmName('');
    if (shouldClosePanel) {
      resetForm();
      onSaved();
      onClose();
    } else {
      setShowHistory(false);
      setTimeout(() => setShowHistory(true), 50);
      onSaved();
    }
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
          <h2 className="text-lg font-bold text-amber-900">
            {isEditMode ? '编辑食材记录' : '记录新食材'}
          </h2>
          <button onClick={handleCancel} className="text-gray-400 text-2xl">✕</button>
        </div>

        {/* 可滚动内容 */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* 编辑模式提示 */}
          {isEditMode && (
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-sm flex-shrink-0">✏️</span>
              <p className="text-xs text-blue-700">正在编辑已有记录，同一日期+同一食物只保留一条记录</p>
            </div>
          )}

          {/* 警告信息 */}
          {warningMsg && (
            <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2.5 flex items-start gap-2">
              <span className="text-sm flex-shrink-0">⚠️</span>
              <p className="text-xs text-yellow-700 leading-relaxed">{warningMsg}</p>
            </div>
          )}

          {/* 反应提示 */}
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
                  setIsEditMode(false);
                }
              }}
              placeholder="搜索或输入食物名称..."
              className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 placeholder-amber-300"
            />
            {/* 始终显示分类选择区域 */}
            {foodQuery.trim().length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-amber-500 mb-1.5">食物分类：</p>
                <div className="flex flex-wrap gap-1.5">
                  {foodCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setRecordCategoryId(cat.id);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                        recordCategoryId === cat.id
                          ? 'bg-orange-400 text-white border-orange-400'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
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

          {/* 排敏天数 - 阶梯选择：选2亮1+2，选3亮1+2+3 */}
          <div className="mb-4">
            <label className="text-sm text-amber-800 font-medium mb-1 block">排敏天数</label>
            <p className="text-xs text-amber-400 mb-2">选择 3 天 = 排敏完成</p>
            <div className="flex gap-2">
              {['day1' as DayCount, 'day2' as DayCount, 'day3' as DayCount].map(opt => {
                const dayNum = Number(opt.replace('day', ''));
                const selectedNum = Number(dayCount.replace('day', ''));
                const isActive = dayNum <= selectedNum;
                return (
                  <button
                    key={opt}
                    onClick={() => setDayCount(opt)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-orange-400 text-white'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {opt === 'day3' ? '3 天 ✅ 排敏完成' : `${dayNum} 天`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 该食物的历史记录 */}
          {selectedFoodId && !isEditMode && (() => {
            const historyRecs = getRecords().filter(r => r.foodId === selectedFoodId);
            if (historyRecs.length === 0) return null;
            return (
              <div className="mb-4">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1 text-xs text-amber-500 mb-2"
                >
                  <span>📋 历史记录（{historyRecs.length}条）</span>
                  <span className="text-amber-300">{showHistory ? '▲' : '▼'}</span>
                </button>
                {showHistory && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {[...historyRecs].sort((a, b) => b.date.localeCompare(a.date)).map(rec => {
                      const mealLabels: Record<string, string> = {
                        breakfast: '早餐', lunch: '中餐', dinner: '晚餐', snack: '加餐'
                      };
                      const reactionLabels: Record<string, string> = {
                        safe: '不过敏', observing: '观察中',
                        suspected: '疑似过敏', allergic: '过敏'
                      };
                      const reactionColors: Record<string, string> = {
                        safe: 'text-green-600', observing: 'text-amber-500',
                        suspected: 'text-orange-500', allergic: 'text-red-500'
                      };
                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">{rec.date}</span>
                            <span className="text-gray-400">{mealLabels[rec.meal] || rec.meal}</span>
                            <span className={reactionColors[rec.reaction] || 'text-gray-500'}>
                              {reactionLabels[rec.reaction] || rec.reaction}
                            </span>
                            {rec.dayCount && (
                              <span className="text-gray-400">Day{rec.dayCount.replace('day','')}</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setDeleteConfirmId(rec.id);
                              setDeleteConfirmName(selectedFoodName);
                            }}
                            className="text-red-300 hover:text-red-500 text-xs px-1"
                          >
                            🗑
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

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
          {isEditMode ? (
            /* 编辑模式：取消 + 删除 + 保存 */
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 rounded-xl text-amber-600 bg-amber-50 border border-amber-200 font-medium"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="py-3 px-4 rounded-xl text-red-500 bg-red-50 border border-red-200 font-medium"
              >
                删除
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl text-white bg-orange-400 font-medium active:bg-orange-500"
              >
                保存修改
              </button>
            </div>
          ) : (
            /* 新建模式：取消 + 保存 */
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
          )}
        </div>
      </div>

      <DeleteConfirmPortal
        deleteConfirmId={deleteConfirmId}
        deleteConfirmName={deleteConfirmName}
        onCancel={() => { setDeleteConfirmId(null); setDeleteConfirmName(''); }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

import ReactDOM from 'react-dom';

/* 删除确认弹窗 - 使用 Portal 渲染到 body 层，避免被 transform 父容器影响 */
const DeleteConfirmPortal: React.FC<{
  deleteConfirmId: string | null;
  deleteConfirmName: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ deleteConfirmId, deleteConfirmName, onCancel, onConfirm }) => {
  if (!deleteConfirmId) return null;
  return ReactDOM.createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-[90]" onClick={onCancel} />
      <div className="fixed inset-0 flex items-center justify-center z-[95] px-6">
        <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6">
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
            <p className="text-sm text-gray-500 mb-1">
              确定要删除 <span className="font-bold text-amber-700">{deleteConfirmName}</span> 的这条记录吗？
            </p>
            <p className="text-xs text-red-400 mb-5">删除后不可恢复</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default RecordPanel;
