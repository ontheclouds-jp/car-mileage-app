"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { LogForm } from "@/components/logs/LogForm";
import { getDailyLogById } from "@/lib/repositories/dailyLogRepository";

export function LogEditClient({ id }: { id: string }) {
  const log = useLiveQuery(() => getDailyLogById(id).then((l) => l ?? null), [id]);

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

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div>
        <Link href={`/logs/${id}`} className="text-blue-600">
          ← 詳細に戻る
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">走行記録の編集</h1>
      <LogForm mode="edit" initialLog={log} />
    </div>
  );
}
