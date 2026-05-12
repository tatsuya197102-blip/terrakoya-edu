'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

const COURSES: Record<string, { titleKey: string; titleJa: string; thumbnail: string; lessons: number }> = {
  'manga-basics': { titleKey: 'manga-basics', titleJa: '漫画基礎講座', thumbnail: '🎨', lessons: 5 },
  'digital-illust': { titleKey: 'digital-illust', titleJa: 'デジタルイラスト入門', thumbnail: '🖌️', lessons: 4 },
  'story-making': { titleKey: 'story-making', titleJa: 'ストーリー作り', thumbnail: '📖', lessons: 3 },
  'animation-basics': { titleKey: 'animation-basics', titleJa: 'アニメーション基礎', thumbnail: '🎬', lessons: 4 },
};

const COURSE_TITLES: Record<string, Record<string, string>> = {
  ja: {
    'manga-basics': '漫画基礎講座',
    'digital-illust': 'デジタルイラスト入門',
    'story-making': 'ストーリー作り',
    'animation-basics': 'アニメーション基礎',
  },
  en: {
    'manga-basics': 'Manga Basics',
    'digital-illust': 'Digital Illustration',
    'story-making': 'Story Making',
    'animation-basics': 'Animation Basics',
  },
  ar: {
    'manga-basics': 'أساسيات المانجا',
    'digital-illust': 'الرسم التوضيحي الرقمي',
    'story-making': 'صناعة القصة',
    'animation-basics': 'أساسيات الرسوم المتحركة',
  },
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
    if (activityDates.includes(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isRtl = lang === 'ar';

  const [userName, setUserName] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth/login'); return; }
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUserName(data.displayName || user.displayName || 'User');
        setEnrolledCourses(data.enrolledCourses || []);

        const pm: Record<string, number> = {};
        const enrolled = data.enrolledCourses || [];
        for (const cid of enrolled) {
          const completed = data.completedLessons?.[cid] || [];
          const total = COURSES[cid]?.lessons || 1;
          pm[cid] = Math.round((completed.length / total) * 100);
        }
        setProgressMap(pm);

        const dates = data.activityDates || [];
        const today = new Date().toISOString().split('T')[0];
        if (!dates.includes(today)) dates.push(today);
        setActivityDates(dates);
      }
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

  const getCourseTitle = (cid: string): string => {
    return COURSE_TITLES[lang]?.[cid] || COURSE_TITLES.ja[cid] || cid;
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">{t('common.loading')}</div>;

  const arrowForward = isRtl ? '←' : '→';

  // 統計カードのデータ（カラフルなグラデーション付き）
  const stats = [
    {
      label: t('dashboard.stats.progress'),
      value: `${totalProgress}%`,
      icon: '📊',
      gradient: 'from-blue-500 to-cyan-400',
      shadow: 'shadow-blue-500/30',
    },
    {
      label: t('dashboard.stats.enrolledCourses'),
      value: enrolledCourses.length,
      icon: '📚',
      gradient: 'from-green-500 to-emerald-400',
      shadow: 'shadow-green-500/30',
    },
    {
      label: t('dashboard.stats.completedCourses'),
      value: completedCourses,
      icon: '🏆',
      gradient: 'from-yellow-500 to-amber-400',
      shadow: 'shadow-yellow-500/30',
    },
    {
      label: t('dashboard.stats.streakDays'),
      value: t('dashboard.stats.streakValue', { count: streak }),
      icon: '🔥',
      gradient: 'from-orange-500 to-red-400',
      shadow: 'shadow-orange-500/30',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white p-6 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* 背景の装飾的なグラデーションブロブ */}
      <div className="absolute top-0 -start-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -end-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 start-1/2 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* ウェルカムバナー - キャラクターイラスト風＆グラデーション強化 */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 mb-6 relative overflow-hidden shadow-2xl shadow-purple-500/30">
          {/* 装飾的な星 */}
          <span className="absolute top-3 end-4 text-2xl animate-pulse">✨</span>
          <span className="absolute bottom-3 end-12 text-xl animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</span>
          <span className="absolute top-1/2 end-24 text-lg animate-pulse" style={{ animationDelay: '1s' }}>💫</span>

          <div className="flex items-center gap-4">
            {/* キャラクターアバター（絵文字ベース） */}
            <div className="hidden md:flex w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center text-4xl shadow-lg shrink-0">
              🎨
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{t('dashboard.welcomeUser', { name: userName })}</h1>
              <p className="text-purple-100 text-sm md:text-base">{t('dashboard.todaysMessage')}</p>
            </div>
          </div>
        </div>

        {/* 統計カード - カラフルなグラデーション */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 text-center shadow-lg ${stat.shadow} hover:scale-105 transition-transform cursor-default`}>
              <p className="text-3xl mb-1">{stat.icon}</p>
              <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">{stat.value}</p>
              <p className="text-white/90 text-xs mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 学習カレンダー */}
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span>{t('dashboard.calendar.title')}</span>
              <span className="text-xs text-gray-400 font-normal">{t('dashboard.calendar.subtitle')}</span>
            </h2>
            <div className="grid grid-cols-10 gap-1">
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  title={day.date}
                  className={`w-6 h-6 rounded-md transition-all ${
                    day.active
                      ? 'bg-gradient-to-br from-blue-400 to-cyan-500 shadow-md shadow-blue-500/50'
                      : 'bg-gray-700/50'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-sm bg-gray-700"></div>
              <span>{t('dashboard.calendar.notStudied')}</span>
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-400 to-cyan-500 ms-2"></div>
              <span>{t('dashboard.calendar.studied')}</span>
            </div>
          </div>

          {/* 連続学習ストリーク - ゲーミフィケーション強化 */}
          <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-sm border border-orange-700/30 rounded-2xl p-5 shadow-xl">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <span>{t('dashboard.streak.title')}</span>
            </h2>
            <div className="text-center py-4">
              <p className="text-7xl font-bold bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-lg">
                {streak}
              </p>
              <p className="text-orange-200 mt-2 font-medium">{t('dashboard.streak.daysInARow')}</p>

              {/* 達成バッジ */}
              <div className="mt-3 space-y-1">
                {streak >= 7 && streak < 30 && (
                  <div className="inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full px-3 py-1">
                    <span className="text-yellow-300 text-sm">🏆</span>
                    <span className="text-yellow-300 text-xs font-bold">{t('dashboard.streak.weekAchievement')}</span>
                  </div>
                )}
                {streak >= 30 && (
                  <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 rounded-full px-3 py-1">
                    <span className="text-pink-300 text-sm">🌟</span>
                    <span className="text-pink-200 text-xs font-bold">{t('dashboard.streak.monthAchievement')}</span>
                  </div>
                )}
                {streak === 0 && <p className="text-gray-400 text-sm mt-2">{t('dashboard.streak.startToday')}</p>}
              </div>
            </div>
            <div className="bg-orange-950/30 border border-orange-800/30 rounded-lg p-3 mt-2">
              <p className="text-xs text-orange-200/80 text-center">
                {t('dashboard.streak.hint')}
              </p>
            </div>
          </div>
        </div>

        {/* 学習中のコース */}
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-5 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <span>{t('dashboard.enrolled.title')}</span>
            </h2>
            <Link href="/courses" className="text-blue-400 hover:text-blue-300 hover:underline text-sm font-medium">
              {t('common.viewAll')} {arrowForward}
            </Link>
          </div>
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-5xl mb-3">🎨</p>
              <p className="text-gray-400 mb-4">{t('dashboard.enrolled.empty')}</p>
              <Link
                href="/courses"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-8 py-3 rounded-full transition-all shadow-lg shadow-blue-500/30 text-sm font-bold hover:scale-105"
              >
                {t('dashboard.enrolled.findCourses')} ✨
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledCourses.map(cid => {
                const course = COURSES[cid];
                if (!course) return null;
                const progress = progressMap[cid] || 0;
                const isCompleted = progress === 100;
                return (
                  <div key={cid} className="flex items-center gap-4 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {course.thumbnail}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{getCourseTitle(cid)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-600 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isCompleted
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 font-bold">{progress}%</span>
                      </div>
                    </div>
                    <Link
                      href={`/courses/${cid}`}
                      className={`text-sm whitespace-nowrap px-3 py-1 rounded-full transition-colors font-medium ${
                        isCompleted
                          ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                          : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                      }`}
                    >
                      {isCompleted ? `🏆 ${t('dashboard.enrolled.review')}` : `${t('dashboard.enrolled.continue').replace('→', arrowForward).replace('←', arrowForward)}`}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* クイックアクション - カラフルなアイコンバッジ */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            { href: '/courses', label: t('dashboard.quickActions.courseList'), icon: '📚', gradient: 'from-blue-500/20 to-cyan-500/20', border: 'hover:border-blue-500/50' },
            { href: '/auto-4manga', label: t('dashboard.quickActions.fourPanel'), icon: '📖', gradient: 'from-pink-500/20 to-rose-500/20', border: 'hover:border-pink-500/50' },
            { href: '/auto-animate', label: t('dashboard.quickActions.animation'), icon: '🎬', gradient: 'from-purple-500/20 to-violet-500/20', border: 'hover:border-purple-500/50' },
            { href: '/notifications', label: t('dashboard.quickActions.notifications'), icon: '🔔', gradient: 'from-yellow-500/20 to-amber-500/20', border: 'hover:border-yellow-500/50' },
            { href: '/profile', label: t('dashboard.quickActions.profile'), icon: '👤', gradient: 'from-green-500/20 to-emerald-500/20', border: 'hover:border-green-500/50' },
            { href: '/certificate?course=manga-basics', label: t('dashboard.quickActions.certificate'), icon: '🏆', gradient: 'from-orange-500/20 to-red-500/20', border: 'hover:border-orange-500/50' },
          ].map((action, i) => (
            <Link
              key={i}
              href={action.href}
              className={`bg-gradient-to-br ${action.gradient} bg-gray-800/80 backdrop-blur-sm border border-gray-700 ${action.border} rounded-2xl p-4 text-center transition-all hover:scale-105`}
            >
              <p className="text-3xl mb-1">{action.icon}</p>
              <p className="text-xs md:text-sm font-medium">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
