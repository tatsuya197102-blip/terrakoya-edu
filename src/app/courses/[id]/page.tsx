'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const COURSES: Record<string, {
  title: Record<string, string>;
  description: Record<string, string>;
  level: string;
  thumbnail: string;
  rating: number;
  students: number;
  lessons: { id: string; title: Record<string, string>; duration: string; free: boolean }[];
}> = {
  'manga-basics': {
    title: { ja: '漫画基礎講座', en: 'Manga Basics', ar: 'أساسيات المانغا' },
    description: { ja: 'キャラクターデザインから背景まで、漫画の基礎を学びます', en: 'Learn manga fundamentals from character design to backgrounds', ar: 'تعلم أساسيات المانغا من تصميم الشخصيات إلى الخلفيات' },
    level: 'beginner', thumbnail: '🎨', rating: 4.8, students: 1250,
    lessons: [
      { id: 'l1', title: { ja: 'キャラクターの描き方基礎', en: 'Character Drawing Basics', ar: 'أساسيات رسم الشخصيات' }, duration: '30min', free: true },
      { id: 'l2', title: { ja: '顔・表情の描き方', en: 'Drawing Faces & Expressions', ar: 'رسم الوجوه والتعبيرات' }, duration: '25min', free: true },
      { id: 'l3', title: { ja: '体・ポーズの描き方', en: 'Drawing Bodies & Poses', ar: 'رسم الأجساد والأوضاع' }, duration: '35min', free: false },
      { id: 'l4', title: { ja: '背景の描き方入門', en: 'Introduction to Backgrounds', ar: 'مقدمة في رسم الخلفيات' }, duration: '40min', free: false },
      { id: 'l5', title: { ja: 'コマ割りの基礎', en: 'Panel Layout Basics', ar: 'أساسيات تقسيم اللوحات' }, duration: '30min', free: false },
    ],
  },
  'digital-illust': {
    title: { ja: 'デジタルイラスト入門', en: 'Digital Illustration', ar: 'الرسم الرقمي' },
    description: { ja: 'CLIPSTUDIOを使ったデジタルイラストの基礎', en: 'Digital illustration basics using CLIPSTUDIO', ar: 'أساسيات الرسم الرقمي باستخدام CLIPSTUDIO' },
    level: 'beginner', thumbnail: '🖌️', rating: 4.6, students: 890,
    lessons: [
      { id: 'l1', title: { ja: 'CLIPSTUDIOの基本操作', en: 'CLIPSTUDIO Basics', ar: 'أساسيات CLIPSTUDIO' }, duration: '20min', free: true },
      { id: 'l2', title: { ja: 'レイヤーの使い方', en: 'Using Layers', ar: 'استخدام الطبقات' }, duration: '25min', free: true },
      { id: 'l3', title: { ja: 'ブラシツールの活用', en: 'Brush Tools', ar: 'أدوات الفرشاة' }, duration: '30min', free: false },
      { id: 'l4', title: { ja: '色塗りの基礎', en: 'Coloring Basics', ar: 'أساسيات التلوين' }, duration: '35min', free: false },
    ],
  },
  'story-making': {
    title: { ja: 'ストーリー作り', en: 'Story Creation', ar: 'كتابة القصص' },
    description: { ja: '読者を引きつけるストーリーの作り方', en: 'How to create compelling stories', ar: 'كيفية إنشاء قصص جذابة' },
    level: 'intermediate', thumbnail: '📖', rating: 4.9, students: 650,
    lessons: [
      { id: 'l1', title: { ja: 'ストーリーの基本構造', en: 'Story Structure Basics', ar: 'أساسيات بنية القصة' }, duration: '30min', free: true },
      { id: 'l2', title: { ja: 'キャラクター設定の作り方', en: 'Creating Character Profiles', ar: 'إنشاء ملفات الشخصيات' }, duration: '35min', free: false },
      { id: 'l3', title: { ja: '起承転結の組み立て方', en: 'Building the 4-Act Structure', ar: 'بناء هيكل 4 فصول' }, duration: '40min', free: false },
    ],
  },
  'animation-basics': {
    title: { ja: 'アニメーション基礎', en: 'Animation Basics', ar: 'أساسيات الرسوم المتحركة' },
    description: { ja: 'キャラクターに動きをつける基礎技術', en: 'Basic techniques for animating characters', ar: 'تقنيات أساسية لتحريك الشخصيات' },
    level: 'intermediate', thumbnail: '🎬', rating: 4.7, students: 430,
    lessons: [
      { id: 'l1', title: { ja: 'アニメーションの原理', en: 'Animation Principles', ar: 'مبادئ الرسوم المتحركة' }, duration: '25min', free: true },
      { id: 'l2', title: { ja: '動きのタイミングと間', en: 'Timing & Spacing', ar: 'التوقيت والتباعد' }, duration: '30min', free: false },
      { id: 'l3', title: { ja: 'ウォークサイクルの作り方', en: 'Walk Cycle', ar: 'دورة المشي' }, duration: '45min', free: false },
      { id: 'l4', title: { ja: '表情アニメーション', en: 'Facial Animation', ar: 'تحريك تعبيرات الوجه' }, duration: '35min', free: false },
    ],
  },
};

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const courseId = params.id as string;
  const course = COURSES[courseId];
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setFavorites(data.favorites || []);
          setIsEnrolled((data.enrolledCourses || []).includes(courseId));
          setCompletedLessons(data.completedLessons?.[courseId] || []);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [courseId]);

  const handleEnroll = async () => {
    const user = auth.currentUser;
    if (!user) { router.push('/login'); return; }
    await updateDoc(doc(db, 'users', user.uid), { enrolledCourses: arrayUnion(courseId) });
    setIsEnrolled(true);
  };

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) { router.push('/login'); return; }
    const ref = doc(db, 'users', user.uid);
    if (favorites.includes(courseId)) {
      await updateDoc(ref, { favorites: arrayRemove(courseId) });
      setFavorites(prev => prev.filter(id => id !== courseId));
    } else {
      await updateDoc(ref, { favorites: arrayUnion(courseId) });
      setFavorites(prev => [...prev, courseId]);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">{t('common.loading')}</div>;
  if (!course) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p>{t('courses.notFound')}</p>
      <Link href="/courses" className="text-blue-400 hover:underline">{t('courses.backToList')}</Link>
    </div>
  );

  const title = course.title[lang] || course.title.ja;
  const description = course.description[lang] || course.description.ja;
  const progress = course.lessons.length > 0
    ? Math.round((completedLessons.length / course.lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/courses" className="text-blue-400 hover:underline text-sm mb-4 block">{t('courses.backToList')}</Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{course.thumbnail}</span>
              <div>
                <h1 className="text-3xl font-bold mb-2">{title}</h1>
                <p className="text-gray-400 mb-3">{description}</p>
                <div className="flex gap-2 flex-wrap items-center">
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded">{t(`courses.${course.level}`)}</span>
                  <span className="text-yellow-400 text-sm">⭐ {course.rating}</span>
                  <span className="text-gray-400 text-sm">👥 {course.students.toLocaleString()}</span>
                  {isEnrolled && <span className="text-green-400 text-sm">{t('courses.progress')}: {progress}%</span>}
                </div>
              </div>
            </div>
            <button onClick={toggleFavorite} className="text-2xl hover:scale-110 transition-transform mt-2">
              {favorites.includes(courseId) ? '❤️' : '🤍'}
            </button>
          </div>
          {isEnrolled && (
            <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-4">{lang === 'ar' ? 'الدروس' : lang === 'en' ? 'Lessons' : 'レッスン一覧'}（{course.lessons.length}）</h2>
            <div className="space-y-3">
              {course.lessons.map((lesson, index) => {
                const lessonTitle = lesson.title[lang] || lesson.title.ja;
                const isCompleted = completedLessons.includes(lesson.id);
                const canAccess = isEnrolled || lesson.free;
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
                        <p className="font-medium">{lessonTitle}</p>
                        <p className="text-gray-400 text-sm">⏱️ {lesson.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.free && <span className="text-green-400 text-xs bg-green-900 px-2 py-1 rounded">{t('common.free')}</span>}
                      {canAccess ? (
                        <Link href={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="text-blue-400 hover:text-blue-300 text-lg">▶️</Link>
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
              <p className="text-3xl font-bold mb-2 text-center">{t('common.free')}</p>
              {isEnrolled ? (
                <div className="text-center">
                  <p className="text-green-400 font-bold mb-4">{t('courses.enrolled')}</p>
                  <Link href={`/courses/${courseId}/lessons/l1`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 rounded-lg py-3 transition-colors">
                    {t('courses.continue')}
                  </Link>
                </div>
              ) : (
                <button onClick={handleEnroll}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg py-3 font-bold transition-colors">
                  {t('courses.enroll')}
                </button>
              )}
              <div className="mt-6 space-y-2 text-sm text-gray-400">
                <p>📚 {course.lessons.length} {t('courses.lessonCount')}</p>
                <p>🏆 {lang === 'ar' ? 'شهادة إتمام' : lang === 'en' ? 'Certificate' : '修了証あり'}</p>
                <p>♾️ {lang === 'ar' ? 'وصول غير محدود' : lang === 'en' ? 'Unlimited access' : '無期限アクセス'}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <Link href={`/courses/${courseId}/assignment`}
                  className="block w-full text-center bg-purple-600 hover:bg-purple-700 rounded-lg py-2.5 text-sm font-medium transition-colors">
                  {t('courses.submitAssignment')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
