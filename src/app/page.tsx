"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/Button";
import { PurposeBadge } from "@/components/logs/PurposeBadge";
import { PurposeBreakdownBar } from "@/components/monthly/PurposeBreakdownBar";
import {
  findDailyLogByDate,
  getAllDailyLogs,
} from "@/lib/repositories/dailyLogRepository";
import { getLatestFuelEfficiency } from "@/lib/repositories/fuelHistoryRepository";
import { getMonthlyStats } from "@/lib/repositories/monthlyStatsRepository";
import { formatDateForDisplay, formatYearMonth, getCurrentYearMonth, todayStr } from "@/lib/utils/date";

export default function Home() {
  const today = todayStr();
  const { year, month } = getCurrentYearMonth();

  const todayLog = useLiveQuery(
    () => findDailyLogByDate(today).then((l) => l ?? null),
    [today]
  );
  const allLogs = useLiveQuery(() => getAllDailyLogs(), []);
  const monthlyStats = useLiveQuery(() => getMonthlyStats(year, month), [year, month]);
  const latestFuelEfficiency = useLiveQuery(() => getLatestFuelEfficiency(), []);

  const hasNoRecords = allLogs !== undefined && allLogs.length === 0;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 p-4">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">マイカー走行日誌</h1>
        <p className="mt-1 text-base text-gray-600">{formatDateForDisplay(today)}</p>
      </header>

      {hasNoRecords && (
        <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          まだ記録がありません。まずは今日の走行距離計の読みを登録してみましょう。使い方は
          <Link href="/help" className="font-medium underline">
            ヘルプ
          </Link>
          をご覧ください。
        </p>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        {todayLog === undefined ? (
          <p className="text-gray-500">読み込み中...</p>
        ) : todayLog === null ? (
          <>
            <p className="text-base text-gray-700">今日の記録はまだ入力されていません。</p>
            <Link href="/logs/new" className="mt-3 block">
              <Button className="w-full">今日の記録を入力する</Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">今日の記録</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                {todayLog.odometerReading.toLocaleString()} km
              </span>
              <PurposeBadge purpose={todayLog.purpose} />
            </div>
            <p className="mt-1 text-base">
              {todayLog.distanceFromPrev === null ? (
                <span className="text-gray-500">初回記録</span>
              ) : (
                <span className="font-bold text-blue-700">
                  前回から {todayLog.distanceFromPrev.toLocaleString()} km 走行
                </span>
              )}
            </p>
            <Link href={`/logs/${todayLog.id}`} className="mt-3 block">
              <Button variant="secondary" className="w-full">
                今日の記録を確認・編集する
              </Button>
            </Link>
          </>
        )}
      </section>

      {!hasNoRecords && (
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">{formatYearMonth(year, month)}のサマリー</p>

          {monthlyStats === undefined ? (
            <p className="mt-1 text-gray-500">読み込み中...</p>
          ) : (
            <>
              <p className="mt-1 text-3xl font-bold text-blue-700">
                {monthlyStats.totalDistance.toLocaleString()} km
              </p>
              <div className="mt-3">
                <PurposeBreakdownBar
                  distanceByPurpose={monthlyStats.distanceByPurpose}
                  total={monthlyStats.totalDistance}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                <div>
                  <p className="text-xs text-gray-500">給油回数・給油量</p>
                  <p className="text-base font-bold text-gray-900">
                    {monthlyStats.refuelCount}回 ／ {monthlyStats.fuelLitersTotal.toLocaleString()}L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">直近の燃費</p>
                  <p className="text-base font-bold text-gray-900">
                    {latestFuelEfficiency === undefined
                      ? "-"
                      : latestFuelEfficiency === null
                        ? "-"
                        : `${latestFuelEfficiency.toFixed(1)} km/L`}
                  </p>
                </div>
              </div>
            </>
          )}

          <Link href="/monthly" className="mt-3 block">
            <Button variant="secondary" className="w-full">
              月次集計を見る
            </Button>
          </Link>
        </section>
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
        <Link href="/settings">
          <Button variant="ghost" className="w-full justify-start">
            設定 →
          </Button>
        </Link>
      </div>
    </div>
  );
}
