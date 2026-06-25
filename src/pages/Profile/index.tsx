// ============================
// 我的 Tab
// ============================

import React, { useState, useCallback, useRef, useMemo } from 'react';
import type { BabyProfile } from '../../types';
import { updateProfile, getStats, clearAllData, getFoodAllergenStatus, getPresetAllergens, getRecords } from '../../store';
import { getMonthAge } from '../../utils/date';
import { exportToExcel, isWeChatBrowser } from '../../utils/export';
import { getAllFoods } from '../../config/foodConfig';
import { getFoodEmoji } from '../../config/foodConfig';

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
  const avatarRef = useRef<HTMLInputElement>(null);

  const stats = getStats();
  const age = getMonthAge(profile.birthday);
  const inWeChat = isWeChatBrowser();

  // ============ 所有排敏记录数据 ============
  const allRecordsData = useMemo(() => {
    if (!showRecords) return null;

    const allRecs = getRecords();
    const presets = getPresetAllergens();
    const allFoods = getAllFoods();

    const foodMap = new Map<string, {
      name: string; emoji: string; status: string;
      eatCount: number; days: number;
    }>();

    for (const r of allRecs) {
      if (!foodMap.has(r.foodId)) {
        foodMap.set(r.foodId, {
          name: r.foodName,
          emoji: getFoodEmoji(r.foodId),
          status: 'unknown',
          eatCount: 0,
          days: 0,
        });
      }
      foodMap.get(r.foodId)!.eatCount++;
    }

    for (const id of presets) {
      if (!foodMap.has(id)) {
        const info = allFoods.find(f => f.id === id);
        if (info) {
          foodMap.set(id, {
            name: info.name, emoji: info.emoji,
            status: 'safe', eatCount: 0, days: 0,
          });
        }
      }
    }

    for (const [foodId, item] of foodMap) {
      const status = getFoodAllergenStatus(foodId) || 'safe';
      const days = new Set(
        allRecs.filter(r => r.foodId === foodId).map(r => r.date)
      ).size;
      item.status = status;
      // 预设食物（无记录）显示为 3 天（排敏完成）
      item.days = presets.includes(foodId) && days === 0 ? 3 : days;
    }

    return { foods: Array.from(foodMap.values()), total: foodMap.size };
  }, [showRecords]);

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
              💡 排敏完成 = 连续 3 天无不良反应 | 排敏中 = 不足 3 天
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
                const grouped = {
                  safe: allRecordsData.foods.filter(f => f.status === 'safe'),
                  suspected: allRecordsData.foods.filter(f => f.status === 'suspected'),
                  observing: allRecordsData.foods.filter(f => f.status === 'observing'),
                  allergic: allRecordsData.foods.filter(f => f.status === 'allergic'),
                };
                const sections = [
                  { key: 'safe', label: '排敏完成（不过敏）', foods: grouped.safe, color: '#7BC67E' },
                  { key: 'suspected', label: '疑似过敏（待回避触发实验）', foods: grouped.suspected, color: '#F59E0B' },
                  { key: 'observing', label: '排敏中', foods: grouped.observing, color: '#FFB347' },
                  { key: 'allergic', label: '过敏', foods: grouped.allergic, color: '#FF6B6B' },
                ].filter(s => !statFilter || s.key === statFilter);

                return sections.map(section => {
                  if (section.foods.length === 0) {
                    return (
                      <div key={section.key} className="text-center py-6 text-amber-400">
                        <div className="text-3xl mb-2">🍽️</div>
                        <p className="text-sm">该分类暂无食物</p>
                      </div>
                    );
                  }
                  return (
                    <div key={section.key} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: section.color }} />
                        <span className="text-sm font-bold text-amber-800">
                          {section.label}
                          <span className="text-xs text-amber-400 ml-1">({section.foods.length})</span>
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {section.foods
                          .sort((a, b) => b.days - a.days || b.eatCount - a.eatCount)
                          .map((food, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{food.emoji}</span>
                                <span className="text-sm font-medium text-amber-900">{food.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {food.days > 0 && (
                                  <span className="text-xs text-amber-400">{food.days}天</span>
                                )}
                                {food.eatCount > 0 && (
                                  <span className="text-xs text-amber-400">×{food.eatCount}</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
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
    </div>
  );
};

export default ProfilePage;
