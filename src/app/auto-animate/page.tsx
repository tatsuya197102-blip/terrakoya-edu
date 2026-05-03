'use client';

import { useState, useRef } from 'react';
import Toast from '@/components/Toast';

interface Frame {
  id: number;
  imageUrl?: string;
}

export default function AutoAnimatePage() {
  const [frames, setFrames] = useState<Frame[]>(
    Array.from({ length: 6 }, (_, i) => ({ id: i + 1 }))
  );
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(300);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [toast, setToast] = useState({ message: '', type: '' as 'success' | 'error' });

  // フレーム画像アップロード
  const handleFrameUpload = (frameId: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setFrames((prev) =>
        prev.map((f) => (f.id === frameId ? { ...f, imageUrl } : f))
      );
      setToast({ message: `フレーム ${frameId} が追加されました！`, type: 'success' });
    };
    reader.readAsDataURL(file);
  };

  // フレーム追加
  const addFrame = () => {
    if (frames.length < 12) {
      const newFrame = { id: Math.max(...frames.map((f) => f.id)) + 1 };
      setFrames([...frames, newFrame]);
    } else {
      setToast({ message: 'フレーム上限は12フレームです', type: 'error' });
    }
  };

  // フレーム削除
  const removeFrame = (frameId: number) => {
    if (frames.length > 2) {
      setFrames(frames.filter((f) => f.id !== frameId));
    } else {
      setToast({ message: '最低2フレーム必要です', type: 'error' });
    }
  };

  // アニメーション再生
  const playAnimation = () => {
    setIsPlaying(true);
    let currentIdx = 0;

    const interval = setInterval(() => {
      setCurrentFrame(currentIdx % frames.length);
      currentIdx++;

      if (currentIdx >= frames.length * 2) {
        setIsPlaying(false);
        clearInterval(interval);
      }
    }, animationSpeed);
  };

  // フレームをダウンロード（個別PNG）
  const downloadFrames = async () => {
    const uploadedFrames = frames.filter((f) => f.imageUrl);
    if (uploadedFrames.length === 0) {
      setToast({ message: '少なくとも1つのフレームが必要です', type: 'error' });
      return;
    }

    try {
      uploadedFrames.forEach((frame, idx) => {
        if (frame.imageUrl) {
          const a = document.createElement('a');
          a.href = frame.imageUrl;
          a.download = `frame_${String(idx + 1).padStart(2, '0')}.png`;
          a.click();
        }
      });

      setToast({ message: `${uploadedFrames.length}枚のフレームをダウンロードしました！`, type: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      setToast({ message: 'ダウンロードに失敗しました', type: 'error' });
    }
  };

  // パラパラ漫画プレビュー
  const currentFrameImage = frames[currentFrame]?.imageUrl;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 to-cyan-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 mt-4">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            🎬 自動ショートアニメ作成ツール
          </h1>
          <p className="text-gray-600">
            パラパラ漫画で簡単アニメーション！フレームを描いて動かそう
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 左側：フレーム管理 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📹 フレーム管理</h2>

              {/* フレーム一覧 */}
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {frames.map((frame, idx) => (
                  <div
                    key={frame.id}
                    className={`border-2 rounded p-2 cursor-pointer transition ${
                      selectedFrame === idx
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedFrame(idx)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-700">
                        Frame {idx + 1}
                      </span>
                      {frame.imageUrl ? (
                        <span className="text-xl">✓</span>
                      ) : (
                        <span className="text-xs text-gray-500">未設定</span>
                      )}
                    </div>
                    {frame.imageUrl && (
                      <img
                        src={frame.imageUrl}
                        alt={`Frame ${idx + 1}`}
                        className="w-full mt-2 rounded h-20 object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* フレーム操作 */}
              <div className="space-y-2 mb-6">
                <button
                  onClick={addFrame}
                  className="w-full bg-blue-400 text-white font-bold py-2 px-4 rounded hover:bg-blue-500 transition text-sm"
                >
                  + フレーム追加（{frames.length}/12）
                </button>
                {frames.length > 2 && (
                  <button
                    onClick={() => removeFrame(frames[selectedFrame].id)}
                    className="w-full bg-red-400 text-white font-bold py-2 px-4 rounded hover:bg-red-500 transition text-sm"
                  >
                    🗑️ このフレーム削除
                  </button>
                )}
              </div>

              {/* 速度設定 */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ⚡ アニメーション速度
                </label>
                <input
                  type="range"
                  min="100"
                  max="800"
                  step="50"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-1">
                  {animationSpeed}ms / フレーム
                </p>
              </div>

              {/* アクション */}
              <div className="space-y-2">
                <button
                  onClick={playAnimation}
                  disabled={isPlaying}
                  className="w-full bg-green-400 text-white font-bold py-2 px-4 rounded hover:bg-green-500 transition disabled:opacity-50"
                >
                  ▶️ アニメーション再生
                </button>
                <button
                  onClick={downloadFrames}
                  className="w-full bg-purple-400 text-white font-bold py-2 px-4 rounded hover:bg-purple-500 transition text-sm"
                >
                  📥 フレームをダウンロード
                </button>
              </div>

              {/* 情報 */}
              <div className="mt-6 p-3 bg-green-50 rounded border-2 border-green-300 text-xs">
                <p className="font-bold text-green-800 mb-2">✨ 完全無料</p>
                <p className="text-green-700">
                  広告なし、登録不要。存分に動画を作ってね！
                </p>
              </div>
            </div>
          </div>

          {/* 中央：フレーム編集 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                🎨 フレーム {selectedFrame + 1} を編集
              </h2>

              {/* 画像表示領域 */}
              <div className="border-4 border-dashed border-blue-300 rounded-lg aspect-square flex items-center justify-center bg-blue-50 mb-4">
                {frames[selectedFrame]?.imageUrl ? (
                  <img
                    src={frames[selectedFrame].imageUrl}
                    alt={`Frame ${selectedFrame + 1}`}
                    className="w-full h-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-3xl mb-2">🖼️</p>
                    <p className="text-sm text-gray-600">
                      ここに絵を描いて
                      <br />
                      アップロードしよう
                    </p>
                  </div>
                )}
              </div>

              {/* アップロード */}
              <label className="w-full block">
                <span className="w-full block bg-blue-400 text-white font-bold py-3 px-4 rounded text-center cursor-pointer hover:bg-blue-500 transition">
                  📁 画像をアップロード
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFrameUpload(
                        frames[selectedFrame].id,
                        e.target.files[0]
                      );
                    }
                  }}
                />
              </label>

              {/* フレーム情報 */}
              <div className="mt-4 p-3 bg-blue-50 rounded border-2 border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>💡 ヒント：</strong>
                  <br />
                  前のフレームと少しだけ違う絵を描くと、スムーズなアニメーションになります！
                </p>
              </div>
            </div>
          </div>

          {/* 右側：プレビュー */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">👀 プレビュー</h2>

              {/* パラパラ漫画プレビュー */}
              <div className="border-4 border-black rounded-lg aspect-square flex items-center justify-center bg-white mb-4 overflow-hidden">
                {currentFrameImage ? (
                  <img
                    src={currentFrameImage}
                    alt="Preview"
                    className="w-full h-full object-contain animate-fade-in"
                    key={currentFrame}
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-4xl mb-2">🎬</p>
                    <p className="text-sm text-gray-600">
                      アニメーションプレビュー
                    </p>
                  </div>
                )}
              </div>

              {/* フレームカウンター */}
              <div className="text-center mb-4">
                <p className="text-sm font-bold text-gray-700">
                  フレーム {currentFrame + 1} / {frames.length}
                </p>
              </div>

              {/* フレームナビゲーション */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() =>
                    setCurrentFrame((p) => (p - 1 + frames.length) % frames.length)
                  }
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 rounded"
                >
                  ⬅️
                </button>
                <button
                  onClick={() => setCurrentFrame((p) => (p + 1) % frames.length)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 rounded"
                >
                  ➡️
                </button>
              </div>

              {/* 情報 */}
              <div className="p-3 bg-blue-50 rounded border-2 border-blue-200 text-xs">
                <p className="font-bold text-blue-800 mb-2">📝 こんな風に使おう</p>
                <ol className="text-blue-700 space-y-1">
                  <li>1️⃣ 各フレームに絵を描く</li>
                  <li>2️⃣ 速度を調整</li>
                  <li>3️⃣ 再生ボタンで確認</li>
                  <li>4️⃣ ダウンロード！</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS アニメーション定義 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        :global(.animate-fade-in) {
          animation: fadeIn 0.1s ease-in-out;
        }
      `}</style>

      {/* トースト通知 */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}
    </main>
  );
}
