// MARKER: TERRAKOYA_EDU_GEN_LIMIT_V1
// generate-4manga v2: サーバー側で1人1日3回の生成上限を掛ける。
//  - クライアントはFirebase IDトークンをAuthorizationヘッダで送る(page.tsx v2が対応済み)
//  - 上限超過は429 {error:'limit'}。クライアントはフォールバックストーリーで続行する
//  - FIREBASE_SERVICE_ACCOUNT 未設定時は上限なしで従来動作(フェイルオープン、本番を止めない)
//  - NEXT_PUBLIC_CLAUDE_API_KEY フォールバックは削除(NEXT_PUBLIC_はクライアントに露出するため)
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const DAILY_LIMIT = 3;

function adminApp(): App | null {
  if (getApps().length) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    return initializeApp({ credential: cert(JSON.parse(raw)) });
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { characterName, theme, lang } = await req.json();
    const apiKey = process.env.CLAUDE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ stories: [] });
    }

    // --- 1日あたりの生成上限(サーバー側で強制) ---------------------------
    const app = adminApp();
    if (app) {
      const authHeader = req.headers.get('authorization') || '';
      const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      if (!idToken) {
        return NextResponse.json({ error: 'auth' }, { status: 401 });
      }
      let uid = '';
      try {
        uid = (await getAuth(app).verifyIdToken(idToken)).uid;
      } catch {
        return NextResponse.json({ error: 'auth' }, { status: 401 });
      }

      const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const db = getFirestore(app);
      const ref = db.collection('genLimits').doc(`${uid}_${day}`);
      try {
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(ref);
          const n = snap.exists ? ((snap.data() as { count?: number }).count ?? 0) : 0;
          if (n >= DAILY_LIMIT) throw new Error('LIMIT');
          tx.set(
            ref,
            { count: n + 1, kind: 'generate-4manga', updatedAt: FieldValue.serverTimestamp() },
            { merge: true }
          );
        });
      } catch (e) {
        if ((e as Error).message === 'LIMIT') {
          return NextResponse.json({ error: 'limit' }, { status: 429 });
        }
        // トランザクション自体の障害は上限なしで続行(子供の体験を止めない)
      }
    }
    // ---------------------------------------------------------------------

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

    if (jsonMatch) {
      const stories = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ stories });
    }

    return NextResponse.json({ stories: [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ stories: [] });
  }
}
