// ============================
// 分类详情页
// ============================

import React, { useState } from 'react';
import { foodCategories, addCustomFood, deleteCustomFood, updateCustomFood, getCustomFoodsByCategory, isCustomFood } from '../../config/foodConfig';
import { getFoodAllergenStatus, getFoodEatCount, getRecords } from '../../store';
import { REACTION_OPTIONS } from '../../types';

interface CategoryDetailProps {
  categoryId: string;
  onBack: () => void;
}

const CategoryDetail: React.FC<CategoryDetailProps> = ({ categoryId, onBack }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [editFoodId, setEditFoodId] = useState<string | null>(null);
  const [editFoodName, setEditFoodName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [newFoodLevel, setNewFoodLevel] = useState<string>('low');
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [, forceUpdate] = useState(0);
  const category = foodCategories.find(c => c.id === categoryId);
  const allRecords = getRecords();

  if (!category) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <p className="text-amber-400">分类未找到</p>
      </div>
    );
  }

  // 自定义食物（合并到该分类下）
  const customFoodsInCat = getCustomFoodsByCategory(categoryId).map(f => ({
    id: f.id,
    name: f.name,
    emoji: '🍽️',
    allergenLevel: (f.allergenLevel || 'low') as 'low' | 'medium' | 'high' | 'avoid',
    recommendedAge: '0',
    categoryId,
    categoryName: category.name,
    categoryIcon: category.icon,
  }));

  // 统计
  let safeCount = 0, observingCount = 0, suspectedCount = 0, allergicCount = 0;
  const foods = [...category.foods, ...customFoodsInCat].map(food => {
    const reaction = getFoodAllergenStatus(food.id);
    const eatCount = getFoodEatCount(food.id);
    const recordDays = new Set(
      allRecords.filter(r => r.foodId === food.id).map(r => r.date)
    ).size;
    const hasDay3Mark = allRecords.some(r => r.foodId === food.id && r.dayCount === 'day3' && r.reaction === 'safe');
    const daysTested = hasDay3Mark ? 3 : recordDays;
    if (reaction === 'safe') safeCount++;
    else if (reaction === 'observing') observingCount++;
    else if (reaction === 'suspected') suspectedCount++;
    else if (reaction === 'allergic') allergicCount++;
    return { ...food, reaction, eatCount, daysTested };
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
            <span className="text-green-600">完成 <b>{safeCount}</b>种</span>
            <span className="text-yellow-600">排敏中 <b>{observingCount}</b>种</span>
            <span className="text-amber-600">疑似 <b>{suspectedCount}</b>种</span>
            <span className="text-red-600">过敏 <b>{allergicCount}</b>种</span>
            <span className="text-amber-400">未排敏 <b>{foods.length - safeCount - observingCount - suspectedCount - allergicCount}</b>种</span>
          </div>
        </div>

        {/* 食物列表 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="space-y-2">
            {foods.map(food => {
              const reactionOpt = REACTION_OPTIONS.find(o => o.value === food.reaction);
              // 状态标签
              const statusLabel = food.reaction === 'safe'
                ? '已排敏 ✓'
                : food.reaction === 'observing'
                  ? `排敏中 ${food.daysTested}/3天`
                  : food.reaction === 'suspected'
                    ? '疑似过敏 ?'
                    : food.reaction === 'allergic'
                      ? '过敏 ✕'
                      : '';

              const custom = isCustomFood(food.id);
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
                      food.allergenLevel === 'avoid' ? 'bg-gray-800 text-white' :
                      'bg-green-50 text-green-500'
                    }`}>
                      {food.allergenLevel === 'low' ? '低敏' :
                       food.allergenLevel === 'medium' ? '中敏' :
                       food.allergenLevel === 'avoid' ? '❌不能吃' :
                       '高敏'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 排敏天数进度条 */}
                    {food.reaction === 'observing' && (
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
                    {reactionOpt ? (
                      <>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: reactionOpt.color }}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-sm text-amber-400">×{food.eatCount}</span>
                      </>
                    ) : (
                      <span className="text-xs text-amber-300">未食用</span>
                    )}
                    {custom && (
                      <div className="flex gap-1 ml-1">
                        <button
                          onClick={() => {
                            setEditFoodId(food.id);
                            setEditFoodName(food.name);
                          }}
                          className="text-amber-400 hover:text-amber-600 text-xs px-1"
                          title="修改名称"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(food.id);
                            setDeleteConfirmName(food.name);
                          }}
                          className="text-red-300 hover:text-red-500 text-xs px-1"
                          title="删除食材"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 添加食材按钮 */}
        <div className="text-center pt-2 pb-4">
          <button
            onClick={() => { setShowAddForm(true); setNewFoodName(''); }}
            className="inline-flex items-center gap-1 px-6 py-2.5 rounded-xl bg-white border-2 border-dashed border-amber-300 text-amber-500 font-medium text-sm hover:bg-amber-50 active:scale-95 transition-all"
          >
            <span className="text-lg">+</span>
            添加{category.name}食材
          </button>
        </div>
      </div>

      {/* 添加食材弹窗 */}
      {showAddForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[55]" onClick={() => setShowAddForm(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-amber-900 mb-4">
              ➕ 添加{category.icon}{category.name}食材
            </h3>
            <input
              type="text"
              value={newFoodName}
              onChange={e => setNewFoodName(e.target.value)}
              placeholder="输入食材名称，如：山药"
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 placeholder-amber-300 mb-3"
              autoFocus
            />

            {/* 致敏等级选择 */}
            <p className="text-xs text-amber-500 mb-2">致敏等级：</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { value: 'low', label: '低敏', color: 'bg-green-100 text-green-700 border-green-300' },
                { value: 'medium', label: '中敏', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                { value: 'high', label: '高敏', color: 'bg-red-100 text-red-700 border-red-300' },
                { value: 'avoid', label: '❌不能吃', color: 'bg-gray-100 text-gray-700 border-gray-300' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setNewFoodLevel(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    newFoodLevel === opt.value
                      ? `${opt.color} ring-2 ring-offset-1 ring-black/10`
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}

              {/* 自动识别按钮 */}
              <button
                onClick={async () => {
                  if (!newFoodName.trim()) {
                    alert('请先输入食材名称');
                    return;
                  }
                  setAutoDetecting(true);
                  try {
                    const res = await fetch('/babyfoodrecorder/api/deepseek/chat', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [
                          { role: 'system', content: '你是一个婴幼儿辅食排敏专家。请判断给定食物对6-12月龄宝宝的致敏等级。只需要返回一个词：low（低敏）/ medium（中敏）/ high（高敏）/ avoid（不建议给婴儿吃）。不要有任何其他文字。' },
                          { role: 'user', content: newFoodName.trim() },
                        ],
                        max_tokens: 10,
                        temperature: 0.1,
                        stream: false,
                      }),
                    });
                    if (!res.ok) throw new Error('API 请求失败');
                    const data = await res.json();
                    const result = data.choices?.[0]?.message?.content?.trim().toLowerCase() || '';
                    if (['low', 'medium', 'high', 'avoid'].includes(result)) {
                      setNewFoodLevel(result);
                    } else {
                      alert('识别结果异常，请手动选择');
                    }
                  } catch (e: any) {
                    alert('自动识别失败: ' + (e.message || '网络错误'));
                  } finally {
                    setAutoDetecting(false);
                  }
                }}
                disabled={autoDetecting}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  autoDetecting
                    ? 'bg-blue-200 text-blue-500 border-blue-200 cursor-wait'
                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                }`}
              >
                {autoDetecting ? '⏳ 识别中...' : '🤖 自动识别'}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddForm(false); setNewFoodLevel('low'); }}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!newFoodName.trim()) return;
                  addCustomFood(newFoodName, categoryId, newFoodLevel);
                  setShowAddForm(false);
                  setNewFoodName('');
                  setNewFoodLevel('low');
                  forceUpdate(n => n + 1);
                }}
                className="flex-1 py-3 rounded-xl bg-orange-400 text-white font-medium"
              >
                添加
              </button>
            </div>
          </div>
        </>
      )}

      {/* 修改食材名称弹窗 */}
      {editFoodId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[55]" onClick={() => setEditFoodId(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-amber-900 mb-4">
              ✏️ 修改食材名称
            </h3>
            <input
              type="text"
              value={editFoodName}
              onChange={e => setEditFoodName(e.target.value)}
              placeholder="输入新名称"
              className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 placeholder-amber-300 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditFoodId(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!editFoodName.trim()) return;
                  updateCustomFood(editFoodId, editFoodName);
                  setEditFoodId(null);
                  forceUpdate(n => n + 1);
                }}
                className="flex-1 py-3 rounded-xl bg-orange-400 text-white font-medium"
              >
                确认修改
              </button>
            </div>
          </div>
        </>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[55]" onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(''); }} />
          <div className="fixed inset-0 flex items-center justify-center z-[60] px-6">
            <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6">
              <div className="text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
                <p className="text-sm text-gray-500 mb-1">
                  确定要删除自定义食材 <span className="font-bold text-amber-700">{deleteConfirmName}</span> 吗？
                </p>
                <p className="text-xs text-red-400 mb-5">删除后相关排敏记录将无法关联</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteConfirmId(null); setDeleteConfirmName(''); }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirmId) {
                      deleteCustomFood(deleteConfirmId);
                      setDeleteConfirmId(null);
                      setDeleteConfirmName('');
                      forceUpdate(n => n + 1);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryDetail;
