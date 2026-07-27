// MARKER: TERRAKOYA_EDU_STUDY_CTA_V1
'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STUDY_URL = 'https://terrakoya-study.web.app';

/**
 * Study への送客カード。
 * 方針: 課金訴求はしない(「むりょうではじめる」まで)。
 * こどもの迎え画面には出さない。ダッシュボード / 保護者ページ / レッスン完了画面で使う。
 */
export default function StudyCta({ subject }: { subject?: string }) {
  const { t } = useTranslation();
  const [petOk, setPetOk] = useState(true);
  const href = subject ? `${STUDY_URL}/?subject=${encodeURIComponent(subject)}` : STUDY_URL;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="block rounded-2xl p-5 border border-teal-400/25 bg-teal-400/5 hover:bg-teal-400/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
      <div className="flex items-center gap-4">
        {petOk ? (
          <img src="/pets/usagi.png" alt="" width={56} height={56}
            onError={() => setPetOk(false)}
            className="w-14 h-14 object-contain shrink-0" />
        ) : (
          <span className="text-4xl shrink-0" aria-hidden="true">🐰</span>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base mb-0.5">{t('studyCta.title')}</p>
          <p className="text-teal-100/80 text-sm leading-snug">{t('studyCta.body')}</p>
        </div>

        <span className="shrink-0 bg-teal-500 text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap">
          {t('studyCta.cta')}
        </span>
      </div>
    </a>
  );
}
