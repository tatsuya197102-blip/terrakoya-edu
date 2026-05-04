'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

const COURSES: Record<string, { title: string }> = {
  'manga-basics':      { title: '漫画基礎講座' },
  'digital-illust':   { title: 'デジタルイラスト入門' },
  'story-making':     { title: 'ストーリー作り' },
  'animation-basics': { title: 'アニメーション基礎' },
};

type GradeItem = { name: string; score: number; comment: string };

type GradeResult = {
  totalScore: number;
  grades: GradeItem[];
  overallComment: string;
  nextStep: string;
};

type Submission = {
  id: string;
  fileName: string;
  fileType: string;
  comment: string;
  submittedAt: string;
  imageBase64?: string;
  aiFeedback?: string;
  feedbackStatus?: 'pending' | 'done' | 'error';
  gradeResult?: GradeResult;
  gradingStatus?: 'idle' | 'grading' | 'done' | 'error';
};

export default function AssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const courseId = params.id as string;
  const course = COURSES[courseId];

  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamText, setStreamText] = useState('');
  const streamRef = useRef('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: import("firebase/auth").User | null) => {
      if (!user) { router.push('/login'); return; }

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setEnrolled((snap.data().enrolledCourses || []).includes(courseId));
      }

      try {
        const ref = collection(db, 'users', user.uid, 'submissions');
        const q = query(ref, orderBy('submittedAt', 'desc'));
        const subSnap = await getDocs(q);
        const list: Submission[] = subSnap.docs
          .filter(d => d.data().courseId === courseId)
          .map(d => ({ id: d.id, ...(d.data() as Omit<Submission, 'id'>) }));
        setSubmissions(list);
      } catch (e) { console.error(e); }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [courseId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { showToast('5MB以下の画像を選んでください', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
    setFile(f);
  };

  // 画像をCanvasで圧縮してbase64に変換（Firestoreの1MB制限対策）
  const compressImage = (file: File): Promise<{ base64: string; fileType: string }> => {
    return new Promise((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        res({ base64: dataUrl.split(',')[1], fileType: 'image/jpeg' });
      };
      img.onerror = () => rej(new Error('画像の読み込みに失敗'));
      img.src = url;
    });
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !file) { showToast('ファイルを選択してください', 'error'); return; }
    setSubmitting(true);
    try {
      // 画像を圧縮（最大800px、JPEG70%品質）
      const { base64, fileType } = await compressImage(file);

      const fsRef = collection(db, 'users', user.uid, 'submissions');
      const docRef = await addDoc(fsRef, {
        courseId, fileName: file.name, fileType, comment,
        imageBase64: base64, submittedAt: new Date().toISOString(),
        aiFeedback: null, feedbackStatus: 'pending',
        gradeResult: null, gradingStatus: 'idle',
      });

      const newSub: Submission = {
        id: docRef.id, fileName: file.name, fileType, comment,
        imageBase64: base64, submittedAt: new Date().toISOString(),
        feedbackStatus: 'pending', gradingStatus: 'idle',
      };

      setSubmissions(prev => [newSub, ...prev]);
      setFile(null); setPreview(''); setComment('');
      showToast('✅ 提出しました！AIがフィードバックを生成中…', 'success');
      await streamFeedback(docRef.id, courseId, file.name, fileType, comment, base64, user.uid);
    } catch (e) {
      console.error('Submit error:', e);
      showToast('提出に失敗しました', 'error');
    }
    setSubmitting(false);
  };

  const streamFeedback = async (
    subId: string, cId: string, fileName: string, fileType: string,
    userComment: string, imageBase64: string, userId: string,
  ) => {
    setStreamingId(subId);
    try {
      const res = await fetch('/api/analyze-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: cId, fileName, fileType, comment: userComment, imageBase64 }),
      });
      const data = await res.json();
      const finalText = data.feedback || 'フィードバックを生成できませんでした';

      await updateDoc(doc(db, 'users', userId, 'submissions', subId), {
        aiFeedback: finalText, feedbackStatus: 'done',
      });
      setSubmissions(prev => prev.map(s =>
        s.id === subId ? { ...s, aiFeedback: finalText, feedbackStatus: 'done' } : s
      ));
      showToast('🤖 AIフィードバックが完成しました！', 'success');
    } catch (e) {
      console.error(e);
      setSubmissions(prev => prev.map(s =>
        s.id === subId ? { ...s, feedbackStatus: 'error' } : s
      ));
    } finally {
      setStreamingId(null);
      setStreamText('');
      streamRef.current = '';
    }
  };

  // AI採点
  const handleGrade = async (sub: Submission) => {
    const user = auth.currentUser;
    if (!user) return;

    setSubmissions(prev => prev.map(s =>
      s.id === sub.id ? { ...s, gradingStatus: 'grading' } : s
    ));

    try {
      const res = await fetch('/api/grade-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId, fileName: sub.fileName, fileType: sub.fileType,
          comment: sub.comment, imageBase64: sub.imageBase64,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '不明なエラー');

      const gradeResult: GradeResult = {
        totalScore: data.totalScore,
        grades: data.grades,
        overallComment: data.overallComment,
        nextStep: data.nextStep,
      };

      await updateDoc(doc(db, 'users', user.uid, 'submissions', sub.id), {
        gradeResult, gradingStatus: 'done',
      });
      setSubmissions(prev => prev.map(s =>
        s.id === sub.id ? { ...s, gradeResult, gradingStatus: 'done' } : s
      ));
      showToast('📊 AI採点が完了しました！', 'success');
    } catch (e: any) {
      console.error(e);
      setSubmissions(prev => prev.map(s =>
        s.id === sub.id ? { ...s, gradingStatus: 'error' } : s
      ));
      showToast(`採点エラー: ${e.message}`, 'error');
    }
  };

  const handleRetryFeedback = async (sub: Submission) => {
    const user = auth.currentUser;
    if (!user || !sub.imageBase64) return;
    setSubmissions(prev => prev.map(s =>
      s.id === sub.id ? { ...s, feedbackStatus: 'pending', aiFeedback: undefined } : s
    ));
    await streamFeedback(sub.id, courseId, sub.fileName, sub.fileType, sub.comment, sub.imageBase64, user.uid);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p>コースが見つかりません</p>
      <Link href="/courses" className="text-blue-400 hover:underline">コース一覧へ</Link>
    </div>
  );

  if (!enrolled) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p className="text-4xl">🔒</p>
      <p>このコースに登録してください</p>
      <Link href={`/courses/${courseId}`} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">コースページへ</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-4">
        <Link href={`/courses/${courseId}`} className="text-blue-400 hover:underline text-sm">← {course.title}</Link>
        <h1 className="text-2xl font-bold mt-2">課題提出</h1>
        <p className="text-gray-400 text-sm mt-1">作品をアップロードすると、AI講師がフィードバック＆採点します</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* 提出フォーム */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-5">📤 新しい課題を提出</h2>
          <div className="mb-5">
            <label className="text-sm text-gray-400 block mb-2">画像ファイル（5MB以下）</label>
            <label htmlFor="file-input" className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-500 transition-colors">
              <input id="file-input" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              {preview ? (
                <div className="text-center space-y-2">
                  <img src={preview} alt="preview" className="w-36 h-36 mx-auto object-cover rounded-lg" />
                  <p className="text-blue-400 text-sm">{file?.name}</p>
                  <p className="text-gray-500 text-xs">クリックで変更</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-5xl mb-3">🖼️</p>
                  <p className="text-gray-400">クリックして画像を選択</p>
                  <p className="text-gray-600 text-xs mt-1">PNG / JPG / GIF / WEBP</p>
                </div>
              )}
            </label>
          </div>
          <div className="mb-5">
            <label className="text-sm text-gray-400 block mb-2">コメント（任意）</label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="工夫した点、難しかったこと、先生に見てほしいところ..."
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-sm text-white resize-none h-20 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSubmit} disabled={!file || submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />提出＆AI分析中...</>
            ) : '✅ 課題を提出してAIフィードバックを受け取る'}
          </button>
        </div>

        {/* 提出履歴 */}
        {submissions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">📋 提出履歴</h2>
            <div className="space-y-5">
              {submissions.map(sub => (
                <SubmissionCard
                  key={sub.id} sub={sub}
                  isStreaming={streamingId === sub.id}
                  streamText={streamingId === sub.id ? streamText : ''}
                  onRetry={handleRetryFeedback}
                  onGrade={handleGrade}
                />
              ))}
            </div>
          </div>
        )}

        {submissions.length === 0 && (
          <div className="text-center text-gray-500 py-16">
            <p className="text-5xl mb-4">📝</p>
            <p>まだ課題が提出されていません</p>
            <p className="text-sm mt-1">上のフォームから作品をアップロードしてください</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ score, max = 20 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right">{score}/{max}</span>
    </div>
  );
}

