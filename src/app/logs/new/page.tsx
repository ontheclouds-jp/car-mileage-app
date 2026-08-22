import Link from "next/link";
import { LogForm } from "@/components/logs/LogForm";

export default function NewLogPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div>
        <Link href="/logs" className="text-blue-600">
          ← 一覧に戻る
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">走行記録の登録</h1>
      <LogForm mode="create" />
    </div>
  );
}
