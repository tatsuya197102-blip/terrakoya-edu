'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface ContestEntry {
  id: string;
  studentName: string;
  title: string;
  imageUrl: string;
  votes: number;
}

interface Contest {
  id: string;
  theme: string;
  themeAr: string;
  description: string;
  descriptionAr: string;
  deadline: string;
  status: 'active' | 'ended' | 'upcoming';
  entries: ContestEntry[];
}

const SAMPLE_CONTESTS: Contest[] = [
  {
    id: 'contest-001',
    theme: '🌟 テーマ：友情',
    themeAr: '🌟 الموضوع: الصداقة',
    description: '「友情」をテーマにした4コマ漫画またはイラストを描こう！',
    descriptionAr: 'ارسم مانجا من 4 لوحات أو رسم توضيحي حول موضوع "الصداقة"!',
    deadline: '2026-06-30',
    status: 'active',
    entries: [],
  },
  {
    id: 'contest-002',
    theme: '🌍 テーマ：エジプトと日本',
    themeAr: '🌍 الموضوع: مصر واليابان',
    description: 'エジプトと日本の文化をミックスしたキャラクターやストーリーを描こう！',
    descriptionAr: 'ارسم شخصيات أو قصص تمزج بين الثقافة المصرية واليابانية!',
    deadline: '2026-07-31',
    status: 'upcoming',
    entries: [],
  },
];

export default function ContestPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [contests, setContests] = useState<Contest[]>(SAMPLE_CONTESTS);
  const [selected, setSelected] = useState<Contest | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const snap = await getDocs(collection(db, 'contest_entries'));
        const entries = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContestEntry[];
        setContests(prev => prev.map(c => ({ ...c, entries })));
      } catch (err) { console.error(err); }
    };
    fetchEntries();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitEntry = async () => {
    if (!title || !preview || !auth.currentUser) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'contest_entries'), {
        contestId: selected?.id,
        studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || 'Anonymous',
        title, imageUrl: preview, votes: 0, submittedAt: serverTimestamp(),
      });
      setTitle(''); setPreview(''); setShowSubmit(false);
      alert(lang === 'ar' ? 'تم تقديم عملك!' : '作品を提出しました！');
      window.location.reload();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const handleVote = async (entryId: string) => {
    if (voted.has(entryId)) return;
    try {
      await updateDoc(doc(db, 'contest_entries', entryId), { votes: increment(1) });
      setVoted(prev => new Set(prev).add(entryId));
      setContests(prev => prev.map(c => ({
        ...c, entries: c.entries.map(e => e.id === entryId ? { ...e, votes: e.votes + 1 } : e),
      })));
    } catch (err) { console.error(err); }
  };

  if (selected) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          <button onClick={() => { setSelected(null); setShowSubmit(false); }} className="text-blue-400 hover:underline mb-6 block">← {lang === 'ar' ? 'العودة' : '戻る'}</button>
          <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-2xl p-8 mb-8">
            <h1 className="text-3xl font-bold mb-2">{lang === 'ar' ? selected.themeAr : selected.theme}</h1>
            <p className="text-gray-300 mb-4">{lang === 'ar' ? selected.descriptionAr : selected.description}</p>
            <p className="text-yellow-300 text-sm">{lang === 'ar' ? 'الموعد النهائي' : '締切'}: {selected.deadline}</p>
          </div>

          {!showSubmit ? (
            <button onClick={() => setShowSubmit(true)} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-lg transition mb-8">
              🎨 {lang === 'ar' ? 'قدم عملك' : '作品を応募する'}
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">{lang === 'ar' ? 'قدم عملك' : '作品を応募する'}</h2>
              <div className="space-y-4">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder={lang === 'ar' ? 'عنوان العمل' : '作品タイトル'} />
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                {preview && <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />}
                <button onClick={handleSubmitEntry} disabled={submitting || !title || !preview} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-3 rounded-xl font-bold transition">
                  {submitting ? '...' : '📤 ' + (lang === 'ar' ? 'إرسال' : '提出する')}
                </button>
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mb-6">{lang === 'ar' ? 'المشاركات' : '応募作品'} ({selected.entries.length})</h2>
          {selected.entries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selected.entries.sort((a, b) => b.votes - a.votes).map((entry, i) => (
                <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  {i === 0 && <div className="bg-yellow-600 text-center py-1 text-sm font-bold">🏆 1st</div>}
                  {i === 1 && <div className="bg-gray-500 text-center py-1 text-sm font-bold">🥈 2nd</div>}
                  {i === 2 && <div className="bg-orange-700 text-center py-1 text-sm font-bold">🥉 3rd</div>}
                  <img src={entry.imageUrl} alt={entry.title} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold mb-1">{entry.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{entry.studentName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-400 font-bold">👍 {entry.votes}</span>
                      <button onClick={() => handleVote(entry.id)} disabled={voted.has(entry.id)} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${voted.has(entry.id) ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {voted.has(entry.id) ? (lang === 'ar' ? 'تم' : '投票済み') : (lang === 'ar' ? 'تصويت' : '👍 投票')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">🎨</p>
              <p className="text-gray-400">{lang === 'ar' ? 'لا توجد مشاركات بعد' : 'まだ応募がありません。最初の応募者になろう！'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-yellow-900 via-orange-900 to-red-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-yellow-300 text-sm tracking-widest mb-4">TERRAKOYA CONTEST</p>
          <h1 className="text-4xl font-bold mb-4">{lang === 'ar' ? 'مسابقة المانجا' : '漫画コンテスト'}</h1>
          <p className="text-gray-300 text-lg">{lang === 'ar' ? 'شارك وصوّت!' : '作品を投稿して、みんなで投票しよう！'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-6">
        {contests.map(c => (
          <div key={c.id} onClick={() => setSelected(c)} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-yellow-500 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold group-hover:text-yellow-300 transition">{lang === 'ar' ? c.themeAr : c.theme}</h2>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${c.status === 'active' ? 'bg-green-600' : 'bg-blue-600'}`}>
                {c.status === 'active' ? (lang === 'ar' ? 'جاري' : '開催中') : (lang === 'ar' ? 'قريباً' : '近日開催')}
              </span>
            </div>
            <p className="text-gray-400 mb-4">{lang === 'ar' ? c.descriptionAr : c.description}</p>
            <p className="text-gray-500 text-sm">{lang === 'ar' ? 'الموعد النهائي' : '締切'}: {c.deadline}</p>
          </div>
        ))}
      </div>
    </div>
  );
}