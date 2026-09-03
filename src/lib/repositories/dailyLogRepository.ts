import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db/db";
import type { DailyLog, DailyLogInput } from "@/types/dailyLog";

/** 走行距離計の値が直前の記録より小さい場合のエラー */
export class OdometerBackwardError extends Error {
  constructor(public readonly previous: DailyLog) {
    super(
      `走行距離計の値が前回の記録（${previous.logDate}：${previous.odometerReading}km）より小さくなっています。入力内容を確認してください`
    );
    this.name = "OdometerBackwardError";
  }
}

/** 走行距離計の値が次の記録より大きい場合のエラー（間に記録を挿入するケース） */
export class OdometerExceedsNextError extends Error {
  constructor(public readonly next: DailyLog) {
    super(
      `走行距離計の値が次の記録（${next.logDate}：${next.odometerReading}km）より大きくなっています。入力内容を確認してください`
    );
    this.name = "OdometerExceedsNextError";
  }
}

/** 同じ日付の記録が既に存在する場合に投げる（呼び出し側で上書き確認を行う） */
export class DuplicateDateError extends Error {
  constructor(public readonly existing: DailyLog) {
    super(`${existing.logDate} の記録は既に存在します`);
    this.name = "DuplicateDateError";
  }
}

async function getAllSorted(): Promise<DailyLog[]> {
  return db.dailyLogs.orderBy("logDate").toArray();
}

/** 全ての走行記録を日付の古い順で取得する */
export async function getAllDailyLogsAscending(): Promise<DailyLog[]> {
  return getAllSorted();
}

export async function getAllDailyLogs(): Promise<DailyLog[]> {
  const logs = await getAllSorted();
  return logs.reverse(); // 新しい日付順
}

export async function getDailyLogById(id: string): Promise<DailyLog | undefined> {
  return db.dailyLogs.get(id);
}

export async function findDailyLogByDate(
  logDate: string,
  excludeId?: string
): Promise<DailyLog | undefined> {
  const matches = await db.dailyLogs.where("logDate").equals(logDate).toArray();
  return matches.find((l) => l.id !== excludeId);
}

/** 指定日付より前で最も近い記録を取得する */
export async function getPreviousLog(
  logDate: string,
  excludeId?: string
): Promise<DailyLog | undefined> {
  const all = await getAllSorted();
  let prev: DailyLog | undefined;
  for (const l of all) {
    if (l.id === excludeId) continue;
    if (l.logDate < logDate) {
      prev = l;
    } else {
      break;
    }
  }
  return prev;
}

/** 指定日付より後で最も近い記録を取得する */
export async function getNextLog(
  logDate: string,
  excludeId?: string
): Promise<DailyLog | undefined> {
  const all = await getAllSorted();
  return all.find((l) => l.id !== excludeId && l.logDate > logDate);
}

/** 指定日付より前で最も近い給油記録を取得する */
export async function getPreviousRefuelLog(
  logDate: string,
  excludeId?: string
): Promise<DailyLog | undefined> {
  const all = await getAllSorted();
  let prev: DailyLog | undefined;
  for (const l of all) {
    if (l.id === excludeId || !l.isRefueled) continue;
    if (l.logDate < logDate) {
      prev = l;
    } else {
      break;
    }
  }
  return prev;
}

/** 指定日付より後で最も近い給油記録を取得する */
export async function getNextRefuelLog(
  logDate: string,
  excludeId?: string
): Promise<DailyLog | undefined> {
  const all = await getAllSorted();
  return all.find((l) => l.id !== excludeId && l.isRefueled && l.logDate > logDate);
}

/** 給油区間の燃費（km/L）を計算する。直前の給油記録がない場合はnull */
function calcFuelEfficiency(
  odometerReading: number,
  fuelLiters: number | null,
  previousRefuel: DailyLog | undefined
): number | null {
  if (!previousRefuel || fuelLiters === null || fuelLiters <= 0) return null;
  return (odometerReading - previousRefuel.odometerReading) / fuelLiters;
}

async function recalcFollowingDistance(afterDate: string, excludeId?: string): Promise<void> {
  const next = await getNextLog(afterDate, excludeId);
  if (!next) return;
  const previous = await getPreviousLog(next.logDate, next.id);
  const newDistance = previous ? next.odometerReading - previous.odometerReading : null;
  if (newDistance !== next.distanceFromPrev) {
    await db.dailyLogs.update(next.id, {
      distanceFromPrev: newDistance,
      updatedAt: new Date().toISOString(),
    });
  }
}

