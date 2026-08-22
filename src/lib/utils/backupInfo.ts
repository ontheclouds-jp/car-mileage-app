const LAST_BACKUP_AT_KEY = "carMileageApp.lastBackupAt";

/** 最終バックアップ日時（ISO文字列）を取得する。未取得の場合はnull */
export function getLastBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_BACKUP_AT_KEY);
  } catch {
    return null;
  }
}

/** 最終バックアップ日時を現在時刻で記録する */
export function recordBackupNow(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_BACKUP_AT_KEY, new Date().toISOString());
  } catch {
    // localStorageが使用できない環境では何もしない
  }
}
