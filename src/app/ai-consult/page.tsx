'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AIConsultPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'こんにちは！TERRAKOYAのAIアシスタントです。漫画やアニメの制作についてお悩みがあれば、何でもご相談ください。\n\n例えば:\n・キャラクターデザインのコツ\n・ストーリー構成の相談\n・デジタルツールの使い方\n・課題のフィードバック',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getAIResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    if (msg.includes('キャラクター') || msg.includes('character')) {
      return 'キャラクターデザインのポイント！\n\n1. シルエット: 遠くからでも識別できる特徴的な形\n2. カラーパレット: 3色以内で統一感\n3. 表情: 目の大きさや形で性格を表現\n4. アクセサリー: 小物で個性を出す\n\n具体的に悩んでいることはありますか？';
    }
    if (msg.includes('ストーリー') || msg.includes('story') || msg.includes('物語')) {
      return 'ストーリー作りの基本！\n\n三幕構成がおすすめ：\n1. 第一幕（導入）: 主人公と世界観を紹介\n2. 第二幕（展開）: 問題や葛藤が生まれる\n3. 第三幕（結末）: クライマックスと解決\n\nポイント: 主人公に「目標」と「障害」を与えると読者が引き込まれます。\n\nどんなジャンルの作品を作りたいですか？';
    }
    if (msg.includes('デジタル') || msg.includes('ツール') || msg.includes('ソフト')) {
      return 'デジタル制作ツールのおすすめ！\n\n初心者向け:\n・CLIP STUDIO PAINT - 漫画制作の定番\n・ibisPaint - スマホで手軽に\n・MediBang Paint - 無料で高機能\n\n中級者以上:\n・Photoshop - プロの定番\n・Procreate - iPad用の人気アプリ\n\nどのツールについて詳しく知りたいですか？';
    }
    if (msg.includes('課題') || msg.includes('提出')) {
      return '課題のアドバイス！\n\n提出前チェックリスト:\n✅ 線画は丁寧か\n✅ バランスは取れているか\n✅ テーマに沿っているか\n\n改善のコツ:\n・他の人の作品を参考にする\n・一度時間を置いてから見直す\n・先生のフィードバックを次に活かす\n\n課題の提出は「課題提出」ページからできます！';
    }
    if (msg.includes('評価') || msg.includes('採点')) {
      return '作品の評価基準（100点満点）:\n\n1. 創造性 (25点): オリジナリティ\n2. 技術力 (25点): 線の質、色使い、バランス\n3. 構図 (25点): レイアウトと見やすさ\n4. テーマ適合 (25点): 課題テーマとの一致\n\n自分の作品を見直して、どの部分が弱いか考えてみましょう！';
    }
    return 'ご質問ありがとうございます！\n\n以下のトピックでお手伝いできます：\n\n🎨 キャラクターデザイン\n📖 ストーリー作り\n🖥️ デジタルツール\n📝 課題のアドバイス\n⭐ 評価・採点\n\nどれについて聞きたいですか？';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const aiResponse = getAIResponse(input);
    setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-6 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">🤖 AI相談室</h1>
          <p className="text-gray-300 text-sm">漫画・アニメ制作のお悩みを相談しましょう</p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-8 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-gray-200'
              }`}>
                {msg.role === 'ai' && <p className="text-xs text-blue-400 mb-1">🤖 TERRAKOYA AI</p>}
                <p className="text-sm whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <p className="text-xs text-blue-400 mb-1">🤖 TERRAKOYA AI</p>
                <p className="text-sm text-gray-400 animate-pulse">考え中...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="質問を入力..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white"
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition">
            送信
          </button>
        </div>
      </div>
    </div>
  );
}