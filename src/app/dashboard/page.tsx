'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getLevelInfo, BADGES, getBadgeLabel } from '@/lib/gamification';
import { recordLogin } from '@/lib/gamificationActions';
import XPToast from '@/components/XPToast';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const COURSES: Record<string, { title: Record<string,string>; thumbnail: string; lessons: number }> = {
  'manga-basics':    { title: { ja: '漫画基礎講座', en: 'Manga Basics', ar: 'أساسيات المانغا' }, thumbnail: '🎨', lessons: 5 },
  'digital-illust':  { title: { ja: 'デジタルイラスト入門', en: 'Digital Illustration', ar: 'الرسم الرقمي' }, thumbnail: '🖌️', lessons: 4 },
  'story-making':    { title: { ja: 'ストーリー作り', en: 'Story Creation', ar: 'كتابة القصص' }, thumbnail: '📖', lessons: 3 },
  'animation-basics':{ title: { ja: 'アニメーション基礎', en: 'Animation Basics', ar: 'أساسيات الرسوم المتحركة' }, thumbnail: '🎬', lessons: 4 },
};

function generateCalendar(activityDates: string[]) {
  const today = new Date();
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, active: activityDates.includes(key) });
  }
  return days;
}

function calcStreak(activityDates: string[]): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (activityDates.includes(key)) streak++;
    else break;
  }
  return streak;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const [userName, setUserName] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [toastXP, setToastXP] = useState(0);
  const [toastBadges, setToastBadges] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUserName(data.displayName || user.displayName || 'ユーザー');
        setEnrolledCourses(data.enrolledCourses || []);
        const pm: Record<string, number> = {};
        for (const cid of (data.enrolledCourses || [])) {
          const completed = data.completedLessons?.[cid] || [];
          const total = COURSES[cid]?.lessons || 1;
          pm[cid] = Math.round((completed.length / total) * 100);
        }
        setProgressMap(pm);
        const dates = data.activityDates || [];
        const today = new Date().toISOString().split('T')[0];
        if (!dates.includes(today)) dates.push(today);
        setActivityDates(dates);
        setXp(data.xp || 0);
        setBadges(data.badges || []);
      }
      // ログイン記録・XP付与
      try {
        const result = await recordLogin(user.uid);
        if (result.xpGained > 0 || result.newBadges.length > 0) {
          setToastXP(result.xpGained);
          setToastBadges(result.newBadges);
          setShowToast(true);
          // XP表示を更新
          const snap2 = await getDoc(doc(db, 'users', user.uid));
          if (snap2.exists()) setXp(snap2.data().xp || 0);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const calendarDays = generateCalendar(activityDates);
  const streak = calcStreak(activityDates);
  const totalProgress = enrolledCourses.length > 0
    ? Math.round(Object.values(progressMap).reduce((a, b) => a + b, 0) / enrolledCourses.length)
    : 0;
  const completedCourses = Object.values(progressMap).filter(p => p === 100).length;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-400 text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* XPトースト */}
        {showToast && (
          <XPToast xp={toastXP} badges={toastBadges} onDone={() => setShowToast(false)} />
        )}

        {/* ウェルカムバナー + レベル */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">{t('dashboard.welcome', { name: userName })}</h1>
              <p className="text-blue-200 text-sm">{t('dashboard.subtitle')}</p>
            </div>
            {/* レベル表示 */}
            {(() => {
              const lv = getLevelInfo(xp, lang);
              return (
                <div className="bg-white/10 rounded-xl p-4 min-w-[220px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-300 font-bold text-sm">Lv.{lv.lv}</span>
                    <span className="text-white font-bold text-sm">{lv.title}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 mb-1">
                    <div className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${lv.progressPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-blue-200">
                    <span>⚡ {xp} XP</span>
                    {!lv.isMax && <span>{lv.progressXP}/{lv.neededXP} → {lv.nextTitle}</span>}
                    {lv.isMax && <span>🔥 MAX!</span>}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: t('dashboard.progress'),         value: `${totalProgress}%`, icon: '📊', color: 'text-blue-400' },
            { label: t('dashboard.enrolledCourses'),  value: enrolledCourses.length, icon: '📚', color: 'text-green-400' },
            { label: t('dashboard.completedCourses'), value: completedCourses, icon: '🏆', color: 'text-yellow-400' },
            { label: t('dashboard.streakDays'),       value: `${streak}${t('dashboard.days')}`, icon: '🔥', color: 'text-orange-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* バッジ一覧 */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            🏅 {lang === 'ar' ? 'شاراتي' : lang === 'en' ? 'My Badges' : 'マイバッジ'}
            <span className="text-xs text-gray-400 font-normal ml-2">
              {badges.length}/{BADGES.length}
            </span>
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3">
            {BADGES.map(badge => {
              const earned = badges.includes(badge.id);
              const label = getBadgeLabel(badge, lang);
              return (
                <div key={badge.id} title={label}
                  className={`flex flex-col items-center gap-1 cursor-default transition-all ${
                    earned ? 'opacity-100' : 'opacity-25 grayscale'
                  }`}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl ${
                    earned ? 'bg-yellow-400/20 border-2 border-yellow-400' : 'bg-gray-800 border-2 border-gray-700'
                  }`}>
                    {label.split(' ')[0]}
                  </div>
                  <span className="text-xs text-center leading-tight text-gray-400 w-12 truncate">{label.split(' ').slice(1).join(' ')}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 学習カレンダー */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              📅 {t('dashboard.calendar')}
              <span className="text-xs text-gray-400 font-normal">（{t('dashboard.calendarSub')}）</span>
            </h2>
            <div className="grid grid-cols-10 gap-1">
              {calendarDays.map((day, i) => (
                <div key={i} title={day.date}
                  className={`w-6 h-6 rounded-sm ${day.active ? 'bg-blue-500' : 'bg-gray-700'}`}/>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-sm bg-gray-700"/><span>{t('dashboard.notStudied')}</span>
              <div className="w-3 h-3 rounded-sm bg-blue-500 ml-2"/><span>{t('dashboard.studied')}</span>
            </div>
          </div>

          {/* ストリーク */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4">🔥 {t('dashboard.streak')}</h2>
            <div className="text-center py-4">
              <p className="text-6xl font-bold text-orange-400">{streak}</p>
              <p className="text-gray-400 mt-2">{t('dashboard.streakDaysContinue')}</p>
              {streak >= 30 && <p className="text-yellow-400 text-sm mt-2">{t('dashboard.streakMonth')}</p>}
              {streak >= 7 && streak < 30 && <p className="text-yellow-400 text-sm mt-2">{t('dashboard.streakWeek')}</p>}
              {streak === 0 && <p className="text-gray-500 text-sm mt-2">{t('dashboard.streakStart')}</p>}
            </div>
            <div className="bg-gray-700 rounded-lg p-3 mt-2">
              <p className="text-xs text-gray-400 text-center">{t('dashboard.streakNote')}</p>
            </div>
          </div>
        </div>

        {/* 学習中のコース */}
        <div className="bg-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">📚 {t('dashboard.myCourses')}</h2>
            <Link href="/courses" className="text-blue-400 hover:underline text-sm">{t('dashboard.viewAll')}</Link>
          </div>
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-5xl">🎌</p>
              <p className="text-gray-300 font-medium">{t('dashboard.welcomeTitle')}</p>
              <p className="text-gray-400 text-sm">{t('dashboard.welcomeNote')}</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a href="/lessons" className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-sm transition-colors">{t('dashboard.goLessons')}</a>
                <a href="/courses" className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg text-sm transition-colors">{t('dashboard.goCourses')}</a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map(cid => {
                const course = COURSES[cid];
                if (!course) return null;
                const progress = progressMap[cid] || 0;
                return (
                  <div key={cid} className="flex items-center gap-4 p-3 bg-gray-700 rounded-lg">
                    <span className="text-2xl">{course.thumbnail}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{course.title[lang] || course.title.ja}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}/>
                        </div>
                        <span className="text-xs text-gray-400">{progress}%</span>
                      </div>
                    </div>
                    <Link href={`/courses/${cid}`} className="text-blue-400 hover:text-blue-300 text-sm whitespace-nowrap">
                      {progress === 100 ? t('dashboard.review') : t('dashboard.continue')}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { href: '/courses',     label: t('nav.courses'),   icon: '📚' },
            { href: '/lessons',     label: t('nav.lessons'),   icon: '🎓' },
            { href: '/auto-4manga', label: t('nav.manga4'),    icon: '📖' },
            { href: '/auto-animate',label: t('nav.anime'),     icon: '🎬' },
            { href: '/live',        label: t('nav.live'),      icon: '📡' },
            { href: '/portfolio',   label: t('nav.portfolio'), icon: '💎' },
          ].map((action, i) => (
            <Link key={i} href={action.href}
              className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition-colors">
              <p className="text-2xl mb-1">{action.icon}</p>
              <p className="text-sm">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
