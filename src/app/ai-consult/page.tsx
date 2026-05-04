'use client';
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const SUGGESTIONS: Record<string, string[]> = {
  ja: ['キャラクターの目の描き方を教えて', 'コマ割りのコツは？', '起承転結のストーリーの作り方', '線を安定させる練習方法', 'CLIPSTUDIOの使い方'],
  en: ['How to draw character eyes', 'Tips for panel layouts', 'How to structure a story', 'How to improve line stability', 'How to use CLIPSTUDIO'],
  ar: ['كيف أرسم عيون الشخصيات', 'نصائح لتقسيم اللوحات', 'كيف أبني قصة متماسكة', 'كيف أثبّت الخطوط', 'كيف أستخدم CLIPSTUDIO'],
};

export default function AIConsultPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: 'こんにちは！テラ先生です ✏️\n\n漫画・アニメ制作について何でも聞いてください。キャラクターの描き方、ストーリー構成、デジタルツールの使い方など、プロの視点でアドバイスします！',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      // 会話履歴（最初の挨拶を除く）
      const history = messages
        .slice(1)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: userMsg }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'エラー');
      setMessages(prev => [...prev, { role: 'ai', content: data.text }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `申し訳ありません、エラーが発生しました。\n${err.message}` }]);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 py-4 px-6 border-b border-slate-800 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-sm font-bold flex-shrink-0">AI</div>
          <div>
            <h1 className="text-base font-bold">{t('aiConsult.teacher')}</h1>
            <p className="text-gray-400 text-xs">漫画・アニメ制作の専門AIアドバイザー</p>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">AI</div>
              )}
              <div className={`max-w-xl rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-800 border border-slate-700 text-gray-200 rounded-bl-sm'
              }`}>
                {msg.role === 'ai' && <p className="text-xs text-purple-400 font-medium mb-1.5">{t('aiConsult.teacher')}</p>}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">AI</div>
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
                <p className="text-xs text-purple-400 font-medium mb-2">{t('aiConsult.teacher')}</p>
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            </div>
          )}

          {/* 最初のみサジェスト表示 */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 pt-2">
              {(SUGGESTIONS[lang] || SUGGESTIONS.ja).map(s => (
                <button key={s} onClick={() => handleSend(s)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded-full transition-colors text-gray-300">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="border-t border-slate-800 bg-slate-900 px-4 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder="テラ先生に質問する..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl font-medium text-sm transition-colors whitespace-nowrap"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
