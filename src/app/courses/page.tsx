'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { toggleFavorite, getFavorites } from '@/lib/firestore';

const SAMPLE_COURSES = [
  { id: '1', title: '漫画基礎講座', titleEn: 'Manga Basics Course', titleAr: 'دورة أساسيات المانغا', description: 'キャラクターデザインから背景まで、漫画の基礎を学びます', level: '初級', category: 'manga', lessons: 12, duration: '6時間', thumbnail: '🎨', rating: 4.8, students: 1250 },
  { id: '2', title: 'デジタルイラスト入門', titleEn: 'Digital Illustration Basics', titleAr: 'مقدمة في الرسم الرقمي', description: 'CLIPSTUDIOを使ったデジタルイラストの基礎', level: '初級', category: 'illustration', lessons: 8, duration: '4時間', thumbnail: '🖌️', rating: 4.6, students: 890 },
  { id: '3', title: 'ストーリー構成講座', titleEn: 'Story Structure Course', titleAr: 'دورة بناء القصة', description: '読者を引きつけるストーリーの作り方', level: '中級', category: 'story', lessons: 10, duration: '5時間', thumbnail: '📖', rating: 4.9, students: 650 },
  { id: '4', title: 'アニメーション基礎', titleEn: 'Animation Basics', titleAr: 'أساسيات الرسوم المتحركة', description: 'キャラクターに動きをつける基礎技術', level: '中級', category: 'animation', lessons: 15, duration: '8時間', thumbnail: '🎬', rating: 4.7, students: 430 },
  { id: '5', title: '背景イラスト講座', titleEn: 'Background Illustration', titleAr: 'دورة رسم الخلفيات', description: '美しい背景を描くための技法を学ぶ', level: '上級', category: 'illustration', lessons: 20, duration: '10時間', thumbnail: '🏙️', rating: 4.5, students: 320 },
  { id: '6', title: 'キャラクターデザイン', titleEn: 'Character Design', titleAr: 'تصميم الشخصيات', description: '魅力的なキャラクターを生み出すデザイン手法', level: '初級', category: 'manga', lessons: 10, duration: '5時間', thumbnail: '✏️', rating: 4.8, students: 980 },
];

const LEVELS = ['すべて', '初級', '中級', '上級'];
const CATEGORIES = [
  { key: 'all', label: 'すべて' },
  { key: 'manga', label: '漫画' },
  { key: 'illustration', label: 'イラスト' },
  { key: 'story', label: 'ストーリー' },
  { key: 'animation', label: 'アニメーション' },
];

export default function CoursesPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('すべて');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'students' | 'lessons'>('rating');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    if (user) {
      getFavorites(user.uid).then(setFavorites);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  const getTitle = (course: typeof SAMPLE_COURSES[0]) => {
    if (i18n.language === 'ar') return course.titleAr;
    if (i18n.language === 'en') return course.titleEn;
    return course.title;
  };

  const filtered = SAMPLE_COURSES
    .filter(c => {
      const matchSearch = getTitle(c).includes(search) || c.description.includes(search);
      const matchLevel = selectedLevel === 'すべて' || c.level === selectedLevel;
      const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
      return matchSearch && matchLevel && matchCategory;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 cursor-pointer" onClick={() => router.push('/dashboard')}>
          {t('common.appName')}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {['ja', 'en', 'ar'].map((lng) => (
              <button key={lng} onClick={() => i18n.changeLanguage(lng)}
                className={`px-2 py-1 rounded text-xs font-medium ${i18n.language === lng ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-600 cursor-pointer hover:text-blue-600" onClick={() => router.push('/profile')}>
            👤 {user?.displayName}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('courses.title')}</h2>

        <div className="relative mb-6">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 コースを検索..."
            className="w-full border border-gray-300 rounded-xl px-5 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-3 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedCategory === cat.key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {LEVELS.map((level) => (
              <button key={level} onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedLevel === level ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {level}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
            className="ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none">
            <option value="rating">⭐ 評価順</option>
            <option value="students">👥 人気順</option>
            <option value="lessons">📚 レッスン数順</option>
          </select>
        </div>

        <p className="text-sm text-gray-500 mb-4">{filtered.length}件のコースが見つかりました</p>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500">該当するコースが見つかりません</p>
            <button onClick={() => { setSearch(''); setSelectedLevel('すべて'); setSelectedCategory('all'); }}
              className="mt-4 text-blue-600 hover:underline text-sm">
              フィルターをリセット
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <div key={course.id} onClick={() => router.push(`/courses/${course.id}`)}
                className="bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl p-8 text-center">
                  <span className="text-5xl">{course.thumbnail}</span>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {course.level}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-yellow-500">⭐ {course.rating}</span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!user) return;
                          const isFav = await toggleFavorite(user.uid, course.id);
                          setFavorites(prev =>
                            isFav ? [...prev, course.id] : prev.filter(id => id !== course.id)
                          );
                        }}
                        className="text-lg hover:scale-110 transition-transform"
                      >
{favorites.includes(course.id) ? '❤️' : '🤍'}