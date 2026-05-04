'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const THEMES = [
  { id: 'school', labelJa: '🏫 学校の日常', labelAr: '🏫 الحياة المدرسية' },
  { id: 'adventure', labelJa: '⚔️ 冒険', labelAr: '⚔️ مغامرة' },
  { id: 'funny', labelJa: '😂 おもしろ', labelAr: '😂 مضحك' },
  { id: 'friendship', labelJa: '🤝 友情', labelAr: '🤝 صداقة' },
  { id: 'free', labelJa: '✨ 自由テーマ', labelAr: '✨ موضوع حر' },
];

interface Story {
  title: string;
  panels: { panel: number; scene: string; dialogue: string }[];
}

export default function Auto4MangaPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [characterName, setCharacterName] = useState('');
  const [theme, setTheme] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const t = {
    title: lang === 'ar' ? 'صانع المانجا ذات 4 لوحات' : '自動4コマ漫画メーカー',
    sub: lang === 'ar' ? 'أنشئ قصة مانجا أصلية مع الذكاء الاصطناعي' : 'AIがオリジナルストーリーを提案します',
    charName: lang === 'ar' ? 'اسم الشخصية' : 'キャラクターの名前',
    charPlaceholder: lang === 'ar' ? 'مثال: سارة، يوسف' : '例: タロウ、サクラ',
    selectTheme: lang === 'ar' ? 'اختر الموضوع' : 'テーマを選ぼう',
    generate: lang === 'ar' ? 'إنشاء القصة' : '🎲 ストーリーを生成！',
    generating: lang === 'ar' ? 'جاري الإنشاء...' : '生成中...',
    panel: lang === 'ar' ? 'اللوحة' : 'コマ',
    scene: lang === 'ar' ? 'المشهد' : '場面',
    dialogue: lang === 'ar' ? 'الحوار' : 'セリフ',
    useThis: lang === 'ar' ? 'استخدم هذه القصة' : 'このストーリーで描く！',
    draw: lang === 'ar' ? 'ارسم المانجا' : '4コマ漫画を描こう！',
    back: lang === 'ar' ? 'العودة' : '← 戻る',
    ki: lang === 'ar' ? 'البداية' : '起',
    sho: lang === 'ar' ? 'التطور' : '承',
    ten: lang === 'ar' ? 'التحول' : '転',
    ketsu: lang === 'ar' ? 'النهاية' : '結',
    download: lang === 'ar' ? 'تحميل القالب' : '📄 テンプレートをダウンロード',
    tips: lang === 'ar' ? 'نصائح' : 'ワンポイントアドバイス',
  };

  const panelLabels = [t.ki, t.sho, t.ten, t.ketsu];

  const generateStories = async () => {
    if (!characterName || !theme) return;
    setLoading(true);
    setStories([]);
    setSelectedStory(null);

    try {
      const response = await fetch('/api/generate-4manga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName, theme, lang }),
      });
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error('Error:', err);
      const fallbackStories = generateFallbackStories(characterName, theme);
      setStories(fallbackStories);
    }
    setLoading(false);
  };

  const generateFallbackStories = (name: string, themeId: string): Story[] => {
    const themeStories: Record<string, Story[]> = {
      school: [
        { title: `${name}の給食タイム`, panels: [
          { panel: 1, scene: `${name}が給食を楽しみにしている`, dialogue: '今日の給食はなんだろう？' },
          { panel: 2, scene: 'メニューを見て驚く', dialogue: 'え！カレーだ！大好き！' },
          { panel: 3, scene: 'おかわりしようとしたら...', dialogue: 'もう無い！？' },
          { panel: 4, scene: '友達が分けてくれる', dialogue: '半分あげるよ！ / ありがとう！' },
        ]},
        { title: `${name}の忘れ物`, panels: [
          { panel: 1, scene: `${name}が元気に登校`, dialogue: '今日もいい天気！' },
          { panel: 2, scene: '授業が始まる', dialogue: 'では教科書を開いて...' },
          { panel: 3, scene: '教科書がない！', dialogue: 'あれ！？教科書忘れた！' },
          { panel: 4, scene: '隣の席の子が見せてくれる', dialogue: '一緒に見よう！ / 助かった〜！' },
        ]},
        { title: `${name}の体育の時間`, panels: [
          { panel: 1, scene: `${name}が張り切って準備体操`, dialogue: 'よし！今日はサッカーだ！' },
          { panel: 2, scene: 'ボールを蹴ろうとする', dialogue: 'いくぞー！' },
          { panel: 3, scene: '空振りして転ぶ', dialogue: 'あっ！' },
          { panel: 4, scene: 'みんなで笑って楽しい', dialogue: 'あはは！もう一回！' },
        ]},
      ],
      adventure: [
        { title: `${name}の宝探し`, panels: [
          { panel: 1, scene: `${name}が古い地図を見つける`, dialogue: 'この地図は...宝の地図だ！' },
          { panel: 2, scene: '冒険に出発', dialogue: '出発だ！' },
          { panel: 3, scene: '大きな洞窟を発見', dialogue: 'ここに宝があるのか...？' },
          { panel: 4, scene: '宝箱を開けると友達の写真', dialogue: '本当の宝は友達だった！' },
        ]},
        { title: `${name}とドラゴン`, panels: [
          { panel: 1, scene: `${name}が森で不思議な卵を見つける`, dialogue: 'なんだこの卵？' },
          { panel: 2, scene: '卵からドラゴンが生まれる', dialogue: 'ピィー！ / か、可愛い！' },
          { panel: 3, scene: 'ドラゴンが火を吹いて大変', dialogue: 'うわぁ！熱い！' },
          { panel: 4, scene: 'ドラゴンと仲良くなる', dialogue: 'よし、お前の名前はヒノ！' },
        ]},
        { title: `${name}の空飛ぶ冒険`, panels: [
          { panel: 1, scene: `${name}が空飛ぶ箒を見つける`, dialogue: 'これ...飛べるの？' },
          { panel: 2, scene: '空を飛ぶ', dialogue: 'すごい！空が近い！' },
          { panel: 3, scene: '雲の上に王国がある', dialogue: 'こんな所に！？' },
          { panel: 4, scene: '王国の人と友達になる', dialogue: 'また遊びに来てね！' },
        ]},
      ],
      funny: [
        { title: `${name}のくしゃみ`, panels: [
          { panel: 1, scene: `${name}がくしゃみをしそう`, dialogue: 'は...は...' },
          { panel: 2, scene: '周りの人が構える', dialogue: 'くるぞ！' },
          { panel: 3, scene: '大きなくしゃみ！', dialogue: 'はっくしょーん！！' },
          { panel: 4, scene: 'カツラが飛ぶ', dialogue: 'あ、先生のカツラが...' },
        ]},
        { title: `${name}の変顔`, panels: [
          { panel: 1, scene: `${name}が鏡の前で変顔の練習`, dialogue: '変顔コンテストで優勝するぞ！' },
          { panel: 2, scene: 'いろんな変顔を試す', dialogue: 'うーん、もっとすごいの...' },
          { panel: 3, scene: '最高の変顔ができた！', dialogue: 'これだ！完璧！' },
          { panel: 4, scene: '顔が戻らなくなった', dialogue: 'あれ？...戻らない！？' },
        ]},
        { title: `${name}の犬の散歩`, panels: [
          { panel: 1, scene: `${name}が犬の散歩に出発`, dialogue: 'お散歩行こう！' },
          { panel: 2, scene: '犬が猫を見つけて走り出す', dialogue: 'わっ！待って！' },
          { panel: 3, scene: '引きずられて街中を爆走', dialogue: 'だ、誰か助けてー！' },
          { panel: 4, scene: '猫と犬が仲良くなってる', dialogue: '...結局仲良しかい' },
        ]},
      ],
      friendship: [
        { title: `${name}と転校生`, panels: [
          { panel: 1, scene: '新しい転校生が来る', dialogue: 'はじめまして...' },
          { panel: 2, scene: `${name}が声をかける`, dialogue: '一緒にお昼食べよう！' },
          { panel: 3, scene: '趣味が同じだと判明', dialogue: 'え！マンガ好きなの？私も！' },
          { panel: 4, scene: '親友になる', dialogue: 'これからよろしくね！' },
        ]},
        { title: `${name}の応援`, panels: [
          { panel: 1, scene: '友達がテストで落ち込んでいる', dialogue: 'もうダメだ...' },
          { panel: 2, scene: `${name}が一緒に勉強を提案`, dialogue: '一緒に勉強しよう！' },
          { panel: 3, scene: '毎日放課後に特訓', dialogue: 'ここはこうだよ！ / なるほど！' },
          { panel: 4, scene: '友達がテストで高得点', dialogue: '90点取れた！ありがとう！' },
        ]},
        { title: `${name}とケンカ`, panels: [
          { panel: 1, scene: '些細なことで友達とケンカ', dialogue: 'もう知らない！' },
          { panel: 2, scene: 'お互い気まずい', dialogue: '...' },
          { panel: 3, scene: '雨が降ってきて友達が傘がない', dialogue: 'あっ...' },
          { panel: 4, scene: `${name}が傘を差し出す`, dialogue: '...一緒に帰ろ / うん！' },
        ]},
      ],
      free: [
        { title: `${name}の夢`, panels: [
          { panel: 1, scene: `${name}が夢の中で空を飛ぶ`, dialogue: 'わぁ！飛んでる！' },
          { panel: 2, scene: '夢の中でケーキの山を発見', dialogue: '食べ放題だ！' },
          { panel: 3, scene: '目覚ましが鳴る', dialogue: 'リリリリリ！' },
          { panel: 4, scene: '起きたらよだれがたれていた', dialogue: '...夢か。美味しかったのに' },
        ]},
        { title: `${name}のタイムマシン`, panels: [
          { panel: 1, scene: `${name}が押入れでタイムマシンを発見`, dialogue: 'これは...！' },
          { panel: 2, scene: '恐竜時代にタイムスリップ', dialogue: 'す、すごい！本物の恐竜！' },
          { panel: 3, scene: '恐竜に追いかけられる', dialogue: 'わぁぁぁ！逃げろー！' },
          { panel: 4, scene: 'なんとか帰ってきて一安心', dialogue: 'やっぱり現代が一番だ...' },
        ]},
        { title: `${name}の魔法のペン`, panels: [
          { panel: 1, scene: `${name}が光るペンを拾う`, dialogue: 'なんだこのペン？' },
          { panel: 2, scene: '描いたものが本物になる', dialogue: 'ケーキを描いたら...本物だ！' },
          { panel: 3, scene: '調子に乗ってライオンを描く', dialogue: 'ガオー！！ / ぎゃー！' },
          { panel: 4, scene: '消しゴムで消して解決', dialogue: '...消しゴムも魔法だった！' },
        ]},
      ],
    };
    return themeStories[themeId] || themeStories.free;
  };

  const handleMangaSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { auth, db } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (!user) { setSubmitMsg('ログインが必要です'); return; }
    setSubmitting(true);
    setSubmitMsg('');
    try {
      // 画像を圧縮
      const base64: string = await new Promise((res) => {
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
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          res(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
        };
        img.src = url;
      });

      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(db, 'users', user.uid, 'submissions'), {
        courseId: 'auto-4manga',
        fileName: file.name,
        fileType: 'image/jpeg',
        comment: `4コマ漫画「${selectedStory?.title || ''}」`,
        imageBase64: base64,
        submittedAt: new Date().toISOString(),
        aiFeedback: null, feedbackStatus: 'pending',
        gradeResult: null, gradingStatus: 'idle',
      });
      setSubmitMsg('✅ 提出しました！コースページからAIフィードバックを確認できます');
    } catch (err) {
      console.error(err);
      setSubmitMsg('❌ 提出に失敗しました。もう一度お試しください');
    }
    setSubmitting(false);
  };

  const downloadTemplate = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 1200);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(selectedStory?.title || '4コマ漫画', 20, 40);

    const panelHeight = 260;
    const startY = 60;
    const labels = ['起', '承', '転', '結'];

    for (let i = 0; i < 4; i++) {
      const y = startY + i * (panelHeight + 10);
      ctx.strokeRect(20, y, 760, panelHeight);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(`${labels[i]}（${i + 1}コマ目）`, 30, y + 25);

      if (selectedStory) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#999999';
        ctx.fillText(selectedStory.panels[i].scene, 30, y + 50);
        ctx.fillText('セリフ: ' + selectedStory.panels[i].dialogue, 30, y + 70);
      }
    }

    const link = document.createElement('a');
    link.download = '4koma_template.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  if (selectedStory) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setSelectedStory(null)} className="text-blue-400 hover:underline mb-6 block">{t.back}</button>
          <h1 className="text-3xl font-bold mb-2">{t.draw}</h1>
          <h2 className="text-xl text-blue-400 mb-8">「{selectedStory.title}」</h2>

          <div className="space-y-6 mb-8">
            {selectedStory.panels.map((panel, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">{panelLabels[i]}</span>
                  <span className="text-gray-400 text-sm">{t.panel} {panel.panel}</span>
                </div>
                <p className="text-gray-300 mb-2">🎬 {t.scene}: {panel.scene}</p>
                <p className="text-white font-medium">💬 {t.dialogue}: 「{panel.dialogue}」</p>
                <div className="mt-4 border-2 border-dashed border-slate-700 rounded-xl h-32 flex items-center justify-center text-gray-500">
                  {lang === 'ar' ? 'ارسم هنا!' : 'ここに描こう！'}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-3">💡 {t.tips}</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>・キャラクターの表情をしっかり描こう</li>
              <li>・セリフは吹き出しの中に書こう</li>
              <li>・背景も簡単でいいから描いてみよう</li>
              <li>・4コマ目のオチが大事！</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button onClick={downloadTemplate} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold transition flex-1">
              {t.download}
            </button>
            <label className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition flex-1 text-center cursor-pointer">
              📤 {lang === 'ar' ? 'تقديم العمل' : '完成したら提出する'}
              <input type="file" accept="image/*" className="hidden" onChange={handleMangaSubmit} />
            </label>
          </div>
          {submitMsg && (
            <div className={`mt-4 p-3 rounded-lg text-sm text-center ${submitMsg.includes('✅') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {submitMsg}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-orange-900 via-red-900 to-pink-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-orange-300 text-sm tracking-widest mb-4">TERRAKOYA 4-KOMA MAKER</p>
          <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-gray-300 text-lg">{t.sub}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">{t.charName}</label>
            <input type="text" value={characterName} onChange={(e) => setCharacterName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg" placeholder={t.charPlaceholder} />
          </div>

          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-2">{t.selectTheme}</label>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map(th => (
                <button key={th.id} onClick={() => setTheme(th.id)} className={`p-4 rounded-xl text-left transition ${theme === th.id ? 'bg-blue-600 text-white border-2 border-blue-400' : 'bg-slate-800 text-gray-300 hover:bg-slate-700 border-2 border-transparent'}`}>
                  {lang === 'ar' ? th.labelAr : th.labelJa}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generateStories} disabled={loading || !characterName || !theme} className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 disabled:opacity-50 px-6 py-4 rounded-xl font-bold text-lg transition">
            {loading ? t.generating : t.generate}
          </button>
        </div>

        {stories.length > 0 && (
          <div className="mt-10 space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">
              {lang === 'ar' ? '٣ قصص مقترحة' : '🎲 3つのストーリー案'}
            </h2>
            {stories.map((story, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500 transition">
                <h3 className="text-xl font-bold mb-4">{story.title}</h3>
                <div className="space-y-2 mb-4">
                  {story.panels.map((panel, j) => (
                    <div key={j} className="flex gap-3 text-sm">
                      <span className="bg-slate-800 text-blue-400 px-2 py-0.5 rounded font-bold">{panelLabels[j]}</span>
                      <span className="text-gray-300">{panel.scene}</span>
                      <span className="text-gray-500">「{panel.dialogue}」</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedStory(story)} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition">
                  {t.useThis}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}