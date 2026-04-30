'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Link from 'next/link';

const COURSES = [
  { id: 'manga-basics', title: '漫画基礎講座', description: 'キャラクターデザインから背景まで、漫画の基礎を学びます', level: '初級', category: 'manga', lessons: 12, duration: '6時間', thumbnail: '🎨', rating: 4.8, students: 1250 },
  { id: 'digital-illust', title: 'デジタルイラスト入門', description: 'CLIPSTUDIOを使ったデジタルイラストの基礎', level: '初級', category: 'illustration', lessons: 8, duration: '4時間', thumbnail: '🖌️', rating: 4.6, students: 890 },
  { id: 'story-making', title: 'ストーリー作り', description: '読者を引きつけるストーリーの作り方', level: '中級', category: 'story', lessons: 10, duration: '5時間', thumbnail: '📖', rating: 4.9, students: 650 },
  { id: 'animation-basics', title: 'アニメーション基礎', description: 'キャラクターに動きをつける基礎技術', level: '中級', category: 'animation', lessons: 15, duration: '8時間', thumbnail: '🎬', rating: 4.7, students: 430 },
];

const CATEGORIES = ['all', 'manga', 'illustration', 'story', 'animation'];
const LEVELS = ['all', '初級', '中級', '上級'];

export default function CoursesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('popular');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setFavorites(snap.data().favorites || []);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleFavorite = async (courseId: string) => {
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

  const filtered = COURSES
    .filter(c => category === 'all' || c.category === category)
    .filter(c => level === 'all' || c.level === level)
    .filter(c => c.title.includes(search) || c.description.includes(search))
    .sort((a, b) => {
      if (sort === 'popular') return b.students - a.students;
      if (sort === 'rating') return b.rating - a.rating;
      return 0;
    });

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">コース一覧</h1>

        {/* 検索・フィルター */}
        <div className="flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            placeholder="コースを検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-gray-800 rounded-lg px-4 py-2 flex-1 min-w-48"
          />
          <select value={category} onChange={e => setCategory(e.target.value)} className="bg-gray-800 rounded-lg px-4 py-2">
            {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'すべてのカテゴリ' : c}</option>)}
          </select>
          <select value={level} onChange={e => setLevel(e.target.value)} className="bg-gray-800 rounded-lg px-4 py-2">
            {LEVELS.map(l => <option key={l} value={l}>{l === 'all' ? 'すべてのレベル' : l}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="bg-gray-800 rounded-lg px-4 py-2">
            <option value="popular">人気順</option>
            <option value="rating">評価順</option>
          </select>
        </div>

        {/* コース一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => (
            <div key={course.id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{course.thumbnail}</span>
                <button
                  onClick={() => toggleFavorite(course.id)}
                  className="text-lg hover:scale-110 transition-transform"
                >
                  {favorites.includes(course.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <h2 className="text-xl font-bold mb-2">{course.title}</h2>
              <p className="text-gray-400 text-sm mb-4">{course.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-600 text-xs px-2 py-1 rounded">{course.level}</span>
                <span className="bg-gray-600 text-xs px-2 py-1 rounded">{course.category}</span>
              </div>
              <div className="text-sm text-gray-400 mb-4">
                <span>📚 {course.lessons}レッスン</span>
                <span className="mx-2">⏱️ {course.duration}</span>
                <span>⭐ {course.rating}</span>
              </div>
              <Link href={`/courses/${course.id}`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 rounded-lg py-2 transition-colors">
                コースを見る
              </Link>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            <p className="text-2xl mb-2">😢</p>
            <p>コースが見つかりませんでした</p>
          </div>
        )}
      </div>
    </div>
  );
}