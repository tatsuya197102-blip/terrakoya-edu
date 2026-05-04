'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const DEFAULT_COURSES = [
  { id: 'manga-basics',    title: { ja: '漫画基礎講座', en: 'Manga Basics', ar: 'أساسيات المانغا', zh: '漫画基础课', hi: 'मंगा बेसिक्स', vi: 'Cơ bản Manga', es: 'Básicos del Manga' }, description: { ja: 'キャラクターデザインから背景まで', en: 'From character design to backgrounds', ar: 'من تصميم الشخصيات إلى الخلفيات', zh: '从角色设计到背景', hi: 'किरदार डिज़ाइन से पृष्ठभूमि तक', vi: 'Từ thiết kế nhân vật đến hậu cảnh', es: 'Del diseño de personajes a los fondos' }, level: 'beginner',     category: 'manga',         lessons: 12, duration: '6h', thumbnail: '🎨', rating: 4.8, students: 1250, tags: ['キャラクター','背景','コマ割り'] },
  { id: 'digital-illust',  title: { ja: 'デジタルイラスト入門', en: 'Digital Illustration', ar: 'الرسم الرقمي', zh: '数字插画入门', hi: 'डिजिटल इलस्ट्रेशन', vi: 'Minh họa kỹ thuật số', es: 'Ilustración Digital' }, description: { ja: 'CLIPSTUDIOの基礎', en: 'CLIPSTUDIO basics', ar: 'أساسيات CLIPSTUDIO', zh: 'CLIPSTUDIO基础', hi: 'CLIPSTUDIO की बेसिक्स', vi: 'Cơ bản CLIPSTUDIO', es: 'Básicos de CLIPSTUDIO' }, level: 'beginner',     category: 'illustration',  lessons: 8,  duration: '4h', thumbnail: '🖌️', rating: 4.6, students: 890,  tags: ['CLIPSTUDIO','レイヤー','色塗り'] },
  { id: 'story-making',    title: { ja: 'ストーリー作り', en: 'Story Creation', ar: 'كتابة القصص', zh: '故事创作', hi: 'कहानी निर्माण', vi: 'Tạo câu chuyện', es: 'Creación de Historias' }, description: { ja: '読者を引きつけるストーリーの作り方', en: 'How to create compelling stories', ar: 'كيفية إنشاء قصص جذابة', zh: '如何创作引人入胜的故事', hi: 'आकर्षक कहानियां कैसे लिखें', vi: 'Cách tạo câu chuyện hấp dẫn', es: 'Cómo crear historias cautivadoras' }, level: 'intermediate', category: 'story',         lessons: 10, duration: '5h', thumbnail: '📖', rating: 4.9, students: 650,  tags: ['構成','キャラクター設定','起承転結'] },
  { id: 'animation-basics',title: { ja: 'アニメーション基礎', en: 'Animation Basics', ar: 'أساسيات الرسوم المتحركة', zh: '动画基础', hi: 'एनिमेशन बेसिक्स', vi: 'Cơ bản Hoạt hình', es: 'Básicos de Animación' }, description: { ja: 'キャラクターに動きをつける', en: 'Adding movement to characters', ar: 'إضافة حركة للشخصيات', zh: '给角色添加动作', hi: 'किरदारों में गति जोड़ें', vi: 'Thêm chuyển động cho nhân vật', es: 'Añadir movimiento a los personajes' }, level: 'intermediate', category: 'animation',     lessons: 15, duration: '8h', thumbnail: '🎬', rating: 4.7, students: 430,  tags: ['モーション','タイミング','ウォークサイクル'] },
];

export default function CoursesPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const [favorites, setFavorites] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [uid, setUid] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          setFavorites(snap.data().favorites || []);
          setEnrolled(snap.data().enrolledCourses || []);
        }
      } catch (e) { console.error(e); }
    });
    return () => unsub();
  }, []);

  const toggleFavorite = async (courseId: string) => {
    if (!uid) return;
    const ref = doc(db, 'users', uid);
    if (favorites.includes(courseId)) {
      await updateDoc(ref, { favorites: arrayRemove(courseId) });
      setFavorites(prev => prev.filter(id => id !== courseId));
    } else {
      await updateDoc(ref, { favorites: arrayUnion(courseId) });
      setFavorites(prev => [...prev, courseId]);
    }
  };

  const cats = [
    { id: 'all',         label: { ja: 'すべて', en: 'All',   ar: 'الكل'    }, icon: '📚' },
    { id: 'manga',       label: { ja: '漫画',   en: 'Manga', ar: 'مانغا'   }, icon: '🎨' },
    { id: 'illustration',label: { ja: 'イラスト',en: 'Illust',ar: 'رسم'    }, icon: '🖌️' },
    { id: 'story',       label: { ja: 'ストーリー',en: 'Story',ar: 'قصص'   }, icon: '📖' },
    { id: 'animation',   label: { ja: 'アニメ', en: 'Anime', ar: 'أنيمي'   }, icon: '🎬' },
  ];

  const filtered = DEFAULT_COURSES.filter(c => {
    const title = c.title[lang] || c.title.ja;
    const matchCat = filter === 'all' || c.category === filter;
    const matchSearch = !search || title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">{t('courses.title')}</h1>
          <p className="text-gray-400 mt-1">{t('courses.subtitle')}</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* フィルター */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{scrollbarWidth:"none"}}>
          {cats.map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === c.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}>
              {c.icon} {(c.label as Record<string,string>)[lang] || (c.label as Record<string,string>).ja}
            </button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('common.search') + '...'}
            className="ml-auto bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>

        <p className="text-gray-400 text-sm mb-6">{filtered.length} {{'ar':'دورة','en':'courses','ja':'コース','zh':'门课程','hi':'कोर्स','vi':'khóa học','es':'cursos'}[lang as string] || 'courses'}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => {
            const title = course.title[lang] || course.title.ja;
            const desc = course.description[lang] || course.description.ja;
            const isEnrolled = enrolled.includes(course.id);
            const isFav = favorites.includes(course.id);
            const levelLabel = course.level === 'beginner' ? t('courses.beginner')
              : course.level === 'intermediate' ? t('courses.intermediate') : t('courses.advanced');
            return (
              <div key={course.id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-500 transition-colors">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{course.thumbnail}</span>
                    <button onClick={() => toggleFavorite(course.id)} className="text-xl hover:scale-110 transition-transform">
                      {isFav ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded">{levelLabel}</span>
                    {isEnrolled && <span className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded">{t('courses.enrolled')}</span>}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{desc}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span>📚 {course.lessons} {t('courses.lessonCount')}</span>
                    <span>⏱️ {course.duration}</span>
                    <span>⭐ {course.rating}</span>
                  </div>
                  <Link href={`/courses/${course.id}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg text-sm font-medium transition-colors">
                    {t('courses.viewCourse')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