function GradePanel({ result }: { result: GradeResult }) {
  const pct = result.totalScore;
  const rank = pct >= 90 ? { label: 'S', color: 'text-yellow-400' }
    : pct >= 80 ? { label: 'A', color: 'text-green-400' }
    : pct >= 70 ? { label: 'B', color: 'text-blue-400' }
    : pct >= 60 ? { label: 'C', color: 'text-purple-400' }
    : { label: 'D', color: 'text-gray-400' };

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-4">
      {/* スコアヘッダー */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className={`text-4xl font-bold ${rank.color}`}>{rank.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">ランク</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-white">{result.totalScore}</p>
          <p className="text-xs text-gray-500 mt-0.5">/ 100点</p>
        </div>
        <div className="flex-1">
          <div className="bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-700"
              style={{
                width: `${result.totalScore}%`,
                background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#3b82f6' : '#eab308',
              }}
            />
          </div>
        </div>
      </div>

      {/* 項目別 */}
      <div className="space-y-2">
        {result.grades.map((g, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-xs text-gray-300 font-medium">{g.name}</span>
            </div>
            <ScoreBar score={g.score} />
            <p className="text-xs text-gray-500 mt-0.5">{g.comment}</p>
          </div>
        ))}
      </div>

      {/* 総評 */}
      <div className="border-t border-gray-700 pt-3 space-y-2">
        <div>
          <p className="text-xs text-green-400 font-medium mb-1">📝 総評</p>
          <p className="text-sm text-gray-200 leading-relaxed">{result.overallComment}</p>
        </div>
        <div className="bg-blue-950 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-300 font-medium mb-0.5">🎯 次のチャレンジ</p>
          <p className="text-sm text-blue-100">{result.nextStep}</p>
        </div>
      </div>
    </div>
  );
}

function SubmissionCard({
  sub, isStreaming, streamText, onRetry, onGrade,
}: {
  sub: Submission; isStreaming: boolean; streamText: string;
  onRetry: (sub: Submission) => void; onGrade: (sub: Submission) => void;
}) {
  const [showGrade, setShowGrade] = useState(false);
  const feedbackText = isStreaming ? streamText : sub.aiFeedback;
  const isPending = sub.feedbackStatus === 'pending' && !isStreaming;
  const isDone = sub.feedbackStatus === 'done' && !isStreaming;
  const isError = sub.feedbackStatus === 'error';
  const isGrading = sub.gradingStatus === 'grading';
  const isGraded = sub.gradingStatus === 'done' && !!sub.gradeResult;

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      {/* 提出情報 */}
      <div className="p-4 flex gap-4">
        {sub.imageBase64 && (
          <img
            src={`data:${sub.fileType};base64,${sub.imageBase64}`}
            alt={sub.fileName}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{sub.fileName}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {new Date(sub.submittedAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
          {sub.comment && <p className="text-gray-300 text-sm mt-2 line-clamp-2">💭 {sub.comment}</p>}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isDone && <span className="text-green-400 text-xs font-medium">✅ FB完了</span>}
          {isGraded && (
            <button onClick={() => setShowGrade(v => !v)} className="text-xs bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded font-medium transition-colors">
              📊 {sub.gradeResult?.totalScore}点 {showGrade ? '▲' : '▼'}
            </button>
          )}
          {isError && (
            <button onClick={() => onRetry(sub)} className="text-xs text-red-400 hover:text-red-300 underline">再試行</button>
          )}
        </div>
      </div>

      {/* AIフィードバックエリア */}
      <div className="border-t border-gray-700 bg-gray-900 px-4 py-4 space-y-4">
        {/* フィードバック */}
        {(isStreaming || isPending) && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">AI</div>
            <div className="flex-1">
              <p className="text-xs text-purple-300 font-medium mb-1.5">AI講師のフィードバック</p>
              {isStreaming && feedbackText ? (
                <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {feedbackText}
                  <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle" />
                </p>
              ) : (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <span>作品を分析しています...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {isDone && feedbackText && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">AI</div>
            <div className="flex-1">
              <p className="text-xs text-purple-300 font-medium mb-1.5">AI講師のフィードバック</p>
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{feedbackText}</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <span>⚠️ フィードバックの生成に失敗しました。</span>
            <button onClick={() => onRetry(sub)} className="underline hover:text-red-300">再試行する</button>
          </div>
        )}

        {/* AI採点ボタン */}
        {isDone && !isGraded && !isGrading && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => onGrade(sub)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              📊 AI採点を受ける
            </button>
          </div>
        )}

        {isGrading && (
          <div className="flex items-center gap-2 text-amber-400 text-sm justify-end pt-1">
            <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>採点中...</span>
          </div>
        )}

        {/* 採点結果 */}
        {isGraded && showGrade && sub.gradeResult && (
          <GradePanel result={sub.gradeResult} />
        )}
      </div>
    </div>
  );
}
