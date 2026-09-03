import Link from "next/link";
import { PurposeBadge } from "./PurposeBadge";
import { formatDateForDisplay } from "@/lib/utils/date";
import { commuteDiscountCount, type DailyLog } from "@/types/dailyLog";

export function LogListItem({ log }: { log: DailyLog }) {
  const commuteCount = commuteDiscountCount(log);
  return (
    <Link
      href={`/logs/${log.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900">
            {formatDateForDisplay(log.logDate)}
          </span>
          <PurposeBadge purpose={log.purpose} />
          {log.isRefueled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-800">
              ⛽ {log.fuelLiters}L
            </span>
          )}
          {commuteCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-sm font-medium text-indigo-800">
              <span
                title="朝の通勤割"
                className={log.isCommuteDiscountMorning ? "" : "opacity-30"}
              >
                🌅
              </span>
              <span
                title="夕の通勤割"
                className={log.isCommuteDiscountEvening ? "" : "opacity-30"}
              >
                🌆
              </span>
              {commuteCount}回
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          走行距離計：{log.odometerReading.toLocaleString()} km
        </div>
      </div>
      <div className="shrink-0 text-right">
        {log.distanceFromPrev === null ? (
          <span className="text-sm text-gray-400">初回記録</span>
        ) : (
          <span className="text-xl font-bold text-blue-700">
            {log.distanceFromPrev.toLocaleString()} km
          </span>
        )}
      </div>
    </Link>
  );
}
