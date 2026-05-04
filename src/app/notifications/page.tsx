'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

type Notification = {
  id: string; title: string; body: string; type: string;
  read: boolean; createdAt: any;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      try {
        const q = query(
          collection(db, 'notifications'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await Promise.all(notifications.filter(n => !n.read).map(n =>
      updateDoc(doc(db, 'notifications', n.id), { read: true })
    ));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">🔔 {t('notifications.title')}</h1>
          {notifications.some(n => !n.read) && (
            <button onClick={markAllRead} className="text-sm text-blue-400 hover:underline">
              {t('notifications.allRead')}
            </button>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-3">
        {notifications.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">🔔</p>
            <p>{t('notifications.noNotifications')}</p>
          </div>
        )}
        {notifications.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-colors ${
              n.read ? 'bg-gray-800 border-gray-700 opacity-60' : 'bg-gray-800 border-blue-700'
            }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium">{n.title}</p>
                <p className="text-gray-400 text-sm mt-1">{n.body}</p>
              </div>
              {!n.read && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
