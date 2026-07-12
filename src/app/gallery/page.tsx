'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import {
  collection, getDocs, query, where, orderBy, doc,
  updateDoc, arrayUnion, arrayRemove, getDoc, limit, deleteDoc
} from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { useTranslation } from 'react-i18next';

interface Comment { uid: string; name: string; phraseId: string; }
interface ThemeSnap { ja?: string; en?: string; ar?: string; }
interface GalleryWork {
  id: string;
  title: string;
  imageUrl: string;
  storagePath?: string;
  studentId: string;
  studentName: string;
  likes: string[];
  reactions?: Record<string, string[]>;
  comments?: Comment[];
  theme?: ThemeSnap | null;
  courseId?: string;
  lessonId?: string;
  createdAt?: any;
  aiFeedback?: string;
  grade?: number;
}
interface Theme { ja?: string; en?: string; ar?: string; active?: boolean; }

// 応援スタンプ（絵文字キー）
const STAMPS = ['👏', '✨', '🎨', '😊', '🔥'];

// 定型応援コメント（自由記述なし）
const PHRASES: { id: string; label: Record<string, string> }[] = [
  { id: 'wow',      label: { ja: 'すごい！',     en: 'Amazing!',         ar: 'رائع!' } },
  { id: 'colorful', label: { ja: '色がきれい！', en: 'Beautiful colors!', ar: 'ألوان جميلة!' } },
  { id: 'cute',     label: { ja: 'かわいい！',   en: 'So cute!',          ar: 'لطيف جداً!' } },
  { id: 'cool',     label: { ja: 'かっこいい！', en: 'So cool!',          ar: 'رائع جداً!' } },
  { id: 'nice',     label: { ja: 'いいね！',     en: 'Nice!',             ar: 'جميل!' } },
  { id: 'effort',   label: { ja: 'がんばったね！', en: 'Great effort!',    ar: 'مجهود رائع!' } },
];
function phraseText(id: string, lang: string) {
  const p = PHRASES.find(x => x.id === id);
  return p ? (p.label[lang] || p.label.en) : '';
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
  del:       { ja: '削除', en: 'Delete', ar: 'حذف' },
  delConfirm:{ ja: 'この作品を削除しますか？', en: 'Delete this artwork?', ar: 'هل تريد حذف هذا العمل؟' },
  cheer:     { ja: '応援コメント', en: 'Cheer', ar: 'تشجيع' },
  themeLabel:{ ja: '今週のお題', en: "This week's theme", ar: 'موضوع الأسبوع' },
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
  const [showComment, setShowComment] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    loadGallery();
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'theme'));
        if (snap.exists()) setTheme(snap.data() as Theme);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const themeTitle = theme && theme.active ? (theme[lang as 'ja' | 'en' | 'ar'] || theme.ja || '') : '';

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
        reactions: {},
        comments: [],
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

  const handleReaction = async (workId: string, emoji: string) => {
    if (!currentUser) return;
    const ref = doc(db, 'submissions', workId);
    const work = works.find(w => w.id === workId);
    const arr = work?.reactions?.[emoji] || [];
    const reacted = arr.includes(currentUser.uid);
    try {
      await updateDoc(ref, {
        [`reactions.${emoji}`]: reacted ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      });
      setWorks(prev => prev.map(w => {
        if (w.id !== workId) return w;
        const r = { ...(w.reactions || {}) };
        const cur = r[emoji] || [];
        r[emoji] = reacted ? cur.filter(id => id !== currentUser.uid) : [...cur, currentUser.uid];
        return { ...w, reactions: r };
      }));
    } catch (err) { console.error(err); }
  };

  const handleComment = async (workId: string, phraseId: string) => {
    if (!currentUser) return;
    const ref = doc(db, 'submissions', workId);
    const entry: Comment = { uid: currentUser.uid, name: currentUser.displayName || '名無し', phraseId };
    try {
      await updateDoc(ref, { comments: arrayUnion(entry) });
      setWorks(prev => prev.map(w => {
        if (w.id !== workId) return w;
        const list = w.comments || [];
        if (list.some(c => c.uid === entry.uid && c.phraseId === entry.phraseId)) return w;
        return { ...w, comments: [...list, entry] };
      }));
      setShowComment(null);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (workId: string) => {
    if (deleteLoading) return;
    if (!window.confirm(L('delConfirm', lang))) return;
    setDeleteLoading(workId);
    try {
      const work = works.find(w => w.id === workId);
      await deleteDoc(doc(db, 'submissions', workId));
      // Storage上の画像もベストエフォートで削除（旧base64投稿はスキップ）
      try {
        if (work?.storagePath) {
          await deleteObject(storageRef(storage, work.storagePath));
        } else if (work?.imageUrl && work.imageUrl.includes('firebasestorage')) {
          await deleteObject(storageRef(storage, work.imageUrl));
        }
      } catch (e) { console.warn('storage delete skipped:', e); }
      setWorks(prev => prev.filter(w => w.id !== workId));
    } catch (err) { console.error(err); }
    setDeleteLoading(null);
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

        {/* 今週のお題バナー */}
        {themeTitle && (
          <div className="flex items-center gap-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl px-5 py-4 mb-6">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-amber-400 text-xs font-bold">{L('themeLabel', lang)}</p>
              <p className="text-white font-bold text-lg leading-tight">{themeTitle}</p>
            </div>
            <a href="/paint"
              className="ml-auto bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap">
              🎨 {lang === 'ar' ? 'ارسم الآن' : lang === 'en' ? 'Draw now' : '描いてみる'}
            </a>
          </div>
        )}

      {/* 投稿方法の案内 */}
        <div className="bg-blue-900/30 border border-blue-700/40 rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-blue-300 mb-3 flex items-center gap-2">
            💡 {lang === 'ar' ? 'كيف تنشر عملك؟' : lang === 'en' ? 'How to post your artwork?' : 'ギャラリーに投稿するには？'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { step: '1', icon: '📚', text: lang === 'ar' ? 'افتح صفحة المهمة في الدورة' : lang === 'en' ? 'Open the assignment page in a course' : 'コースの課題ページを開く' },
              { step: '2', icon: '🖼️', text: lang === 'ar' ? 'ارفع صورة عملك' : lang === 'en' ? 'Upload a photo of your artwork' : '作品の写真をアップロードする' },
              { step: '3', icon: '🌍', text: lang === 'ar' ? 'شغّل "نشر في المعرض"' : lang === 'en' ? 'Turn on "Publish to Gallery"' : '「ギャラリーに公開する」をONにする' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3 bg-black/20 rounded-xl p-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</div>
                <p className="text-sm text-gray-300 leading-snug">{s.icon} {s.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href="/courses"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition">
              📚 {lang === 'ar' ? 'اذهب إلى الدورات' : lang === 'en' ? 'Go to Courses' : 'コースへ行く'}
            </a>
            <a href="/auto-4manga"
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition">
              📖 {lang === 'ar' ? '4 لوحات مانغا' : lang === 'en' ? '4-Koma Manga' : '4コマ漫画を作る'}
            </a>
            <a href="/paint"
              className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition">
              🎨 {lang === 'ar' ? 'الرسم' : lang === 'en' ? 'Paint' : 'ペイントで描く'}
            </a>
          </div>
        </div>

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
              const workTheme = work.theme ? (work.theme[lang as 'ja' | 'en' | 'ar'] || work.theme.ja || '') : '';
              return (
                <div key={work.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-all group">
                  {/* 画像 */}
                  <div className="relative aspect-square bg-gray-800">
                    <img src={work.imageUrl} alt={work.title} loading="lazy"
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
                    <p className="text-gray-500 text-xs truncate mb-1">
                      {L('by', lang)} {work.studentName}
                    </p>

                    {/* お題タグ */}
                    {workTheme && (
                      <div className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 text-xs px-2 py-0.5 rounded-full mb-2">
                        🎯 {workTheme}
                      </div>
                    )}

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

                      {/* 削除（自分の作品のみ） */}
                      {isOwn && (
                        <button onClick={() => handleDelete(work.id)}
                          disabled={deleteLoading === work.id}
                          title={L('del', lang)}
                          className="bg-gray-800 hover:bg-red-900/50 hover:text-red-400 px-2 py-1 rounded-lg text-xs text-gray-400 transition disabled:opacity-50">
                          {deleteLoading === work.id ? (
                            <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                          ) : '🗑️'}
                        </button>
                      )}
                    </div>

                    {/* 応援スタンプ */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {STAMPS.map(s => {
                        const arr = work.reactions?.[s] || [];
                        const reacted = currentUser && arr.includes(currentUser.uid);
                        return (
                          <button key={s} onClick={() => handleReaction(work.id, s)}
                            disabled={!currentUser}
                            className={`px-1.5 py-0.5 rounded-lg text-xs transition disabled:opacity-50 ${
                              reacted ? 'bg-blue-900/50 ring-1 ring-blue-500' : 'bg-gray-800 hover:bg-gray-700'
                            }`}>
                            {s}{arr.length > 0 && <span className="ml-0.5 text-gray-400">{arr.length}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* 応援コメント */}
                    <div className="mt-2">
                      <button onClick={() => setShowComment(showComment === work.id ? null : work.id)}
                        disabled={!currentUser}
                        className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50">
                        💬 {L('cheer', lang)}
                      </button>
                      {showComment === work.id && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {PHRASES.map(p => (
                            <button key={p.id} onClick={() => handleComment(work.id, p.id)}
                              className="px-2 py-1 rounded-lg text-xs bg-gray-800 hover:bg-blue-900/50 text-gray-300 transition">
                              {p.label[lang] || p.label.en}
                            </button>
                          ))}
                        </div>
                      )}
                      {(work.comments || []).length > 0 && (
                        <div className="mt-2 space-y-1">
                          {(work.comments || []).map((c, idx) => (
                            <p key={idx} className="text-xs text-gray-400 leading-snug">
                              <span className="text-gray-300">{c.name}</span>: {phraseText(c.phraseId, lang)}
                            </p>
                          ))}
                        </div>
                      )}
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
