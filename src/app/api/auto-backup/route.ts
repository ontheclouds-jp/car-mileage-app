import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { backupFileSchema } from "@/lib/validation/backupSchema";

// 利用者が一人の想定のため、固定ファイル名で毎回上書きする（spec 11.4）
const AUTO_BACKUP_PATH = "auto-backups/car-mileage-app.json";
// 最新ファイルが少ない件数のデータで上書きされても過去の状態に戻せるよう、日付（日本時間）ごとの履歴も残す
const HISTORY_DIR = "auto-backups/history";

function todayInJapan(): string {
  // sv-SEロケールは YYYY-MM-DD 形式で出力される
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSONの解析に失敗しました" }, { status: 400 });
  }

  const result = backupFileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "バックアップデータの形式が正しくありません" }, { status: 400 });
  }
  // 空データでクラウド上のバックアップを上書きしないようにする
  if (result.data.dailyLogs.length === 0) {
    return NextResponse.json({ error: "走行記録が0件のため保存しません" }, { status: 400 });
  }

  try {
    const json = JSON.stringify(result.data, null, 2);
    const options = {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
    } as const;
    const [latest, history] = await Promise.all([
      put(AUTO_BACKUP_PATH, json, options),
      put(`${HISTORY_DIR}/${todayInJapan()}.json`, json, options),
    ]);
    return NextResponse.json({ pathname: latest.pathname, historyPathname: history.pathname });
  } catch (err) {
    console.error("[api/auto-backup] Blobへの保存に失敗しました", err);
    return NextResponse.json({ error: "バックアップの保存に失敗しました" }, { status: 500 });
  }
}