/** 直後の給油記録の燃費を、直前の給油記録を基準に再計算する（9.5） */
async function recalcFollowingFuelEfficiency(afterDate: string, excludeId?: string): Promise<void> {
  const nextRefuel = await getNextRefuelLog(afterDate, excludeId);
  if (!nextRefuel) return;
  const previousRefuel = await getPreviousRefuelLog(nextRefuel.logDate, nextRefuel.id);
  const newEfficiency = calcFuelEfficiency(
    nextRefuel.odometerReading,
    nextRefuel.fuelLiters,
    previousRefuel
  );
  if (newEfficiency !== nextRefuel.fuelEfficiency) {
    await db.dailyLogs.update(nextRefuel.id, {
      fuelEfficiency: newEfficiency,
      updatedAt: new Date().toISOString(),
    });
  }
}

export interface SaveDailyLogOptions {
  /** 編集対象の記録ID（新規登録の場合は省略） */
  id?: string;
  /** 同一日付の記録が既に存在する場合に上書きするか */
  confirmOverwrite?: boolean;
}

/**
 * 走行記録を新規登録・更新する。
 * 直前記録との差分（走行距離）を自動計算し、直前・直後の整合性チェックを行う。
 */
export async function saveDailyLog(
  input: DailyLogInput,
  options: SaveDailyLogOptions = {}
): Promise<DailyLog> {
  const { id } = options;

  const duplicate = await findDailyLogByDate(input.logDate, id);
  if (duplicate && !options.confirmOverwrite) {
    throw new DuplicateDateError(duplicate);
  }

  // 上書き確認済みの場合は、既存の同日記録に統合する
  const targetId = duplicate && options.confirmOverwrite ? duplicate.id : id ?? uuidv4();

  const previous = await getPreviousLog(input.logDate, targetId);
  if (previous && input.odometerReading < previous.odometerReading) {
    throw new OdometerBackwardError(previous);
  }

  const next = await getNextLog(input.logDate, targetId);
  if (next && input.odometerReading > next.odometerReading) {
    throw new OdometerExceedsNextError(next);
  }

  const distanceFromPrev = previous ? input.odometerReading - previous.odometerReading : null;
  const now = new Date().toISOString();
  const existingRecord = await getDailyLogById(targetId);
  const oldLogDate = existingRecord?.logDate;

  const fuelLiters = input.isRefueled ? input.fuelLiters : null;
  const previousRefuel = input.isRefueled
    ? await getPreviousRefuelLog(input.logDate, targetId)
    : undefined;
  const fuelEfficiency = input.isRefueled
    ? calcFuelEfficiency(input.odometerReading, fuelLiters, previousRefuel)
    : null;

  const record: DailyLog = {
    id: targetId,
    logDate: input.logDate,
    odometerReading: input.odometerReading,
    distanceFromPrev,
    purpose: input.purpose,
    isRefueled: input.isRefueled,
    fuelLiters,
    fuelEfficiency,
    isCommuteDiscountMorning: input.isCommuteDiscountMorning,
    isCommuteDiscountEvening: input.isCommuteDiscountEvening,
    memo: input.memo,
    createdAt: existingRecord?.createdAt ?? now,
    updatedAt: now,
  };

  await db.transaction("rw", db.dailyLogs, async () => {
    await db.dailyLogs.put(record);
    // 編集で日付を変更した結果、既存の別記録に統合された場合は元の行を削除する
    if (id && id !== targetId) {
      await db.dailyLogs.delete(id);
    }
  });

  await recalcFollowingDistance(record.logDate, record.id);
  await recalcFollowingFuelEfficiency(record.logDate, record.id);
  // 編集で日付を変更した場合、元の日付側に残る記録の再計算も行う
  if (oldLogDate && oldLogDate !== record.logDate) {
    await recalcFollowingDistance(oldLogDate, record.id);
    await recalcFollowingFuelEfficiency(oldLogDate, record.id);
  }

  return record;
}

/** 記録を削除し、直後の記録の走行距離・燃費を再計算する（9.5） */
export async function deleteDailyLog(id: string): Promise<void> {
  const target = await getDailyLogById(id);
  if (!target) return;
  await db.dailyLogs.delete(id);
  await recalcFollowingDistance(target.logDate, id);
  await recalcFollowingFuelEfficiency(target.logDate, id);
}
