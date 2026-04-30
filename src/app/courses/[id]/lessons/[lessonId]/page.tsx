'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import Link from 'next/link';

const COURSES: Record<string, {
  title: string;
  lessons: { id: string; title: string; duration: string; free: boolean; description: string }[];
}> = {
  'manga-basics': {
    title: '漫画基礎講座',
    lessons: [
      { id: 'l1', title: 'キャラクターの描き方基礎', duration: '30分', free: true, description: 'キャラクターの基本的な描き方を学びます。頭身バランス、体の構造など基礎から丁寧に解説します。' },
      { id: 'l2', title: '顔・表情の描き方', duration: '25分', free: true, description: '喜怒哀楽の表情を自然に描くコツを学びます。目・鼻・口のバランスが重要です。' },
      { id: 'l3', title: '体・ポーズの描き方', duration: '35分', free: false, description: '動きのあるポーズの描き方を学びます。重心とバランスを意識することが大切です。' },
      { id: 'l4', title: '背景の描き方入門', duration: '40分', free: false, description: 'キャラクターを引き立てる背景の描き方を学びます。パース（遠近法）の基礎も解説します。' },
      { id: 'l5', title: 'コマ割りの基礎', duration: '30分', free: false, description: '読者を引き込むコマ割りのテクニックを学びます。テンポとリズムが重要です。' },
    ],
  },
  'digital-illust': {
    title: 'デジタルイラスト入門',
    lessons: [
      { id: 'l1', title: 'CLIPSTUDIOの基本操作', duration: '20分', free: true, description: 'CLIPSTUDIOの画面構成と基本ツールの使い方を学びます。' },
      { id: 'l2', title: 'レイヤーの使い方', duration: '25分', free: true, description: 'レイヤーの概念と効果的な使い方を学びます。' },
      { id: 'l3', title: 'ブラシツールの活用', duration: '30分', free: false, description: '様々なブラシの特性と使い分けを学びます。' },
      { id: 'l4', title: '色塗りの基礎', duration: '35分', free: false, description: 'アニメ塗りの基本テクニックを学びます。' },
    ],
  },
  'story-making': {
    title: 'ストーリー作り',
    lessons: [
      { id: 'l1', title: 'ストーリーの基本構造', duration: '30分', free: true, description: '起承転結の基本構造と応用を学びます。' },
      { id: 'l2', title: 'キャラクター設定の作り方', duration: '35分', free: false, description: '魅力的なキャラクターを作るための設定シートの書き方を学びます。' },
      { id: 'l3', title: '起承転結の組み立て方', duration: '40分', free: false, description: '読者を飽きさせないストーリー展開の作り方を学びます。' },
    ],
  },
  'animation-basics': {
    title: 'アニメーション基礎',
    lessons: [
      { id: 'l1', title: 'アニメーションの原理', duration: '25分', free: true, description: '12のアニメーション原則を学びます。' },
      { id: 'l2', title: '動きのタイミングと間', duration: '30分', free: false, description: 'タイミングとスペーシングの概念を学びます。' },
      { id: 'l3', title: 'ウォークサイクルの作り方', duration: '45分', free: false, description: '歩行アニメーションの基本パターンを学びます。' },
      { id: 'l4', title: '表情アニメーション', duration: '35分', free: false, description: '表情変化のアニメーション技法を学びます。' },
    ],
  },
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const course = COURSES[courseId];
  const lessonIndex = course?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const lesson = course?.lessons[lessonIndex];
  const [completed, setCompleted] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth/login'); return; }
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const enrolledCourses = data.enrolledCourses || [];
        setEnrolled(enrolledCourses.includes(courseId));
        const completedLessons = data.completedLessons?.[courseId] || [];
        setCompleted(completedLessons.includes(lessonId));
        const total = course?.lessons.length || 1;
        setProgress(Math.round((completedLessons.length / total) * 100));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [courseId, lessonId]);

  const handleComplete = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    await updateDoc(ref, {
      [`completedLessons.${courseId}`]: arrayUnion(lessonId),
    });
    setCompleted(true);
    const total = course?.lessons.length || 1;
    setProgress(prev => Math.min(100, prev + Math.round(100 / total)));
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
      <Link href={`/courses/${courseId}`} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">
        コースページへ
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ヘッダー */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <Link href={`/courses/${courseId}`} className="text-blue-400 hover:underline text-sm">
          ← {course.title}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">進捗: {progress}%</span>
          <div className="w-24 h-1.5 bg-gray-700 rounded-full">
            <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 動画プレイヤー（モック） */}
        <div className="bg-gray-800 rounded-xl aspect-video flex items-center justify-center mb-6 relative overflow-hidden">
          <div className="text-center">
            <div className="text-6xl mb-4">▶️</div>
            <p className="text-gray-400 text-sm">動画プレイヤー</p>
            <p className="text-gray-500 text-xs mt-1">{lesson.duration}</p>
          </div>
          {completed && (
            <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
              ✅ 完了済み
            </div>
          )}
        </div>

        {/* レッスン情報 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">レッスン {lessonIndex + 1} / {course.lessons.length}</p>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <p className="text-gray-400 mt-2">{lesson.description}</p>
          </div>
          {!completed ? (
            <button onClick={handleComplete}
              className="ml-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              ✅ 完了にする
            </button>
          ) : (
            <span className="ml-4 text-green-400 text-sm font-medium whitespace-nowrap">✅ 完了済み</span>
          )}
        </div>

        {/* 前後ナビ */}
        <div className="flex justify-between gap-4 mt-8">
          {prevLesson ? (
            <Link href={`/courses/${courseId}/lessons/${prevLesson.id}`}
              className="flex-1 bg-gray-800 hover:bg-gray-700 rounded-xl p-4 transition-colors">
              <p className="text-gray-400 text-xs mb-1">← 前のレッスン</p>
              <p className="font-medium text-sm">{prevLesson.title}</p>
            </Link>
          ) : <div className="flex-1" />}
          {nextLesson ? (
            <Link href={`/courses/${courseId}/lessons/${nextLesson.id}`}
              className="flex-1 bg-blue-700 hover:bg-blue-600 rounded-xl p-4 transition-colors text-right">
              <p className="text-gray-300 text-xs mb-1">次のレッスン →</p>
              <p className="font-medium text-sm">{nextLesson.title}</p>
            </Link>
          ) : (
            <Link href={`/courses/${courseId}`}
              className="flex-1 bg-green-700 hover:bg-green-600 rounded-xl p-4 transition-colors text-right">
              <p className="text-gray-300 text-xs mb-1">🏆 コース完了！</p>
              <p className="font-medium text-sm">コースページへ戻る</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}