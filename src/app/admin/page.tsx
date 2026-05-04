'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

const ADMIN_EMAIL = 'tatsuya197102@gmail.com';

type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  thumbnail: string;
  lessons: number;
  duration: string;
  rating: number;
  students: number;
  tags: string[];
  published: boolean;
};

type Lesson = {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  duration: string;
  free: boolean;
};

type User = { uid: string; displayName: string; email: string };

const EMPTY_COURSE: Omit<Course, 'id'> = {
  title: '', description: '', level: '初級', category: 'manga',
  thumbnail: '🎨', lessons: 0, duration: '', rating: 0, students: 0,
  tags: [], published: true,
};

const EMPTY_LESSON: Omit<Lesson, 'id'> = {
  courseId: '', title: '', videoUrl: '', duration: '', free: true,
};

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'lessons' | 'notify' | 'live'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<Omit<Course, 'id'>>(EMPTY_COURSE);
  const [tagInput, setTagInput] = useState('');
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState<Omit<Lesson, 'id'>>(EMPTY_LESSON);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [notifyType, setNotifyType] = useState<'reminder' | 'new_course' | 'progress'>('new_course');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: import("firebase/auth").User | null) => {
      if (!user || user.email !== ADMIN_EMAIL) { router.push('/'); return; }
      try {
        const [uSnap, cSnap, lSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'lessons')),
        ]);
        setUsers(uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
        setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
        setLessons(lSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)));
      } catch (e) {
        console.error('Admin load error:', e);
        showToast('データの読み込みに失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveCourse = async () => {
    if (!form.title) { showToast('タイトルを入力してください', 'error'); return; }
    const id = editingCourse ? editingCourse.id : form.title.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now();
    await setDoc(doc(db, 'courses', id), { ...form, updatedAt: serverTimestamp() });
    const updated = { id, ...form };
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === id ? updated : c));
      showToast('コースを更新しました', 'success');
    } else {
      setCourses(prev => [...prev, updated]);
      showToast('コースを追加しました', 'success');
    }
    setShowForm(false);
    setEditingCourse(null);
    setForm(EMPTY_COURSE);
    setTagInput('');
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('このコースを削除しますか？')) return;
    await deleteDoc(doc(db, 'courses', id));
    setCourses(prev => prev.filter(c => c.id !== id));
    showToast('コースを削除しました', 'info');
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setForm({ title: course.title, description: course.description, level: course.level,
      category: course.category, thumbnail: course.thumbnail, lessons: course.lessons,
      duration: course.duration, rating: course.rating, students: course.students,
      tags: course.tags || [], published: course.published ?? true });
    setTagInput((course.tags || []).join(', '));
    setShowForm(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title || !lessonForm.videoUrl || !lessonForm.courseId) {
      showToast('すべてのフィールドを入力してください', 'error');
      return;
    }
    const id = editingLesson ? editingLesson.id : 'lesson-' + Date.now();
    await setDoc(doc(db, 'lessons', id), lessonForm);
    const updated = { id, ...lessonForm };
    if (editingLesson) {
      setLessons(prev => prev.map(l => l.id === id ? updated : l));
      showToast('レッスンを更新しました', 'success');
    } else {
      setLessons(prev => [...prev, updated]);
      showToast('レッスンを追加しました', 'success');
    }
    setShowLessonForm(false);
    setEditingLesson(null);
    setLessonForm(EMPTY_LESSON);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('このレッスンを削除しますか？')) return;
    await deleteDoc(doc(db, 'lessons', id));
    setLessons(prev => prev.filter(l => l.id !== id));
    showToast('レッスンを削除しました', 'info');
  };

  const handleSendNotify = async () => {
    if (!notifyTitle || !notifyBody) { showToast('タイトルと本文を入力してください', 'error'); return; }
    const snap = await getDocs(collection(db, 'users'));
    await Promise.all(snap.docs.map(d =>
      setDoc(doc(collection(db, 'notifications')), {
        uid: d.id, type: notifyType, title: notifyTitle, body: notifyBody,
        read: false, createdAt: serverTimestamp(),
      })
    ));
    showToast(`${snap.docs.length}人に通知を送信しました`, 'success');
    setNotifyTitle(''); setNotifyBody('');
  };

  const handleTagInput = (value: string) => {
    setTagInput(value);
    const tags = value.split(',').map(t => t.trim()).filter(t => t !== '');
    setForm(p => ({ ...p, tags }));
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-400 hover:underline text-sm">← ダッシュボード</Link>
          <h1 className="text-xl font-bold">🛠️ 管理者パネル</h1>
        </div>
        <div className="text-sm text-gray-400">ユーザー: {users.length} / コース: {courses.length} / レッスン: {lessons.length}</div>
      </div>

      <div className="flex border-b border-gray-800 px-8">
        {([['users', '👥 ユーザー'], ['courses', '📚 コース'], ['lessons', '🎥 レッスン'], ['notify', '🔔 通知'], ['live', '📡 ライブ授業']] as const).map(([tab, label]) => (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-800">
                      <td className="px-4 py-3">{u.displayName || '名無し'}</td>
                      <td className="px-4 py-3 text-gray-400">{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* コース管理 */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">コース管理</h2>
              <button onClick={() => { setShowForm(true); setEditingCourse(null); setForm(EMPTY_COURSE); setTagInput(''); }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
                + コース追加
              </button>
            </div>

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
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-400 block mb-1">タグ（カンマ区切り）</label>
                    <input value={tagInput} onChange={e => handleTagInput(e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="キャラクター, 背景, コマ割り" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="published" checked={form.published}
                      onChange={e => setForm(p => ({ ...p, published: e.target.checked }))} />
                    <label htmlFor="published" className="text-sm text-gray-400">公開する</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSaveCourse} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm transition-colors">
                    {editingCourse ? '更新' : '追加'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditingCourse(null); }}
                    className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-sm transition-colors">
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {courses.length === 0 && (
                <p className="text-center text-gray-500 py-8">コースがありません。</p>
              )}
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
                    <button onClick={() => handleEditCourse(course)} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm">✏️ 編集</button>
                    <button onClick={() => handleDeleteCourse(course.id)} className="bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm">🗑️ 削除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* レッスン管理 */}
        {activeTab === 'lessons' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">レッスン管理</h2>
              <button onClick={() => { setShowLessonForm(true); setEditingLesson(null); setLessonForm(EMPTY_LESSON); }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors">
                + レッスン追加
              </button>
            </div>

            {showLessonForm && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6">
                <h3 className="font-bold mb-4">{editingLesson ? 'レッスン編集' : '新規レッスン追加'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">コース ID *</label>
                    <input value={lessonForm.courseId} onChange={e => setLessonForm(p => ({ ...p, courseId: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="manga-basics" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">レッスンタイトル *</label>
                    <input value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="レッスンタイトル" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">動画URL (YouTube/Cloudflare Stream) *</label>
                    <input value={lessonForm.videoUrl} onChange={e => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">時間</label>
                    <input value={lessonForm.duration} onChange={e => setLessonForm(p => ({ ...p, duration: e.target.value }))}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="30分" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="free" checked={lessonForm.free}
                      onChange={e => setLessonForm(p => ({ ...p, free: e.target.checked }))} />
                    <label htmlFor="free" className="text-sm text-gray-400">無料</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSaveLesson} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg text-sm transition-colors">
                    {editingLesson ? '更新' : '追加'}
                  </button>
                  <button onClick={() => { setShowLessonForm(false); setEditingLesson(null); }}
                    className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg text-sm transition-colors">
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {lessons.length === 0 && (
                <p className="text-center text-gray-500 py-8">レッスンがありません。</p>
              )}
              {lessons.map(lesson => (
                <div key={lesson.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{lesson.title}</p>
                    <p className="text-gray-400 text-xs">{lesson.courseId} · {lesson.duration} {lesson.free && '· 無料'}</p>
                    <p className="text-gray-500 text-xs truncate mt-1">{lesson.videoUrl}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => { setEditingLesson(lesson); setLessonForm(lesson); setShowLessonForm(true); }}
                      className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap">✏️ 編集</button>
                    <button onClick={() => handleDeleteLesson(lesson.id)}
                      className="bg-red-800 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap">🗑️ 削除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 通知 */}
        {activeTab === 'notify' && (
          <div className="max-w-lg">
            <h2 className="text-lg font-bold mb-6">全ユーザーへ通知</h2>
            <div className="bg-gray-800 rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">タイプ</label>
                <select value={notifyType} onChange={e => setNotifyType(e.target.value as typeof notifyType)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm">
                  <option value="reminder">⏰ 学習リマインダー</option>
                  <option value="new_course">🆕 新着コース</option>
                  <option value="progress">🏆 進捗達成</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">タイトル</label>
                <input value={notifyTitle} onChange={e => setNotifyTitle(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">本文</label>
                <textarea value={notifyBody} onChange={e => setNotifyBody(e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm h-24" />
              </div>
              <button onClick={handleSendNotify} disabled={!notifyTitle || !notifyBody}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-2 rounded-lg text-sm transition-colors">
                {users.length}人に送信
              </button>
            </div>
          </div>
        )}
        {/* ライブ授業管理 */}
        {activeTab === 'live' && <LiveAdmin showToast={showToast} />}
      </div>
    </div>
  );
}

// ---- ライブ授業管理コンポーネント ----
function LiveAdmin({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', instructor: '',
    meetingUrl: '', platform: 'zoom',
    scheduledAt: '', durationMin: 60,
  });

  const load = async () => {
    const { getDocs, collection, orderBy, query } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    const q = query(collection(db, 'liveLessons'), orderBy('scheduledAt', 'asc'));
    const snap = await getDocs(q);
    setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.meetingUrl || !form.scheduledAt) {
      showToast('タイトル・URL・日時は必須です', 'error'); return;
    }
    setSaving(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await addDoc(collection(db, 'liveLessons'), { ...form, createdAt: serverTimestamp() });
      showToast('✅ ライブ授業を登録しました', 'success');
      setForm({ title: '', description: '', instructor: '', meetingUrl: '', platform: 'zoom', scheduledAt: '', durationMin: 60 });
      setShowForm(false);
      await load();
    } catch (e) {
      showToast('登録に失敗しました', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    const { deleteDoc, doc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    await deleteDoc(doc(db, 'liveLessons', id));
    showToast('削除しました', 'success');
    await load();
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold">ライブ授業管理</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {showForm ? '✕ 閉じる' : '＋ 新規登録'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="font-medium">新規ライブ授業</h3>
          {[
            { label: 'タイトル *', key: 'title', type: 'text', placeholder: '例: 漫画基礎 第1回ライブQ&A' },
            { label: '説明', key: 'description', type: 'text', placeholder: '授業内容の説明（任意）' },
            { label: '講師名', key: 'instructor', type: 'text', placeholder: '例: 岡本先生' },
            { label: 'Zoom/Meet URL *', key: 'meetingUrl', type: 'url', placeholder: 'https://zoom.us/j/...' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">プラットフォーム</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm">
                <option value="zoom">Zoom</option>
                <option value="meet">Google Meet</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">時間（分）</label>
              <input type="number" value={form.durationMin}
                onChange={e => setForm(f => ({ ...f, durationMin: Number(e.target.value) }))}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">開催日時 *</label>
            <input type="datetime-local" value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? '登録中...' : '✅ 登録する'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {lessons.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-3">📡</p>
            <p>ライブ授業がまだ登録されていません</p>
          </div>
        )}
        {lessons.map((l: any) => (
          <div key={l.id} className="bg-gray-800 rounded-xl p-4 flex items-start gap-4">
            <div className="flex-1">
              <p className="font-medium">{l.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {l.platform.toUpperCase()} · {l.instructor} · {new Date(l.scheduledAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {l.durationMin}分
              </p>
              <p className="text-xs text-blue-400 mt-1 truncate">{l.meetingUrl}</p>
            </div>
            <button onClick={() => handleDelete(l.id)}
              className="text-red-400 hover:text-red-300 text-xs underline flex-shrink-0">
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}