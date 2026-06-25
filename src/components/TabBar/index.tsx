// ============================
// 底部 Tab 导航栏（带中心 AI 助手按钮）
// ============================

import React from 'react';

export type TabKey = 'home' | 'calendar' | 'food' | 'profile';

interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
  onOpenChat: () => void;
}

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'calendar', label: '日历', icon: '📅' },
  { key: 'food', label: '食物', icon: '🍎' },
  { key: 'profile', label: '我的', icon: '👤' },
];

const TabBar: React.FC<TabBarProps> = ({ active, onChange, onOpenChat }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto px-2">
        {tabs.slice(0, 2).map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              active === tab.key
                ? 'text-orange-500'
                : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        ))}

        {/* 中心 AI 助手按钮 */}
        <button
          onClick={onOpenChat}
          className="flex flex-col items-center justify-center w-14 h-14 -mt-6 bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-full shadow-lg shadow-orange-200 active:scale-95 transition-transform"
          title="AI 辅食规划助手"
        >
          <span className="text-2xl leading-none">🤖</span>
          <span className="text-[9px] mt-0.5 font-medium">AI助手</span>
        </button>

        {tabs.slice(2, 4).map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              active === tab.key
                ? 'text-orange-500'
                : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabBar;
