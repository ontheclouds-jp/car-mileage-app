import { getAllDailyLogsAscending } from "@/lib/repositories/dailyLogRepository";
import { monthPrefix } from "@/lib/utils/date";
import type { Purpose } from "@/types/dailyLog";

export interface MonthlyStats {
  year: number;
  month: number; // 1-12
  /** その月に記録された走行距離（前回記録からの差分）の合計 */
  totalDistance: number;
  /** 用途別の走行距離合計 */
  distanceByPurpose: Record<Purpose, number>;
  /** その月の給油回数 */
  refuelCount: number;
  /** その月の給油量合計（リットル） */
  fuelLitersTotal: number;
  /** その月に発生した給油区間の平均燃費。給油記録が1件もない場合はnull */
  averageFuelEfficiency: number | null;
  /** その月の通勤割（朝）利用回数 */
  commuteMorningCount: number;
  /** その月の通勤割（夕）利用回数 */
  commuteEveningCount: number;
  /** その月の通勤割利用回数の合計（朝＋夕） */
  commuteTotalCount: number;
}

/**
 * 指定した年月（1日〜末日）の用途別走行距離・給油量・平均燃費を集計する（9.3, 9.4）。
 * 月をまたぐ走行・給油区間は、記録日（給油日）側の月に計上する。
 */
export async function getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
  const prefix = monthPrefix(year, month);
  const logs = await getAllDailyLogsAscending();
  const monthLogs = logs.filter((log) => log.logDate.startsWith(prefix));

  const distanceByPurpose: Record<Purpose, number> = { work: 0, private: 0, other: 0 };
  let totalDistance = 0;
  let refuelCount = 0;
  let fuelLitersTotal = 0;
  const efficiencies: number[] = [];
  let commuteMorningCount = 0;
  let commuteEveningCount = 0;

  for (const log of monthLogs) {
    if (log.distanceFromPrev !== null) {
      totalDistance += log.distanceFromPrev;
      distanceByPurpose[log.purpose] += log.distanceFromPrev;
    }
    if (log.isRefueled) {
      refuelCount += 1;
      if (log.fuelLiters !== null) fuelLitersTotal += log.fuelLiters;
      if (log.fuelEfficiency !== null) efficiencies.push(log.fuelEfficiency);
    }
    if (log.isCommuteDiscountMorning) commuteMorningCount += 1;
    if (log.isCommuteDiscountEvening) commuteEveningCount += 1;
  }

  const averageFuelEfficiency =
    efficiencies.length > 0
      ? efficiencies.reduce((sum, v) => sum + v, 0) / efficiencies.length
      : null;

  return {
    year,
    month,
    totalDistance,
    distanceByPurpose,
    refuelCount,
    fuelLitersTotal,
    averageFuelEfficiency,
    commuteMorningCount,
    commuteEveningCount,
    commuteTotalCount: commuteMorningCount + commuteEveningCount,
  };
}

