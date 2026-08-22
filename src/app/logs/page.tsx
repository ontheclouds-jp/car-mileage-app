"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/Button";
import { LogListItem } from "@/components/logs/LogListItem";
import {
  LogFilterBar,
  type PeriodMode,
  type PurposeFilter,
  type SortOrder,
} from "@/components/logs/LogFilterBar";
import { getAllDailyLogs } from "@/lib/repositories/dailyLogRepository";
import { getCurrentYearMonth, getPreviousYearMonth, monthPrefix } from "@/lib/utils/date";
import type { DailyLog } from "@/types/dailyLog";

export default function LogsPage() {
  const logs = useLiveQuery(() => getAllDailyLogs(), []);

  const [periodMode, setPeriodMode] = useState<PeriodMode>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>("all");
  const [refuelOnly, setRefuelOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredLogs = useMemo(() => {
    if (!logs) return undefined;

    const matchesPeriod = (log: DailyLog): boolean => {
      if (periodMode === "all") return true;
      if (periodMode === "thisMonth") {
        const { year, month } = getCurrentYearMonth();
        return log.logDate.startsWith(monthPrefix(year, month));
      }
      if (periodMode === "lastMonth") {
        const current = getCurrentYearMonth();
        const { year, month } = getPreviousYearMonth(current.year, current.month);
        return log.logDate.startsWith(monthPrefix(year, month));
      }
      // custom
      if (customFrom && log.logDate < customFrom) return false;
      if (customTo && log.logDate > customTo) return false;
      return true;
    };

    const result = logs.filter(
      (log) =>
        matchesPeriod(log) &&
        (purposeFilter === "all" || log.purpose === purposeFilter) &&
        (!refuelOnly || log.isRefueled)
    );

    // logsはgetAllDailyLogsにより新しい順で取得済み
    return sortOrder === "desc" ? result : [...result].reverse();
  }, [logs, periodMode, customFrom, customTo, purposeFilter, refuelOnly, sortOrder]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">走行記録一覧</h1>
        <Link href="/logs/new">
          <Button>＋ 新規登録</Button>
        </Link>
      </div>

      <LogFilterBar
        periodMode={periodMode}
        onPeriodModeChange={setPeriodMode}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
        purposeFilter={purposeFilter}
        onPurposeFilterChange={setPurposeFilter}
        refuelOnly={refuelOnly}
        onRefuelOnlyChange={setRefuelOnly}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {filteredLogs === undefined && <p className="text-gray-500">読み込み中...</p>}

      {filteredLogs && logs && logs.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          まだ記録がありません。「＋ 新規登録」から最初の記録を登録しましょう。
        </p>
      )}

      {filteredLogs && logs && logs.length > 0 && filteredLogs.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          条件に一致する記録がありません。
        </p>
      )}

      {filteredLogs && filteredLogs.length > 0 && (
        <div className="flex flex-col gap-2">
          {filteredLogs.map((log) => (
            <LogListItem key={log.id} log={log} />
          ))}
        </div>
      )}

      <Link href="/fuel-history" className="text-center text-blue-600">
        燃費履歴を見る →
      </Link>
      <Link href="/" className="text-center text-blue-600">
        ホームに戻る
      </Link>
    </div>
  );
}
