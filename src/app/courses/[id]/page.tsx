'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Link from 'next/link';

const COURSES: Record<string, {
  id: string; title: string; description: string; level: string;
  category: string; thumbnail: string; rating: number; students: number;
  lessons: { id: string; title: string; duration: string; free: boolean }[];
}> = {
  'manga-basics': {
    id: 'manga-basics', title: '漫画基礎講座', description: 'キャラクターデザインから背景まで、漫画の基礎を学びます',
    level: '初級', category: 'manga', thumbnail: '🎨', rating: 4.8, students: 1250,
    lessons: [
      { id: 'l1', title: 'キャラクターの描き方基礎', duration: '30分', free: true },
      { id: 'l2', title: '顔・表情の描き方', duration: '25分', free: true },
      { id: 'l3', title: '体・ポーズの描き方', duration: '35分', free: false },
      { id: 'l4', title: '背景の描き方入門', duration: '40分', free: false },
      { id: 'l5', title: 'コマ割りの基礎', duration: '30分', free: false },
    ],
  },
  'digital-illust': {
    id: 'digital-illust', title: 'デジタルイラスト入門', description: 'CLIPSTUDIOを使ったデジタルイラストの基礎',
    level: '初級', category: 'illustration', thumbnail: '🖌️', rating: 4.6, students: 890,
    lessons: [
      { id: 'l1', title: 'CLIPSTUDIOの基本操作', duration: '20分', free: true },
      { id: 'l2', title: 'レイヤーの使い方', duration: '25分', free: true },
      { id: 'l3', title: 'ブラシツールの活用', duration: '30分', free: false },
      { id: 'l4', title: '色塗りの基礎', duration: '35分', free: false },
    ],
  },
  'story-making': {
    id: 'story-making', title: 'ストーリー作り', description: '読者を引きつけるストーリーの作り方',
    level: '中級', category: 'story', thumbnail: '📖', rating: 4.9, students: 650,
    lessons: [
      { id: 'l1', title: 'ストーリーの基本構造', duration: '30分', free: true },
      { id: 'l2', title: 'キャラクター設定の作り方', duration: '35分', free: false },
      { id: 'l3', title: '起承転結の組み立て方', duration: '40分', free: false },
    ],
  },
  'animation-basics': {
    id: 'animation-basics', title: 'アニメーション基礎', description: 'キャラクターに動きをつける基礎技術',
    level: '中級', category: 'animation', thumbnail: '🎬', rating: 4.7, students: 430,
    lessons: [
      { id: 'l1', title: 'アニメーションの原理', duration: '25分', free: true },
      { id: 'l2', title: '動きのタイミングと間', duration: '30分', free: false },
      { id: 'l3', title: 'ウォークサイクルの作り方', duration: '45分', free: false },
      { id: 'l4', title: '表情アニメーション', duration: '35分', free: false },
    ],
  },
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const course = COURSES[courseId];
  const [favorites, setFavorites] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setFavorites(data.favorites || []);
          setEnrolled((data.enrolledCourses || []).includes(courseId));
          setCompletedLessons(data.completedLessons?.[courseId] || []);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [courseId]);

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) { router.push('/auth/login'); return; }
    const ref = doc(db, 'users', user.uid);
    const isFav = favorites.includes(courseId);
    if (isFav) {
      await updateDoc(ref, { favorites: arrayRemove(courseId) });
      setFavorites(prev => prev.filter(id => id !== courseId));
    } else {
      await updateDoc(ref, { favorites: arrayUnion(courseId) });
      setFavorites(prev => [...prev, courseId]);
    }
  };

  const handleEnroll = async () => {
    const user = auth.currentUser;
    if (!user) { router.push('/auth/login'); return; }
    const ref = doc(db, 'users', user.uid);
    await updateDoc(ref, { enrolledCourses: arrayUnion(courseId) });
    setEnrolled(true);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>;

  if (!course) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p className="text-2xl">コースが見つかりません</p>
      <Link href="/courses" className="text-blue-400 hover:underline">コース一覧に戻る</Link>
    </div>
  );

  const isFav = favorites.includes(courseId);
  const progress = course.lessons.length > 0
    ? Math.round((completedLessons.length / course.lessons.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/courses" className="text-blue-400 hover:underline text-sm mb-4 block">← コース一覧に戻る</Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{course.thumbnail}</span>
              <div>
                <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
                <p className="text-gray-400 mb-3">{course.description}</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded">{course.level}</span>
                  <span className="bg-gray-600 text-xs px-2 py-1 rounded">{course.category}</span>
                  <span className="text-yellow-400 text-sm">⭐ {course.rating}</span>
                  <span className="text-gray-400 text-sm">👥 {course.students.toLocaleString()}人</span>
                  {enrolled && (
                    <span className="text-green-400 text-sm">進捗: {progress}%</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={toggleFavorite} className="text-2xl hover:scale-110 transition-transform mt-2">
              {isFav ? '❤️' : '🤍'}
            </button>
          </div>
          {enrolled && (
            <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-4">レッスン一覧（{course.lessons.length}本）</h2>
            <div className="space-y-3">
              {course.lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const canAccess = enrolled || lesson.free;
                return (
                  <div key={lesson.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      canAccess ? 'bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-800 opacity-60'
                    }`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm w-6 ${isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                        {isCompleted ? '✅' : index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{lesson.title}</p>
                        <p className="text-gray-400 text-sm">⏱️ {lesson.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.free && <span className="text-green-400 text-xs bg-green-900 px-2 py-1 rounded">無料</span>}
                      {canAccess ? (
                        <Link href={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="text-blue-400 hover:text-blue-300 text-lg transition-colors">▶️</Link>
                      ) : (
                        <span className="text-gray-500 text-lg">🔒</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:w-72">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-8">
              <p className="text-3xl font-bold mb-2 text-center">無料</p>
              <p className="text-gray-400 text-sm text-center mb-6">全レッスン受け放題</p>
              {enrolled ? (
                <div className="text-center">
                  <p className="text-green-400 font-bold mb-4">✅ 受講中</p>
                  <Link href={`/courses/${courseId}/lessons/l1`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 rounded-lg py-3 transition-colors">
                    続きを学ぶ
                  </Link>
                </div>
              ) : (
                <button onClick={handleEnroll}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-bold transition-colors">
                  無料で受講する
                </button>
              )}
              <div className="mt-6 space-y-2 text-sm text-gray-400">
                <p>📚 {course.lessons.length}レッスン</p>
                <p>🏆 修了証あり</p>
                <p>♾️ 無期限アクセス</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}