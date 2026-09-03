"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PurposeBadge } from "@/components/logs/PurposeBadge";
import { deleteDailyLog, getDailyLogById } from "@/lib/repositories/dailyLogRepository";
import { formatDateForDisplay, formatDateTime } from "@/lib/utils/date";
import { commuteDiscountCount } from "@/types/dailyLog";

export function LogDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const log = useLiveQuery(() => getDailyLogById(id).then((l) => l ?? null), [id]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (log === undefined) {
    return <p className="p-4 text-gray-500">読み込み中...</p>;
  }

  if (log === null) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
        <p className="text-gray-700">記録が見つかりませんでした。</p>
        <Link href="/logs" className="text-blue-600">
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDailyLog(id);
      router.push("/logs");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div>
        <Link href="/logs" className="text-blue-600">
          ← 一覧に戻る
        </Link>
      </div>

      <h1 className="text-xl font-bold text-gray-900">{formatDateForDisplay(log.logDate)}</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-sm text-gray-500">走行距離計の読み</dt>
            <dd className="text-xl font-bold text-gray-900">
              {log.odometerReading.toLocaleString()} km
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">前回記録からの走行距離</dt>
            <dd className="text-xl font-bold text-blue-700">
              {log.distanceFromPrev === null
                ? "初回記録"
                : `${log.distanceFromPrev.toLocaleString()} km`}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">用途</dt>
            <dd>
              <PurposeBadge purpose={log.purpose} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">給油</dt>
            <dd className="text-base text-gray-900">
              {log.isRefueled ? `給油あり（${log.fuelLiters} L）` : "給油なし"}
            </dd>
          </div>
          {log.isRefueled && (
            <div>
              <dt className="text-sm text-gray-500">この区間の燃費</dt>
              <dd className="text-xl font-bold text-blue-700">
                {log.fuelEfficiency === null
                  ? "初回の給油のため燃費は計算できません"
                  : `${log.fuelEfficiency.toFixed(1)} km/L`}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-500">通勤割</dt>
            <dd className="text-base text-gray-900">
              朝：{log.isCommuteDiscountMorning ? "利用あり" : "利用なし"} ／ 夕：
              {log.isCommuteDiscountEvening ? "利用あり" : "利用なし"}（
              {commuteDiscountCount(log)}回）
            </dd>
          </div>
          {log.memo && (
            <div>
              <dt className="text-sm text-gray-500">メモ</dt>
              <dd className="whitespace-pre-line text-base text-gray-900">{log.memo}</dd>
            </div>
          )}
          <div className="border-t border-gray-100 pt-3 text-xs text-gray-400">
            登録日時：{formatDateTime(log.createdAt)} / 更新日時：{formatDateTime(log.updatedAt)}
          </div>
        </dl>
      </div>

      <div className="flex gap-2">
        <Link href={`/logs/${log.id}/edit`} className="flex-1">
          <Button className="w-full">編集する</Button>
        </Link>
        <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={deleting}>
          削除
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="記録の削除"
        message="この記録を削除します。前後の記録の走行距離・燃費の計算に影響する場合があります。元に戻せません。"
        confirmLabel="削除する"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
