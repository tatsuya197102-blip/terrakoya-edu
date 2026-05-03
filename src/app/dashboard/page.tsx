'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

const COURSES: Record<string, { title: string; thumbnail: string; lessons: number }> = {
  'manga-basics': { title: '漫画基礎講座', thumbnail: '🎨', lessons: 5 },
  'digital-illust': { title: 'デジタルイラスト入門', thumbnail: '🖌️', lessons: 4 },
  'story-making': { title: 'ストーリー作り', thumbnail: '📖', lessons: 3 },
  'animation-basics': { title: 'アニメーション基礎', thumbnail: '🎬', lessons: 4 },
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
        setUserName(data.displayName || user.displayName || 'ユーザー');
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

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* ウェルカムバナー */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 mb-6">
          <h1 className="text-2xl font-bold mb-1">ようこそ、{userName}さん！ 👋</h1>
          <p className="text-blue-200 text-sm">今日も学習を続けましょう 🎯</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '進捗状況', value: `${totalProgress}%`, icon: '📊', color: 'text-blue-400' },
            { label: '登録コース数', value: enrolledCourses.length, icon: '📚', color: 'text-green-400' },
            { label: '完了したコース', value: completedCourses, icon: '🏆', color: 'text-yellow-400' },
            { label: '連続学習日数', value: `${streak}日`, icon: '🔥', color: 'text-orange-400' },
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
              📅 学習カレンダー
              <span className="text-xs text-gray-400 font-normal">（過去30日）</span>
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
              <span>未学習</span>
              <div className="w-3 h-3 rounded-sm bg-blue-500 ml-2"></div>
              <span>学習済み</span>
            </div>
          </div>

          {/* 連続学習ストリーク */}
          <div className="bg-gray-800 rounded-xl p-5">
            <h2 className="font-bold mb-4">🔥 学習ストリーク</h2>
            <div className="text-center py-4">
              <p className="text-6xl font-bold text-orange-400">{streak}</p>
              <p className="text-gray-400 mt-2">日連続学習中！</p>
              {streak >= 7 && <p className="text-yellow-400 text-sm mt-2">🏆 1週間達成！すごい！</p>}
              {streak >= 30 && <p className="text-yellow-400 text-sm mt-1">🌟 30日達成！圧倒的！</p>}
              {streak === 0 && <p className="text-gray-500 text-sm mt-2">今日から始めよう！</p>}
            </div>
            <div className="bg-gray-700 rounded-lg p-3 mt-2">
              <p className="text-xs text-gray-400 text-center">
                レッスンを完了すると学習日として記録されます
              </p>
            </div>
          </div>
        </div>

        {/* 学習中のコース */}
        <div className="bg-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">📚 学習中のコース</h2>
            <Link href="/courses" className="text-blue-400 hover:underline text-sm">すべて見る →</Link>
          </div>
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">まだコースに登録していません</p>
              <Link href="/courses" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors text-sm">
                コースを探す
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
                      <p className="font-medium text-sm">{course.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-600 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-400">{progress}%</span>
                      </div>
                    </div>
                    <Link href={`/courses/${cid}`}
                      className="text-blue-400 hover:text-blue-300 text-sm whitespace-nowrap">
                      {progress === 100 ? '復習する' : '続きを学ぶ →'}
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
            { href: '/courses', label: 'コース一覧', icon: '📚' },
            { href: '/auto-4manga', label: '4コマ漫画', icon: '📖' },
            { href: '/auto-animate', label: 'アニメーション', icon: '🎬' },
            { href: '/notifications', label: '通知', icon: '🔔' },
            { href: '/profile', label: 'プロフィール', icon: '👤' },
            { href: '/certificate?course=manga-basics', label: '修了証', icon: '🏆' },
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