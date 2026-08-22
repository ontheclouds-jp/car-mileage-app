import { PURPOSE_LABELS, type DailyLog } from "@/types/dailyLog";
import { formatDateTime } from "@/lib/utils/date";

const CSV_HEADERS = [
  "日付",
  "走行距離計(km)",
  "前回からの走行距離(km)",
  "用途",
  "給油",
  "給油量(L)",
  "燃費(km/L)",
  "メモ",
  "登録日時",
  "更新日時",
];

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** 走行記録の配列をCSV文字列（日付昇順、UTF-8 BOM付き）に変換する */
export function dailyLogsToCsv(logs: DailyLog[]): string {
  const sorted = [...logs].sort((a, b) => a.logDate.localeCompare(b.logDate));

  const rows = sorted.map((log) =>
    [
      log.logDate,
      String(log.odometerReading),
      log.distanceFromPrev === null ? "" : String(log.distanceFromPrev),
      PURPOSE_LABELS[log.purpose],
      log.isRefueled ? "あり" : "なし",
      log.fuelLiters === null ? "" : String(log.fuelLiters),
      log.fuelEfficiency === null ? "" : log.fuelEfficiency.toFixed(1),
      log.memo,
      formatDateTime(log.createdAt),
      formatDateTime(log.updatedAt),
    ]
      .map(escapeCsvField)
      .join(",")
  );

  const bom = "﻿";
  return bom + [CSV_HEADERS.join(","), ...rows].join("\r\n");
}
