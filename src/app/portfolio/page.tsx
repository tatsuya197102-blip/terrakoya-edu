// MARKER: TERRAKOYA_EDU_PORTFOLIO_V2
// 修正内容(2026-08-05):
//  1. 【致命的】ヘルパー L() が useEffect の内側で定義されているのに JSX から呼ばれており、
//     "L is not defined" で画面が落ちていた。コンポーネント直下に移動。
//     (tsconfig の ignoreBuildErrors: true のためビルドは通ってしまっていた)
//  2. 【4コマが出ない既知バグ】作品をトップレベル submissions からしか読んでいなかった。
//     4コマと課題は users/{uid}/submissions にあるため永久に表示されなかった。
//     album.ts と同じ方式で両方を読み、重複を避ける:
//       - トップレベル submissions は source==='paint' のみ(課題の公開コピーを除外)
//       - users/{uid}/submissions は全件(4コマ + 課題)
//  3. 画像は imageUrl 優先・旧 imageBase64 はフォールバック(移行済みだが古い端末キャッシュ対策)
//  4. 片方のクエリが権限等で失敗しても、取れた分は必ず表示する(Promise.allSettled)
//  5. BADGES に存在しない labelEn を参照していたのを解消
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

type WorkKind = 'paint' | 'manga4' | 'assignment';

interface Work {
  id: string;
  kind: WorkKind;
  title: string;
  imageSrc?: string;
  status: string;
  aiFeedback?: string;
  grade?: number;
  at?: string;
}

/** Timestamp / ISO文字列 / Date のいずれでも比較用の数値にそろえる */
function toMillis(v: unknown): number {
  if (!v) return 0;
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(+d) ? 0 : +d;
  }
  const maybe = v as { toDate?: () => Date };
  if (typeof maybe?.toDate === 'function') {
    try { return +maybe.toDate(); } catch { return 0; }
  }
  return 0;
}

/** imageUrl があればそれを、無ければ旧 imageBase64 を data URI にして返す */
function pickImage(x: Record<string, any>): string | undefined {
  if (typeof x.imageUrl === 'string' && x.imageUrl.startsWith('http')) return x.imageUrl;
  const b64 = typeof x.imageBase64 === 'string' ? x.imageBase64 : '';
  if (!b64) return undefined;
  return b64.startsWith('data:') ? b64 : `data:${x.fileType || 'image/jpeg'};base64,${b64}`;
}

