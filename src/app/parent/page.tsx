'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ParentDashboard() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [worksCount, setWorksCount] = useState(0);
  const [avgGrade, setAvgGrade] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      setChildName(user.displayName || 'Student');
      try {
        const q = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
        const snap = await getDocs(q);
        const works = snap.docs.map(d => d.data());
        setWorksCount(works.length);
        const grades = works.filter(w => w.grade).map(w => w.grade as number);
        setAvgGrade(grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0);
      } catch (err) { console.error(err); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const lessonsCompleted = Math.min(worksCount * 2, 14);

  const CURRICULUM = [
    { name: lang === 'ar' ? 'تصميم الشخصيات' : 'キャラクターデザイン', lessons: 5, icon: '🎨' },
    { name: lang === 'ar' ? 'تقنيات التعبير' : '表現技法', lessons: 3, icon: '😊' },
    { name: lang === 'ar' ? 'الخلفيات' : '背景・構図', lessons: 1, icon: '🏙️' },
    { name: lang === 'ar' ? 'القصة' : 'ストーリー', lessons: 3, icon: '📐' },
    { name: lang === 'ar' ? 'الرسوم المتحركة' : 'アニメーション', lessons: 1, icon: '🎬' },
    { name: lang === 'ar' ? 'الرقمي' : 'デジタル', lessons: 1, icon: '🖥️' },
  ];

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><p>読み込み中...</p></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-emerald-300 text-sm tracking-widest mb-4">TERRAKOYA PARENTS</p>
          <h1 className="text-4xl font-bold mb-4">{lang === 'ar' ? 'لوحة تحكم الوالدين' : '保護者ダッシュボード'}</h1>
          <p className="text-gray-300 text-lg">{lang === 'ar' ? 'تابع تقدم طفلك' : 'お子様の学習進捗を確認'}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl">{childName[0]}</div>
            <div>
              <h2 className="text-xl font-bold">{childName}</h2>
              <p className="text-gray-400 text-sm">{lang === 'ar' ? 'آخر دخول' : '最終アクセス'}: {new Date().toLocaleDateString('ja-JP')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{lessonsCompleted}/14</p>
              <p className="text-gray-400 text-xs mt-1">{lang === 'ar' ? 'الدروس' : 'レッスン'}</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(lessonsCompleted / 14) * 100}%` }}></div>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{worksCount}</p>
              <p className="text-gray-400 text-xs mt-1">{lang === 'ar' ? 'الأعمال' : '提出作品'}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{avgGrade || '-'}</p>
              <p className="text-gray-400 text-xs mt-1">{lang === 'ar' ? 'التقييم' : '平均評価'}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{Math.min(worksCount, 7)}</p>
              <p className="text-gray-400 text-xs mt-1">{lang === 'ar' ? 'متتالية' : '連続日数'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">{lang === 'ar' ? 'المنهج الدراسي' : 'カリキュラム内容'}</h3>
          <div className="space-y-3">
            {CURRICULUM.map((item, i) => (
              <div key={i} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-gray-400 text-sm">{item.lessons} {lang === 'ar' ? 'دروس' : 'レッスン'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">💡 {lang === 'ar' ? 'نصائح للوالدين' : '保護者へのアドバイス'}</h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>1. {lang === 'ar' ? 'شجع طفلك على الرسم كل يوم' : 'お子様に毎日10分でも絵を描くことを勧めましょう'}</p>
            <p>2. {lang === 'ar' ? 'اطلع على أعماله وامدحه' : 'お子様の作品を見て、褒めてあげましょう'}</p>
            <p>3. {lang === 'ar' ? 'شارك في المسابقات معاً' : 'コンテストに一緒に参加してみましょう'}</p>
            <p>4. {lang === 'ar' ? 'لا تقارن بالآخرين' : '他の人と比べず、個人の成長に注目しましょう'}</p>
          </div>
        </div>

        <div className="bg-emerald-900/30 border border-emerald-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-3">🔒 {lang === 'ar' ? 'معلومات الأمان' : '安全情報'}</h3>
          <p className="text-gray-300 text-sm">{lang === 'ar' ? 'نحن نجمع فقط البريد الإلكتروني واسم العرض' : 'TERRAKOYAはお子様の個人情報を最小限にしています。メールアドレスと表示名のみを取得しています。'}</p>
        </div>
      </div>
    </div>
  );
}