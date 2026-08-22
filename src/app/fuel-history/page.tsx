"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { FuelHistoryChart } from "@/components/fuel/FuelHistoryChart";
import { FuelHistoryListItem } from "@/components/fuel/FuelHistoryListItem";
import { getFuelHistoryAscending } from "@/lib/repositories/fuelHistoryRepository";

export default function FuelHistoryPage() {
  const entries = useLiveQuery(() => getFuelHistoryAscending(), []);

  const efficiencies = (entries ?? [])
    .map((e) => e.fuelEfficiency)
    .filter((v): v is number => v !== null);

  const average =
    efficiencies.length > 0
      ? efficiencies.reduce((sum, v) => sum + v, 0) / efficiencies.length
      : null;
  const max = efficiencies.length > 0 ? Math.max(...efficiencies) : null;
  const min = efficiencies.length > 0 ? Math.min(...efficiencies) : null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div>
        <Link href="/" className="text-blue-600">
          ← ホームに戻る
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">燃費履歴</h1>

      {entries === undefined && <p className="text-gray-500">読み込み中...</p>}

      {entries && entries.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          給油記録がありません。走行記録の登録時に「給油した」をONにすると、ここに燃費の推移が表示されます。
        </p>
      )}

      {entries && entries.length > 0 && (
        <>
          <FuelHistoryChart entries={entries} />

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-xs text-gray-500">平均燃費</div>
              <div className="text-lg font-bold text-gray-900">
                {average !== null ? `${average.toFixed(1)}` : "-"}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-xs text-gray-500">最高燃費</div>
              <div className="text-lg font-bold text-gray-900">
                {max !== null ? `${max.toFixed(1)}` : "-"}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-xs text-gray-500">最低燃費</div>
              <div className="text-lg font-bold text-gray-900">
                {min !== null ? `${min.toFixed(1)}` : "-"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {[...entries].reverse().map((entry) => (
              <FuelHistoryListItem key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
