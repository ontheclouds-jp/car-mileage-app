import { getAllDailyLogsAscending } from "@/lib/repositories/dailyLogRepository";

export interface FuelHistoryEntry {
  id: string;
  logDate: string;
  fuelLiters: number;
  /** 直前の給油記録からの区間走行距離。初回給油の場合はnull */
  sectionDistance: number | null;
  /** この区間の燃費（km/L）。初回給油の場合はnull */
  fuelEfficiency: number | null;
}

/** 給油記録を日付の古い順に並べ、区間走行距離とともに返す */
export async function getFuelHistoryAscending(): Promise<FuelHistoryEntry[]> {
  const refuelLogs = (await getAllDailyLogsAscending()).filter((log) => log.isRefueled);

  return refuelLogs.map((log, index) => {
    const previous = index > 0 ? refuelLogs[index - 1] : undefined;
    return {
      id: log.id,
      logDate: log.logDate,
      fuelLiters: log.fuelLiters ?? 0,
      sectionDistance: previous ? log.odometerReading - previous.odometerReading : null,
      fuelEfficiency: log.fuelEfficiency,
    };
  });
}

/** 直近の給油区間の燃費を返す。給油記録がない、または初回給油のみの場合はnull */
export async function getLatestFuelEfficiency(): Promise<number | null> {
  const history = await getFuelHistoryAscending();
  if (history.length === 0) return null;
  return history[history.length - 1].fuelEfficiency;
}
