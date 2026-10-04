import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { backupFileSchema } from "@/lib/validation/backupSchema";

// 利用者が一人の想定のため、固定ファイル名で毎回上書きする（spec 11.4）
const AUTO_BACKUP_PATH = "auto-backups/car-mileage-app.json";

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
    const blob = await put(AUTO_BACKUP_PATH, JSON.stringify(result.data, null, 2), {
      access: "private",
      contentType: "application/json",
      allowOverwrite: true,
    });
    return NextResponse.json({ pathname: blob.pathname });
  } catch (err) {
    console.error("[api/auto-backup] Blobへの保存に失敗しました", err);
    return NextResponse.json({ error: "バックアップの保存に失敗しました" }, { status: 500 });
  }
}
