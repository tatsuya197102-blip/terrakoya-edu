// このAPIルートは管理者画面のCSV出力で不要（クライアント側で直接生成）
// 将来のサーバーサイドエクスポート用に予約
export async function GET() {
  return new Response('Use client-side CSV export', { status: 200 });
}
