'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

const COURSE_DETAILS = {
  '1': {
    title: '漫画基礎講座',
    titleEn: 'Manga Basics Course',
    titleAr: 'دورة أساسيات المانغا',
    description: 'キャラクターデザインから背景まで、漫画の基礎を体系的に学びます。プロの漫画家が教える実践的なカリキュラムです。',
    level: '初級',
    lessons: [
      { id: 1, title: 'キャラクターの基本比率', duration: '30分', free: true },
      { id: 2, title: '表情の描き方', duration: '25分', free: true },
      { id: 3, title: '体のポーズ入門', duration: '35分', free: false },
      { id: 4, title: '服と布のしわ', duration: '30分', free: false },
      { id: 5, title: '背景の基礎', duration: '40分', free: false },
      { id: 6, title: 'コマ割りの基本', duration: '30分', free: false },
    ],
    thumbnail: '🎨',
    instructor: '田中 漫次',
    totalDuration: '6時間',
  },
  '2': {
    title: 'デジタルイラスト入門',
    titleEn: 'Digital Illustration Basics',
    titleAr: 'مقدمة في الرسم الرقمي',
    description: 'CLIPSTUDIOを使ったデジタルイラストの基礎を学びます。',
    level: '初級',
    lessons: [
      { id: 1, title: 'ツールの基本操作', duration: '20分', free: true },
      { id: 2, title: 'レイヤーの使い方', duration: '25分', free: true },
      { id: 3, title: '線画の描き方', duration: '30分', free: false },
      { id: 4, title: '色塗りの基礎', duration: '35分', free: false },
    ],
    thumbnail: '🖌️',
    instructor: '鈴木 彩香',
    totalDuration: '4時間',
  },
  '3': {
    title: 'ストーリー構成講座',
    titleEn: 'Story Structure Course',
    titleAr: 'دورة بناء القصة',
    description: '読者を引きつけるストーリーの作り方を学びます。',
    level: '中級',
    lessons: [
      { id: 1, title: 'ストーリーの三幕構成', duration: '35分', free: true },
      { id: 2, title: 'キャラクターの動機', duration: '30分', free: false },
      { id: 3, title: '伏線の張り方', duration: '30分', free: false },
      { id: 4, title: 'クライマックスの作り方', duration: '35分', free: false },
    ],
    thumbnail: '📖',
    instructor: '山田 文子',
    totalDuration: '5時間',
  },
};

export default function CourseDetailPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [mounted, setMounted] = useState(false);

  const courseId = params.id as string;
  const course = COURSE_DETAILS[courseId as keyof typeof COURSE_DETAILS];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (!mounted || loading) {
    return <div className="flex items-center justify-center min-h-screen"><p>読み込み中...</p></div>;
  }

  if (!course) {
    return <div className="flex items-center justify-center min-h-screen"><p>コースが見つかりません</p></div>;
  }

  const getTitle = () => {
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
          onClick={() => router.push('/courses')}
        >
          ← {t('navigation.courses')}
        </h1>
        <div className="flex gap-1">
          {['ja', 'en', 'ar'].map((lng) => (
            <button
              key={lng}
              onClick={() => i18n.changeLanguage(lng)}
              className={`px-2 py-1 rounded text-xs font-medium ${
                i18n.language === lng ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* コース概要 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="text-6xl">{course.thumbnail}</div>
            <div className="flex-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {course.level}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-2">
                {getTitle()}
              </h2>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>👨‍🏫 {course.instructor}</span>
                <span>⏱ {course.totalDuration}</span>
                <span>📚 {course.lessons.length}レッスン</span>
              </div>
            </div>
          </div>
          <button className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition">
            {t('courses.enroll')}
          </button>
        </div>

        {/* レッスン一覧 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">レッスン一覧</h3>
          <div className="space-y-3">
            {course.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  lesson.free ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-6">{lesson.id}</span>
                  <span className="font-medium text-gray-800">{lesson.title}</span>
                  {lesson.free && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      無料
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{lesson.duration}</span>
                  <button
                    className={`text-sm px-3 py-1 rounded ${
                      lesson.free
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!lesson.free}
                  >
                    {lesson.free ? '▶ 再生' : '🔒'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}