'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n/config';

const langLabels: Record<string, string> = {
  ja: 'JP',
  en: 'EN',
  ar: 'AR',
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  };

  if (!mounted) return null;

  return (
    <div className="flex gap-1">
      {languages.map((lng) => (
        <button
          key={lng}
          onClick={() => handleChange(lng)}
          className={`px-2 py-1 rounded text-sm transition ${
            i18n.language === lng
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          {langLabels[lng] || lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}