'use client';
import { useEffect, useState } from 'react';
import { BADGES } from '@/lib/gamification';
import { useTranslation } from 'react-i18next';

interface XPToastProps {
  xp?: number;
  badges?: string[];
  onDone?: () => void;
}

export default function XPToast({ xp = 0, badges = [], onDone }: XPToastProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone?.(); }, 3000);
    return () => clearTimeout(t);
  }, []);

  if (!visible || (xp === 0 && badges.length === 0)) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {xp > 0 && (
        <div className="bg-yellow-400 text-black px-6 py-3 rounded-full font-bold text-lg shadow-xl animate-bounce">
          ⚡ +{xp} XP！
        </div>
      )}
      {badges.map(bid => {
        const badge = BADGES.find(b => b.id === bid);
        if (!badge) return null;
        const label = lang === 'ar' ? badge.ar : lang === 'en' ? badge.en : badge.ja;
        return (
          <div key={bid} className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl">
            🏅 新バッジ獲得！ {label}
          </div>
        );
      })}
    </div>
  );
}
