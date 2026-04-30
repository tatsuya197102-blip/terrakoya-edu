'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

type User = { uid: string; displayName: string; email: string; createdAt: Timestamp | null; };
type Course = { id: string; title: string; description: string; level: string; category: string; thumbnail: string; lessons: number; duration: string; };

const ADMIN_EMAIL = 'tatsuya197102@gmail.com';

const EMPTY_COURSE: Omit<Course, 'id'> = { title: '', description: '', level: '初級', category: 'manga', thumbnail: '🎨', lessons: 0, duration: '' };

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'notify'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<Omit<Course, 'id'>>(EMPTY_COURSE);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [notifyType, setNotifyType] = useState<'reminder' | 'new_course' | 'progress'>('new_course');
  const [notifySent, setNotifySent] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user || user.email !== ADMIN_EMAIL) { router.push('/'); return; }
      setIsAdmin(true);
      const [uSnap, cSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'courses')),
      ]);
      setUsers(uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
      setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveCourse = async () => {
    if (!form.title) return;
    const id = editingCourse ? editingCourse.id : form.title.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now();
    await setDoc(doc(db, 'courses', id), { ...form, updatedAt: serverTimestamp() });
    const updated = { id, ...form };
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === id ? updated : c));
    } else {
      setCourses(prev => [...prev, updated]);
    }
    setShowForm(false);
    setEditingCourse(null);
    setForm(EMPTY_COURSE);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('このコースを削除しますか？')) return;
    await deleteDoc(doc(db, 'courses', id));
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setForm({ title: course.title, description: course.description, level: course.level, category: course.category, thumbnail: course.thumbnail, lessons: course.lessons, duration: course.duration });
    setShowForm(true);
  };

  const handleSendNotify = async () => {
    if (!notifyTitle || !notifyBody) return;
    const snap = await getDocs(collection(db, 'users'));
    await Promise.all(snap.docs.map(d =>
      setDoc(doc(collection(db, 'notifications')), {
        uid: d.id, type: notifyType, title: notifyTitle, body: notifyBody, read: false, createdAt: serverTimestamp(),
      })
    ));
    setNotifySent(true);
    setNotifyTitle(''); setNotifyBody('');
    setTimeout(() => setNotifySent(false), 3000);
  };

  if (loading || !isAdmin) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">← ダッシュボード</Link>
          <h1 className="text-xl font-bold">🛠️ 管理者パネル</h1>
        </div>
        <div className="text-sm text-gray-400">ユーザー数: {users.length}</div>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-800 px-8">
        {([['users', '👥 ユーザー'], ['courses', '📚 コース'], ['notify', '🔔 一斉通知']] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="p-8 max-w-6xl mx-auto">

        {/* ユーザー一覧 */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-lg font-bold mb-4">登録ユーザー一覧</h2>
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left">名前</th>
                    <th className="px-4 py-3 text-left">メール</th>
                    <th className="px-4 py-3 text-left">登録日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-3">{u.displayName || '名無し'}</td>
                      <td className="px-4 py-3 text-gray-400">{u.email}</td>
                      <td className="px-4 py-3 text-gray-400">{u.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <p className="text-center text-gray-500 py-8">ユーザーがいません</p>}
            </div>
          </div>
        )}

        {/* コース管理 */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">コース管理</h2>
              <button onClick={() => { setShowForm(true); setEditingCourse(null); setForm(EMPTY_COURSE); }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
                + コース追加
              </button>
            </div>

            {/* コース追加・編集フォーム */}
            {showForm && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6">
                <h3 className="font-bold mb-4">{editingCourse ? 'コース編集' : '新規コース追加'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">タイトル *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="コースタイトル" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">サムネイル（絵文字）</label>
                    <input value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="🎨" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">説明</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm h-20" placeholder="コースの説明" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">レベル</label>
                    <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm">
                      {['初級', '中級', '上級'].map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">カテゴリ</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm">
                      {['manga', 'illustration', 'story', 'animation'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">レッスン数</label>
                    <input type="number" value={form.lessons} onChange={e => setForm(p => ({ ...p, lessons: Number(e.target.value) }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">合計時間</label>
                    <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="6時間" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSaveCourse} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm transition-colors">
                    {editingCourse ? '更新' : '追加'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditingCourse(null); }} className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-sm transition-colors">
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* コース一覧 */}
            <div className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{course.thumbnail}</span>
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-gray-400 text-xs">{course.level} · {course.category} · {course.lessons}レッスン</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditCourse(course)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm transition-colors">
                      ✏️ 編集
                    </button>
                    <button onClick={() => handleDeleteCourse(course.id)} className="bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm transition-colors">
                      🗑️ 削除
                    </button>
                  </div>
                </div>
              ))}
              {courses.length === 0 && <p className="text-center text-gray-500 py-8">コースがありません。追加してください。</p>}
            </div>
          </div>
        )}

        {/* 一斉通知 */}
        {activeTab === 'notify' && (
          <div className="max-w-lg">
            <h2 className="text-lg font-bold mb-6">全ユーザーへ一斉通知</h2>
            <div className="bg-gray-800 rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">通知タイプ</label>
                <select value={notifyType} onChange={e => setNotifyType(e.target.value as typeof notifyType)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm">
                  <option value="reminder">⏰ 学習リマインダー</option>
                  <option value="new_course">🆕 新着コース</option>
                  <option value="progress">🏆 進捗達成</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">タイトル *</label>
                <input value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="通知タイトル" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">本文 *</label>
                <textarea value={notifyBody} onChange={e => setNotifyBody(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm h-24" placeholder="通知の内容" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleSendNotify} disabled={!notifyTitle || !notifyBody}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2 rounded-lg text-sm transition-colors">
                  {users.length}人に送信
                </button>
                {notifySent && <span className="text-green-400 text-sm">✅ 送信完了！</span>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}