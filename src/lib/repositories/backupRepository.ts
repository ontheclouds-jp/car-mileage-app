import { z } from "zod";
import { db } from "@/lib/db/db";
import { PURPOSE_OPTIONS, type DailyLog } from "@/types/dailyLog";
import { APP_VERSION } from "@/lib/appInfo";

const backupDailyLogSchema = z.object({
  id: z.string(),
  logDate: z.string(),
  odometerReading: z.number(),
  distanceFromPrev: z.number().nullable(),
  purpose: z.enum(PURPOSE_OPTIONS as [string, ...string[]]),
  isRefueled: z.boolean(),
  fuelLiters: z.number().nullable(),
  fuelEfficiency: z.number().nullable(),
  isCommuteDiscountMorning: z.boolean().default(false),
  isCommuteDiscountEvening: z.boolean().default(false),
  memo: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const backupFileSchema = z.object({
  appVersion: z.string(),
  exportedAt: z.string(),
  dailyLogs: z.array(backupDailyLogSchema),
});

export class InvalidBackupFileError extends Error {
  constructor() {
    super("バックアップファイルの形式が正しくありません");
    this.name = "InvalidBackupFileError";
  }
}

/** 全データをバックアップ用JSON文字列として書き出す */
export async function exportBackupJson(): Promise<string> {
  const dailyLogs = await db.dailyLogs.orderBy("logDate").toArray();
  const backup = {
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    dailyLogs,
  };
  return JSON.stringify(backup, null, 2);
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
