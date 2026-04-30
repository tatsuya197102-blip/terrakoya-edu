'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900">
      <div className="text-center px-6">
        <div className="text-8xl mb-6">🎨</div>
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-blue-200 mb-2">
          ページが見つかりません
        </p>
        <p className="text-blue-300 text-sm mb-10">
          お探しのページは存在しないか、移動した可能性があります
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="border border-white/30 text-white px-6 py-3 rounded-xl hover:bg-white/10 transition"
          >
            ← 戻る
          </button>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-400 transition"
          >
            🏠 ホームへ
          </button>
        </div>
      </div>
    </div>
  );
}