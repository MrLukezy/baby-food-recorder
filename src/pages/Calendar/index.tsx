// ============================
// 日历 Tab
// ============================

import React, { useState, useEffect, useCallback } from 'react';
import type { FoodRecord } from '../../types';
import { REACTION_OPTIONS, MEAL_OPTIONS } from '../../types';
import { getRecords } from '../../store';
import { getFoodEmoji } from '../../config/foodConfig';
import { today, getMonthCalendar, formatFriendlyDate, getMonthLabel } from '../../utils/date';

const CalendarPage: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(today());
  const [allRecords, setAllRecords] = useState<FoodRecord[]>([]);

  const refreshData = useCallback(() => {
    setAllRecords(getRecords());
  }, []);

  useEffect(refreshData, [refreshData]);

  const calendarCells = getMonthCalendar(year, month);
  const todayStr = today();

  // 月份统计
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthRecords = allRecords.filter(r => r.date.startsWith(monthStr));
  const monthStats = {
    total: monthRecords.length,
    safe: new Set(monthRecords.filter(r => r.reaction === 'safe').map(r => r.date)).size,
    observing: new Set(monthRecords.filter(r => r.reaction === 'observing').map(r => r.date)).size,
    allergic: new Set(monthRecords.filter(r => r.reaction === 'allergic').map(r => r.date)).size,
  };

  // 选中日期的记录
  const dayRecords = allRecords
    .filter(r => r.date === selectedDate)
    .sort((a, b) => {
      const mealOrder = ['breakfast', 'lunch', 'snack', 'dinner'];
      return mealOrder.indexOf(a.meal) - mealOrder.indexOf(b.meal);
    });

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const mealIcons: Record<string, string> = {
    breakfast: '🌅', lunch: '☀️', snack: '🍪', dinner: '🌙',
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-20">
      {/* 月份导航 */}
      <div className="bg-gradient-to-b from-orange-100 to-[#FFF8F0] px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => window.history.length > 1 ? window.history.back() : null}
            className="w-9 h-9 rounded-full bg-orange-400/80 shadow-sm flex items-center justify-center text-white text-sm flex-shrink-0"
          >
            ←
          </button>
          <span className="text-lg font-bold text-amber-900">📅 日历</span>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-700">
            ‹
          </button>
          <h1 className="text-xl font-bold text-amber-900">{getMonthLabel(year, month)}</h1>
          <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-700">
            ›
          </button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* 月份统计 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="text-amber-700">总 <b className="text-orange-500">{monthStats.total}</b>次</span>
            <span className="text-green-600">安全 <b>{monthStats.safe}</b></span>
            <span className="text-yellow-600">观察 <b>{monthStats.observing}</b></span>
            <span className="text-red-600">过敏 <b>{monthStats.allergic}</b></span>
          </div>
        </div>

        {/* 日历网格 */}
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          {/* 星期头 */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs text-amber-400 font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* 日期格 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, i) => {
              const dayRecords = allRecords.filter(r => r.date === cell.date);
              const hasRecord = dayRecords.length > 0;
              const hasAllergic = dayRecords.some(r => r.reaction === 'allergic');
              const hasObserving = dayRecords.some(r => r.reaction === 'observing');
              const isSelected = cell.date === selectedDate;
              const isToday = cell.date === todayStr;
              const dayNum = Number(cell.date.split('-')[2]);

              let dotColor = '';
              if (hasAllergic) dotColor = 'bg-red-400';
              else if (hasObserving) dotColor = 'bg-yellow-400';
              else if (hasRecord) dotColor = 'bg-green-400';

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`relative flex flex-col items-center py-1 rounded-lg transition-all min-h-[44px] ${
                    !cell.isCurrentMonth
                      ? 'text-amber-200'
                      : isSelected
                        ? 'bg-orange-400 text-white shadow-md'
                        : isToday
                          ? 'bg-orange-100 text-orange-700 font-bold'
                          : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <span className="text-sm">{dayNum}</span>
                  {dotColor && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : dotColor}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 选中日期的详细记录 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-amber-800 mb-3">
            {formatFriendlyDate(selectedDate)}的辅食记录
          </h3>

          {dayRecords.length === 0 ? (
            <div className="text-center py-8 text-amber-400">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm">该日暂无记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                let currentMeal = '';
                return dayRecords.map(rec => {
                  const showMealHeader = rec.meal !== currentMeal;
                  currentMeal = rec.meal;
                  const mealOpt = MEAL_OPTIONS.find(m => m.value === rec.meal);
                  const reactionOpt = REACTION_OPTIONS.find(o => o.value === rec.reaction);

                  return (
                    <div key={rec.id}>
                      {showMealHeader && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <span>{mealIcons[rec.meal]}</span>
                          <span className="text-sm font-bold text-amber-700">{mealOpt?.label}</span>
                        </div>
                      )}
                      <div className="ml-6 bg-amber-50 rounded-xl p-3 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{getFoodEmoji(rec.foodId)}</span>
                          <span className="font-medium text-amber-900">{rec.foodName}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: reactionOpt?.color }}
                          >
                            {reactionOpt?.label}
                          </span>
                          <span className="text-xs text-amber-400">
                            D{rec.dayCount.replace('day', '')}
                          </span>
                        </div>
                        {rec.note && (
                          <p className="text-xs text-amber-500 mt-1">💬 {rec.note}</p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
