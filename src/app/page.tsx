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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">

      {/* ナビゲーション */}
      <nav className="flex justify-between items-center px-8 py-5">
        <h1 className="text-white text-xl font-bold">
          TERRAKOYA
        </h1>
        <div className="flex items-center gap-4">
          {/* 言語切り替え */}
          <div className="flex gap-1">
            {['ja', 'en', 'ar'].map((lng) => (
              <button
                key={lng}
                onClick={() => i18n.changeLanguage(lng)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  i18n.language === lng
                    ? 'bg-white text-blue-900'
                    : 'text-white border border-white/30 hover:bg-white/10'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          {user ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-400 transition"
            >
              {t('dashboard.title')} →
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
            >
              {t('auth.login')}
            </button>
          )}
        </div>
      </nav>

      {/* ヒーローセクション */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-block bg-blue-500/20 text-blue-300 text-sm px-4 py-1.5 rounded-full mb-6 border border-blue-400/30">
          🎌 日本語 · English · العربية
        </div>
        <h2 className="text-5xl font-bold text-white mb-6 leading-tight max-w-2xl">
          {t('home.title')}
        </h2>
        <p className="text-xl text-blue-200 mb-10 max-w-xl">
          {t('home.subtitle')}
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={() => router.push(user ? '/dashboard' : '/login')}
            className="bg-blue-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-400 transition text-lg"
          >
            {user ? '学習を続ける →' : t('auth.signUp')}
          </button>
          <button
            onClick={() => router.push('/courses')}
            className="border border-white/30 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/10 transition text-lg"
          >
            {t('courses.title')} →
          </button>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎨',
              title: '漫画・アニメ特化',
              titleEn: 'Manga & Anime Focus',
              titleAr: 'تركيز على المانغا والأنمي',
              desc: 'プロの漫画家・アニメーターが教える実践的なコース',
            },
            {
              icon: '🌍',
              title: '多言語対応',
              titleEn: 'Multilingual',
              titleAr: 'متعدد اللغات',
              desc: '日本語・英語・アラビア語に完全対応',
            },
            {
              icon: '📊',
              title: '進捗管理',
              titleEn: 'Progress Tracking',
              titleAr: 'تتبع التقدم',
              desc: 'あなたの学習進捗をリアルタイムで管理',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">
                {i18n.language === 'ar' ? feature.titleAr
                  : i18n.language === 'en' ? feature.titleEn
                  : feature.title}
              </h3>
              <p className="text-blue-200 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}