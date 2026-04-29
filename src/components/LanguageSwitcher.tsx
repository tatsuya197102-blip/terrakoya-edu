'use client';

import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n/config';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-2">
      {languages.map((lng) => (
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
  );
}