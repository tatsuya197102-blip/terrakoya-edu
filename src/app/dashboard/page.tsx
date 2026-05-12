'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

const COURSES: Record<string, { titleKey: string; titleJa: string; thumbnail: string; lessons: number }> = {
  'manga-basics': { titleKey: 'manga-basics', titleJa: '漫画基礎講座', thumbnail: '🎨', lessons: 5 },
  'digital-illust': { titleKey: 'digital-illust', titleJa: 'デジタルイラスト入門', thumbnail: '🖌️', lessons: 4 },
  'story-making': { titleKey: 'story-making', titleJa: 'ストーリー作り', thumbnail: '📖', lessons: 3 },
  'animation-basics': { titleKey: 'animation-basics', titleJa: 'アニメーション基礎', thumbnail: '🎬', lessons: 4 },
};

// 言語ごとのコースタイトル
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

        // 進捗計算
        const pm: Record<string, number> = {};
        const enrolled = data.enrolledCourses || [];
        for (const cid of enrolled) {
          const completed = data.completedLessons?.[cid] || [];
          const total = COURSES[cid]?.lessons || 1;
          pm[cid] = Math.round((completed.length / total) * 100);
        }
        setProgressMap(pm);

        // アクティビティ日付（仮：今日含む過去7日をアクティブに）
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

  // 言語別のコースタイトル取得ヘルパー
  const getCourseTitle = (cid: string): string => {
    return COURSE_TITLES[lang]?.[cid] || COURSE_TITLES.ja[cid] || cid;
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">{t('common.loading')}</div>;

  // 矢印（RTL対応）
  const arrowForward = isRtl ? '←' : '→';

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto">

        {/* ウェルカムバナー */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 mb-6">
          <h1 className="text-2xl font-bold mb-1">{t('dashboard.welcomeUser', { name: userName })}</h1>
          <p className="text-blue-200 text-sm">{t('dashboard.todaysMessage')}</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: t('dashboard.stats.progress'), value: `${totalProgress}%`, icon: '📊', color: 'text-blue-400' },
            { label: t('dashboard.stats.enrolledCourses'), value: enrolledCourses.length, icon: '📚', color: 'text-green-400' },
            { label: t('dashboard.stats.completedCourses'), value: completedCourses, icon: '🏆', color: 'text-yellow-400' },
            { label: t('dashboard.stats.streakDays'), value: t('dashboard.stats.streakValue', { count: streak }), icon: '🔥', color: 'text-orange-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 学習カレンダー */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              📅 {t('dashboard.calendar.title')}
              <span className="text-xs text-gray-400 font-normal">{t('dashboard.calendar.subtitle')}</span>
            </h2>
            <div className="grid grid-cols-10 gap-1">
              {calendarDays.map((day, i) => (
                <div key={i} title={day.date}
                  className={`w-6 h-6 rounded-sm ${day.active ? 'bg-blue-500' : 'bg-gray-700'}`}>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-sm bg-gray-700"></div>
              <span>{t('dashboard.calendar.notStudied')}</span>
              <div className="w-3 h-3 rounded-sm bg-blue-500 ms-2"></div>
              <span>{t('dashboard.calendar.studied')}</span>
            </div>
          </div>

          {/* 連続学習ストリーク */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4">🔥 {t('dashboard.streak.title')}</h2>
            <div className="text-center py-4">
              <p className="text-6xl font-bold text-orange-400">{streak}</p>
              <p className="text-gray-400 mt-2">{t('dashboard.streak.daysInARow')}</p>
              {streak >= 7 && streak < 30 && <p className="text-yellow-400 text-sm mt-2">{t('dashboard.streak.weekAchievement')}</p>}
              {streak >= 30 && <p className="text-yellow-400 text-sm mt-1">{t('dashboard.streak.monthAchievement')}</p>}
              {streak === 0 && <p className="text-gray-500 text-sm mt-2">{t('dashboard.streak.startToday')}</p>}
            </div>
            <div className="bg-gray-700 rounded-lg p-3 mt-2">
              <p className="text-xs text-gray-400 text-center">
                {t('dashboard.streak.hint')}
              </p>
            </div>
          </div>
        </div>

        {/* 学習中のコース */}
        <div className="bg-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">📚 {t('dashboard.enrolled.title')}</h2>
            <Link href="/courses" className="text-blue-400 hover:underline text-sm">{t('common.viewAll')} {arrowForward}</Link>
          </div>
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">{t('dashboard.enrolled.empty')}</p>
              <Link href="/courses" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors text-sm">
                {t('dashboard.enrolled.findCourses')}
              </Link>
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
                      <p className="font-medium text-sm">{getCourseTitle(cid)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400">{progress}%</span>
                      </div>
                    </div>
                    <Link href={`/courses/${cid}`}
                      className="text-blue-400 hover:text-blue-300 text-sm whitespace-nowrap">
                      {progress === 100 ? t('dashboard.enrolled.review') : `${t('dashboard.enrolled.continue').replace('→', arrowForward).replace('←', arrowForward)}`}
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
            { href: '/courses', label: t('dashboard.quickActions.courseList'), icon: '📚' },
            { href: '/auto-4manga', label: t('dashboard.quickActions.fourPanel'), icon: '📖' },
            { href: '/auto-animate', label: t('dashboard.quickActions.animation'), icon: '🎬' },
            { href: '/notifications', label: t('dashboard.quickActions.notifications'), icon: '🔔' },
            { href: '/profile', label: t('dashboard.quickActions.profile'), icon: '👤' },
            { href: '/certificate?course=manga-basics', label: t('dashboard.quickActions.certificate'), icon: '🏆' },
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
