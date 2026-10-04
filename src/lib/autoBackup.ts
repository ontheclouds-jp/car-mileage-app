import { buildBackupData } from "@/lib/repositories/backupRepository";

const LAST_AUTO_BACKUP_AT_KEY = "carMileageApp.lastAutoBackupAt";

/** 最終自動バックアップ日時（ISO文字列）を取得する。未実施の場合はnull */
export function getLastAutoBackupAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_AUTO_BACKUP_AT_KEY);
  } catch {
    return null;
  }
}

function setLastAutoBackupAt(isoDate: string): void {
  try {
    window.localStorage.setItem(LAST_AUTO_BACKUP_AT_KEY, isoDate);
  } catch {
    // localStorageが使用できない環境では何もしない
  }
}

let running = false;
let pending = false;

/**
 * クラウド（Vercel Blob）への自動バックアップをfire-and-forgetで実行する（spec 11.4）。
 * 失敗してもユーザーには通知せず、コンソールにログを残すのみとする（呼び出し元の保存処理を妨げないため）。
 * 実行中に再度呼ばれた場合は、完了後に最新データでもう一度送信する（古いデータでの上書きを防ぐため）。
 */
export function triggerAutoBackup(): void {
  if (typeof window === "undefined") return;
  if (running) {
    pending = true;
    return;
  }
  void runAutoBackup();
}

async function runAutoBackup(): Promise<void> {
  running = true;
  try {
    do {
      pending = false;
      await performAutoBackup();
    } while (pending);
  } finally {
    running = false;
  }
}

async function performAutoBackup(): Promise<void> {
  try {
    const data = await buildBackupData();
    // サイトデータ消失直後や全データ削除後に、空データでクラウド上のバックアップを上書きしない
    if (data.dailyLogs.length === 0) return;
    const res = await fetch("/api/auto-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`auto-backup request failed with status ${res.status}`);
    }
    setLastAutoBackupAt(new Date().toISOString());
  } catch (err) {
    console.error("[auto-backup] 自動バックアップに失敗しました", err);
  }
}
