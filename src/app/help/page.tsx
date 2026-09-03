import Link from "next/link";
import { APP_CHANGELOG, APP_DEVELOPER, APP_LAST_UPDATED, APP_NAME, APP_VERSION } from "@/lib/appInfo";

const USAGE_SECTIONS = [
  {
    title: "毎日の記録",
    body: "走行前または走行後に、車の走行距離計（オドメーター）に表示されている数字をそのまま入力してください。",
  },
  {
    title: "用途の選び方",
    body: "その日の運転が主に「仕事」「プライベート」「その他」のどれだったかを選んでください。",
  },
  {
    title: "給油した日",
    body: "給油した日は「給油した」をONにして、給油量（リットル）を入力してください。次回給油時に自動で燃費が計算されます。",
  },
  {
    title: "走行距離の自動計算について",
    body: "前回記録した日からの走行距離が自動で計算されます。記録を忘れた日があっても、次に記録した時点で正しく計算されます。",
  },
  {
    title: "月次集計について",
    body: "ホーム画面や月次集計画面で、今月の用途別走行距離や平均燃費を確認できます。",
  },
  {
    title: "データを守るために",
    body: "設定画面の「データ管理」から、定期的にJSONバックアップを取っておくことをおすすめします。",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-4">
      <div>
        <Link href="/settings" className="text-blue-600">
          ← 設定に戻る
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">ヘルプ</h1>

      <section className="flex flex-col gap-4">
        {USAGE_SECTIONS.map((section) => (
          <div key={section.title} className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
            <p className="mt-1 text-base text-gray-700">{section.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-bold text-gray-900">バージョン情報</h2>
        <dl className="mt-2 flex flex-col gap-1 text-sm text-gray-700">
          <div className="flex justify-between">
            <dt className="text-gray-500">アプリ名</dt>
            <dd>{APP_NAME}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">バージョン</dt>
            <dd>{APP_VERSION}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">最終更新日</dt>
            <dd>{APP_LAST_UPDATED}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">開発</dt>
            <dd>{APP_DEVELOPER}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="text-base font-bold text-gray-900">更新履歴</h2>
        <ul className="mt-2 flex flex-col gap-3">
          {APP_CHANGELOG.map((entry) => (
            <li key={entry.version} className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-gray-900">{entry.version}</span>
                <span className="text-xs text-gray-500">{entry.date}</span>
              </div>
              <p className="mt-0.5 text-sm text-gray-700">{entry.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
