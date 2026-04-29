'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      {/* 言語ボタン */}
      <div className="absolute top-4 right-4 flex gap-2">
        {['ja', 'en', 'ar'].map((lng) => (
          <button
            key={lng}
            onClick={() => i18n.changeLanguage(lng)}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              i18n.language === lng
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {lng.toUpperCase()}
          </button>
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          {t('home.title')}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {t('home.subtitle')}
        </p>
      </div>
    </div>
  );
}