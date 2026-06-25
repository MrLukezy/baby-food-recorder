// ============================
// 引导页 - 创建宝宝
// ============================

import React, { useState } from 'react';
import type { BabyProfile } from '../../types';
import { saveProfile, generateId } from '../../store';

interface CreateBabyProps {
  onNext: (profile: BabyProfile) => void;
}

const CreateBaby: React.FC<CreateBabyProps> = ({ onNext }) => {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');

  const canProceed = name.trim().length > 0 && birthday.length > 0;

  const handleNext = () => {
    if (!canProceed) return;

    const profile: BabyProfile = {
      id: generateId(),
      name: name.trim(),
      birthday,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProfile(profile);
    onNext(profile);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center px-6 py-10">
      {/* 图标 */}
      <div className="text-7xl mb-6 animate-bounce-slow">🍼</div>

      {/* 欢迎文案 */}
      <h1 className="text-2xl font-bold text-amber-900 mb-2 text-center">
        欢迎使用宝宝饮食记录
      </h1>
      <p className="text-amber-600 mb-8 text-center">给宝宝起个昵称吧</p>

      {/* 表单 */}
      <div className="w-full max-w-sm space-y-5">
        {/* 昵称 */}
        <div>
          <label className="text-sm text-amber-800 font-medium mb-1.5 block">
            宝宝昵称
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value.slice(0, 10))}
            placeholder="最多10个字"
            maxLength={10}
            className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-amber-900 placeholder-amber-300 focus:border-orange-300 focus:outline-none transition-colors"
          />
        </div>

        {/* 出生日期 */}
        <div>
          <label className="text-sm text-amber-800 font-medium mb-1.5 block">
            出生日期
          </label>
          <input
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-amber-900 focus:border-orange-300 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* 按钮 */}
      <button
        onClick={handleNext}
        disabled={!canProceed}
        className={`mt-10 w-full max-w-sm py-3.5 rounded-xl text-lg font-bold transition-all ${
          canProceed
            ? 'bg-orange-400 text-white active:bg-orange-500 shadow-lg shadow-orange-200'
            : 'bg-amber-100 text-amber-300 cursor-not-allowed'
        }`}
      >
        下一步 →
      </button>
    </div>
  );
};

export default CreateBaby;
