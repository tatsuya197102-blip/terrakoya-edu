'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const lang = i18n.language;
  const isAr = lang === 'ar';

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const features = [
    { icon: '🎨', titleKey: 'home.feature1Title', descKey: 'home.feature1Desc' },
    { icon: '🌍', titleKey: 'home.feature2Title', descKey: 'home.feature2Desc' },
    { icon: '🤖', titleKey: 'home.feature3Title', descKey: 'home.feature3Desc' },
  ];

  // 言語別キャッチコピー（改行なし・スマホ対応）
  const headlines: Record<string, { main: string; sub: string }> = {
    ja: { main: '漫画・アニメで夢をかなえよう', sub: 'プロから学ぶ、エジプト発の創作プラットフォーム' },
    en: { main: 'Draw Your Future', sub: 'Learn manga & anime from professionals — from Egypt to the world' },
    ar: { main: 'ارسم مستقبلك', sub: 'تعلم المانغا والأنيمي من المحترفين — من مصر إلى العالم' },
  };

  const headline = headlines[lang] || headlines.ja;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">

      {/* ナビ */}
      <nav className="flex justify-between items-center px-6 py-4">
        <h1 className="text-white text-xl font-bold tracking-wide">TERRAKOYA</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {['ja', 'en', 'ar'].map(lng => (
              <button key={lng} onClick={() => i18n.changeLanguage(lng)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  i18n.language === lng ? 'bg-white text-blue-900' : 'text-white border border-white/30 hover:bg-white/10'
                }`}>
                {lng === 'ja' ? 'JP' : lng === 'en' ? 'EN' : 'AR'}
              </button>
            ))}
          </div>
          <button onClick={() => router.push(user ? '/dashboard' : '/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-400 transition whitespace-nowrap">
            {user ? (isAr ? 'لوحة التحكم' : lang === 'en' ? 'Dashboard' : 'ダッシュボード')
                   : (isAr ? 'تسجيل الدخول' : lang === 'en' ? 'Login' : 'ログイン')}
          </button>
        </div>
      </nav>

      {/* ヒーロー */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-16 md:py-24">
        <div className="inline-block bg-blue-500/20 text-blue-300 text-xs px-4 py-1.5 rounded-full mb-6 border border-blue-400/30">
          🎌 JP · EN · AR
        </div>
        <h2 className={`text-4xl md:text-6xl font-bold text-white mb-4 leading-tight max-w-lg ${isAr ? 'font-arabic' : ''}`}
          dir={isAr ? 'rtl' : 'ltr'}>
          {headline.main}
        </h2>
        <p className="text-base md:text-xl text-blue-200 mb-10 max-w-md leading-relaxed"
          dir={isAr ? 'rtl' : 'ltr'}>
          {headline.sub}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:justify-center">
          <button onClick={() => router.push(user ? '/dashboard' : '/register')}
            className="bg-blue-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-400 transition text-base w-full sm:w-auto">
            {user
              ? (isAr ? 'واصل التعلم' : lang === 'en' ? 'Continue Learning' : '学習を続ける')
              : (isAr ? 'ابدأ مجاناً' : lang === 'en' ? 'Start for Free' : '無料で始める')}
          </button>
          <button onClick={() => router.push('/lessons')}
            className="border border-white/30 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/10 transition text-base w-full sm:w-auto">
            {isAr ? 'استعرض الدروس' : lang === 'en' ? 'Browse Lessons' : 'レッスンを見る'}
          </button>
        </div>
      </section>

      {/* 特徴 */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-bold text-base mb-1">{t(f.titleKey)}</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
