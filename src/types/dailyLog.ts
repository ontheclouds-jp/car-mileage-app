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
  memo: string;
}
