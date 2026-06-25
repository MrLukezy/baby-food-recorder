// ============================
// 我的 Tab
// ============================

import React, { useState, useCallback, useRef } from 'react';
import type { BabyProfile } from '../../types';
import { updateProfile, getStats, clearAllData } from '../../store';
import { getMonthAge } from '../../utils/date';
import { exportToExcel } from '../../utils/export';

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
  const avatarRef = useRef<HTMLInputElement>(null);

  const stats = getStats();
  const age = getMonthAge(profile.birthday);

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : null}
            className="w-9 h-9 rounded-full bg-orange-400/80 shadow-sm flex items-center justify-center text-white text-sm flex-shrink-0"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-amber-900">👤 我的</h1>
        </div>
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
            {[
              { label: '总记录次数', value: stats.total, color: 'text-orange-500' },
              { label: '排敏成功次数', value: stats.safe, color: 'text-green-500' },
              { label: '观察中次数', value: stats.observing, color: 'text-yellow-500' },
              { label: '过敏源次数', value: stats.allergic, color: 'text-red-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3">
                <span className="text-sm text-amber-700">{item.label}</span>
                <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
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
              <p className="text-xs text-amber-500">导出所有排敏和辅食记录为 Excel 文件</p>
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
    </div>
  );
};

export default ProfilePage;
