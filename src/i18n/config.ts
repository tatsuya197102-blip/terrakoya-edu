// MARKER: TERRAKOYA_EDU_I18N_SWFR_V1
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// 対応言語: ja(日本語) / en(英語) / ar(アラビア語) / sw(スワヒリ語) / fr(フランス語)
const languages = ['ja', 'en', 'ar', 'sw', 'fr'];

// RTL(右から左)言語。ar のみ。sw/fr は LTR。
const RTL_LANGUAGES = ['ar'];

/** 言語コードからテキスト方向を返す。'ja-JP' のような地域付きコードにも対応 */
export function dirFor(lng?: string): 'rtl' | 'ltr' {
  const base = (lng || 'en').split('-')[0];
  return RTL_LANGUAGES.includes(base) ? 'rtl' : 'ltr';
}

/** <html> の lang / dir を現在の言語に合わせる */
export function applyDocumentDir(lng?: string) {
  if (typeof document === 'undefined') return;
  const base = (lng || 'en').split('-')[0];
  document.documentElement.lang = base;
  document.documentElement.dir = dirFor(base);
}

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: languages,
    debug: false,
    interpolation: { escapeValue: false },
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
    ns: ['translation'],
    defaultNS: 'translation',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    load: 'languageOnly',
  });

// 初期表示と言語変更のたびに dir を同期(リロード直後の ar 表示崩れ防止)
if (typeof window !== 'undefined') {
  applyDocumentDir(i18n.language);
  i18n.on('languageChanged', (lng) => applyDocumentDir(lng));
}

export default i18n;
export { languages, RTL_LANGUAGES };
