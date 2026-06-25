// ============================
// 底部 Tab 导航栏
// ============================

import React from 'react';

export type TabKey = 'home' | 'calendar' | 'food' | 'profile';

interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'calendar', label: '日历', icon: '📅' },
  { key: 'food', label: '食物', icon: '🍎' },
  { key: 'profile', label: '我的', icon: '👤' },
];

const TabBar: React.FC<TabBarProps> = ({ active, onChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map(tab => (
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
