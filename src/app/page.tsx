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

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const features = [
    { icon: '🎨', titleKey: 'home.feature1Title', descKey: 'home.feature1Desc' },
    { icon: '🌍', titleKey: 'home.feature2Title', descKey: 'home.feature2Desc' },
    { icon: '🤖', titleKey: 'home.feature3Title', descKey: 'home.feature3Desc' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
      <nav className="flex justify-between items-center px-8 py-5">
        <h1 className="text-white text-xl font-bold">TERRAKOYA</h1>
        <div className="flex items-center gap-4">
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
          {user ? (
            <button onClick={() => router.push('/dashboard')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-400 transition">
              {t('dashboard.title')} →
            </button>
          ) : (
            <button onClick={() => router.push('/login')}
              className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition">
              {t('auth.login')}
            </button>
          )}
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-block bg-blue-500/20 text-blue-300 text-sm px-4 py-1.5 rounded-full mb-6 border border-blue-400/30">
          🎌 JP · EN · AR
        </div>
        <h2 className="text-5xl font-bold text-white mb-6 leading-tight max-w-2xl whitespace-pre-line">
          {t('home.title')}
        </h2>
        <p className="text-xl text-blue-200 mb-10 max-w-xl">{t('home.subtitle')}</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button onClick={() => router.push(user ? '/dashboard' : '/login')}
            className="bg-blue-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-400 transition text-lg">
            {user ? t('dashboard.continue') : t('auth.signUp')}
          </button>
          <button onClick={() => router.push('/courses')}
            className="border border-white/30 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/10 transition text-lg">
            {t('home.exploreCourses')}
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{t(f.titleKey)}</h3>
              <p className="text-blue-200 text-sm">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
