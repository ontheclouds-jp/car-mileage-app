"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getAllDailyLogsAscending } from "@/lib/repositories/dailyLogRepository";
import {
  InvalidBackupFileError,
  deleteAllDailyLogs,
  exportBackupJson,
  restoreBackupJson,
} from "@/lib/repositories/backupRepository";
import { dailyLogsToCsv } from "@/lib/csv";
import { downloadTextFile } from "@/lib/utils/download";
import { getLastBackupAt, recordBackupNow } from "@/lib/utils/backupInfo";
import { formatDateTime, getCurrentYearMonth, todayStr } from "@/lib/utils/date";

const DELETE_CONFIRM_PHRASE = "削除する";

export default function DataManagementPage() {
  const current = getCurrentYearMonth();
  const [csvMonthMode, setCsvMonthMode] = useState<"all" | "month">("all");
  const [csvMonth, setCsvMonth] = useState(
    `${current.year}-${String(current.month).padStart(2, "0")}`
  );

  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() => getLastBackupAt());
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const handleExportCsv = async () => {
    const logs = await getAllDailyLogsAscending();
    const target =
      csvMonthMode === "all" ? logs : logs.filter((l) => l.logDate.startsWith(csvMonth));
    const csv = dailyLogsToCsv(target);
    const filename =
      csvMonthMode === "all"
        ? `mycar-driving-log_全期間_${todayStr()}.csv`
        : `mycar-driving-log_${csvMonth}.csv`;
    downloadTextFile(filename, csv, "text/csv;charset=utf-8");
  };

  const handleExportBackup = async () => {
    const json = await exportBackupJson();
    downloadTextFile(`mycar-driving-log_backup_${todayStr()}.json`, json, "application/json");
    recordBackupNow();
    setLastBackupAt(getLastBackupAt());
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingRestoreFile(file);
    setRestoreMessage(null);
    setRestoreError(null);
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestoreFile) return;
    const file = pendingRestoreFile;
    setPendingRestoreFile(null);
    try {
      const text = await file.text();
      const count = await restoreBackupJson(text);
      setRestoreMessage(`${count}件の記録を復元しました。`);
    } catch (err) {
      if (err instanceof InvalidBackupFileError) {
        setRestoreError(err.message);
      } else {
        setRestoreError("復元中にエラーが発生しました。");
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCancelRestore = () => {
    setPendingRestoreFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAll = async () => {
    await deleteAllDailyLogs();
    setDeleteDialogOpen(false);
    setDeleteConfirmText("");
    setDeleteMessage("全データを削除しました。");
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-4">
      <div>
        <Link href="/settings" className="text-blue-600">
          ← 設定に戻る
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">データ管理</h1>

      <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-bold text-gray-900">CSV書き出し</h2>
        <div className="flex gap-2">
          <select
            value={csvMonthMode}
            onChange={(e) => setCsvMonthMode(e.target.value as "all" | "month")}
            className="min-h-11 flex-1 rounded-lg border border-gray-300 px-2 text-sm"
          >
            <option value="all">全期間</option>
            <option value="month">月を指定</option>
          </select>
          {csvMonthMode === "month" && (
            <input
              type="month"
              value={csvMonth}
              onChange={(e) => setCsvMonth(e.target.value)}
              className="min-h-11 flex-1 rounded-lg border border-gray-300 px-2 text-sm"
            />
          )}
        </div>
        <Button onClick={handleExportCsv}>CSVを書き出す</Button>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-bold text-gray-900">JSONバックアップ</h2>
        <p className="text-sm text-gray-500">
          全データを1つのJSONファイルに保存します。定期的なバックアップをおすすめします。
        </p>
        <p className="text-sm text-gray-700">
          最終バックアップ：{lastBackupAt ? formatDateTime(lastBackupAt) : "未実施"}
        </p>
        <Button onClick={handleExportBackup}>JSONバックアップを書き出す</Button>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-bold text-gray-900">JSONから復元</h2>
        <p className="text-sm text-gray-500">
          バックアップファイルを選択すると、現在のデータをすべて置き換えて復元します。
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileSelected}
          className="text-sm"
        />
        {restoreMessage && <p className="text-sm text-blue-700">{restoreMessage}</p>}
        {restoreError && <p className="text-sm text-red-600">{restoreError}</p>}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <h2 className="text-base font-bold text-red-800">全データ削除</h2>
        <p className="text-sm text-red-700">
          すべての走行記録を削除します。元に戻せません。削除するには「{DELETE_CONFIRM_PHRASE}
          」と入力してください。
        </p>
        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          placeholder={DELETE_CONFIRM_PHRASE}
          className="min-h-11 rounded-lg border border-red-300 px-3 text-base"
        />
        <Button
          variant="danger"
          disabled={deleteConfirmText !== DELETE_CONFIRM_PHRASE}
          onClick={() => setDeleteDialogOpen(true)}
        >
          全データを削除する
        </Button>
        {deleteMessage && <p className="text-sm text-gray-700">{deleteMessage}</p>}
      </section>

      <ConfirmDialog
        open={pendingRestoreFile !== null}
        title="データの復元"
        message={`「${pendingRestoreFile?.name ?? ""}」から復元します。現在のデータはすべて置き換えられ、元に戻せません。よろしいですか？`}
        confirmLabel="復元する"
        danger
        onConfirm={handleConfirmRestore}
        onCancel={handleCancelRestore}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="全データ削除の最終確認"
        message="本当にすべての走行記録を削除します。この操作は元に戻せません。"
        confirmLabel="削除する"
        danger
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
