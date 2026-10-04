"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { APP_VERSION } from "@/lib/appInfo";

const DB_NAME = "CarMileageAppDB";
const STORE_NAME = "dailyLogs";

interface DiagnosticsResult {
  origin: string;
  databases: { name: string; version: number }[] | null;
  dbFound: boolean;
  stores: string[];
  logCount: number | null;
  oldestDate: string | null;
  newestDate: string | null;
  usage: number | null;
  quota: number | null;
  usageDetails: Record<string, number> | null;
  persisted: boolean | null;
  error: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 記録の保存状況を読み取り専用で調べる。
 * Dexie経由で開くとスキーマのアップグレードが走る可能性があるため、生のIndexedDB APIで参照する。
 * DBが存在しない場合に新規作成してしまわないよう、indexedDB.databases() で存在確認してから開く。
 */
async function runDiagnostics(): Promise<DiagnosticsResult> {
  const result: DiagnosticsResult = {
    origin: window.location.origin,
    databases: null,
    dbFound: false,
    stores: [],
    logCount: null,
    oldestDate: null,
    newestDate: null,
    usage: null,
    quota: null,
    usageDetails: null,
    persisted: null,
    error: null,
  };

  try {
    if (navigator.storage?.estimate) {
      const estimate = (await navigator.storage.estimate()) as StorageEstimate & {
        usageDetails?: Record<string, number>;
      };
      result.usage = estimate.usage ?? null;
      result.quota = estimate.quota ?? null;
      result.usageDetails = estimate.usageDetails ?? null;
    }
    if (navigator.storage?.persisted) {
      result.persisted = await navigator.storage.persisted();
    }

    const databases = await indexedDB.databases();
    result.databases = databases.map((d) => ({ name: d.name ?? "(名前なし)", version: d.version ?? 0 }));
    result.dbFound = databases.some((d) => d.name === DB_NAME);
    if (!result.dbFound) return result;

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME);
      // 既存DBを開く場合は発火しない。万一発火したら何も作らずに中断する
      req.onupgradeneeded = () => req.transaction?.abort();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    try {
      result.stores = Array.from(db.objectStoreNames);
      if (!result.stores.includes(STORE_NAME)) return result;

      const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
      const request = <T,>(r: IDBRequest<T>) =>
        new Promise<T>((resolve, reject) => {
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
      result.logCount = await request(store.count());
      const index = store.index("logDate");
      const oldest = await request(index.openCursor(null, "next"));
      const newest = await request(index.openCursor(null, "prev"));
      result.oldestDate = (oldest?.value as { logDate?: string } | undefined)?.logDate ?? null;
      result.newestDate = (newest?.value as { logDate?: string } | undefined)?.logDate ?? null;
    } finally {
      db.close();
    }
  } catch (err) {
    result.error = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  return result;
}

export default function DiagnosticsPage() {
  const [result, setResult] = useState<DiagnosticsResult | null>(null);

  useEffect(() => {
    runDiagnostics().then(setResult);
  }, []);

  const rows: [string, string][] = result
    ? [
        ["アプリのバージョン", APP_VERSION],
        ["URL", result.origin],
        ["データベース", result.dbFound ? "あり" : "なし"],
        ["記録の件数", result.logCount === null ? "-" : `${result.logCount} 件`],
        ["最も古い記録", result.oldestDate ?? "-"],
        ["最も新しい記録", result.newestDate ?? "-"],
        ["使用容量（合計）", result.usage === null ? "-" : formatBytes(result.usage)],
        ...Object.entries(result.usageDetails ?? {}).map(
          ([key, value]): [string, string] => [`　内訳：${key}`, formatBytes(value)]
        ),
        ["保護設定（persist）", result.persisted === null ? "-" : result.persisted ? "あり" : "なし"],
        [
          "データベース一覧",
          result.databases === null
            ? "-"
            : result.databases.map((d) => `${d.name}(v${d.version})`).join(", ") || "(なし)",
        ],
        ["テーブル", result.stores.join(", ") || "-"],
        ["エラー", result.error ?? "なし"],
      ]
    : [];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div>
        <Link href="/" className="text-blue-600">
          ← ホームに戻る
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">保存データの診断</h1>
      <p className="text-sm text-gray-600">
        この端末に保存されている記録の状況を表示します（読み取りのみで、データは変更しません）。
      </p>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        {result === null ? (
          <p className="text-gray-500">調べています...</p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-gray-500">{label}</dt>
                <dd className="break-all font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}
