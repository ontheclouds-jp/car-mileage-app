import { z } from "zod";
import { PURPOSE_OPTIONS } from "@/types/dailyLog";

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

/** JSONバックアップ（手動書き出し・クラウド自動バックアップ共通）の形式 */
export const backupFileSchema = z.object({
  appVersion: z.string(),
  exportedAt: z.string(),
  dailyLogs: z.array(backupDailyLogSchema),
});
