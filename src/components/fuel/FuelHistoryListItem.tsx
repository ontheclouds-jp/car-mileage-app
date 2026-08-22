import Link from "next/link";
import { formatDateForDisplay } from "@/lib/utils/date";
import type { FuelHistoryEntry } from "@/lib/repositories/fuelHistoryRepository";

export function FuelHistoryListItem({ entry }: { entry: FuelHistoryEntry }) {
  return (
    <Link
      href={`/logs/${entry.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
    >
      <div>
        <div className="text-base font-semibold text-gray-900">
          {formatDateForDisplay(entry.logDate)}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          給油量：{entry.fuelLiters} L
          {entry.sectionDistance !== null && (
            <> ／ 区間走行距離：{entry.sectionDistance.toLocaleString()} km</>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {entry.fuelEfficiency === null ? (
          <span className="text-sm text-gray-400">初回給油</span>
        ) : (
          <span className="text-xl font-bold text-blue-700">
            {entry.fuelEfficiency.toFixed(1)} km/L
          </span>
        )}
      </div>
    </Link>
  );
}
