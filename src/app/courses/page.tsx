'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';

type LangText = { ja: string; en: string; ar: string };

type CategoryKey = 'manga' | 'illustration' | 'story' | 'animation';
type LevelKey = 'beginner' | 'intermediate' | 'advanced';

interface Course {
  id: string;
  // 多言語対応のため title/description は言語マップ
  title: LangText;
  description: LangText;
  level: LevelKey;
  category: CategoryKey;
  lessons: number;
  durationMinutes: number; // 時間ではなく分で統一
  thumbnail: string;
  rating: number;
  students: number;
  tags: string[];
  published?: boolean;
}

// ハードコードのデフォルトコース（3言語対応）
const DEFAULT_COURSES: Course[] = [
  {
    id: 'manga-basics',
    title: { ja: '漫画基礎講座', en: 'Manga Basics', ar: 'أساسيات المانجا' },
    description: {
      ja: 'キャラクターデザインから背景まで、漫画の基礎を学びます',
      en: 'Learn the basics of manga from character design to backgrounds',
      ar: 'تعلم أساسيات المانجا من تصميم الشخصيات إلى الخلفيات',
    },
    level: 'beginner', category: 'manga', lessons: 12, durationMinutes: 360,
    thumbnail: '🎨', rating: 4.8, students: 1250,
    tags: ['キャラクター', '背景', 'コマ割り'], published: true,
  },
  {
    id: 'digital-illust',
    title: { ja: 'デジタルイラスト入門', en: 'Digital Illustration', ar: 'الرسم التوضيحي الرقمي' },
    description: {
      ja: 'CLIPSTUDIOを使ったデジタルイラストの基礎',
      en: 'Basics of digital illustration using CLIP STUDIO',
      ar: 'أساسيات الرسم التوضيحي الرقمي باستخدام كليب ستوديو',
    },
    level: 'beginner', category: 'illustration', lessons: 8, durationMinutes: 240,
    thumbnail: '🖌️', rating: 4.6, students: 890,
    tags: ['CLIPSTUDIO', 'レイヤー', '色塗り'], published: true,
  },
  {
    id: 'story-making',
    title: { ja: 'ストーリー作り', en: 'Story Making', ar: 'صناعة القصة' },
    description: {
      ja: '読者を引きつけるストーリーの作り方',
      en: 'How to create stories that captivate readers',
      ar: 'كيفية إنشاء قصص تجذب القراء',
    },
    level: 'intermediate', category: 'story', lessons: 10, durationMinutes: 300,
    thumbnail: '📖', rating: 4.9, students: 650,
    tags: ['構成', 'キャラクター設定', '起承転結'], published: true,
  },
  {
    id: 'animation-basics',
    title: { ja: 'アニメーション基礎', en: 'Animation Basics', ar: 'أساسيات الرسوم المتحركة' },
    description: {
      ja: 'キャラクターに動きをつける基礎技術',
      en: 'Basic techniques for adding movement to characters',
      ar: 'تقنيات أساسية لإضافة الحركة إلى الشخصيات',
    },
    level: 'intermediate', category: 'animation', lessons: 15, durationMinutes: 480,
    thumbnail: '🎬', rating: 4.7, students: 430,
    tags: ['モーション', 'タイミング', 'ウォークサイクル'], published: true,
  },
];

const CATEGORIES: Array<{ id: 'all' | CategoryKey; icon: string }> = [
  { id: 'all', icon: '📚' },
  { id: 'manga', icon: '🎨' },
  { id: 'illustration', icon: '🖌️' },
  { id: 'story', icon: '📖' },
  { id: 'animation', icon: '🎬' },
];

const LEVELS: Array<'all' | LevelKey> = ['all', 'beginner', 'intermediate', 'advanced'];
const SORTS: Array<'popular' | 'rating' | 'newest'> = ['popular', 'rating', 'newest'];

