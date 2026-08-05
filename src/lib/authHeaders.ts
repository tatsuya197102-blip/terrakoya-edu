// MARKER: TERRAKOYA_EDU_AUTHHEADERS_V1
// クライアント専用。IDトークンを Authorization ヘッダに載せるだけの薄いヘルパー。
// firebase-admin には一切触れないので、ブラウザバンドルに入っても安全。
// サーバー側の上限チェックは '@/lib/genLimit'(server-only)にある。

export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { auth } = await import('@/lib/firebase');
    const t = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}
