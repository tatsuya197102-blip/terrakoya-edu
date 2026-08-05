// MARKER: TERRAKOYA_EDU_GEN_LIMIT_V6
// v5の診断で原因確定: firebase-admin/auth は jwks-rsa -> jose(ESM専用) を require するため
// Node 24 の CommonJS ランタイムで読み込めない ("require() of ES Module ... not supported")。
// v6の対策: トークン検証を firebase-admin/auth ではなく Firebase Auth REST API で行う。
//           依存ゼロ・fetchのみ。app と firestore は正常に import できるのでそのまま使う。
// generate-4manga v3 — v2 が 500 を返した件の修正版。
//
// v2の問題: firebase-admin をトップレベルで static import していたため、
//           Vercelのバンドル/ランタイムで解決に失敗するとモジュール読込段階で落ち、
//           POST内のtry/catchに到達せず 500 になっていた。
// v3の対策: (1) export const runtime = 'nodejs' を明示
//           (2) firebase-admin は try 内で動的 import する
//           -> 何が起きても 500 にはならず、最悪でも「上限なしで従来動作」に落ちる
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_LIMIT = 3;

/** 上限チェック。'ok' | 'limit' | 'auth' | 'skip'(admin使用不可=フェイルオープン) */
async function checkLimit(req: NextRequest): Promise<'ok' | 'limit' | 'auth' | 'skip'> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return 'skip';

  let appMod, fsMod;
  try {
    appMod = await import('firebase-admin/app');
    fsMod = await import('firebase-admin/firestore');
  } catch (e) {
    console.error('firebase-admin import failed:', e);
    return 'skip';
  }

  let app;
  try {
    const apps = appMod.getApps();
    app = apps.length ? apps[0] : appMod.initializeApp({ credential: appMod.cert(JSON.parse(raw)) });
  } catch (e) {
    console.error('firebase-admin init failed:', e);
    return 'skip';
  }

  const header = req.headers.get('authorization') || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!idToken) return 'auth';

  // Firebase Auth REST API でIDトークンを検証する(firebase-admin/auth を回避)
  const webKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!webKey) return 'skip';

  let uid = '';
  try {
    const vr = await fetch(
      'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + webKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!vr.ok) return 'auth';
    const vd = await vr.json();
    uid = vd?.users?.[0]?.localId || '';
    if (!uid) return 'auth';
  } catch (e) {
    console.error('token verify failed:', e);
    return 'skip';
  }

  try {
    const db = fsMod.getFirestore(app);
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const ref = db.collection('genLimits').doc(uid + '_' + day);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const n = snap.exists ? ((snap.data() as { count?: number }).count ?? 0) : 0;
      if (n >= DAILY_LIMIT) throw new Error('LIMIT');
      tx.set(
        ref,
        { count: n + 1, kind: 'generate-4manga', updatedAt: fsMod.FieldValue.serverTimestamp() },
        { merge: true }
      );
    });
    return 'ok';
  } catch (e) {
    if ((e as Error).message === 'LIMIT') return 'limit';
    console.error('limit tx failed:', e);
    return 'skip';
  }
}

/**
 * GET /api/generate-4manga  -> 診断のみ。秘密情報は返さない(存在有無と長さ、エラーメッセージのみ)。
 * 上限が効かない原因を切り分けるための一時的なエンドポイント。原因確定後に削除してよい。
 */
