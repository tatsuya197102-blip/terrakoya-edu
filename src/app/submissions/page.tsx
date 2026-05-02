'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface Submission {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  submittedAt: any;
  status: string;
  aiFeedback?: string;
  grade?: number;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return; }
      try {
        const q = query(
          collection(db, 'submissions'),
          where('studentId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Submission[];
        setSubmissions(data);
      } catch (err) {
        console.error('Error:', err);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!title || !auth.currentUser) return;
    setUploading(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || 'Unknown',
        title,
        description,
        imageUrl: preview || '',
        submittedAt: serverTimestamp(),
        status: 'submitted',
        reviewed: false,
      });
      setTitle('');
      setDescription('');
      setPreview('');
      setShowForm(false);
      window.location.reload();
    } catch (err) {
      console.error('Submit error:', err);
      alert('提出に失敗しました');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">課題提出</h1>
            <p className="text-gray-400 mt-1">作品をアップロードして、フィードバックを受けましょう</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition">
            {showForm ? '✕ 閉じる' : '＋ 新規提出'}
          </button>
        </div>

        {showForm && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">課題を提出する</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">タイトル</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="例: マンガ基礎 - 第3課 課題" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">説明</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white h-24" placeholder="課題の説明を入力..." />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">画像ファイル</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
              </div>
              {preview && <img src={preview} alt="Preview" className="max-h-64 rounded-lg border border-slate-700" />}
              <button onClick={handleSubmit} disabled={uploading || !title} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition w-full">
                {uploading ? '提出中...' : '📤 提出する'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{sub.title}</h3>
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">{sub.status === 'graded' ? '採点済み' : '提出済み'}</span>
                  </div>
                  {sub.description && <p className="text-gray-400 text-sm">{sub.description}</p>}
                  {sub.aiFeedback && (
                    <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 mt-3">
                      <p className="text-blue-300 text-xs font-bold mb-1">🤖 AIフィードバック</p>
                      <p className="text-gray-300 text-sm">{sub.aiFeedback}</p>
                    </div>
                  )}
                </div>
                {sub.imageUrl && <img src={sub.imageUrl} alt={sub.title} className="w-20 h-20 object-cover rounded-lg ml-4" />}
              </div>
            </div>
          ))}
          {submissions.length === 0 && (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">📝</p>
              <p className="text-gray-400">まだ課題が提出されていません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}