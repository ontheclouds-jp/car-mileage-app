export const APP_NAME = "マイカー走行日誌";
export const APP_VERSION = "v1.6.0";
export const APP_LAST_UPDATED = "2026-09-03";
export const APP_DEVELOPER = "Claude Codeで作成";

export interface ChangelogEntry {
  version: string;
  date: string;
  description: string;
}

// 新しいバージョンが先頭にくるように追加する
export const APP_CHANGELOG: ChangelogEntry[] = [
  {
    version: "v1.6.0",
    date: "2026-09-03",
    description: "通勤割（朝・夕）チェック機能と月間サマリーへの回数表示を追加",
  },
];
