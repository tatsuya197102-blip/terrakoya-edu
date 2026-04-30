'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

// コースデータ（後でFirestoreから取得）
const SAMPLE_COURSES = [
  {
    id: '1',
    title: '漫画基礎講座',
    titleAr: 'دورة أساسيات المانغا',
    titleEn: 'Manga Basics Course',
    description: 'キャラクターデザインから背景まで、漫画の基礎を学びます',
    level: '初級',
    lessons: 12,
    duration: '6時間',
    thumbnail: '🎨',
  },
  {
    id: '2',
    title: 'デジタルイラスト入門',
    titleAr: 'مقدمة في الرسم الرقمي',
    titleEn: 'Digital Illustration Basics',
    description: 'CLIPSTUDIOを使ったデジタルイラストの基礎',
    level: '初級',
    lessons: 8,
    duration: '4時間',
    thumbnail: '🖌️',
  },
  {
    id: '3',
    title: 'ストーリー構成講座',
    titleAr: 'دورة بناء القصة',
    titleEn: 'Story Structure Course',
    description: '読者を引きつけるストーリーの作り方',
    level: '中級',
    lessons: 10,
    duration: '5時間',
    thumbnail: '📖',
  },
];

export default function CoursesPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1
          className="text-xl font-bold text-gray-900 cursor-pointer"
          onClick={() => router.push('/dashboard')}
        >
          {t('common.appName')}
        </h1>
        <div className="flex items-center gap-4">
          {/* 言語切り替え */}
          <div className="flex gap-1">
            {['ja', 'en', 'ar'].map((lng) => (
              <button
                key={lng}
                onClick={() => i18n.changeLanguage(lng)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  i18n.language === lng
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {user?.displayName}
          </span>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('courses.title')}
        </h2>
        <p className="text-gray-500 mb-8">
          {t('courses.description')}
        </p>

        {/* コース一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SAMPLE_COURSES.map((course) => (
            <div
              key={course.id}
              onClick={() => router.push(`/courses/${course.id}`)}
              className="bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer"
            >
              {/* サムネイル */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-xl p-8 text-center">
                <span className="text-5xl">{course.thumbnail}</span>
              </div>

              {/* コース情報 */}
              <div className="p-5">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {course.level}
                </span>
                <h3 className="font-bold text-gray-900 mt-2 mb-1">
                  {getTitle(course)}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {course.description}
                </p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>📚 {course.lessons}レッスン</span>
                  <span>⏱ {course.duration}</span>
                </div>
                <button className="w-full mt-4 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
                  {t('courses.enroll')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}