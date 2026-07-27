// MARKER: TERRAKOYA_EDU_WELCOME_V1
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import LanguageSwitcher from '@/components/LanguageSwitcher';

/**
 * 迎え画面を毎回出すか、初回訪問時だけにするか。
 * 子供向け端末が前提なので既定は「毎回」= 迎え画面がこの子のホーム。
 * 初回のみに変えたい場合は false にする。
 */
const ALWAYS_SHOW_WELCOME = true;
const WELCOME_SEEN_KEY = 'terrakoya_welcome_seen';

// ファイアンス(古代エジプトの青緑釉)を軸にしたパレット
const C = {
  ink: '#0E3B4A',
  inkSoft: '#3C6675',
  wash1: '#EAF6F8',
  wash2: '#D7EDF2',
  card: '#FFFFFF',
  learn: '#1B7A8C',
  sing: '#B8642A',
  paint: '#3F7F52',
  play: '#7A4E9E',
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'welcome' | 'about'>('welcome');
  const [petOk, setPetOk] = useState(true);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const lang = (i18n.language || 'ja').split('-')[0];
  const isAr = lang === 'ar';

  useEffect(() => {
    setMounted(true);
    if (!ALWAYS_SHOW_WELCOME) {
      try {
        if (localStorage.getItem(WELCOME_SEEN_KEY)) setView('about');
        else localStorage.setItem(WELCOME_SEEN_KEY, '1');
      } catch { /* localStorage 不可の環境では常に迎え画面 */ }
    }
  }, []);

  if (!mounted) return null;

  const pick = (o: Record<string, string>) => o[lang] || o.ja;

  // ── 迎え画面 ────────────────────────────────────────────────
  if (view === 'welcome') {
    const activities = [
      { key: 'learn', icon: '📚', href: '/lessons',   color: C.learn },
      { key: 'sing',  icon: '🎤', href: '/sing',      color: C.sing  },
      { key: 'paint', icon: '🎨', href: '/paint',     color: C.paint },
      { key: 'play',  icon: '🎮', href: '/game-spot', color: C.play  },
    ];

    return (
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${C.wash1} 0%, ${C.wash2} 100%)`,
        display: 'flex', flexDirection: 'column',
      }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes tk-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          .tk-bob { animation: tk-bob 3.2s ease-in-out infinite; }
          .tk-tile { transition: transform .15s ease, box-shadow .15s ease; }
          .tk-tile:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(14,59,74,.16); }
          .tk-tile:focus-visible { outline: 3px solid ${C.ink}; outline-offset: 3px; }
          @media (prefers-reduced-motion: reduce) {
            .tk-bob { animation: none; }
            .tk-tile { transition: none; }
            .tk-tile:hover { transform: none; }
          }
        ` }} />

        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.9rem 1.25rem',
        }}>
          <span style={{ color: C.ink, fontWeight: 800, letterSpacing: '.04em', fontSize: '1.05rem' }}>
            TERRAKOYA
          </span>
          <LanguageSwitcher />
        </header>

        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '1rem 1.25rem 2.5rem', width: '100%', maxWidth: '46rem', margin: '0 auto',
        }}>
          {/* ブンブン + ふきだし */}
          <div className="tk-bob" style={{ marginBottom: '.5rem' }}>
            {petOk ? (
              <img src="/pets/usagi.png" alt="" width={132} height={132}
                onError={() => setPetOk(false)}
                style={{ width: 132, height: 132, objectFit: 'contain', display: 'block' }} />
            ) : (
              <div style={{ fontSize: '5.5rem', lineHeight: 1 }} aria-hidden="true">🐰</div>
            )}
          </div>

          <div style={{
            background: C.card, borderRadius: '1.25rem', padding: '.9rem 1.5rem',
            boxShadow: '0 4px 16px rgba(14,59,74,.10)', textAlign: 'center',
            marginBottom: '2rem', maxWidth: '26rem',
            direction: isAr ? 'rtl' : 'ltr',
          }}>
            <p style={{ color: C.inkSoft, fontSize: '.95rem', margin: '0 0 .25rem' }}>
              {t('welcome.hello')}
            </p>
            <p style={{ color: C.ink, fontSize: 'clamp(1.4rem,5vw,1.9rem)', fontWeight: 800, margin: 0, lineHeight: 1.25 }}>
              {t('welcome.greeting')}
            </p>
          </div>

          {/* 4つのボタン */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.9rem',
            width: '100%', maxWidth: '30rem',
          }}>
            {activities.map(a => (
              <button key={a.key} className="tk-tile"
                onClick={() => router.push(a.href)}
                aria-label={t(`welcome.${a.key}`)}
                style={{
                  background: C.card, border: `3px solid ${a.color}`, borderRadius: '1.25rem',
                  padding: '1.4rem .75rem', cursor: 'pointer', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem',
                  boxShadow: '0 2px 10px rgba(14,59,74,.08)', minHeight: '9rem',
                }}>
                <span style={{ fontSize: '2.6rem', lineHeight: 1 }} aria-hidden="true">{a.icon}</span>
                <span style={{ color: a.color, fontSize: 'clamp(1.1rem,4vw,1.35rem)', fontWeight: 800 }}>
                  {t(`welcome.${a.key}`)}
                </span>
                <span style={{ color: C.inkSoft, fontSize: '.8rem' }}>
                  {t(`welcome.${a.key}Desc`)}
                </span>
              </button>
            ))}
          </div>
        </main>

        <footer style={{ textAlign: 'center', padding: '0 1.25rem 1.75rem' }}>
          <button onClick={() => setView('about')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.inkSoft, fontSize: '.85rem', textDecoration: 'underline',
              padding: '.5rem 1rem',
            }}>
            {pick({ ja: 'おとなの方へ', en: 'For grown-ups', ar: 'للكبار' })}
          </button>
        </footer>
      </div>
    );
  }

  // ── おとな向け(従来のトップページ) ──────────────────────────
  const features = [
    { icon: '🎨', titleKey: 'home.feature1Title', descKey: 'home.feature1Desc' },
    { icon: '🌍', titleKey: 'home.feature2Title', descKey: 'home.feature2Desc' },
    { icon: '🤖', titleKey: 'home.feature3Title', descKey: 'home.feature3Desc' },
  ];

  const headlines: Record<string, { main: string; sub: string }> = {
    ja: { main: '漫画・アニメで、夢を現実に', sub: '創作の力で、未来を描く' },
    en: { main: 'Turn Your Dreams into Reality', sub: 'Draw your future with the power of creation' },
    ar: { main: 'حوّل أحلامك إلى واقع', sub: 'ارسم مستقبلك بقوة الإبداع' },
  };
  const headline = headlines[lang] || headlines.ja;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">

      <nav className="flex justify-between items-center px-6 py-4">
        <h1 className="text-white text-xl font-bold tracking-wide">TERRAKOYA</h1>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button onClick={() => router.push(user ? '/dashboard' : '/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-400 transition whitespace-nowrap">
            {user ? pick({ ar: 'لوحة التحكم', en: 'Dashboard', ja: 'ダッシュボード' })
                  : pick({ ar: 'تسجيل الدخول', en: 'Login', ja: 'ログイン' })}
          </button>
        </div>
      </nav>

      <div className="px-6 pt-2">
        <button onClick={() => setView('welcome')}
          className="text-blue-200 text-sm underline hover:text-white transition">
          {isAr ? `${pick({ ar: 'شاشة الأطفال', en: "Kids' screen", ja: 'こどもの画面' })} ›`
                : `‹ ${pick({ ar: 'شاشة الأطفال', en: "Kids' screen", ja: 'こどもの画面' })}`}
        </button>
      </div>

      <section style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'3rem 1.5rem 4rem'}}>
        <div className="inline-block bg-blue-500/20 text-blue-300 text-xs px-4 py-1.5 rounded-full mb-6 border border-blue-400/30">
          JP · EN · AR
        </div>
        <h2 style={{fontSize:'clamp(1.6rem,5vw,3.5rem)', fontWeight:'bold', color:'white', marginBottom:'1rem', lineHeight:1.2, maxWidth:'32rem', direction: isAr ? 'rtl' : 'ltr'}}>
          {headline.main}
        </h2>
        <p style={{fontSize:'clamp(1rem,2.5vw,1.25rem)', color:'#bfdbfe', marginBottom:'2.5rem', maxWidth:'28rem', lineHeight:1.7, direction: isAr ? 'rtl' : 'ltr'}}>
          {headline.sub}
        </p>
        <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', width:'100%', maxWidth:'20rem'}}>
          <button onClick={() => router.push(user ? '/dashboard' : '/register')}
            style={{background:'#3b82f6', color:'white', padding:'0.75rem 2rem', borderRadius:'0.75rem', fontWeight:'500', fontSize:'1rem', width:'100%', cursor:'pointer', border:'none'}}>
            {user ? pick({ ar: 'واصل التعلم', en: 'Continue Learning', ja: '学習を続ける' })
                  : pick({ ar: 'ابدأ مجاناً', en: 'Start for Free', ja: '無料で始める' })}
          </button>
          <button onClick={() => router.push('/lessons')}
            style={{background:'transparent', color:'white', padding:'0.75rem 2rem', borderRadius:'0.75rem', fontWeight:'500', fontSize:'1rem', width:'100%', cursor:'pointer', border:'1px solid rgba(255,255,255,0.3)'}}>
            {pick({ ar: 'استعرض الدروس', en: 'Browse Lessons', ja: 'レッスンを見る' })}
          </button>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-bold text-base mb-1">{t(f.titleKey)}</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
