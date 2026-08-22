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
  }
}

export const db = new AppDatabase();
