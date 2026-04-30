'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 管理者メールアドレス
const ADMIN_EMAILS = ['tatsuya197102@gmail.com'];

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  createdAt: any;
  lastLoginAt: any;
}

interface EnrollmentData {
  courseId: string;
  progress: number;
  completedLessons: number[];
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'courses'>('users');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!ADMIN_EMAILS.includes(user.email || '')) {
        router.push('/dashboard');
        return;
      }
      // ユーザー一覧を取得
      fetchUsers();
    }
  }, [user, loading]);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const data = snap.docs.map(d => d.data() as UserData);
    setUsers(data);
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-red-400 font-bold text-lg">⚙️ 管理者パネル</span>
          <span className="text-gray-400 text-sm">TERRAKOYA</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300 text-sm">{user?.email}</span>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-blue-400 hover:underline"
          >
            ← ダッシュボードへ
          </button>
        </div>
      </header>

      {/* タブ */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {[
            { key: 'users', label: '👥 ユーザー管理' },
            { key: 'courses', label: '📚 コース統計' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'users' | 'courses')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: '総ユーザー数', value: users.length, color: 'text-blue-600', icon: '👥' },
            { label: '総コース数', value: 3, color: 'text-green-600', icon: '📚' },
            { label: '今日のログイン', value: users.filter(u => {
              const d = u.lastLoginAt?.toDate?.();
              return d && new Date().toDateString() === d.toDateString();
            }).length, color: 'text-purple-600', icon: '📅' },
            { label: '管理者数', value: ADMIN_EMAILS.length, color: 'text-red-600', icon: '⚙️' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ユーザー管理タブ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-900">ユーザー一覧</h3>
              <button
                onClick={fetchUsers}
                className="text-sm text-blue-600 hover:underline"
              >
                🔄 更新
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['名前', 'メール', '登録日', '最終ログイン'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {u.displayName || '未設定'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {u.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {u.lastLoginAt?.toDate?.()?.toLocaleDateString('ja-JP') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* コース統計タブ */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">コース統計</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: '1', name: '漫画基礎講座', icon: '🎨', lessons: 6 },
                { id: '2', name: 'デジタルイラスト入門', icon: '🖌️', lessons: 4 },
                { id: '3', name: 'ストーリー構成講座', icon: '📖', lessons: 4 },
              ].map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-3xl mb-2">{course.icon}</div>
                  <h4 className="font-semibold text-gray-800 mb-1">{course.name}</h4>
                  <p className="text-sm text-gray-500">{course.lessons}レッスン</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}