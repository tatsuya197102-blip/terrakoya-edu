'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface Work {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
  aiFeedback?: string;
  grade?: number;
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      setUserName(user.displayName || 'Creator');
      try {
        const q = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Work[];
        setWorks(data);
        setTotalWorks(data.length);
        const grades = data.filter(w => w.grade).map(w => w.grade as number);
        setAvgGrade(grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0);
        setStreak(Math.min(data.length, 7));
      } catch (err) { console.error(err); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const BADGES = [
    { icon: '🌟', labelJa: '初投稿', labelAr: 'أول عمل', ok: totalWorks >= 1 },
    { icon: '🔥', labelJa: '5作品達成', labelAr: '5 أعمال', ok: totalWorks >= 5 },
    { icon: '💎', labelJa: '10作品達成', labelAr: '10 أعمال', ok: totalWorks >= 10 },
    { icon: '⚡', labelJa: '3日連続', labelAr: '3 أيام', ok: streak >= 3 },
    { icon: '🏆', labelJa: '7日連続', labelAr: '7 أيام', ok: streak >= 7 },
    { icon: '👑', labelJa: '高評価', labelAr: 'تقييم عالي', ok: avgGrade >= 80 },
  ];

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><p>読み込み中...</p></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">{userName[0] || '?'}</div>
          <h1 className="text-3xl font-bold mb-2">{userName}</h1>
          <p className="text-gray-300">{lang === 'ar' ? 'سجل نموك كفنان' : 'クリエイターとしての成長記録'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-blue-400">{totalWorks}</p>
            <p className="text-gray-400 text-sm mt-1">{lang === 'ar' ? 'الأعمال' : '作品数'}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-green-400">{avgGrade || '-'}</p>
            <p className="text-gray-400 text-sm mt-1">{lang === 'ar' ? 'التقييم' : '平均評価'}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-3xl font-bold text-orange-400">{streak}</p>
            <p className="text-gray-400 text-sm mt-1">{lang === 'ar' ? 'متتالية' : '連続日数'}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-12">
          <h2 className="text-xl font-bold mb-4">{lang === 'ar' ? 'الشارات' : 'バッジ'}</h2>
          <div className="flex gap-4 flex-wrap">
            {BADGES.map((b, i) => (
              <div key={i} className={`flex flex-col items-center p-4 rounded-xl ${b.ok ? 'bg-slate-800' : 'bg-slate-800/30 opacity-40'}`}>
                <span className="text-3xl mb-1">{b.icon}</span>
                <span className="text-xs text-gray-300">{lang === 'ar' ? b.labelAr : b.labelJa}</span>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">{lang === 'ar' ? 'أعمالي' : '作品一覧'}</h2>
        {works.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {works.map(work => (
              <div key={work.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {work.imageUrl && <img src={work.imageUrl} alt={work.title} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <h3 className="font-bold mb-1">{work.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 text-xs">{work.status === 'graded' ? t('portfolio.graded') : t('portfolio.submitted')}</span>
                    {work.grade && <span className="text-yellow-400 font-bold">{work.grade}/100</span>}
                  </div>
                </div>
              </div>
            ))}
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