export async function GET() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  const out: Record<string, unknown> = {
    marker: 'TERRAKOYA_EDU_GEN_LIMIT_V6',
    nodeVersion: process.version,
    hasClaudeKey: !!process.env.CLAUDE_API_KEY,
    hasServiceAccountEnv: !!raw,
    hasWebApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    serviceAccountLength: raw ? raw.length : 0,
  };

  if (!raw) {
    out.verdict = 'FIREBASE_SERVICE_ACCOUNT is missing on this deployment';
    return NextResponse.json(out);
  }

  try {
    const parsed = JSON.parse(raw);
    out.parseOk = true;
    out.projectId = parsed.project_id || null;
    out.clientEmailPresent = !!parsed.client_email;
    out.privateKeyPresent = !!parsed.private_key;
    out.privateKeyHasRealNewline = typeof parsed.private_key === 'string' && parsed.private_key.includes('\n');
  } catch (e) {
    out.parseOk = false;
    out.parseError = (e as Error).message;
    out.verdict = 'JSON.parse failed -> env value is malformed';
    return NextResponse.json(out);
  }

  // POST側と同じ3モジュールを個別にテストする(v4はappしか見ていなかった)
  const failed: string[] = [];
  let appMod: typeof import('firebase-admin/app') | null = null;

  for (const name of ['firebase-admin/app', 'firebase-admin/firestore']) {
    try {
      const m = await import(/* webpackIgnore: true */ name);
      out['import_' + name.split('/')[1]] = 'ok';
      if (name.endsWith('/app')) appMod = m as typeof import('firebase-admin/app');
    } catch (e) {
      out['import_' + name.split('/')[1]] = 'FAILED: ' + (e as Error).message;
      failed.push(name);
    }
  }

  if (failed.length) {
    out.verdict = 'import failed for: ' + failed.join(', ');
    return NextResponse.json(out);
  }

  try {
    const apps = appMod!.getApps();
    if (!apps.length) appMod!.initializeApp({ credential: appMod!.cert(JSON.parse(raw)) });
    out.initOk = true;
  } catch (e) {
    out.initOk = false;
    out.initError = (e as Error).message;
    out.verdict = 'initializeApp failed';
    return NextResponse.json(out);
  }

  // Firestoreに実際に書けるか(ルールはAdmin SDKでは無視されるので接続確認になる)
  try {
    const fsMod = await import('firebase-admin/firestore');
    const db = fsMod.getFirestore(appMod!.getApps()[0]);
    await db.collection('genLimits').doc('__diag__').set({
      kind: 'diag', updatedAt: fsMod.FieldValue.serverTimestamp(),
    }, { merge: true });
    out.firestoreWriteOk = true;
    out.verdict = 'ALL OK -> limit should be active';
  } catch (e) {
    out.firestoreWriteOk = false;
    out.firestoreError = (e as Error).message;
    out.verdict = 'firestore write failed';
  }

  return NextResponse.json(out);
}

export async function POST(req: NextRequest) {
  try {
    const { characterName, theme, lang } = await req.json();
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) return NextResponse.json({ stories: [] });

    const verdict = await checkLimit(req);
    if (verdict === 'limit') return NextResponse.json({ error: 'limit' }, { status: 429 });
    if (verdict === 'auth') return NextResponse.json({ error: 'auth' }, { status: 401 });

    const prompt = lang === 'ar'
      ? `أنت كاتب مانجا للأطفال. أنشئ 3 قصص مانجا من 4 لوحات للشخصية "${characterName}" حول موضوع "${theme}". أجب بتنسيق JSON فقط بدون أي نص آخر: [{"title":"...","panels":[{"panel":1,"scene":"...","dialogue":"..."},{"panel":2,"scene":"...","dialogue":"..."},{"panel":3,"scene":"...","dialogue":"..."},{"panel":4,"scene":"...","dialogue":"..."}]}]`
      : lang === 'en'
      ? `You are a children's manga writer. Create 3 four-panel manga stories for the character "${characterName}" on the theme "${theme}". Reply in JSON format only, no other text: [{"title":"...","panels":[{"panel":1,"scene":"...","dialogue":"..."},{"panel":2,"scene":"...","dialogue":"..."},{"panel":3,"scene":"...","dialogue":"..."},{"panel":4,"scene":"...","dialogue":"..."}]}]`
      : `あなたは子供向けマンガの作家です。キャラクター「${characterName}」の「${theme}」テーマの4コマ漫画を3つ作ってください。JSON形式のみで回答（他のテキスト不要）: [{"title":"...","panels":[{"panel":1,"scene":"...","dialogue":"..."},{"panel":2,"scene":"...","dialogue":"..."},{"panel":3,"scene":"...","dialogue":"..."},{"panel":4,"scene":"...","dialogue":"..."}]}]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: [
          {
            type: 'text',
            text: 'あなたはTERRAKOYA・漫画・アニメ創作プロジェクト向けのAI漫画制作アシスタントです。',
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return NextResponse.json({ stories: [] });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return NextResponse.json({ stories: JSON.parse(jsonMatch[0]) });

    return NextResponse.json({ stories: [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ stories: [] });
  }
}
