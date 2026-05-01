'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useToast } from '@/components/ToastProvider';

const COURSES: Record<string, { title: string }> = {
  'manga-basics': { title: '漫画基礎講座' },
  'digital-illust': { title: 'デジタルイラスト入門' },
  'story-making': { title: 'ストーリー作り' },
  'animation-basics': { title: 'アニメーション基礎' },
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
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [analyzingFeedback, setAnalyzingFeedback] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth/login'); return; }
      
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setEnrolled((snap.data().enrolledCourses || []).includes(courseId));
      }

      // ユーザーの提出作品を取得
      try {
        const submissionsRef = collection(db, `users/${user.uid}/submissions`);
        const submissionsSnap = await getDoc(doc(db, `users/${user.uid}`));
        // 簡略化のため、ここではローカルステート使用
      } catch (e) {
        console.error('提出作品読み込みエラー:', e);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [courseId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 画像ファイルのプレビュー
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }

    setFile(selectedFile);
    showToast(`ファイル選択: ${selectedFile.name}`, 'info');
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user || !file) { showToast('ファイルを選択してください', 'error'); return; }

    setSubmitting(true);
    try {
      // 簡略化のため、ファイルは localStorage に保存（本番ではFirebase Storageを使用）
      const fileData = {
        id: Date.now(),
        courseId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        comment,
        submittedAt: new Date().toISOString(),
        feedback: null,
      };

      // ローカルに保存
      const existing = JSON.parse(localStorage.getItem(`submissions_${courseId}`) || '[]');
      existing.push(fileData);
      localStorage.setItem(`submissions_${courseId}`, JSON.stringify(existing));
      setSubmissions(existing);

      showToast('✅ 課題を提出しました！', 'success');
      setFile(null);
      setPreview('');
      setComment('');
    } catch (e) {
      showToast('提出に失敗しました', 'error');
    }
    setSubmitting(false);
  };

  const handleGetFeedback = async (submissionId: number) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    setSelectedSubmission(submission);
    setAnalyzingFeedback(true);

    try {
      // Claude APIを呼び出してAIフィードバックを生成
      const response = await fetch('/api/analyze-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          fileName: submission.fileName,
          fileType: submission.fileType,
          comment: submission.comment,
        }),
      });

      const data = await response.json();
      setFeedback(data.feedback || 'フィードバックを生成できませんでした');

      // 提出作品にフィードバックを保存
      const updated = submissions.map(s => s.id === submissionId ? { ...s, feedback: data.feedback } : s);
      setSubmissions(updated);
      localStorage.setItem(`submissions_${courseId}`, JSON.stringify(updated));

      showToast('🤖 AIフィードバックが完成しました！', 'success');
    } catch (e) {
      showToast('フィードバック生成に失敗しました', 'error');
      console.error(e);
    }
    setAnalyzingFeedback(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">読み込み中...</div>;

  if (!course) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p>コースが見つかりません</p>
      <Link href="/courses" className="text-blue-400 hover:underline">コース一覧へ</Link>
    </div>
  );

  if (!enrolled) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
      <p className="text-2xl">🔒</p>
      <p>このコースに登録してください</p>
      <Link href={`/courses/${courseId}`} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors">コースページへ</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-4">
        <Link href={`/courses/${courseId}`} className="text-blue-400 hover:underline text-sm">← {course.title}</Link>
        <h1 className="text-2xl font-bold mt-2">課題提出</h1>
        <p className="text-gray-400 text-sm mt-1">作品をアップロードして、AI講師からフィードバックを受け取ろう！（月1枚無料）</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* 提出フォーム */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">📤 新しい課題を提出</h2>

          {/* ファイルアップロード */}
          <div className="mb-6">
            <label className="text-sm text-gray-400 block mb-2">画像ファイル（PNG, JPG, GIF）</label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                {preview ? (
                  <div className="space-y-2">
                    <img src={preview} alt="preview" className="w-32 h-32 mx-auto object-cover rounded-lg" />
                    <p className="text-blue-400">{file?.name}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-4xl mb-2">🖼️</p>
                    <p className="text-gray-400">ファイルをドラッグするか、クリックして選択</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* コメント */}
          <div className="mb-6">
            <label className="text-sm text-gray-400 block mb-2">作品についてのコメント</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="この作品で工夫した点、困っていることなど..."
              className="w-full bg-gray-700 rounded-lg px-4 py-3 text-sm text-white resize-none h-24"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!file || submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {submitting ? '提出中...' : '✅ 課題を提出'}
          </button>
        </div>

        {/* 提出済み作品 */}
        {submissions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">📋 提出済みの作品</h2>
            <div className="space-y-4">
              {submissions.map(submission => (
                <div key={submission.id} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{submission.fileName}</p>
                      <p className="text-gray-400 text-sm">{new Date(submission.submittedAt).toLocaleString('ja-JP')}</p>
                      {submission.comment && (
                        <p className="text-gray-300 text-sm mt-2">💭 {submission.comment}</p>
                      )}
                    </div>
                    {submission.feedback ? (
                      <span className="text-green-400 text-sm font-medium">✅ フィードバック完了</span>
                    ) : (
                      <button
                        onClick={() => handleGetFeedback(submission.id)}
                        disabled={analyzingFeedback}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
                      >
                        {analyzingFeedback ? '🤖 分析中...' : '🤖 AIフィードバック'}
                      </button>
                    )}
                  </div>

                  {submission.feedback && (
                    <div className="mt-4 bg-gray-700 rounded-lg p-4 text-sm">
                      <p className="text-gray-400 font-medium mb-2">🤖 AI講師のフィードバック：</p>
                      <p className="text-gray-200 whitespace-pre-wrap">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {submissions.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-3">📝</p>
            <p>提出済みの作品はありません</p>
          </div>
        )}
      </div>
    </div>
  );
}