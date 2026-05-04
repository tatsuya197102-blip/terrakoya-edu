'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

type LiveLesson = {
  id: string;
  title: string;
  description: string;
  meetingUrl: string;
  platform: 'zoom' | 'meet' | 'other';
  scheduledAt: string;
  durationMin: number;
  instructor: string;
  courseId?: string;
  status: 'upcoming' | 'live' | 'ended';
};

const PLATFORM_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  zoom:  { label: 'Zoom',         color: 'bg-blue-600',  icon: '💻' },
  meet:  { label: 'Google Meet',  color: 'bg-green-600', icon: '🎥' },
  other: { label: 'ライブ',       color: 'bg-purple-600',icon: '📡' },
};

function getStatus(scheduledAt: string, durationMin: number): 'upcoming' | 'live' | 'ended' {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const end = start + durationMin * 60 * 1000;
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const calc = () => setDiff(new Date(scheduledAt).getTime() - Date.now());
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);

  if (diff <= 0) return <span className="text-green-400 font-bold">🔴 ライブ中！</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  if (days > 0) return <span className="text-gray-300">{days}日 {hours}時間後</span>;
  if (hours > 0) return <span className="text-yellow-300">{hours}時間 {mins}分後</span>;
  return <span className="text-orange-400 font-bold animate-pulse">{mins}分 {secs}秒後</span>;
}

export default function LivePage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<LiveLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user: import("firebase/auth").User | null) => {
      if (!user) { router.push('/login'); return; }

      try {
        const q = query(collection(db, 'liveLessons'), orderBy('scheduledAt', 'asc'));
        const snap = await getDocs(q);
        const list: LiveLesson[] = snap.docs.map(d => {
          const data = d.data() as Omit<LiveLesson, 'id' | 'status'>;
          return {
            id: d.id,
            ...data,
            status: getStatus(data.scheduledAt, data.durationMin),
          };
        });
        setLessons(list);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const upcoming = lessons.filter(l => l.status === 'upcoming');
  const live     = lessons.filter(l => l.status === 'live');
  const ended    = lessons.filter(l => l.status === 'ended');

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">📡 ライブ授業</h1>
        <p className="text-gray-400 text-sm mt-1">講師とリアルタイムで学べるオンライン授業</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-10">

        {/* ライブ中 */}
        {live.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              今すぐ参加できます
            </h2>
            <div className="space-y-4">
              {live.map(l => <LessonCard key={l.id} lesson={l} />)}
            </div>
          </section>
        )}

        {/* 予定 */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 text-blue-300">📅 予定されている授業</h2>
            <div className="space-y-4">
              {upcoming.map(l => <LessonCard key={l.id} lesson={l} />)}
            </div>
          </section>
        )}

        {/* 過去 */}
        {ended.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 text-gray-500">🗂️ 過去の授業</h2>
            <div className="space-y-4 opacity-60">
              {ended.map(l => <LessonCard key={l.id} lesson={l} />)}
            </div>
          </section>
        )}

        {lessons.length === 0 && (
          <div className="text-center py-24 text-gray-500">
            <p className="text-5xl mb-4">📡</p>
            <p className="text-lg">ライブ授業はまだ予定されていません</p>
            <p className="text-sm mt-2">講師からのお知らせをお待ちください</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LessonCard({ lesson }: { lesson: LiveLesson }) {
  const platform = PLATFORM_LABELS[lesson.platform] || PLATFORM_LABELS.other;
  const isLive = lesson.status === 'live';
  const isEnded = lesson.status === 'ended';

  return (
    <div className={`bg-gray-800 rounded-xl overflow-hidden border ${isLive ? 'border-red-500' : 'border-gray-700'}`}>
      {isLive && (
        <div className="bg-red-600 px-4 py-1.5 flex items-center gap-2 text-sm font-bold">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          ライブ配信中
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`${platform.color} text-xs px-2 py-0.5 rounded-full font-medium`}>
                {platform.icon} {platform.label}
              </span>
              <span className="text-gray-500 text-xs">{lesson.durationMin}分</span>
            </div>
            <h3 className="text-lg font-bold">{lesson.title}</h3>
            {lesson.description && <p className="text-gray-400 text-sm mt-1">{lesson.description}</p>}
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-gray-400">👨‍🏫 {lesson.instructor}</p>
              <p className="text-gray-400">🕐 {formatDate(lesson.scheduledAt)}</p>
              {!isEnded && (
                <p className="text-sm">
                  ⏰ <Countdown scheduledAt={lesson.scheduledAt} />
                </p>
              )}
            </div>
          </div>
        </div>

        {!isEnded && (
          <a
            href={lesson.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
              isLive
                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isLive ? '🔴 今すぐ参加する' : '🔗 授業に参加する（当日押してください）'}
          </a>
        )}

        {isEnded && (
          <p className="mt-3 text-xs text-gray-600 text-center">この授業は終了しました</p>
        )}
      </div>
    </div>
  );
}
