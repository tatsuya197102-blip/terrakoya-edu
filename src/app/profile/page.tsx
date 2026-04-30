'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user, loading, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      // Firebase Auth のプロフィールを更新
      await updateProfile(auth.currentUser!, {
        displayName,
      });
      // Firestore のプロフィールを更新
      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1
          className="text-xl font-bold text-gray-900 cursor-pointer"
          onClick={() => router.push('/dashboard')}
        >
          ← {t('navigation.dashboard')}
        </h1>
        <span className="text-sm text-gray-500">{t('navigation.profile')}</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">

        {/* プロフィールカード */}
        <div className="bg-white rounded-xl shadow p-8">

          {/* アバター */}
          <div className="flex flex-col items-center mb-8">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-24 h-24 rounded-full border-4 border-blue-100 mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-4xl">👤</span>
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {user.displayName || '名前未設定'}
            </h2>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <span className="mt-2 text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
              {user.providerData[0]?.providerId === 'google.com' ? '🔵 Google アカウント' : '📧 メールアカウント'}
            </span>
          </div>

          {/* 成功メッセージ */}
          {saved && (
            <div className="bg-green-50 text-green-600 text-sm rounded-lg p-3 mb-4 text-center">
              ✅ プロフィールを保存しました
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          {/* 編集フォーム */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                表示名
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="表示名を入力"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={user.email || ''}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-gray-400 bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">メールアドレスは変更できません</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                アカウント作成日
              </label>
              <input
                type="text"
                value={user.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString('ja-JP')
                  : '-'}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-gray-400 bg-gray-50 cursor-not-allowed"
                disabled
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? '保存中...' : '💾 保存する'}
            </button>
          </form>
        </div>

        {/* 危険ゾーン */}
        <div className="bg-white rounded-xl shadow p-6 mt-6 border border-red-100">
          <h3 className="font-bold text-red-600 mb-4">⚠️ アカウント操作</h3>
          <button
            onClick={() => {
              if (confirm('ログアウトしますか？')) {
                import('@/lib/auth').then(({ logout }) => {
                  logout();
                  router.push('/');
                });
              }
            }}
            className="w-full border border-red-300 text-red-600 rounded-lg px-4 py-2 hover:bg-red-50 transition text-sm"
          >
            ログアウト
          </button>
        </div>
      </main>
    </div>
  );
}