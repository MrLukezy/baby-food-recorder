// ============================
// 我的 Tab
// ============================

import React, { useState, useCallback, useRef } from 'react';
import type { BabyProfile, FoodRecord } from '../../types';
import { updateProfile, getStats, clearAllData, getFoodAllergenStatus, getPresetAllergens, getRecords, deleteRecord } from '../../store';
import { getMonthAge } from '../../utils/date';
import { exportToExcel, isWeChatBrowser } from '../../utils/export';
import { getAllFoods, getFoodById } from '../../config/foodConfig';
import { getFoodEmoji, foodCategories } from '../../config/foodConfig';

interface ProfileProps {
  profile: BabyProfile;
  onUpdate: (profile: BabyProfile) => void;
  onClearData: () => void;
}

const ProfilePage: React.FC<ProfileProps> = ({ profile, onUpdate, onClearData }) => {
  const [editingName, setEditingName] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [tempName, setTempName] = useState(profile.name);
  const [tempBirthday, setTempBirthday] = useState(profile.birthday);
  const [showRecords, setShowRecords] = useState(false);
  // 当前浮层筛选的分类：null=全部, 'safe'/'observing'/'suspected'/'allergic'
  const [statFilter, setStatFilter] = useState<string | null>(null);
  const [expandedFood, setExpandedFood] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{foodName: string; recordId: string} | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);


  const handleDeleteRecord = useCallback(() => {
    if (deleteConfirm) {
      deleteRecord(deleteConfirm.recordId);
      setDeleteConfirm(null);
      setExpandedFood(null);
      setRefreshKey(n => n + 1);
    }
  }, [deleteConfirm]);

  const stats = getStats();
  const age = getMonthAge(profile.birthday);
  const inWeChat = isWeChatBrowser();

  // ============ 所有排敏记录数据 ============
  // 用 refreshKey 让删除后重新拉取数据
  const [refreshKey, setRefreshKey] = useState(0);
  const buildRecordsData = useCallback(() => {
    if (!showRecords) return null;

    const allRecs = getRecords();
    const presets = getPresetAllergens();
    const allFoods = getAllFoods();

    const foodMap = new Map<string, {
      name: string; emoji: string; status: string;
      eatCount: number; days: number;
      categoryId: string; categoryName: string; categoryIcon: string;
      records: FoodRecord[];
    }>();

    for (const r of allRecs) {
      if (!foodMap.has(r.foodId)) {
        const foodInfo = getFoodById(r.foodId);
        foodMap.set(r.foodId, {
          name: r.foodName,
          emoji: getFoodEmoji(r.foodId),
          status: 'unknown',
          eatCount: 0,
          days: 0,
          records: [],
          categoryId: foodInfo?.categoryId || r.categoryId || 'custom',
          categoryName: foodInfo?.categoryName || (r.categoryId ? (foodCategories.find(c=>c.id===r.categoryId)?.name || '自定义') : '自定义'),
          categoryIcon: foodInfo?.categoryIcon || (r.categoryId ? (foodCategories.find(c=>c.id===r.categoryId)?.icon || '🍽️') : '🍽️'),
        });
      }
      foodMap.get(r.foodId)!.eatCount++;
      foodMap.get(r.foodId)!.records.push(r);
    }

    for (const id of presets) {
      if (!foodMap.has(id)) {
        const info = allFoods.find(f => f.id === id);
        if (info) {
          foodMap.set(id, {
            name: info.name, emoji: info.emoji,
            status: 'safe', eatCount: 0, days: 0, records: [],
            categoryId: info.categoryId,
            categoryName: info.categoryName,
            categoryIcon: info.categoryIcon || '🍽️',
          });
        }
      }
    }

    for (const [foodId, item] of foodMap) {
      const status = getFoodAllergenStatus(foodId) || 'safe';
      const days = new Set(
        allRecs.filter(r => r.foodId === foodId).map(r => r.date)
      ).size;
      const hasDay3Mark = allRecs.some(r => r.foodId === foodId && r.dayCount === 'day3' && r.reaction === 'safe');
      item.status = status;
      item.days = presets.includes(foodId) && days === 0 ? 3 : (hasDay3Mark ? 3 : days);
    }

    return { foods: Array.from(foodMap.values()), total: foodMap.size };
  }, [showRecords, refreshKey]);

  const allRecordsData = buildRecordsData();

  // ============ 回调函数 ============

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = Math.min(200, img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const sx = (img.width - Math.min(img.width, img.height)) / 2;
        const sy = (img.height - Math.min(img.width, img.height)) / 2;
        const sSize = Math.min(img.width, img.height);
        ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const updated = updateProfile({ avatar: dataUrl });
        if (updated) onUpdate(updated);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onUpdate]);

  const handleSaveName = useCallback(() => {
    if (tempName.trim().length === 0) return;
    const updated = updateProfile({ name: tempName.trim() });
    if (updated) onUpdate(updated);
    setEditingName(false);
  }, [tempName, onUpdate]);

  const handleSaveBirthday = useCallback(() => {
    const updated = updateProfile({ birthday: tempBirthday });
    if (updated) onUpdate(updated);
    setEditingBirthday(false);
  }, [tempBirthday, onUpdate]);

  const handleExport = () => {
    exportToExcel(profile);
  };

  const handleClearData = () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      clearAllData();
      onClearData();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-20">
      {/* 标题 */}
      <div className="bg-gradient-to-b from-orange-100 to-[#FFF8F0] px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold text-amber-900">👤 我的</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* 宝宝信息卡片 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col items-center mb-4">
            <div className="relative mb-3">
              <button
                onClick={() => avatarRef.current?.click()}
                className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl overflow-hidden border-2 border-orange-200"
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : '👶'}
              </button>
              <button
                onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-orange-400 rounded-full flex items-center justify-center text-white text-xs shadow-md"
              >📷</button>
              <input
                type="file"
                ref={avatarRef}
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* 昵称 */}
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={e => setTempName(e.target.value.slice(0, 10))}
                  maxLength={10}
                  className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-center"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-orange-400 text-sm font-medium">保存</button>
                <button onClick={() => { setEditingName(false); setTempName(profile.name); }} className="text-gray-400 text-sm">取消</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-amber-900">{profile.name}</h2>
                <button onClick={() => { setTempName(profile.name); setEditingName(true); }} className="text-orange-400 text-xs">
                  ✏️
                </button>
              </div>
            )}
          </div>

          {/* 出生日期 */}
          <div className="bg-amber-50 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-600">出生日期</span>
              {editingBirthday ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={tempBirthday}
                    onChange={e => setTempBirthday(e.target.value)}
                    className="px-2 py-1 bg-white border border-amber-200 rounded-lg text-amber-900 text-sm"
                  />
                  <button onClick={handleSaveBirthday} className="text-orange-400 text-xs">保存</button>
                  <button onClick={() => { setEditingBirthday(false); setTempBirthday(profile.birthday); }} className="text-gray-400 text-xs">取消</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-amber-900">{profile.birthday}</span>
                  <button onClick={() => { setTempBirthday(profile.birthday); setEditingBirthday(true); }} className="text-orange-400 text-xs">
                    ✏️
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 月龄 */}
          <div className="bg-amber-50 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-600">当前月龄</span>
              <span className="text-sm font-bold text-orange-500">
                {age.months}个月{age.days}天
              </span>
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 mb-3">数据统计</h3>
          <div className="space-y-3">
            {/* 总记录次数 — 可点击展开查看所有排敏记录 */}
            <button
              onClick={() => { setShowRecords(true); setStatFilter(null); }}
              className="w-full flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-700">总记录次数</span>
                <span className="text-xs text-amber-400">点击查看</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-orange-500">{stats.total}</span>
                <span className="text-amber-300">›</span>
              </div>
            </button>

            <button
              onClick={() => { setShowRecords(true); setStatFilter('safe'); }}
              className="w-full flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors"
            >
              <span className="text-sm text-amber-700">排敏完成（不过敏）</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-green-500">{stats.safe}</span>
                <span className="text-amber-300">›</span>
              </div>
            </button>
            <button
              onClick={() => { setShowRecords(true); setStatFilter('observing'); }}
              className="w-full flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors"
            >
              <span className="text-sm text-amber-700">排敏中</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-yellow-500">{stats.observing}</span>
                <span className="text-amber-300">›</span>
              </div>
            </button>
            <button
              onClick={() => { setShowRecords(true); setStatFilter('suspected'); }}
              className="w-full flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors"
            >
              <span className="text-sm text-amber-700">疑似过敏</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-amber-500">{stats.suspected}</span>
                <span className="text-amber-300">›</span>
              </div>
            </button>
            <button
              onClick={() => { setShowRecords(true); setStatFilter('allergic'); }}
              className="w-full flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors"
            >
              <span className="text-sm text-amber-700">过敏源</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-red-500">{stats.allergic}</span>
                <span className="text-amber-300">›</span>
              </div>
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-100">
            <p className="text-xs text-amber-400">
              💡 排敏完成 = 选择第 3 天（排敏完成）或连续 3 天无不良反应
            </p>
          </div>
        </div>

        {/* 功能按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:bg-amber-50 transition-colors"
          >
            <span className="text-2xl">📤</span>
            <div className="text-left">
              <p className="font-medium text-amber-900">导出数据</p>
              <p className="text-xs text-amber-500">
                {inWeChat
                  ? '导出所有排敏和辅食记录（将复制为 CSV 格式）'
                  : '导出所有排敏和辅食记录为 Excel 文件'}
              </p>
            </div>
          </button>

          <button
            onClick={handleClearData}
            className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:bg-red-50 transition-colors"
          >
            <span className="text-2xl">⚠️</span>
            <div className="text-left">
              <p className="font-medium text-red-700">清除所有数据</p>
              <p className="text-xs text-red-400">删除所有记录重新开始，此操作不可恢复</p>
            </div>
          </button>
        </div>
      </div>

      {/* ============ 查看所有排敏记录浮层 ============ */}
      {showRecords && allRecordsData && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[55]" onClick={() => { setShowRecords(false); setStatFilter(null); }} />
          <div className="fixed inset-x-0 bottom-0 z-[60] bg-white rounded-t-2xl max-h-[80vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-amber-100">
              <h2 className="text-lg font-bold text-amber-900">
                {statFilter === 'safe' && '排敏完成（不过敏）'}
                {statFilter === 'observing' && '排敏中'}
                {statFilter === 'suspected' && '疑似过敏'}
                {statFilter === 'allergic' && '过敏食物'}
                {!statFilter && '所有排敏记录'}
                <span className="text-xs text-amber-400 ml-2">共 {allRecordsData.total} 种食物</span>
              </h2>
              <button onClick={() => { setShowRecords(false); setStatFilter(null); }} className="text-gray-400 text-2xl">✕</button>
            </div>

            {/* 筛选标签 */}
            <div className="px-5 py-2 flex gap-2 flex-shrink-0 border-b border-amber-50 overflow-x-auto">
              {[
                { key: null, label: '全部' },
                { key: 'safe', label: '已排敏' },
                { key: 'observing', label: '排敏中' },
                { key: 'suspected', label: '疑似过敏' },
                { key: 'allergic', label: '过敏' },
              ].map((opt) => (
                <button
                  key={opt.key ?? 'all'}
                  onClick={() => setStatFilter(opt.key)}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                    statFilter === opt.key
                      ? 'bg-orange-400 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {(() => {
                const statusGroups = [
                  { key: 'safe', label: '✅ 排敏完成（不过敏）', color: '#7BC67E' },
                  { key: 'observing', label: '⏳ 排敏中', color: '#FFB347' },
                  { key: 'suspected', label: '⚠️ 疑似过敏', color: '#F59E0B' },
                  { key: 'allergic', label: '❌ 过敏源', color: '#FF6B6B' },
                ].filter(sg => !statFilter || sg.key === statFilter);

                const categoryOrder = foodCategories.map(c => c.id);

                return statusGroups.map(sg => {
                  const foodsOfStatus = allRecordsData.foods.filter(f => f.status === sg.key);

                  // 按分类分组
                  const byCategory = new Map<string, typeof foodsOfStatus>();
                  for (const food of foodsOfStatus) {
                    const catKey = food.categoryId || 'custom';
                    if (!byCategory.has(catKey)) byCategory.set(catKey, []);
                    byCategory.get(catKey)!.push(food);
                  }

                  const sortedCategories = Array.from(byCategory.entries()).sort(([aId], [bId]) => {
                    const ai = categoryOrder.indexOf(aId);
                    const bi = categoryOrder.indexOf(bId);
                    if (ai === -1 && bi === -1) return aId.localeCompare(bId);
                    if (ai === -1) return 1;
                    if (bi === -1) return -1;
                    return ai - bi;
                  });

                  return (
                    <div key={sg.key} className="mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sg.color }} />
                        <span className="text-sm font-bold text-amber-800">
                          {sg.label}
                          <span className="text-xs text-amber-400 ml-1">({foodsOfStatus.length}种)</span>
                        </span>
                      </div>

                      {foodsOfStatus.length === 0 ? (
                        <p className="text-xs text-amber-300 ml-4 mb-3">暂无食物</p>
                      ) : (
                        sortedCategories.map(([catId, catFoods]) => {
                          const catInfo = foodCategories.find(c => c.id === catId);
                          const catName = catInfo?.name || (catId === 'custom' ? '自定义' : catId);
                          const catIcon = catInfo?.icon || catFoods[0]?.categoryIcon || '🍽️';
                          return (
                            <div key={catId} className="mb-3 ml-2">
                              <div className="flex items-center gap-1 mb-1.5">
                                <span className="text-xs">{catIcon}</span>
                                <span className="text-xs text-amber-600 font-medium">{catName}</span>
                                <span className="text-xs text-amber-300">({catFoods.length})</span>
                              </div>
                              <div className="space-y-1 ml-4">
                                {catFoods
                                  .sort((a, b) => b.days - a.days || b.eatCount - a.eatCount)
                                  .map((food, i) => (
                                    <div key={i}>
                                      {/* 食物条目 — 可点击展开 */}
                                      <div
                                        onClick={() => {
                                          if (food.eatCount === 0) return;
                                          setExpandedFood(expandedFood === food.name ? null : food.name);
                                        }}
                                        className={`flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                                          expandedFood === food.name
                                            ? 'bg-amber-100'
                                            : 'bg-amber-50/70 hover:bg-amber-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm">{food.emoji}</span>
                                          <span className="text-sm font-medium text-amber-900">{food.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {food.days > 0 && (
                                            <span className="text-xs text-amber-400">{food.days}天</span>
                                          )}
                                          {food.eatCount > 0 && (
                                            <span className="text-xs text-amber-400">×{food.eatCount}</span>
                                          )}
                                          {food.eatCount > 0 && (
                                            <span className="text-xs text-amber-300 ml-1">{expandedFood === food.name ? '▲' : '▼'}</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* 展开后的记录列表 */}
                                      {expandedFood === food.name && food.records.length > 0 && (
                                        <div className="ml-2 mt-1 mb-2 space-y-1">
                                          {[...food.records].sort((a, b) => b.date.localeCompare(a.date)).map((rec) => {
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
                                                className="flex items-center justify-between bg-white rounded-md px-3 py-1.5 border border-amber-100"
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
                                                  {rec.note && <span className="text-gray-400 max-w-[80px] truncate">{rec.note}</span>}
                                                </div>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm({ foodName: food.name, recordId: rec.id });
                                                  }}
                                                  className="text-red-300 hover:text-red-500 text-sm px-1"
                                                >
                                                  🗑
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          );
                        })
                      )}
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

      {/* ============ 删除确认弹窗 ============ */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[70]" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-[75] px-6">
            <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl p-6 animate-pop-in">
              <div className="text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">确认删除</h3>
                <p className="text-sm text-gray-500 mb-1">
                  确定要删除 <span className="font-bold text-amber-700">{deleteConfirm.foodName}</span> 的这条记录吗？
                </p>
                <p className="text-xs text-red-400 mb-5">删除后不可恢复</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteRecord}
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

export default ProfilePage;
