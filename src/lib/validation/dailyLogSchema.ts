import { z } from "zod";
import { isFutureDate } from "@/lib/utils/date";
import { PURPOSE_OPTIONS } from "@/types/dailyLog";

// 8.1 走行記録の入力チェック
export const dailyLogFormSchema = z
  .object({
    logDate: z
      .string()
      .min(1, "日付は必須です")
      .refine((val) => !Number.isNaN(Date.parse(val)), "日付の形式が正しくありません")
      .refine((val) => !isFutureDate(val), "未来の日付は入力できません"),
    odometerReading: z
      .number({ error: "走行距離計の読みは数値で入力してください" })
      .int("走行距離計の読みは整数で入力してください")
      .min(0, "走行距離計の読みは0以上で入力してください"),
    purpose: z.enum(PURPOSE_OPTIONS as [string, ...string[]], {
      error: "用途を選択してください",
    }),
    isRefueled: z.boolean(),
    fuelLiters: z.number().nullable(),
    memo: z.string().max(500, "メモは500文字以内で入力してください"),
  })
  .superRefine((data, ctx) => {
    if (data.isRefueled) {
      if (data.fuelLiters === null || data.fuelLiters === undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["fuelLiters"],
          message: "給油した場合は給油量を入力してください",
        });
      } else if (Number.isNaN(data.fuelLiters) || data.fuelLiters <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["fuelLiters"],
          message: "給油量は0より大きい数値を入力してください",
        });
      }
    }
  });

export type DailyLogFormValues = z.infer<typeof dailyLogFormSchema>;
