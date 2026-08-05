// MARKER: TERRAKOYA_EDU_GENLIMIT_LIB_V1
// AI APIルート共通の1日あたり生成上限。
//
// 設計上の注意(2026-08-05に実地で確認した制約):
//  - firebase-admin/auth は使えない。jwks-rsa -> jose(ESM専用) を require するため
//    Node 24 の CommonJS ランタイムで «require() of ES Module ... not supported» になる。
//    そのため IDトークン検証は Firebase Auth REST API で行う(依存ゼロ)。
//  - firebase-admin/app と firebase-admin/firestore は正常に動く。
//    ただし next.config.ts の serverExternalPackages に firebase-admin の指定が必須。
//  - 動的 import を try 内で行い、失敗しても 500 にせず「上限なしで続行」に落とす。
//    子供の画面を止めないことを最優先する。
import type { NextRequest } from 'next/server';

export type LimitVerdict = 'ok' | 'limit' | 'auth' | 'skip';

/** 機能ごとの1日あたり上限。ここを変えるだけで全ルートに反映される。 */
export const DAILY_LIMITS: Record<string, number> = {
  'generate-4manga': 3,
  'analyze-artwork': 10,
  'grade-artwork': 10,
  'chat': 20,
};

/**
 * IDトークンを検証し、その日の利用回数を1つ進める。
 * 戻り値:
 *   'ok'    -> 続行してよい
 *   'limit' -> 上限到達。呼び出し側は 429 を返す
 *   'auth'  -> トークン無し/無効。呼び出し側は 401 を返す
 *   'skip'  -> 上限機構が使えない状態。呼び出し側はそのまま続行する(フェイルオープン)
 */
export async function consumeDailyQuota(req: NextRequest, kind: string): Promise<LimitVerdict> {
  const limit = DAILY_LIMITS[kind];
  if (!limit) return 'skip';

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return 'skip';

  let appMod, fsMod;
  try {
    appMod = await import('firebase-admin/app');
    fsMod = await import('firebase-admin/firestore');
  } catch (e) {
    console.error('[genLimit] firebase-admin import failed:', e);
    return 'skip';
  }

  let app;
  try {
    const apps = appMod.getApps();
    app = apps.length ? apps[0] : appMod.initializeApp({ credential: appMod.cert(JSON.parse(raw)) });
  } catch (e) {
    console.error('[genLimit] init failed:', e);
    return 'skip';
  }

  const header = req.headers.get('authorization') || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!idToken) return 'auth';

  const webKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!webKey) return 'skip';

  let uid = '';
  try {
    const vr = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + webKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!vr.ok) return 'auth';
    const vd = await vr.json();
    uid = vd?.users?.[0]?.localId || '';
    if (!uid) return 'auth';
  } catch (e) {
    console.error('[genLimit] token verify failed:', e);
    return 'skip';
  }

  try {
    const db = fsMod.getFirestore(app);
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ref = db.collection('genLimits').doc(uid + '_' + day + '_' + kind);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const n = snap.exists ? ((snap.data() as { count?: number }).count ?? 0) : 0;
      if (n >= limit) throw new Error('LIMIT');
      tx.set(
        ref,
        { count: n + 1, kind, uid, updatedAt: fsMod.FieldValue.serverTimestamp() },
        { merge: true }
      );
    });
    return 'ok';
  } catch (e) {
    if ((e as Error).message === 'LIMIT') return 'limit';
    console.error('[genLimit] tx failed:', e);
    return 'skip';
  }
}

/** クライアント側でIDトークンをヘッダに載せるための共通ヘルパー。 */
export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { auth } = await import('@/lib/firebase');
    const t = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}
