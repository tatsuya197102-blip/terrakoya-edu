'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const COURSE_TITLES: Record<string, Record<string, string>> = {
  'manga-basics':     { ja: '漫画基礎講座',         en: 'Manga Basics',         ar: 'أساسيات المانغا' },
  'digital-illust':   { ja: 'デジタルイラスト入門', en: 'Digital Illustration',  ar: 'الرسم الرقمي' },
  'story-making':     { ja: 'ストーリー作り',        en: 'Story Creation',        ar: 'كتابة القصص' },
  'animation-basics': { ja: 'アニメーション基礎',   en: 'Animation Basics',      ar: 'أساسيات الرسوم المتحركة' },
};

export default function CertificatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const courseId = searchParams.get('course') || '';
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : lang === 'en' ? 'en-US' : 'ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserName(data.displayName || user.displayName || '');
        const cl = data.completedLessons?.[courseId] || [];
        setCompleted(cl.length > 0);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [courseId]);

  const handleDownload = () => {
    const el = document.getElementById('certificate');
    if (!el) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(el).then(canvas => {
        const link = document.createElement('a');
        link.download = 'terrakoya_certificate.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    }).catch(() => alert('Download feature requires html2canvas'));
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">{t('common.loading')}</div>;

  const courseTitle = COURSE_TITLES[courseId]?.[lang] || COURSE_TITLES[courseId]?.ja || courseId;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 py-12" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div id="certificate" className="bg-gradient-to-br from-yellow-50 to-amber-50 border-4 border-yellow-400 rounded-2xl p-10 max-w-2xl w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">🏆</div>
        <p className="text-yellow-700 text-sm font-medium tracking-widest mb-2">TERRAKOYA</p>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('certificate.title')}</h1>
        <p className="text-gray-500 text-sm mb-6">{t('certificate.congratulations')}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1">{userName}</p>
        <p className="text-gray-600 mb-6">{t('certificate.completed')}</p>
        <div className="bg-yellow-100 border border-yellow-300 rounded-xl px-6 py-3 mb-6 inline-block">
          <p className="text-xl font-bold text-yellow-800">{courseTitle}</p>
        </div>
        <p className="text-gray-500 text-sm">{today}</p>
        <p className="text-gray-400 text-xs mt-2">{t('certificate.issuedBy')}</p>
      </div>
      <button onClick={handleDownload} className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-xl font-bold transition-colors">
        📥 {t('certificate.download')}
      </button>
    </div>
  );
}
