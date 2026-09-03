export type Purpose = "work" | "private" | "other";

export const PURPOSE_OPTIONS: Purpose[] = ["work", "private", "other"];

export const PURPOSE_LABELS: Record<Purpose, string> = {
  work: "仕事",
  private: "プライベート",
  other: "その他",
};

// 10.1: 用途は色分け表示する（仕事＝青、プライベート＝緑、その他＝グレー）
export const PURPOSE_COLOR_CLASSES: Record<Purpose, string> = {
  work: "bg-blue-100 text-blue-800 border-blue-300",
  private: "bg-green-100 text-green-800 border-green-300",
  other: "bg-gray-100 text-gray-700 border-gray-300",
};

// daily_logs テーブル（spec 7.1）
export interface DailyLog {
  id: string;
  logDate: string; // "YYYY-MM-DD"
  odometerReading: number;
  distanceFromPrev: number | null;
  purpose: Purpose;
  isRefueled: boolean;
  fuelLiters: number | null;
  fuelEfficiency: number | null; // 第2段階で計算対象。第1段階では常にnull
  isCommuteDiscountMorning: boolean; // 通勤割（朝）利用の有無
  isCommuteDiscountEvening: boolean; // 通勤割（夕）利用の有無
  memo: string;
  createdAt: string; // ISO日時
  updatedAt: string; // ISO日時
}

// フォーム入力から受け取る値
export interface DailyLogInput {
  logDate: string;
  odometerReading: number;
  purpose: Purpose;
  isRefueled: boolean;
  fuelLiters: number | null;
  isCommuteDiscountMorning: boolean;
  isCommuteDiscountEvening: boolean;
  memo: string;
}

/** その日の通勤割利用回数（朝＋夕、0〜2回）を返す */
export function commuteDiscountCount(log: {
  isCommuteDiscountMorning: boolean;
  isCommuteDiscountEvening: boolean;
}): number {
  return (log.isCommuteDiscountMorning ? 1 : 0) + (log.isCommuteDiscountEvening ? 1 : 0);
}
