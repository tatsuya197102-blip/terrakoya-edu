// src/app/api/verify-egg-code/route.ts
// TERRAKOYA-edu Phase 3-3: たまご引換コードの検証API(Study 側の S-31 から呼ばれる)
// マーカー: TERRAKOYA_VERIFY_EGG_CODE_V1
//
// なぜサーバー側か:
//  - Study は別の Firebase プロジェクトなので edu の Firestore を直接読めない
//  - Flutter Web のクライアントに秘密情報は置けない
//  → edu 側に共有シークレット付きのAPIを立て、Admin SDK で使用済みフラグを立てる
//
// 必要な環境変数(Vercel):
//  - FIREBASE_SERVICE_ACCOUNT   サービスアカウントJSONを1行の文字列にしたもの
//  - EGG_CODE_SHARED_SECRET     Study と共有する任意の長い文字列
//
// 呼び出し例:
//  POST /api/verify-egg-code
//  { "code": "TKS-AB3D-9KP2", "secret": "<EGG_CODE_SHARED_SECRET>" }

import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { timingSafeEqual } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  const svc = JSON.parse(raw);
  // Vercel の環境変数では改行が \\n で入ることがあるため戻す
  if (typeof svc.private_key === 'string') {
    svc.private_key = svc.private_key.replace(/\\n/g, '\n');
  }
  return initializeApp({ credential: cert(svc) });
}

/** 長さ差でも落ちない定数時間比較 */
function secretMatches(given: unknown): boolean {
  const expected = process.env.EGG_CODE_SHARED_SECRET;
  if (!expected || typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // 長さを漏らさないためダミー比較してから false
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\u2010-\u2015\uFF0D]/g, '-')
    .replace(/\s+/g, '')
    .trim();
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 });
  }

  if (!secretMatches(body.secret)) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  const rawCode = typeof body.code === 'string' ? body.code : '';
  const code = normalizeCode(rawCode);
  if (!/^TKS-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(code)) {
    return NextResponse.json({ ok: false, reason: 'malformed' }, { status: 400 });
  }

  try {
    const dbAdmin = getFirestore(adminApp());
    const ref = dbAdmin.collection('eggCodes').doc(code);

    const result = await dbAdmin.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { ok: false as const, reason: 'not_found' as const, status: 404 };

      const d = snap.data() as Record<string, any>;
      if (d.usedAt) return { ok: false as const, reason: 'already_used' as const, status: 409 };

      tx.update(ref, { usedAt: Timestamp.now() });
      return {
        ok: true as const,
        status: 200,
        character: d.character ?? 'cat',
        termHearts: typeof d.termHearts === 'number' ? d.termHearts : 0,
        term: typeof d.term === 'string' ? d.term : '',
      };
    });

    const { status, ...payload } = result;
    return NextResponse.json(payload, { status });
  } catch (e) {
    console.error('verify-egg-code failed', e);
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 });
  }
}
