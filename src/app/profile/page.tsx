'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      setEmail(user.email || '');
      setAvatarUrl(user.photoURL || '');
      setAvatarPreview(user.photoURL || '');
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUserName(data.displayName || user.displayName || '');
        setBio(data.bio || '');
        const enrolled = data.enrolledCourses || [];
        setEnrolledCount(enrolled.length);
        const progressMap = data.completedLessons || {};
        const completed = Object.values(progressMap).filter((lessons: any) => lessons.length > 0).length;
        setCompletedCount(completed);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('画像サイズは2MB以下にしてください');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      setAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, {
        displayName: userName,
        photoURL: avatarUrl || user.photoURL,
      });
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        displayName: userName,
        bio,
        photoURL: avatarUrl || user.photoURL,
        updatedAt: new Date(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-blue-400 hover:underline text-sm mb-6 block">← ダッシュボード</Link>
        <h1 className="text-2xl font-bold mb-6">👤 プロフィール設定</h1>

        {/* アバター */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-bold mb-4">プロフィール画像</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-600" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold border-2 border-blue-500">
                  {userName?.[0] || '?'}
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm transition-colors border-2 border-gray-900">
                ✏️
              </button>
            </div>
            <div>
              <button onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors block mb-2">
                📷 画像をアップロード
              </button>
              <p className="text-gray-400 text-xs">JPG・PNG・GIF（2MB以下）</p>
              {avatarPreview && avatarPreview !== auth.currentUser?.photoURL && (
                <button onClick={() => { setAvatarPreview(auth.currentUser?.photoURL || ''); setAvatarUrl(''); }}
                  className="text-red-400 hover:underline text-xs mt-1">
                  削除
                </button>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>

        {/* 基本情報 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-bold mb-4">基本情報</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">表示名</label>
              <input value={userName} onChange={e => setUserName(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-sm" placeholder="表示名を入力" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">メールアドレス</label>
              <input value={email} disabled
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-sm opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">自己紹介</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-4 py-2 text-sm h-24 resize-none"
                placeholder="自己紹介を入力してください（任意）" />
            </div>
          </div>
        </div>

        {/* 学習統計 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="font-bold mb-4">📊 学習統計</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{enrolledCount}</p>
              <p className="text-gray-400 text-sm mt-1">登録コース数</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{completedCount}</p>
              <p className="text-gray-400 text-sm mt-1">学習中コース</p>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-3 mb-6">
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-xl font-bold transition-colors">
            {saving ? '保存中...' : saved ? '✅ 保存しました！' : '💾 変更を保存'}
          </button>
        </div>

        {/* ログアウト */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="font-bold mb-4 text-red-400">⚠️ アカウント操作</h2>
          <button onClick={handleLogout}
            className="w-full bg-red-800 hover:bg-red-700 py-3 rounded-xl font-bold transition-colors">
            🚪 ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}