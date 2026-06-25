// ============================
// 日期工具函数
// ============================

/** 获取今天的日期字符串 YYYY-MM-DD */
export function today(): string {
  return formatDate(new Date());
}

/** 格式化日期为 YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 解析日期字符串为 Date */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 获取某一周的起止日期（周一开始） */
export function getWeekDates(refDate: Date): string[] {
  const day = refDate.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 调整到周一
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + diff);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

/** 获取某月的日历网格（包含前后补齐天数） */
export function getMonthCalendar(year: number, month: number): { date: string; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startOffset = firstDay.getDay(); // 0=周日
  if (startOffset === 0) startOffset = 7; // 调整为周一开始
  startOffset -= 1;

  const cells: { date: string; isCurrentMonth: boolean }[] = [];

  // 上月补齐
  for (let i = startOffset; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    cells.push({ date: formatDate(d), isCurrentMonth: false });
  }

  // 当月
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    cells.push({ date: formatDate(d), isCurrentMonth: true });
  }

  // 下月补齐到 42 格（6 行）
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({ date: formatDate(d), isCurrentMonth: false });
  }

  return cells;
}

/** 计算月龄 */
export function getMonthAge(birthday: string): { months: number; days: number } {
  const birth = parseDate(birthday);
  const now = new Date();

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  return { months, days };
}

/** 格式化友好日期 */
export function formatFriendlyDate(dateStr: string): string {
  const d = parseDate(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[d.getDay()];
  return `${month}月${day}日（周${weekDay}）`;
}

/** 获取某月的记录统计 */
export function getMonthLabel(year: number, month: number): string {
  return `${year}年${month + 1}月`;
}
