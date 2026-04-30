'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/lib/auth';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">
          {t('common.appName')}
        </h1>
        <div className="flex items-center gap-4">
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('dashboard.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t('dashboard.myProgress')}
            </h3>
            <p className="text-3xl font-bold text-blue-600">0%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t('dashboard.completedCourses')}
            </h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              {t('dashboard.recentActivity')}
            </h3>
            <p className="text-sm text-gray-500">なし</p>
          </div>
        </div>
      </main>
    </div>
  );
}