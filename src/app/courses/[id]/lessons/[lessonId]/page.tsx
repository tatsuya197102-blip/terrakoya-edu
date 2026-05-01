'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

const COURSES: Record<string, {
  title: string;
  lessons: { id: string; title: string; duration: string; free: boolean; description: string; videoUrl?: string }[];
}> = {
  'manga-basics': {
    title: '漫画基礎講座',
    lessons: [
      { id: 'l1', title: 'キャラクターの描き方基礎', duration: '30分', free: true, description: 'キャラクターの基本的な描き方を学びます。', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      { id: 'l2', title: '顔・表情の描き方', duration: '25分', free: true, description: '喜怒哀楽の表情を自然に描くコツを学びます。' },
      { id: 'l3', title: '体・ポーズの描き方', duration: '35分', free: false, description: '動きのあるポーズの描き方を学びます。' },
      { id: 'l4', title: '背景の描き方入門', duration: '40分', free: false, description: 'キャラクターを引き立てる背景の描き方を学びます。' },
      { id: 'l5', title: 'コマ割りの基礎', duration: '30分', free: false, description: '読者を引き込むコマ割りのテクニックを学びます。' },
    ],
  },
  'digital-illust': {
    title: 'デジタルイラスト入門',
    lessons: [
      { id: 'l1', title: 'CLIPSTUDIOの基本操作', duration: '20分', free: true, description: 'CLIPSTUDIOの基本を学びます。' },
      { id: 'l2', title: 'レイヤーの使い方', duration: '25分', free: true, description: 'レイヤーの概念を学びます。' },
      { id: 'l3', title: 'ブラシツールの活用', duration: '30分', free: false, description: 'ブラシの使い分けを学びます。' },
      { id: 'l4', title: '色塗りの基礎', duration: '35分', free: false, description: 'アニメ塗りの基本を学びます。' },
    ],
  },
  'story-making': {
    title: 'ストーリー作り',
    lessons: [
      { id: 'l1', title: 'ストーリーの基本構造', duration: '30分', free: true, description: '起承転結の基本を学びます。' },
      { id: 'l2', title: 'キャラクター設定の作り方', duration: '35分', free: false, description: 'キャラクター設定を学びます。' },
      { id: 'l3', title: '起承転結の組み立て方', duration: '40分', free: false, description: 'ストーリー展開を学びます。' },
    ],
  },
  'animation-basics': {
    title: 'アニメーション基礎',
    lessons: [
      { id: 'l1', title: 'アニメーションの原理', duration: '25分', free: true, description: '12の原則を学びます。' },
      { id: 'l2', title: '動きのタイミングと間', duration: '30分', free: false, description: 'タイミングを学びます。' },
      { id: 'l3', title: 'ウォークサイクルの作り方', duration: '45分', free: false, description: 'ウォークサイクルを学びます。' },
      { id: 'l4', title: '表情アニメーション', duration: '35分', free: false, description: '表情アニメーションを学びます。' },
    ],
  },
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const course = COURSES[courseId];
  const lessonIndex = course?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const lesson = course?.lessons[lessonIndex];
  const [completed, setCompleted] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth/login'); return; }
      
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setEnrolled((data.enrolledCourses || []).includes(courseId));
        const cl = data.completedLessons?.[courseId] || [];
        setCompletedLessons(cl);
        setCompleted(cl.includes(lessonId));
        const total = course?.lessons.length || 1;
        setProgress(Math.round((cl.length / total) * 100));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [courseId, lessonId]);

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const today = new Date().toISOString().split('T')[0];
    const snap = await getDoc(ref);
    const data = snap.data() || {};
    const currentCompleted = [...(data.completedLessons?.[courseId] || [])];
    const activityDates = [...(data.activityDates || [])];
    if (!currentCompleted.includes(lessonId)) currentCompleted.push(lessonId);
    if (!activityDates.includes(today)) activityDates.push(today);
    const total = course?.lessons.length || 1;
    const newProgress = Math.round((currentCompleted.length / total) * 100);
    await updateDoc(ref, {
      [`completedLessons.${courseId}`]: currentCompleted,
      activityDates,
      lastAccessedAt: serverTimestamp(),
    });
    setCompleted(true);
    setCompletedLessons(currentCompleted);
    setProgress(newProgress);
    showToast(`レッスン完了！進捗: ${newProgress}%`, 'success');
    if (newProgress === 100) {
      setTimeout(() => {
        showToast('🎉 コース修了おめでとうございます！', 'success');
        setTimeout(() => router.push(`/certificate?course=${courseId}`), 2000);
      }, 500);
    }
  };

  const prevLesson = lessonIndex > 0 ? course?.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < (course?.lessons.length ?? 0) - 1 ? course?.lessons[lessonIndex + 1] : null;

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>;

  if (!lesson || !course) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p>レッスンが見つかりません</p>
      <Link href="/courses" className="text-blue-400 hover:underline">コース一覧へ</Link>
    </div>
  );

  if (!lesson.free && !enrolled) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p className="text-2xl">🔒</p>
      <p>このレッスンは受講登録が必要です</p>
      <Link href={`/courses/${courseId}`} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">コースページへ</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link href={`/courses/${courseId}`} className="text-blue-400 hover:underline text-sm">← {course.title}</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{progress}%</span>
          <div className="w-32 h-2 bg-gray-700 rounded-full">
            <div className="h-2 bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 動画プレイヤー */}
        <div className="bg-gray-800 rounded-xl mb-6 relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {lesson.videoUrl ? (
            <iframe
              width="100%"
              height="100%"
              src={lesson.videoUrl}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ display: 'block' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">▶️</div>
                <p className="text-gray-400">動画プレイヤー</p>
                <p className="text-gray-500 text-sm mt-2">{lesson.duration}</p>
              </div>
            </div>
          )}
          {completed && (
            <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full z-10">✅ 完了済み</div>
          )}
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">レッスン {lessonIndex + 1} / {course.lessons.length}</p>
            <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
            <p className="text-gray-400">{lesson.description}</p>
          </div>
          <div className="ml-4">
            {!completed ? (
              <button onClick={handleComplete} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                ✅ 完了にする
              </button>
            ) : (
              <span className="text-green-400 text-sm font-medium">✅ 完了済み</span>
            )}
          </div>
        </div>

        {/* レッスン一覧 */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <h3 className="font-bold mb-3 text-sm text-gray-400">このコースのレッスン</h3>
          <div className="space-y-2">
            {course.lessons.map((l, i) => (
              <Link key={l.id} href={`/courses/${courseId}/lessons/${l.id}`}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${l.id === lessonId ? 'bg-blue-700' : 'hover:bg-gray-700'}`}>
                <span className="text-sm w-5 text-center">{completedLessons.includes(l.id) ? '✅' : i + 1}</span>
                <span className="text-sm flex-1">{l.title}</span>
                <span className="text-xs text-gray-400">{l.duration}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 課題提出セクション */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1 text-sm text-gray-400">📤 課題を提出してAIフィードバックをもらおう</h3>
              <p className="text-xs text-gray-500">月1枚まで無料でAI講師のフィードバックが受けられます</p>
            </div>
            <Link href={`/courses/${courseId}/assignment`}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              📝 課題を提出
            </Link>
          </div>
        </div>

        <div className="flex justify-between gap-4">
          {prevLesson ? (
            <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`} className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl p-4 transition-colors">
              <p className="text-gray-400 text-xs mb-1">← 前のレッスン</p>
              <p className="font-medium text-sm">{prevLesson.title}</p>
            </Link>
          ) : <div className="flex-1" />}
          {nextLesson ? (
            <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`} className="flex-1 bg-blue-700 hover:bg-blue-600 rounded-xl p-4 transition-colors text-right">
              <p className="text-gray-300 text-xs mb-1">次のレッスン →</p>
              <p className="font-medium text-sm">{nextLesson.title}</p>
            </Link>
          ) : (
            <Link href={`/courses/${courseId}`} className="flex-1 bg-green-700 hover:bg-green-600 rounded-xl p-4 transition-colors text-right">
              <p className="text-gray-300 text-xs mb-1">🏆 コース完了！</p>
              <p className="font-medium text-sm">コースページへ戻る</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}