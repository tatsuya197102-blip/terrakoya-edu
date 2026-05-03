'use client';

import { useState, useRef } from 'react';
import MangaTemplate from '@/components/MangaTemplate';
import { Spinner } from '@/components/Spinner';
import Toast from '@/components/Toast';

interface Story {
  id: number;
  title: string;
  panels: Array<{
    panelNumber: number;
    description: string;
    imageUrl?: string;
  }>;
}

export default function Auto4MangaPage() {
  const [characterDescription, setCharacterDescription] = useState('');
  const [theme, setTheme] = useState('adventure');
  const [ageGroup, setAgeGroup] = useState('8-10');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [toast, setToast] = useState({ message: '', type: '' as 'success' | 'error' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateStories = async () => {
    if (!characterDescription.trim()) {
      setToast({ message: 'キャラクターの説明を入力してください', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-4manga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterDescription,
          theme,
          ageGroup,
        }),
      });

      if (!response.ok) {
        throw new Error('ストーリー生成に失敗しました');
      }

      const data = await response.json();
      setStories(data.stories || []);
      setSelectedStory(null);
      setToast({ message: '3つのストーリーが生成されました！', type: 'success' });
    } catch (error) {
      console.error('Error:', error);
      setToast({ message: 'エラーが発生しました', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManga = (panels: typeof stories[0]['panels']) => {
    setToast({ message: '💾 4コマ漫画が保存されました！', type: 'success' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 mt-4">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">🎨 自動4コマ漫画生成</h1>
          <p className="text-gray-600">キャラと話を考えると、ストーリーが自動で作られます！</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 左側：入力パネル */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📝 ストーリー設定</h2>

              {/* キャラクター説明 */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📌 キャラクターの説明
                </label>
                <textarea
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  placeholder="例：元気な犬、かわいい猫、魔法の妖精..."
                  className="w-full p-3 border-2 border-orange-300 rounded focus:outline-none focus:border-orange-500 resize-none"
                  rows={4}
                />
              </div>

              {/* テーマ選択 */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🎭 テーマ
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-2 border-2 border-orange-300 rounded focus:outline-none focus:border-orange-500"
                >
                  <option value="adventure">冒険</option>
                  <option value="friendship">友情</option>
                  <option value="comedy">コメディ</option>
                  <option value="family">家族</option>
                  <option value="mystery">謎</option>
                  <option value="nature">自然</option>
                </select>
              </div>

              {/* 年齢グループ */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  👶 年齢
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full p-2 border-2 border-orange-300 rounded focus:outline-none focus:border-orange-500"
                >
                  <option value="5-7">5〜7歳</option>
                  <option value="8-10">8〜10歳</option>
                  <option value="11-13">11〜13歳</option>
                </select>
              </div>

              {/* 生成ボタン */}
              <button
                onClick={generateStories}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-500 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner /> 作成中...
                  </>
                ) : (
                  <>✨ ストーリーを作成</>
                )}
              </button>

              {/* ご使用上のご注意 */}
              <div className="mt-6 p-4 bg-blue-50 rounded border-2 border-blue-300">
                <p className="text-xs text-blue-800 font-semibold mb-2">💡 使い方</p>
                <ol className="text-xs text-blue-700 space-y-1">
                  <li>1. キャラクターの説明を書く</li>
                  <li>2. テーマを選ぶ</li>
                  <li>3. ストーリーを作成をクリック</li>
                  <li>4. 好きなストーリーを選ぶ</li>
                  <li>5. 各パネルに絵を描く</li>
                  <li>6. 保存またはPDFでダウンロード</li>
                </ol>
              </div>
            </div>
          </div>

          {/* 右側：ストーリー表示 */}
          <div className="md:col-span-2">
            {selectedStory ? (
              <div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="mb-4 text-orange-600 font-bold hover:text-orange-700 flex items-center gap-2"
                >
                  ← ストーリー選択に戻る
                </button>
                <MangaTemplate story={selectedStory} onSave={handleSaveManga} />
              </div>
            ) : stories.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  📖 3つのストーリーから選んでね！
                </h2>
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div
                      key={story.id}
                      className="bg-white rounded-lg shadow-lg p-6 border-4 border-orange-300 cursor-pointer hover:shadow-xl transition"
                      onClick={() => setSelectedStory(story)}
                    >
                      <h3 className="text-xl font-bold text-orange-600 mb-3">
                        {story.id}. {story.title}
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {story.panels.map((panel) => (
                          <div
                            key={panel.panelNumber}
                            className="border-2 border-gray-300 rounded p-2 text-center"
                          >
                            <p className="text-xs font-bold text-gray-600 mb-1">
                              Panel {panel.panelNumber}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {panel.description}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-right">
                        <span className="inline-block bg-orange-400 text-white px-3 py-1 rounded text-sm font-bold">
                          このストーリーで描く →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center border-4 border-gray-200">
                <p className="text-4xl mb-4">🎨</p>
                <p className="text-gray-600 font-semibold">
                  キャラクターとテーマを選んで、ストーリーを作成してね！
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

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
