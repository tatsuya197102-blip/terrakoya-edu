'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface ContestEntry { id: string; studentName: string; title: string; imageUrl: string; votes: number; }
interface Contest {
  id: string;
  theme: Record<string, string>;
  description: Record<string, string>;
  deadline: string;
  status: 'active' | 'ended' | 'upcoming';
  entries: ContestEntry[];
}

const SAMPLE_CONTESTS: Contest[] = [
  {
    id: 'contest-001',
    theme: { ja: '🌟 テーマ：友情', en: '🌟 Theme: Friendship', ar: '🌟 الموضوع: الصداقة', zh: '🌟 主题：友情', hi: '🌟 विषय: मित्रता' },
    description: { ja: '「友情」をテーマにした4コマ漫画またはイラストを描こう！', en: 'Draw a 4-koma manga or illustration about "Friendship"!', ar: 'ارسم مانجا من 4 لوحات أو رسم توضيحي حول موضوع "الصداقة"!', zh: '画一幅以"友情"为主题的四格漫画或插画！', hi: '"मित्रता" विषय पर 4-कोमा मंगा या चित्र बनाएं!' },
    deadline: '2026-06-30', status: 'active', entries: [],
  },
  {
    id: 'contest-002',
    theme: { ja: '🌍 テーマ：エジプトと日本', en: '🌍 Theme: Egypt & Japan', ar: '🌍 الموضوع: مصر واليابان', zh: '🌍 主题：埃及与日本', hi: '🌍 विषय: मिस्र और जापान' },
    description: { ja: 'エジプトと日本の文化をミックスしたキャラクターやストーリーを描こう！', en: 'Draw characters or stories mixing Egyptian and Japanese cultures!', ar: 'ارسم شخصيات أو قصص تمزج بين الثقافة المصرية واليابانية!', zh: '画融合埃及和日本文化的角色或故事！', hi: 'मिस्र और जापान की संस्कृति मिलाकर किरदार या कहानी बनाएं!' },
    deadline: '2026-07-31', status: 'upcoming', entries: [],
  },
];

export default function ContestPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const [contests, setContests] = useState<Contest[]>(SAMPLE_CONTESTS);
  const [selected, setSelected] = useState<Contest | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    getDocs(collection(db, 'contest_entries')).then(snap => {
      const entries = snap.docs.map(d => ({ id: d.id, ...d.data() })) as ContestEntry[];
      setContests(prev => prev.map(c => ({ ...c, entries })));
    }).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { const r = new FileReader(); r.onload = ev => setPreview(ev.target?.result as string); r.readAsDataURL(file); }
  };

  const handleSubmitEntry = async () => {
    if (!title || !preview || !auth.currentUser) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'contest_entries'), {
        contestId: selected?.id, studentId: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || 'Anonymous',
        title, imageUrl: preview, votes: 0, submittedAt: serverTimestamp(),
      });
      setTitle(''); setPreview(''); setShowSubmit(false);
      alert(t('contest.enterBtn') + ' ✅');
      window.location.reload();
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const handleVote = async (entryId: string) => {
    if (voted.has(entryId)) return;
    await updateDoc(doc(db, 'contest_entries', entryId), { votes: increment(1) });
    setVoted(prev => new Set(prev).add(entryId));
    setContests(prev => prev.map(c => ({ ...c, entries: c.entries.map(e => e.id === entryId ? { ...e, votes: e.votes + 1 } : e) })));
  };

  const getText = (obj: Record<string,string>) => obj[lang] || obj.ja;

  if (selected) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto">
          <button onClick={() => { setSelected(null); setShowSubmit(false); }} className="text-blue-400 hover:underline mb-6 block">← {t('common.back')}</button>
          <div className="bg-gradient-to-r from-yellow-900 to-orange-900 rounded-2xl p-8 mb-8">
            <h1 className="text-3xl font-bold mb-2">{getText(selected.theme)}</h1>
            <p className="text-gray-300 mb-4">{getText(selected.description)}</p>
            <p className="text-yellow-300 text-sm">{t('contest.deadline')}: {selected.deadline}</p>
          </div>
          {!showSubmit ? (
            <button onClick={() => setShowSubmit(true)} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-bold text-lg transition mb-8">
              🎨 {t('contest.enterBtn')}
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">{t('contest.enterBtn')}</h2>
              <div className="space-y-4">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder={lang === 'ar' ? 'عنوان العمل' : lang === 'en' ? 'Artwork title' : '作品タイトル'} />
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white" />
                {preview && <img src={preview} alt="Preview" className="max-h-48 rounded-lg" />}
                <button onClick={handleSubmitEntry} disabled={submitting || !title || !preview}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 py-3 rounded-xl font-bold transition">
                  {submitting ? t('common.loading') : '📤 ' + t('common.submit')}
                </button>
              </div>
            </div>
          )}
          <h2 className="text-2xl font-bold mb-6">{t('contest.entries')} ({selected.entries.length})</h2>
          {selected.entries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selected.entries.sort((a,b) => b.votes - a.votes).map((entry, i) => (
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
                      <button onClick={() => handleVote(entry.id)} disabled={voted.has(entry.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition ${voted.has(entry.id) ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {voted.has(entry.id) ? '✅' : '👍 Vote'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">🎨</p>
              <p className="text-gray-400">{t('contest.noEntries')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const statusLabel = (status: string) => {
    if (status === 'active') return lang === 'ar' ? 'جاري' : lang === 'en' ? 'Active' : '開催中';
    return lang === 'ar' ? 'قريباً' : lang === 'en' ? 'Coming Soon' : '近日開催';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-yellow-900 via-orange-900 to-red-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-yellow-300 text-sm tracking-widest mb-4">TERRAKOYA CONTEST</p>
          <h1 className="text-4xl font-bold mb-4">{t('contest.title')}</h1>
          <p className="text-gray-300 text-lg">{t('contest.subtitle')}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-6">
        {contests.map(c => (
          <div key={c.id} onClick={() => setSelected(c)} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-yellow-500 transition-all cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold group-hover:text-yellow-300 transition">{getText(c.theme)}</h2>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${c.status === 'active' ? 'bg-green-600' : 'bg-blue-600'}`}>
                {statusLabel(c.status)}
              </span>
            </div>
            <p className="text-gray-400 mb-4">{getText(c.description)}</p>
            <p className="text-gray-500 text-sm">{t('contest.deadline')}: {c.deadline}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
