// src/lib/eggCode.ts
// TERRAKOYA-edu Phase 3-3: たまご引換コード — 児童1人につき1コード・使用上限1
// マーカー: TERRAKOYA_EGG_CODE_V1
//
// 設計メモ:
//  - コードは学期ごとに1つ。users/{uid}.eggCode に「今の学期のコード」を控えるので、
//    発行済みかどうかの判定は getDoc 1回で済む(uid+学期の複合クエリを避ける)
//  - eggCodes/{code} が引換の実体。クライアントは create のみ許可、update/delete は禁止。
//    使用済みフラグ(usedAt)は Study からの検証API(Admin SDK)だけが書ける
//  - 紛らわしい 0/O/1/I を除いた32文字。TKS-XXXX-XXXX で 32^8 ≈ 1.1兆通り
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

    // 新規発行(衝突したら振り直す)
    for (let i = 0; i < MAX_TRIES; i += 1) {
      const code = newCode();
      const cRef = doc(db, 'eggCodes', code);
      const cSnap = await getDoc(cRef);
      if (cSnap.exists()) continue;

      await setDoc(cRef, {
        uid,
        term,
        character,
        termHearts,
        createdAt: serverTimestamp(),
        usedAt: null,
      });

      await setDoc(uRef, { eggCode: { code, term, createdAt: serverTimestamp() } }, { merge: true });
      return code;
    }
    return null;
  } catch {
    // 発行に失敗してもアルバムは出す
    return null;
  }
}
