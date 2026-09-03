import Dexie, { type Table } from "dexie";
import type { DailyLog } from "@/types/dailyLog";

export class AppDatabase extends Dexie {
  dailyLogs!: Table<DailyLog, string>;

  constructor() {
    super("CarMileageAppDB");
    this.version(1).stores({
      // id: 主キー, logDate: 日付検索・並び替え用インデックス
      dailyLogs: "id, logDate",
    });
    // v2: 通勤割（朝・夕）チェック機能の追加。既存レコードにデフォルト値を補完する
    this.version(2)
      .stores({
        dailyLogs: "id, logDate",
      })
      .upgrade((tx) =>
        tx
          .table("dailyLogs")
          .toCollection()
          .modify((log) => {
            if (log.isCommuteDiscountMorning === undefined) log.isCommuteDiscountMorning = false;
            if (log.isCommuteDiscountEvening === undefined) log.isCommuteDiscountEvening = false;
          })
      );
  }
}

export const db = new AppDatabase();
