/** 日付まわりの純粋関数。日付キーは端末のローカル日付の "YYYY-MM-DD"。 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=日, 1=月 ... 6=土

/** 画面に表示する順番（月曜はじまり） */
export const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: '日',
  1: '月',
  2: '火',
  3: '水',
  4: '木',
  5: '金',
  6: '土',
};

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" → ローカル正午の Date（夏時間などで日付がずれないよう正午を使う） */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateKey(fromDateKey(value)) === value;
}

export function addDays(key: string, days: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function weekdayOf(key: string): Weekday {
  return fromDateKey(key).getDay() as Weekday;
}

export type DayTarget = 'today' | 'tomorrow';

export function targetDateKey(now: Date, target: DayTarget): string {
  const today = toDateKey(now);
  return target === 'today' ? today : addDays(today, 1);
}

/** 起動時の初期表示：お昼まで＝きょう、お昼から＝あした（前の晩に準備する想定） */
export function defaultTarget(now: Date): DayTarget {
  return now.getHours() < 12 ? 'today' : 'tomorrow';
}

/** 例: 10月13日（火） */
export function formatDateJa(key: string): string {
  const d = fromDateKey(key);
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAY_LABELS[d.getDay() as Weekday]}）`;
}
