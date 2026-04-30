'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/auth';
import { getEnrollments } from '@/lib/firestore';

interface Enrollment {
  courseId: string;
  progress: number;
  completedLessons: number[];
  enrolledAt: any;
}

const COURSE_NAMES: Record<string, string> = {
  '1': '漫画基礎講座',
  '2': 'デジタルイラスト入門',
  '3': 'ストーリー構成講座',
};

const COURSE_THUMBNAILS: Record<string, string> = {
  '1': '🎨',
  '2': '🖌️',
  '3': '📖',
};

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      getEnrollments(user.uid).then((data) => {
        setEnrollments(data as Enrollment[]);
      });
    }
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) return null;

  const totalProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">
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
            {user.displayName || user.email}
          </span>
          <button
            onClick={() => router.push('/courses')}
            className="text-sm text-blue-600 hover:underline"
          >
            {t('navigation.courses')}
          </button>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="text-sm text-red-600 hover:underline"
          >
            {t('navigation.logout')}
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* ウェルカムメッセージ */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-1">
            {t('common.welcome')}、{user.displayName}さん！
          </h2>
          <p className="text-blue-100">
            今日も学習を続けましょう 🎓
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t('dashboard.myProgress')}
            </h3>
            <p className="text-3xl font-bold text-blue-600">{totalProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              登録コース数
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {enrollments.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t('dashboard.completedCourses')}
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {enrollments.filter(e => e.progress === 100).length}
            </p>
          </div>
        </div>

        {/* 登録済みコース */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📚 学習中のコース
          </h3>
          {enrollments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">まだコースに登録していません</p>
              <button
                onClick={() => router.push('/courses')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                コースを探す
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.courseId}
                  onClick={() => router.push(`/courses/${enrollment.courseId}`)}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer"
                >
                  <span className="text-3xl">
                    {COURSE_THUMBNAILS[enrollment.courseId]}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {COURSE_NAMES[enrollment.courseId]}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-10">
                        {enrollment.progress}%
                      </span>
                    </div>
                  </div>
                  <span className="text-blue-600 text-sm">続きを学ぶ →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}