// Firestore から取得したコースを正規化する（古いデータは日本語ベース）
function normalizeCourse(raw: Record<string, unknown>): Course {
  // 古いデータが文字列の title/description を持つ可能性に対応
  const title = raw.title as LangText | string;
  const description = raw.description as LangText | string;
  const level = raw.level as string;
  const category = raw.category as string;

  const titleObj: LangText = typeof title === 'string'
    ? { ja: title, en: title, ar: title }
    : (title || { ja: '', en: '', ar: '' });
  const descObj: LangText = typeof description === 'string'
    ? { ja: description, en: description, ar: description }
    : (description || { ja: '', en: '', ar: '' });

  // levelの日本語→キーマッピング（後方互換）
  const levelMap: Record<string, LevelKey> = {
    '初級': 'beginner', '中級': 'intermediate', '上級': 'advanced',
    'beginner': 'beginner', 'intermediate': 'intermediate', 'advanced': 'advanced',
  };
  const normalizedLevel: LevelKey = levelMap[level] || 'beginner';

  const validCategories: CategoryKey[] = ['manga', 'illustration', 'story', 'animation'];
  const normalizedCategory: CategoryKey = validCategories.includes(category as CategoryKey)
    ? (category as CategoryKey)
    : 'manga';

  return {
    id: String(raw.id || ''),
    title: titleObj,
    description: descObj,
    level: normalizedLevel,
    category: normalizedCategory,
    lessons: Number(raw.lessons) || 0,
    durationMinutes: Number(raw.durationMinutes) || 0,
    thumbnail: String(raw.thumbnail || '📚'),
    rating: Number(raw.rating) || 0,
    students: Number(raw.students) || 0,
    tags: Array.isArray(raw.tags) ? raw.tags as string[] : [],
    published: raw.published !== false,
  };
}

export default function CoursesPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'ja') as 'ja' | 'en' | 'ar';
  const isRtl = lang === 'ar';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | CategoryKey>('all');
  const [level, setLevel] = useState<'all' | LevelKey>('all');
  const [sort, setSort] = useState<'popular' | 'rating' | 'newest'>('popular');
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
          const fbCourses = cSnap.docs.map(d => normalizeCourse({ id: d.id, ...d.data() }));

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

  const getCourseTitle = (c: Course) => c.title[lang] || c.title.ja;
  const getCourseDesc = (c: Course) => c.description[lang] || c.description.ja;

  const allTags = Array.from(new Set(courses.flatMap(c => c.tags || [])));

  const filtered = courses
    .filter(c => category === 'all' || c.category === category)
    .filter(c => level === 'all' || c.level === level)
    .filter(c => selectedTag === '' || (c.tags || []).includes(selectedTag))
    .filter(c => {
      if (search === '') return true;
      const q = search.toLowerCase();
      return getCourseTitle(c).toLowerCase().includes(q)
        || getCourseDesc(c).toLowerCase().includes(q)
        || (c.tags || []).some(tag => tag.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sort === 'popular') return b.students - a.students;
      if (sort === 'rating') return b.rating - a.rating;
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white" dir={isRtl ? 'rtl' : 'ltr'}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('courses.title')}</h1>

        {/* カテゴリタブ */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                category === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              <span>{cat.icon}</span>{t(`courses.categories.${cat.id}`)}
            </button>
          ))}
        </div>

        {/* 検索・フィルター */}
        <div className="bg-gray-800 rounded-xl p-4 mb-5">
          <div className="flex flex-wrap gap-3 mb-3">
            <input
              type="text"
              placeholder={t('courses.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-700 rounded-lg px-4 py-2 flex-1 min-w-48 text-sm"
            />
            <select value={level} onChange={e => setLevel(e.target.value as 'all' | LevelKey)}
              className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
              {LEVELS.map(l => (
                <option key={l} value={l}>{t(`courses.levels.${l}`)}</option>
              ))}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value as 'popular' | 'rating' | 'newest')}
              className="bg-gray-700 rounded-lg px-4 py-2 text-sm">
              {SORTS.map(s => (
                <option key={s} value={s}>{t(`courses.sorts.${s}`)}</option>
              ))}
            </select>
          </div>

          {/* タグフィルター */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedTag('')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedTag === '' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
              {t('courses.allTags')}
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* 検索結果数 - ICU plural 対応 */}
        <p className="text-gray-400 text-sm mb-4">
          {t('courses.count', { count: filtered.length })}
          {search && <span> {t('courses.searchResultFor', { query: search })}</span>}
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
              <h2 className="text-lg font-bold mb-1">{getCourseTitle(course)}</h2>
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{getCourseDesc(course)}</p>

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
                <span className="bg-blue-600 text-xs px-2 py-1 rounded">{t(`courses.levels.${course.level}`)}</span>
                <span className="bg-gray-600 text-xs px-2 py-1 rounded">{t(`courses.categories.${course.category}`)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mb-4 flex-wrap gap-2">
                <span>📚 {t('courses.lessonsCount', { count: course.lessons })}</span>
                <span>⏱️ {Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60 > 0 ? `${course.durationMinutes % 60}m` : ''}</span>
                <span>⭐ {course.rating}</span>
              </div>
              <Link href={`/courses/${course.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 rounded-lg py-2 transition-colors text-sm font-medium">
                {t('courses.viewCourse')}
              </Link>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg mb-2">{t('courses.notFound')}</p>
            <button onClick={() => { setSearch(''); setCategory('all'); setLevel('all'); setSelectedTag(''); }}
              className="text-blue-400 hover:underline text-sm">
              {t('courses.resetFilter')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
