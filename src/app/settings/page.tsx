import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div>
        <Link href="/" className="text-blue-600">
          ← ホームに戻る
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">設定</h1>

      <div className="flex flex-col gap-2">
        <Link href="/data-management">
          <Button variant="secondary" className="w-full justify-start">
            データ管理（CSV書き出し・バックアップ・復元）
          </Button>
        </Link>
        <Link href="/help">
          <Button variant="secondary" className="w-full justify-start">
            ヘルプ・バージョン情報
          </Button>
        </Link>
      </div>
    </div>
  );
}
