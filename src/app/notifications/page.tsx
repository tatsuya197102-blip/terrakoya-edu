'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

type Notification = {
  id: string;
  type: 'reminder' | 'new_course' | 'progress';
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth/login'); return; }
      await fetchNotifications(user.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchNotifications = async (uid: string) => {
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
    setNotifications(items);
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const sendTestNotification = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const types: Array<{ type: 'reminder' | 'new_course' | 'progress'; title: string; body: string }> = [
      { type: 'reminder', title: '学習リマインダー', body: '今日はまだ学習していません。少しだけ学びましょう！' },
      { type: 'new_course', title: '新着コース', body: '「背景イラスト上級編」が新しく追加されました！' },
      { type: 'progress', title: '進捗達成', body: '「漫画基礎講座」の50%を達成しました！この調子で続けましょう！' },
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    await addDoc(collection(db, 'notifications'), {
      uid: user.uid,
      ...t,
      read: false,
      createdAt: serverTimestamp(),
    });
    await fetchNotifications(user.uid);
  };

  const getIcon = (type: string) => {
    if (type === 'reminder') return '⏰';
    if (type === 'new_course') return '🆕';
    if (type === 'progress') return '🏆';
    return '🔔';
  };

  const getColor = (type: string) => {
    if (type === 'reminder') return 'border-yellow-600';
    if (type === 'new_course') return 'border-blue-600';
    if (type === 'progress') return 'border-green-600';
    return 'border-gray-600';
  };

  const formatDate = (ts: Timestamp | null) => {
    if (!ts) return '';
    const d = ts.toDate();
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">← ダッシュボード</Link>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🔔 通知
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-sm text-blue-400 hover:underline">
                すべて既読
              </button>
            )}
            <button
              onClick={sendTestNotification}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg transition-colors"
            >
              + テスト通知
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="flex gap-2 mb-6">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'すべて' : '未読'}
            </button>
          ))}
        </div>

        {/* 通知一覧 */}
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p className="text-4xl mb-4">🔕</p>
            <p>{filter === 'unread' ? '未読の通知はありません' : '通知はありません'}</p>
            <button
              onClick={sendTestNotification}
              className="mt-4 text-sm text-blue-400 hover:underline"
            >
              テスト通知を送る
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all ${getColor(n.type)} ${
                  n.read ? 'bg-gray-900 opacity-60' : 'bg-gray-800 hover:bg-gray-750'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{getIcon(n.type)}</span>
                    <div>
                      <p className="font-semibold text-sm">{n.title}</p>
                      <p className="text-gray-400 text-sm mt-1">{n.body}</p>
                      <p className="text-gray-600 text-xs mt-2">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}