'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const lang = i18n.language;
  const isAr = lang === 'ar';

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const features = [
    { icon: '🎨', titleKey: 'home.feature1Title', descKey: 'home.feature1Desc' },
    { icon: '🌍', titleKey: 'home.feature2Title', descKey: 'home.feature2Desc' },
    { icon: '🤖', titleKey: 'home.feature3Title', descKey: 'home.feature3Desc' },
  ];

  // 言語別キャッチコピー（改行なし・スマホ対応）
  const headlines: Record<string, { main: string; sub: string }> = {
    ja: { main: 'アニメで夢をかなえよう', sub: 'プロから学ぶ、エジプト発の創作プラットフォーム' },
    en: { main: 'Achieve Your Dreams with Anime', sub: 'Learn from professionals — a creative platform from Egypt' },
    ar: { main: 'حقق أحلامك مع الأنيمي', sub: 'تعلم من المحترفين — منصة إبداعية من مصر' },
    zh: { main: '用动漫实现你的梦想', sub: '向专业人士学习——来自埃及的创作平台' },
    vi: { main: 'Thực hiện ước mơ với Anime', sub: 'Học từ chuyên gia — nền tảng sáng tạo từ Ai Cập' },
  };

  const headline = headlines[lang] || headlines.ja;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">

      {/* ナビ */}
      <nav className="flex justify-between items-center px-6 py-4">
        <h1 className="text-white text-xl font-bold tracking-wide">TERRAKOYA</h1>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button onClick={() => router.push(user ? '/dashboard' : '/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-400 transition whitespace-nowrap">
            {user ? ({'ar':'لوحة التحكم','en':'Dashboard','ja':'ダッシュボード','zh':'学习面板','vi':'Bảng điều khiển'}[lang as string] || 'Dashboard')
                   : ({'ar':'تسجيل الدخول','en':'Login','ja':'ログイン','zh':'登录','vi':'Đăng nhập'}[lang as string] || 'Login')}
          </button>
        </div>
      </nav>

      {/* ヒーロー */}
      <section style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'4rem 1.5rem'}}>
        <div className="inline-block bg-blue-500/20 text-blue-300 text-xs px-4 py-1.5 rounded-full mb-6 border border-blue-400/30">
          🎌 JP · EN · AR · ZH · VI
        </div>
        <h2 style={{fontSize:'clamp(2rem,6vw,3.5rem)', fontWeight:'bold', color:'white', marginBottom:'1rem', lineHeight:1.2, maxWidth:'32rem', direction: isAr ? 'rtl' : 'ltr'}}>
          {headline.main}
        </h2>
        <p style={{fontSize:'clamp(1rem,2.5vw,1.25rem)', color:'#bfdbfe', marginBottom:'2.5rem', maxWidth:'28rem', lineHeight:1.7, direction: isAr ? 'rtl' : 'ltr'}}>
          {headline.sub}
        </p>
        <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', width:'100%', maxWidth:'20rem'}}>
          <button onClick={() => router.push(user ? '/dashboard' : '/register')}
            style={{background:'#3b82f6', color:'white', padding:'0.75rem 2rem', borderRadius:'0.75rem', fontWeight:'500', fontSize:'1rem', width:'100%', cursor:'pointer', border:'none'}}>
            {user
              ? ({'ar':'واصل التعلم','en':'Continue Learning','ja':'学習を続ける','zh':'继续学习','vi':'Tiếp tục học'}[lang as string] || 'Continue Learning')
              : ({'ar':'ابدأ مجاناً','en':'Start for Free','ja':'無料で始める','zh':'免费开始','vi':'Bắt đầu miễn phí'}[lang as string] || 'Start for Free')}
          </button>
          <button onClick={() => router.push('/lessons')}
            style={{background:'transparent', color:'white', padding:'0.75rem 2rem', borderRadius:'0.75rem', fontWeight:'500', fontSize:'1rem', width:'100%', cursor:'pointer', border:'1px solid rgba(255,255,255,0.3)'}}>
            {{'ar':'استعرض الدروس','en':'Browse Lessons','ja':'レッスンを見る','zh':'浏览课程','vi':'Xem bài học'}[lang as string] || 'Browse Lessons'}
          </button>
        </div>
      </section>

      {/* 特徴 */}
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
