import { format, parseISO, startOfDay, isAfter } from "date-fns";
import { ja } from "date-fns/locale";

/** 今日の日付を "YYYY-MM-DD" 形式で返す */
export function todayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** 対象の日付文字列が今日より未来かどうか */
export function isFutureDate(dateStr: string): boolean {
  const target = startOfDay(parseISO(dateStr));
  const today = startOfDay(new Date());
  return isAfter(target, today);
}

/** "YYYY-MM-DD" を "YYYY年M月D日(曜)" 形式で表示 */
export function formatDateForDisplay(dateStr: string): string {
  return format(parseISO(dateStr), "yyyy年M月d日(E)", { locale: ja });
}

/** ISO日時を "YYYY/MM/DD HH:mm" 形式で表示 */
export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "yyyy/MM/dd HH:mm");
}

/** "YYYY-MM-DD" を "M/D" の短い形式で表示（グラフの軸ラベル用） */
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "M/d");
}

/** 今日時点の年・月（1〜12）を返す */
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** 年・月を「YYYY年M月」形式で表示 */
export function formatYearMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

/** 年・月から "YYYY-MM" 形式のプレフィックス（log_dateの前方一致用）を返す */
export function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** 指定した年・月の前月の年・月を返す */
export function getPreviousYearMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}
