import { db } from "@/lib/db/db";
import type { DailyLog } from "@/types/dailyLog";
import { APP_VERSION } from "@/lib/appInfo";
import { backupFileSchema } from "@/lib/validation/backupSchema";

export class InvalidBackupFileError extends Error {
  constructor() {
    super("バックアップファイルの形式が正しくありません");
    this.name = "InvalidBackupFileError";
  }
}

export interface BackupData {
  appVersion: string;
  exportedAt: string;
  dailyLogs: DailyLog[];
}

/** 全データをバックアップ用のオブジェクトとして組み立てる */
export async function buildBackupData(): Promise<BackupData> {
  const dailyLogs = await db.dailyLogs.orderBy("logDate").toArray();
  return {
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    dailyLogs,
  };
}

/** 全データをバックアップ用JSON文字列として書き出す */
export async function exportBackupJson(): Promise<string> {
  return JSON.stringify(await buildBackupData(), null, 2);
}

/** バックアップJSON文字列を検証し、全データを置き換える形で復元する */
export async function restoreBackupJson(jsonText: string): Promise<number> {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new InvalidBackupFileError();
  }

  const result = backupFileSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new InvalidBackupFileError();
  }

  const dailyLogs = result.data.dailyLogs as DailyLog[];

  await db.transaction("rw", db.dailyLogs, async () => {
    await db.dailyLogs.clear();
    await db.dailyLogs.bulkPut(dailyLogs);
  });

  return dailyLogs.length;
}

/** 全ての走行記録を削除する */
export async function deleteAllDailyLogs(): Promise<void> {
  await db.dailyLogs.clear();
}
