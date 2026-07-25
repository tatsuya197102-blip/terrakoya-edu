// src/lib/album.ts
// TERRAKOYA-edu Phase 3: 学期末アルバム — 児童1人分の学期内作品を集計する
// マーカー: TERRAKOYA_ALBUM_V1
//
// 設計メモ:
//  - 学期範囲は pets/school.termStartDate を正とする(ペットの学期と自動一致)
//  - 複合インデックスを避けるため、Firestoreへは uid 等値のみで問い合わせ、日付はJS側で絞る
//  - トップレベル submissions からは source==='paint' のみ拾う
//    (課題提出の isPublic コピーが同居しており、両方拾うと二重になるため)

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

/** 課題提出をアルバムに含めるか。false にすると歌/ペイント/4コマの3種のみ */
export const INCLUDE_ASSIGNMENTS = true;

export type AlbumKind = 'song' | 'paint' | 'manga4' | 'assignment';

export type AlbumItem = {
  id: string;
  kind: AlbumKind;
  /** 見出しに使う文字列(未設定なら空文字) */
  title: string;
  date: Date;
  /** <img src> にそのまま入れられる値。Storage URL か data URI */
  imageSrc?: string;
  /** true = Storage由来。html2canvas に渡す <img> に crossOrigin="anonymous" が必要 */
  needsCors?: boolean;
  /** 歌のみ */
  lyrics?: string;
  audioUrl?: string;
  /** 4コマ・課題のコメント */
  comment?: string;
};

export type AlbumData = {
  uid: string;
  termStartDate: string;
  termEndDate: string;
  /** pets/school のキャラ。引換コードに載せる値でもある */
  character: 'rabbit' | 'cat' | 'bird';
  /** その児童の学期累計ハート */
  termHearts: number;
  items: AlbumItem[];
  /** 種別ごとの件数(表紙のサマリー用) */
  counts: Record<AlbumKind, number>;
};

/** Timestamp / ISO文字列 / Date のいずれでも Date にそろえる */
function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(+v) ? null : v;
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(+d) ? null : d;
  }
  const maybe = v as { toDate?: () => Date };
  if (typeof maybe.toDate === 'function') {
    try {
      const d = maybe.toDate();
      return isNaN(+d) ? null : d;
    } catch {
      return null;
    }
  }
  return null;
}

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * 児童1人分のアルバムデータを取得する。
 * 失敗したコレクションがあっても、取れた分だけで返す(1本コケて全滅させない)。
 */
export async function loadAlbum(uid: string): Promise<AlbumData> {
  // --- 学期範囲とキャラを pets/school から取得 --------------------------
  let termStartDate = `${new Date().getFullYear()}-04-01`;
  let character: AlbumData['character'] = 'cat';
  try {
    const petSnap = await getDoc(doc(db, 'pets', 'school'));
    if (petSnap.exists()) {
      const p = petSnap.data() as Record<string, unknown>;
      if (typeof p.termStartDate === 'string') termStartDate = p.termStartDate;
      if (p.character === 'rabbit' || p.character === 'cat' || p.character === 'bird') {
        character = p.character;
      }
    }
  } catch {
    /* 既定値で続行 */
  }

  const start = new Date(`${termStartDate}T00:00:00`);
  const end = new Date();
  const inTerm = (d: Date | null) => !!d && d >= start && d <= end;

  // --- その児童の学期累計ハート -----------------------------------------
  let termHearts = 0;
  try {
    const uSnap = await getDoc(doc(db, 'users', uid));
    const th = uSnap.exists() ? (uSnap.data() as Record<string, unknown>).termHearts : 0;
    if (typeof th === 'number') termHearts = th;
  } catch {
    /* 0 のまま */
  }

  // --- 3本のクエリを並走(いずれも uid 等値のみ = インデックス不要) -------
  const [songsRes, subsRes, mineRes] = await Promise.allSettled([
    getDocs(query(collection(db, 'songs'), where('uid', '==', uid))),
    getDocs(query(collection(db, 'submissions'), where('studentId', '==', uid))),
    getDocs(collection(db, 'users', uid, 'submissions')),
  ]);

  const items: AlbumItem[] = [];

  // 歌・ラップ
  if (songsRes.status === 'fulfilled') {
    songsRes.value.forEach((d) => {
      const x = d.data() as Record<string, any>;
      const date = toDate(x.createdAt);
      if (!inTerm(date)) return;
      items.push({
        id: d.id,
        kind: 'song',
        title: typeof x.lyrics === 'string' ? x.lyrics.split('\n')[0].slice(0, 24) : '',
        date: date as Date,
        lyrics: typeof x.lyrics === 'string' ? x.lyrics : '',
        audioUrl: typeof x.audioUrl === 'string' ? x.audioUrl : undefined,
      });
    });
  }

  // ペイント(source==='paint' のみ。課題提出の公開コピーを除外)
  if (subsRes.status === 'fulfilled') {
    subsRes.value.forEach((d) => {
      const x = d.data() as Record<string, any>;
      if (x.source !== 'paint') return;
      const date = toDate(x.createdAt);
      if (!inTerm(date)) return;
      items.push({
        id: d.id,
        kind: 'paint',
        title: typeof x.title === 'string' ? x.title : '',
        date: date as Date,
        imageSrc: typeof x.imageUrl === 'string' ? x.imageUrl : undefined,
        needsCors: true,
      });
    });
  }

  // 4コマ + 課題提出(どちらも users/{uid}/submissions、imageBase64)
  if (mineRes.status === 'fulfilled') {
    mineRes.value.forEach((d) => {
      const x = d.data() as Record<string, any>;
      const date = toDate(x.submittedAt);
      if (!inTerm(date)) return;

      const isManga = x.courseId === 'auto-4manga';
      if (!isManga && !INCLUDE_ASSIGNMENTS) return;

      const b64 = typeof x.imageBase64 === 'string' ? x.imageBase64 : '';
      const src = b64
        ? b64.startsWith('data:')
          ? b64
          : `data:${x.fileType || 'image/jpeg'};base64,${b64}`
        : undefined;

      items.push({
        id: d.id,
        kind: isManga ? 'manga4' : 'assignment',
        title: typeof x.comment === 'string' ? x.comment : typeof x.fileName === 'string' ? x.fileName : '',
        date: date as Date,
        imageSrc: src,
        needsCors: false,
        comment: typeof x.comment === 'string' ? x.comment : undefined,
      });
    });
  }

  // 古い順に(アルバムは時系列で並べる)
  items.sort((a, b) => +a.date - +b.date);

  const counts: Record<AlbumKind, number> = { song: 0, paint: 0, manga4: 0, assignment: 0 };
  items.forEach((it) => { counts[it.kind] += 1; });

  return {
    uid,
    termStartDate,
    termEndDate: ymd(end),
    character,
    termHearts,
    items,
    counts,
  };
}
