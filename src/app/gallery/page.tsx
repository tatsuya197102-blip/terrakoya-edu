'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  collection, getDocs, query, where, orderBy, doc,
  updateDoc, arrayUnion, arrayRemove, getDoc, limit
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface GalleryWork {
  id: string;
  title: string;
  imageUrl: string;
  studentId: string;
  studentName: string;
  likes: string[];
  courseId?: string;
  lessonId?: string;
  createdAt?: any;
  aiFeedback?: string;
  grade?: number;
}

const SHARE_LABELS: Record<string, Record<string, string>> = {
  title:     { ja: '🎨 ギャラリー', en: '🎨 Gallery', ar: '🎨 المعرض' },
  subtitle:  { ja: 'みんなの作品を見てみよう！', en: "Check out everyone's artworks!", ar: 'شاهد أعمال الجميع!' },
  all:       { ja: 'すべて', en: 'All', ar: 'الكل' },
  newest:    { ja: '新しい順', en: 'Newest', ar: 'الأحدث' },
  popular:   { ja: 'いいね順', en: 'Most Liked', ar: 'الأكثر إعجاباً' },
  noWorks:   { ja: 'まだ公開作品がありません', en: 'No public artworks yet', ar: 'لا توجد أعمال عامة بعد' },
  noWorksNote: { ja: '作品を投稿して公開してみよう！', en: 'Post and share your artworks!', ar: 'انشر أعمالك وشاركها!' },
  likes:     { ja: 'いいね', en: 'likes', ar: 'إعجاب' },
  share:     { ja: 'シェア', en: 'Share', ar: 'مشاركة' },
  copyLink:  { ja: 'リンクをコピー', en: 'Copy Link', ar: 'نسخ الرابط' },
  copied:    { ja: 'コピーしました！', en: 'Copied!', ar: 'تم النسخ!' },
  myWork:    { ja: '自分の作品', en: 'My Work', ar: 'عملي' },
  grade:     { ja: '点', en: 'pts', ar: 'نقطة' },
  by:        { ja: 'by', en: 'by', ar: 'بواسطة' },
};

function L(key: string, lang: string) {
  return SHARE_LABELS[key]?.[lang] || SHARE_LABELS[key]?.en || '';
}

export default function GalleryPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [works, setWorks] = useState<GalleryWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'submissions'),
        where('isPublic', '==', true),
        limit(60)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        likes: [],
        ...d.data(),
      })) as unknown as GalleryWork[];
      setWorks(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLike = async (workId: string) => {
    if (!currentUser || likeLoading === workId) return;
    setLikeLoading(workId);
    try {
      const ref = doc(db, 'submissions', workId);
      const work = works.find(w => w.id === workId);
      const alreadyLiked = work?.likes?.includes(currentUser.uid);
      await updateDoc(ref, {
        likes: alreadyLiked
          ? arrayRemove(currentUser.uid)
          : arrayUnion(currentUser.uid),
      });
      setWorks(prev => prev.map(w =>
        w.id === workId
          ? { ...w, likes: alreadyLiked
              ? w.likes.filter(id => id !== currentUser.uid)
              : [...w.likes, currentUser.uid] }
          : w
      ));
    } catch (err) { console.error(err); }
    setLikeLoading(null);
  };

  const handleCopyLink = (workId: string) => {
    const url = `${window.location.origin}/gallery?work=${workId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(workId);
    setTimeout(() => setCopiedId(null), 2000);
    setShowShare(null);
  };

  const handleShareX = (work: GalleryWork) => {
    const text = lang === 'ar'
      ? `شاهد عملي الفني على TERRAKOYA! 🎨 "${work.title}"`
      : lang === 'en'
      ? `Check out my artwork on TERRAKOYA! 🎨 "${work.title}"`
      : `TERRAKOYAで作品を公開しました！🎨「${work.title}」`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin + '/gallery')}`;
    window.open(url, '_blank');
    setShowShare(null);
  };

  const handleShareWhatsApp = (work: GalleryWork) => {
    const text = lang === 'ar'
      ? `شاهد عملي الفني على TERRAKOYA! 🎨 "${work.title}" ${window.location.origin}/gallery`
      : lang === 'en'
      ? `Check out my artwork on TERRAKOYA! 🎨 "${work.title}" ${window.location.origin}/gallery`
      : `TERRAKOYAで作品を公開しました！🎨「${work.title}」 ${window.location.origin}/gallery`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowShare(null);
  };

  const sorted = [...works].sort((a, b) => {
    if (sortBy === 'popular') return (b.likes?.length || 0) - (a.likes?.length || 0);
    const aTime = a.createdAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">{L('title', lang)}</h1>
          <p className="text-blue-200 text-sm">{L('subtitle', lang)}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ソート */}
        <div className="flex gap-2 mb-6">
          {(['newest', 'popular'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                sortBy === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {L(s, lang)}
            </button>
          ))}
          <span className="ml-auto text-gray-500 text-sm self-center">{works.length} {L('all', lang)}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎨</p>
            <p className="text-gray-400 font-medium">{L('noWorks', lang)}</p>
            <p className="text-gray-600 text-sm mt-1">{L('noWorksNote', lang)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sorted.map(work => {
              const isLiked = currentUser && work.likes?.includes(currentUser.uid);
              const isOwn = currentUser?.uid === work.studentId;
              return (
                <div key={work.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-all group">
                  {/* 画像 */}
                  <div className="relative aspect-square bg-gray-800">
                    <img src={work.imageUrl} alt={work.title}
                      className="w-full h-full object-cover" />
                    {isOwn && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {L('myWork', lang)}
                      </div>
                    )}
                    {work.grade && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        {work.grade}{L('grade', lang)}
                      </div>
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="p-3">
                    <p className="font-bold text-sm truncate mb-0.5">{work.title}</p>
                    <p className="text-gray-500 text-xs truncate mb-2">
                      {L('by', lang)} {work.studentName}
                    </p>

                    {/* アクション */}
                    <div className="flex items-center gap-2">
                      {/* いいね */}
                      <button
                        onClick={() => handleLike(work.id)}
                        disabled={!currentUser || likeLoading === work.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition flex-1 justify-center ${
                          isLiked
                            ? 'bg-red-900/50 text-red-400'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        } disabled:opacity-50`}>
                        {likeLoading === work.id ? (
                          <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>{isLiked ? '❤️' : '🤍'} {work.likes?.length || 0}</>
                        )}
                      </button>

                      {/* シェア */}
                      <div className="relative">
                        <button onClick={() => setShowShare(showShare === work.id ? null : work.id)}
                          className="bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-lg text-xs text-gray-400 transition">
                          📤
                        </button>
                        {showShare === work.id && (
                          <div className="absolute bottom-full right-0 mb-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-10 min-w-[140px]">
                            <button onClick={() => handleShareX(work)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 transition">
                              𝕏 Twitter/X
                            </button>
                            <button onClick={() => handleShareWhatsApp(work)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 transition">
                              💬 WhatsApp
                            </button>
                            <button onClick={() => handleCopyLink(work.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-700 transition">
                              {copiedId === work.id ? `✅ ${L('copied', lang)}` : `🔗 ${L('copyLink', lang)}`}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
