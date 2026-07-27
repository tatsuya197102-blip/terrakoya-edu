// MARKER: TERRAKOYA_EDU_LANGSWITCHER_V2
'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { applyDocumentDir } from '../i18n/config';

const LANGS = [
  { code: 'ja', label: 'JP', flag: '🇯🇵', name: '日本語' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'ar', label: 'AR', flag: '🇪🇬', name: 'العربية' },
  { code: 'sw', label: 'SW', flag: '🇰🇪', name: 'Kiswahili' },
  { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
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
    applyDocumentDir(code);
    setOpen(false);
  };

  if (!mounted) return null;
  const base = (i18n.language || 'ja').split('-')[0];
  const current = LANGS.find(l => l.code === base) || LANGS[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        aria-label={current.name}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition">
        <span className="text-base leading-none">{current.flag}</span>
        {current.label}
        <span className="text-xs opacity-70">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 min-w-[150px]">
          {LANGS.map(lng => (
            <button key={lng.code} onClick={() => handleChange(lng.code)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                base === lng.code ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}>
              <span className="text-base leading-none">{lng.flag}</span>
              <span className="font-mono font-bold text-xs w-6">{lng.label}</span>
              <span className="opacity-80">{lng.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
