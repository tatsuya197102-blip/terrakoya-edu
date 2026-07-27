// src/lib/eggCode.ts
// TERRAKOYA-edu Phase 3-3: たまご引換コード — 児童1人につき1コード・使用上限1
// マーカー: TERRAKOYA_EGG_CODE_V2
//
// V1からの修正:
//  発行前の衝突チェック getDoc(eggCodes/{code}) を廃止した。
//  ルールは「自分のuidのコードだけ読める」であり、存在しないドキュメントには
//  resource が無いためこの読み取りは必ず permission-denied になる(V1が発行に
//  失敗していた原因)。32^8 ≈ 1.1兆通りで衝突は事実上起きず、万一衝突しても
//  既存ドキュメントへの setDoc は update 扱いでルールに拒否されるため、
//  失敗したら次のコードで再試行すれば安全性は変わらない。
//
// 設計メモ:
//  - コードは学期ごとに1つ。users/{uid}.eggCode に「今の学期のコード」を控えるので、
//    発行済みかどうかの判定は getDoc 1回で済む
//  - eggCodes/{code} が引換の実体。クライアントは create のみ許可。
//    使用済みフラグ(usedAt)は Study からの検証API(Admin SDK)だけが書ける
//  - 失敗しても null を返すだけ。アルバム本体の表示は絶対に巻き込まない

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const PREFIX = 'TKS';
const MAX_TRIES = 5;

export type EggCharacter = 'rabbit' | 'cat' | 'bird';

function randomChunk(n: number): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < n; i += 1) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

function newCode(): string {
  return `${PREFIX}-${randomChunk(4)}-${randomChunk(4)}`;
}

/** 表示・入力ゆれを吸収する(小文字・全角ハイフン・空白) */
export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\u2010-\u2015\uFF0D]/g, '-')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * その児童の「今の学期のコード」を返す。無ければ発行する。
 * @param term pets/school.termStartDate(学期の識別子として使う)
 */
export async function ensureEggCode(
  uid: string,
  term: string,
  character: EggCharacter,
  termHearts: number,
): Promise<string | null> {
  try {
    // すでに今学期のコードがあれば使い回す
    const uRef = doc(db, 'users', uid);
    const uSnap = await getDoc(uRef);
    if (uSnap.exists()) {
      const existing = (uSnap.data() as Record<string, any>).eggCode;
      if (existing && existing.term === term && typeof existing.code === 'string') {
        return existing.code as string;
      }
    }

    // 新規発行: 事前読み取りなしで create を試み、拒否されたら振り直す
    for (let i = 0; i < MAX_TRIES; i += 1) {
      const code = newCode();
      try {
        await setDoc(doc(db, 'eggCodes', code), {
          uid,
          term,
          character,
          termHearts,
          createdAt: serverTimestamp(),
          usedAt: null,
        });
      } catch (e) {
        // 衝突(既存docへのupdate扱い)や一時的な失敗 → 次のコードで再試行
        console.warn('eggCode create rejected, retrying', e);
        continue;
      }

      // 児童側に控えを書く。ここが失敗してもコード自体は有効なので返す
      try {
        await setDoc(uRef, { eggCode: { code, term, createdAt: serverTimestamp() } }, { merge: true });
      } catch (e) {
        console.warn('users.eggCode memo failed (code is still valid)', e);
      }
      return code;
    }
    return null;
  } catch (e) {
    // 発行に失敗してもアルバムは出す
    console.warn('ensureEggCode failed', e);
    return null;
  }
}