export default function PortfolioPage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;
  const router = useRouter();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [totalWorks, setTotalWorks] = useState(0);
  const [avgGrade, setAvgGrade] = useState(0);
  const [streak, setStreak] = useState(0);

  // コンポーネント直下に置く(以前は useEffect 内にあり JSX から見えなかった)
  const L = (ar: string, en: string, ja: string, zh: string, hi: string, vi: string, es: string) =>
    ({ ar, en, ja, zh, hi, vi, es } as Record<string, string>)[lang] || en;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      setUserName(user.displayName || 'Creator');

      const [topRes, mineRes] = await Promise.allSettled([
        getDocs(query(collection(db, 'submissions'), where('studentId', '==', user.uid))),
        getDocs(collection(db, 'users', user.uid, 'submissions')),
      ]);

      const list: Work[] = [];

      // ペイント(トップレベル)。課題の公開コピーは source!=='paint' なので除外される
      if (topRes.status === 'fulfilled') {
        topRes.value.docs.forEach((d) => {
          const x = d.data() as Record<string, any>;
          if (x.source !== 'paint') return;
          list.push({
            id: d.id,
            kind: 'paint',
            title: typeof x.title === 'string' ? x.title : '',
            imageSrc: pickImage(x),
            status: typeof x.status === 'string' ? x.status : 'submitted',
            aiFeedback: x.aiFeedback,
            grade: typeof x.grade === 'number' ? x.grade : undefined,
          });
        });
      } else {
        console.error('portfolio: top-level submissions failed', topRes.reason);
      }

      // 4コマ + 課題(users/{uid}/submissions)。ここが今まで読まれていなかった
      if (mineRes.status === 'fulfilled') {
        mineRes.value.docs.forEach((d) => {
          const x = d.data() as Record<string, any>;
          const isManga = x.courseId === 'auto-4manga';
          list.push({
            id: d.id,
            kind: isManga ? 'manga4' : 'assignment',
            title:
              (typeof x.comment === 'string' && x.comment) ||
              (typeof x.fileName === 'string' && x.fileName) ||
              '',
            imageSrc: pickImage(x),
            status: typeof x.status === 'string' ? x.status : 'submitted',
            aiFeedback: x.aiFeedback,
            grade: typeof x.grade === 'number' ? x.grade : undefined,
            at: x.submittedAt,
          });
        });
      } else {
        console.error('portfolio: users/{uid}/submissions failed', mineRes.reason);
      }

      // 新しい順
      list.sort((a, b) => toMillis(b.at) - toMillis(a.at));

      setWorks(list);
      setTotalWorks(list.length);
      const grades = list.filter((w) => typeof w.grade === 'number').map((w) => w.grade as number);
      setAvgGrade(grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0);
      setStreak(Math.min(list.length, 7));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const BADGES = [
    { icon: '🌟', labelJa: '初投稿', labelAr: 'أول عمل', labelEn: 'First work', ok: totalWorks >= 1 },
    { icon: '🔥', labelJa: '5作品達成', labelAr: '5 أعمال', labelEn: '5 works', ok: totalWorks >= 5 },
    { icon: '💎', labelJa: '10作品達成', labelAr: '10 أعمال', labelEn: '10 works', ok: totalWorks >= 10 },
    { icon: '⚡', labelJa: '3日連続', labelAr: '3 أيام', labelEn: '3-day streak', ok: streak >= 3 },
    { icon: '🏆', labelJa: '7日連続', labelAr: '7 أيام', labelEn: '7-day streak', ok: streak >= 7 },
    { icon: '👑', labelJa: '高評価', labelAr: 'تقييم عالي', labelEn: 'High score', ok: avgGrade >= 80 },
  ];

  const KIND_BADGE: Record<WorkKind, { icon: string; ja: string; ar: string; en: string }> = {
    paint: { icon: '🎨', ja: 'おえかき', ar: 'رسم', en: 'Paint' },
    manga4: { icon: '📖', ja: '4コマ', ar: 'مانجا', en: '4-Koma' },
    assignment: { icon: '📝', ja: '課題', ar: 'مهمة', en: 'Assignment' },
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><p>読み込み中...</p></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">{userName[0] || '?'}</div>
          <h1 className="text-3xl font-bold mb-2">{userName}</h1>
          <p className="text-gray-300">{L('سجل نموك كفنان','Your creative growth record','クリエイターとしての成長記録','创作者成长记录','क्रिएटर की विकास यात्रा','Hành trình sáng tạo của bạn','Tu registro de crecimiento creativo')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-blue-400">{totalWorks}</p>
            <p className="text-gray-400 text-sm mt-1">{L('الأعمال','Works','作品数','作品数','कार्य','Tác phẩm','Obras')}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-green-400">{avgGrade || '-'}</p>
            <p className="text-gray-400 text-sm mt-1">{L('التقييم','Avg. Grade','平均評価','平均评分','औसत ग्रेड','Điểm TB','Nota media')}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-orange-400">{streak}</p>
            <p className="text-gray-400 text-sm mt-1">{L('متتالية','Streak','連続日数','连续天数','स्ट्रीक','Chuỗi ngày','Racha')}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-12">
          <h2 className="text-xl font-bold mb-4">{L('الشارات','Badges','バッジ','徽章','बैज','Huy hiệu','Insignias')}</h2>
          <div className="flex gap-4 flex-wrap">
            {BADGES.map((b, i) => (
              <div key={i} className={`flex flex-col items-center p-4 rounded-xl ${b.ok ? 'bg-slate-800' : 'bg-slate-800/30 opacity-40'}`}>
                <span className="text-3xl mb-1">{b.icon}</span>
                <span className="text-xs text-gray-300">{({ ar: b.labelAr, ja: b.labelJa, en: b.labelEn } as Record<string,string>)[lang] || b.labelJa}</span>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">{L('أعمالي','My Artworks','作品一覧','我的作品','मेरी कलाकृतियां','Tác phẩm của tôi','Mis obras')}</h2>
        {works.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map(work => {
              const kb = KIND_BADGE[work.kind];
              const kindLabel = ({ ar: kb.ar, ja: kb.ja, en: kb.en } as Record<string,string>)[lang] || kb.en;
              return (
                <div key={`${work.kind}-${work.id}`} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  {work.imageSrc && <img src={work.imageSrc} alt={work.title} loading="lazy" className="w-full h-40 object-cover" />}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-gray-300">{kb.icon} {kindLabel}</span>
                    </div>
                    <h3 className="font-bold mb-1 line-clamp-2">{work.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 text-xs">{work.status === 'graded' ? t('portfolio.graded') : t('portfolio.submitted')}</span>
                      {typeof work.grade === 'number' && <span className="text-yellow-400 font-bold">{work.grade}/100</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">🎨</p>
            <p className="text-gray-400">{t('portfolio.noWorks')}</p>
            <p className="text-gray-500 text-sm mt-2">{t('portfolio.noWorksNote')}</p>
            <a href="/courses" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">{t('portfolio.goToCourses')}</a>
          </div>
        )}
      </div>
    </div>
  );
}
