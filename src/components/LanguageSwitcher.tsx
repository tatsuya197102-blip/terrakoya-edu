'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'ja', label: 'JP', name: '日本語' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'ar', label: 'AR', name: 'العربية' },
  { code: 'zh', label: 'ZH', name: '中文' },
  { code: 'vi', label: 'VI', name: 'Tiếng Việt' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    setOpen(false);
  };

  if (!mounted) return null;

  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition"
      >
        {current.label}
        <span className="text-xs opacity-70">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 min-w-[130px]">
          {LANGS.map(lng => (
            <button
              key={lng.code}
              onClick={() => handleChange(lng.code)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                i18n.language === lng.code
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="font-mono font-bold text-xs w-6">{lng.label}</span>
              <span className="opacity-80">{lng.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
