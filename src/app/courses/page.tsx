'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

// ハードコードのデフォルトコース
const DEFAULT_COURSES = [
  { id: 'manga-basics', title: '漫画基礎講座', description: 'キャラクターデザインから背景まで、漫画の基礎を学びます', level: '初級', category: 'manga', lessons: 12, duration: '6時間', thumbnail: '🎨', rating: 4.8, students: 1250, tags: ['キャラクター', '背景', 'コマ割り'], published: true },
  { id: 'digital-illust', title: 'デジタルイラスト入門', description: 'CLIPSTUDIOを使ったデジタルイラストの基礎', level: '初級', category: 'illustration', lessons: 8, duration: '4時間', thumbnail: '🖌️', rating: 4.6, students: 890, tags: ['CLIPSTUDIO', 'レイヤー', '色塗り'], published: true },
  { id: 'story-making', title: 'ストーリー作り', description: '読者を引きつけるストーリーの作り方', level: '中級', category: 'story', lessons: 10, duration: '5時間', thumbnail: '📖', rating: 4.9, students: 650, tags: ['構成', 'キャラクター設定', '起承転結'], published: true },
  { id: 'animation-basics', title: 'アニメーション基礎', description: 'キャラクターに動きをつける基礎技術', level: '中級', category: 'animation', lessons: 15, duration: '8時間', thumbnail: '🎬', rating: 4.7, students: 430, tags: ['モーション', 'タイミング', 'ウォークサイクル'], published: true },
];

const CATEGORIES = [
  { id: 'all', label: 'すべて', icon: '📚' },
  { id: 'manga', label: '漫画', icon: '🎨' },
  { id: 'illustration', label: 'イラスト', icon: '🖌️' },
  { id: 'story', label: 'ストーリー', icon: '📖' },
  { id: 'animation', label: 'アニメ', icon: '🎬' },
];

const LEVELS = ['all', '初級', '中級', '上級'];
const SORTS = [
  { id: 'popular', label: '人気順' },
  { id: 'rating', label: '評価順' },
  { id: 'newest', label: '新着順' },
];

type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  lessons: number;
  duration: string;
  thumbnail: string;
  rating: number;
  students: number;
  tags: string[];
  published?: boolean;
};

export default function CoursesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('popular');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) setFavorites(snap.data().favorites || []);
        }

        // Firebaseからコース取得
        try {
          const cSnap = await getDocs(collection(db, 'courses'));
          const fbCourses = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course));
          
          // デフォルトコースとマージ（公開中のみ）
          const publishedDefault = DEFAULT_COURSES.filter(c => c.published !== false);
          const publishedFb = fbCourses.filter(c => c.published !== false);
          const merged = [...publishedDefault, ...publishedFb];
          
          // 重複削除
          const unique = Array.from(new Map(merged.map(c => [c.id, c])).values());
          setCourses(unique);
        } catch (e) {
          console.error('コース読み込みエラー:', e);
          setCourses(DEFAULT_COURSES);
        }

        setLoading(false);
      });
      return () => unsubscribe();
    };
    loadData();
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

  const allTags = Array.from(new Set(courses.flatMap(c => c.tags || [])));

  const filtered = courses
    .filter(c => category === 'all' || c.category === category)
    .filter(c => level === 'all' || c.level === level)
    .filter(c => selectedTag === '' || (c.tags || []).includes(selectedTag))
    .filter(c => search === '' || c.title.includes(search) || c.description.includes(search) || (c.tags || []).some(t => t.includes(search)))
    .sort((a, b) => {
      if (sort === 'popular') return b.students - a.students;
      if (sort === 'rating') return b.rating - a.rating;
      return 0;
    });

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">コース一覧</h1>

        {/* カテゴリタブ */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              <span>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>

        {/* 検索・フィルター */}
        <div className="bg-gray-800 rounded-xl p-4 mb-5">
          <div className="flex flex-wrap gap-3 mb-3">
            <input
              type="text"
              placeholder="コース・タグを検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-700 rounded-lg px-4 py-2 flex-1 min-w-48 text-sm"
            />
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
              {LEVELS.map(l => <option key={l} value={l}>{l === 'all' ? 'すべてのレベル' : l}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
              {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {/* タグフィルター */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedTag('')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedTag === '' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
              すべてのタグ
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* 検索結果数 */}
        <p className="text-gray-400 text-sm mb-4">
          {filtered.length}件のコース
          {search && <span> 「{search}」の検索結果</span>}
          {selectedTag && <span> #{selectedTag}</span>}
        </p>

        {/* コース一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(course => (
            <div key={course.id} className="bg-gray-800 rounded-xl p-5 hover:bg-gray-750 transition-colors border border-gray-700 hover:border-blue-600">
              <div className="flex justify-between items-start mb-3">
                <span className="text-4xl">{course.thumbnail}</span>
                <button onClick={() => toggleFavorite(course.id)}
                  className="text-xl hover:scale-110 transition-transform">
                  {favorites.includes(course.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <h2 className="text-lg font-bold mb-1">{course.title}</h2>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{course.description}</p>

              {/* タグ */}
              <div className="flex flex-wrap gap-1 mb-3">
                {(course.tags || []).map(tag => (
                  <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}>
                    #{tag}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <span className="bg-blue-600 text-xs px-2 py-1 rounded">{course.level}</span>
                <span className="bg-gray-600 text-xs px-2 py-1 rounded">{course.category}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mb-4">
                <span>📚 {course.lessons}レッスン</span>
                <span>⏱️ {course.duration}</span>
                <span>⭐ {course.rating}</span>
              </div>
              <Link href={`/courses/${course.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 rounded-lg py-2 transition-colors text-sm font-medium">
                コースを見る
              </Link>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg mb-2">コースが見つかりませんでした</p>
            <button onClick={() => { setSearch(''); setCategory('all'); setLevel('all'); setSelectedTag(''); }}
              className="text-blue-400 hover:underline text-sm">
              フィルターをリセット
            </button>
          </div>
        )}
      </div>
    </div>
  );
}