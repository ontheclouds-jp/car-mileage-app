"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/Button";
import { PurposeBreakdownBar } from "@/components/monthly/PurposeBreakdownBar";
import { getAllDailyLogsAscending } from "@/lib/repositories/dailyLogRepository";
import { getMonthlyStats } from "@/lib/repositories/monthlyStatsRepository";
import { dailyLogsToCsv } from "@/lib/csv";
import { downloadTextFile } from "@/lib/utils/download";
import { formatYearMonth, getCurrentYearMonth, monthPrefix } from "@/lib/utils/date";

export default function MonthlyStatsPage() {
  const initial = getCurrentYearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);

  const stats = useLiveQuery(() => getMonthlyStats(year, month), [year, month]);

  const monthInputValue = `${year}-${String(month).padStart(2, "0")}`;

  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m] = e.target.value.split("-").map(Number);
    setYear(y);
    setMonth(m);
  };

  const goPrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleExportCsv = async () => {
    const prefix = monthPrefix(year, month);
    const logs = (await getAllDailyLogsAscending()).filter((l) => l.logDate.startsWith(prefix));
    const csv = dailyLogsToCsv(logs);
    downloadTextFile(`mycar-driving-log_${prefix}.csv`, csv, "text/csv;charset=utf-8");
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div>
        <Link href="/" className="text-blue-600">
          ← ホームに戻る
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">月次集計</h1>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={goPrevMonth}
          aria-label="前の月"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg"
        >
          ←
        </button>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-gray-900">{formatYearMonth(year, month)}</span>
          <input
            type="month"
            value={monthInputValue}
            onChange={handleMonthInputChange}
            className="mt-1 text-sm text-gray-500"
          />
        </div>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="次の月"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg"
        >
          →
        </button>
      </div>

      {stats === undefined ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">走行距離合計</p>
            <p className="mt-1 text-3xl font-bold text-blue-700">
              {stats.totalDistance.toLocaleString()} km
            </p>
            <div className="mt-4">
              <PurposeBreakdownBar
                distanceByPurpose={stats.distanceByPurpose}
                total={stats.totalDistance}
              />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">給油</p>
            <p className="mt-1 text-base text-gray-900">
              給油回数：<span className="text-xl font-bold">{stats.refuelCount}</span> 回 ／
              給油量合計：
              <span className="text-xl font-bold">{stats.fuelLitersTotal.toLocaleString()}</span>{" "}
              L
            </p>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">平均燃費</p>
            {stats.averageFuelEfficiency === null ? (
              <p className="mt-1 text-base text-gray-500">この月は給油記録がありません</p>
            ) : (
              <p className="mt-1 text-3xl font-bold text-blue-700">
                {stats.averageFuelEfficiency.toFixed(1)} km/L
              </p>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">通勤割利用回数</p>
            <p className="mt-1 text-3xl font-bold text-indigo-700">
              {stats.commuteTotalCount.toLocaleString()} 回
            </p>
            <p className="mt-1 text-sm text-gray-600">
              朝：{stats.commuteMorningCount.toLocaleString()} 回 ／ 夕：
              {stats.commuteEveningCount.toLocaleString()} 回
            </p>
          </section>

          <Button variant="secondary" className="w-full" onClick={handleExportCsv}>
            この月の記録をCSVで書き出す
          </Button>
        </>
      )}

      <div className="flex flex-col gap-2">
        <Link href="/logs">
          <Button variant="ghost" className="w-full justify-start">
            走行記録一覧を見る →
          </Button>
        </Link>
        <Link href="/fuel-history">
          <Button variant="ghost" className="w-full justify-start">
            燃費履歴を見る →
          </Button>
        </Link>
      </div>
    </div>
  );
}
