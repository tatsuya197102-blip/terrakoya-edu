'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const THEMES = [
  { id: 'school',     labelJa: '🏫 学校の日常', labelEn: '🏫 School Life', labelAr: '🏫 الحياة المدرسية', labelZh: '🏫 校园日常', labelHi: '🏫 स्कूल जीवन', labelVi: '🏫 Đời học đường', labelEs: '🏫 Vida escolar' },
  { id: 'adventure',  labelJa: '⚔️ 冒険', labelEn: '⚔️ Adventure', labelAr: '⚔️ مغامرة', labelZh: '⚔️ 冒险', labelHi: '⚔️ साहसिक', labelVi: '⚔️ Phiêu lưu', labelEs: '⚔️ Aventura' },
  { id: 'funny',      labelJa: '😂 おもしろ', labelEn: '😂 Comedy', labelAr: '😂 مضحك', labelZh: '😂 搞笑', labelHi: '😂 कॉमेडी', labelVi: '😂 Hài hước', labelEs: '😂 Comedia' },
  { id: 'friendship', labelJa: '🤝 友情', labelEn: '🤝 Friendship', labelAr: '🤝 صداقة', labelZh: '🤝 友情', labelHi: '🤝 मित्रता', labelVi: '🤝 Tình bạn', labelEs: '🤝 Amistad' },
  { id: 'free',       labelJa: '✨ 自由テーマ', labelEn: '✨ Free Theme', labelAr: '✨ موضوع حر', labelZh: '✨ 自由主题', labelHi: '✨ मुक्त विषय', labelVi: '✨ Chủ đề tự do', labelEs: '✨ Tema libre' },
];

interface Story {
  title: string;
  panels: { panel: number; scene: string; dialogue: string }[];
}

export default function Auto4MangaPage() {
  const { i18n, t: tr } = useTranslation();
  const lang = i18n.language as 'ja' | 'en' | 'ar';
  const [characterName, setCharacterName] = useState('');
  const [theme, setTheme] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [submitMsg, setSubmitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { useT } = { useT: null }; // dummy
  const tl = {
    title: tr('manga4.title'),
    sub: tr('manga4.subtitle'),
    charName: tr('manga4.characterName'),
    charPlaceholder: ({'ar':'مثال: سارة، يوسف','en':'e.g. Sakura, Taro','ja':'例: タロウ、サクラ','zh':'例：小明、小花','hi':'जैसे: सकुरा, तारो','vi':'Vd: Sakura, Taro','es':'Ej: Sakura, Taro'} as Record<string,string>)[lang] || 'e.g. Sakura, Taro',
    selectTheme: tr('manga4.theme'),
    generate: tr('manga4.generate'),
    generating: tr('manga4.generating'),
    panel: ({'ar':'اللوحة','en':'Panel','ja':'コマ','zh':'格','hi':'पैनल','vi':'Panel','es':'Panel'} as Record<string,string>)[lang] || 'Panel',
    scene: ({'ar':'المشهد','en':'Scene','ja':'場面','zh':'场景','hi':'दृश्य','vi':'Cảnh','es':'Escena'} as Record<string,string>)[lang] || 'Scene',
    dialogue: ({'ar':'الحوار','en':'Dialogue','ja':'セリフ','zh':'对话','hi':'संवाद','vi':'Đối thoại','es':'Diálogo'} as Record<string,string>)[lang] || 'Dialogue',
    useThis: tr('manga4.useThis'),
    draw: tr('manga4.draw'),
    back: tr('manga4.back'),
    ki: ({'ar':'البداية','en':'Setup','ja':'起','zh':'起','hi':'शुरुआत','vi':'Mở đầu','es':'Inicio'} as Record<string,string>)[lang] || 'Setup',
    sho: ({'ar':'التطور','en':'Build','ja':'承','zh':'承','hi':'विकास','vi':'Phát triển','es':'Desarrollo'} as Record<string,string>)[lang] || 'Build',
    ten: ({'ar':'التحول','en':'Turn','ja':'転','zh':'转','hi':'मोड़','vi':'Chuyển biến','es':'Giro'} as Record<string,string>)[lang] || 'Turn',
    ketsu: ({'ar':'النهاية','en':'Payoff','ja':'結','zh':'结','hi':'समाप्ति','vi':'Kết thúc','es':'Desenlace'} as Record<string,string>)[lang] || 'Payoff',
    download: tr('manga4.download'),
    tips: tr('manga4.tips'),
  };
  const t = tl;

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
    if (!user) { setSubmitMsg({'ar':'يجب تسجيل الدخول','en':'Login required','ja':'ログインが必要です','zh':'请先登录','hi':'लॉगिन आवश्यक है','vi':'Cần đăng nhập','es':'Inicio de sesión requerido'}[lang as string] || 'Login required'); return; }
    setSubmitting(true);
    setSubmitMsg(tr('manga4.submitting'));
    try {
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

      const { addDoc, updateDoc, doc, collection } = await import('firebase/firestore');
      const docRef = await addDoc(collection(db, 'users', user.uid, 'submissions'), {
        courseId: 'auto-4manga',
        fileName: file.name,
        fileType: 'image/jpeg',
        comment: `4コマ漫画「${selectedStory?.title || ''}」`,
        imageBase64: base64,
        submittedAt: new Date().toISOString(),
        aiFeedback: null, feedbackStatus: 'pending',
        gradeResult: null, gradingStatus: 'idle',
      });

      setSubmitMsg(tr('manga4.analyzing'));

      const res = await fetch('/api/analyze-artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: 'auto-4manga',
          fileName: file.name,
          fileType: 'image/jpeg',
          comment: `4コマ漫画「${selectedStory?.title || ''}」`,
          imageBase64: base64,
        }),
      });
      const data = await res.json();
      const feedback = data.feedback || ({'ar':'تعذر إنشاء التغذية الراجعة','en':'Could not generate feedback','ja':'フィードバックを生成できませんでした','zh':'无法生成反馈','hi':'फीडबैक नहीं बन सका','vi':'Không thể tạo phản hồi','es':'No se pudo generar retroalimentación'}[lang as string] || 'Could not generate feedback');

      await updateDoc(doc(db, 'users', user.uid, 'submissions', docRef.id), {
        aiFeedback: feedback, feedbackStatus: 'done',
      });

      setSubmitMsg(`✅__${feedback}`);
    } catch (err) {
      console.error(err);
      setSubmitMsg('❌ ' + ({'ar':'فشل الإرسال. حاول مجدداً','en':'Submission failed. Please try again','ja':'提出に失敗しました。もう一度お試しください','zh':'提交失败，请重试','hi':'सबमिट विफल हुआ। कृपया पुनः प्रयास करें','vi':'Gửi thất bại. Vui lòng thử lại','es':'Error al enviar. Inténtalo de nuevo'}[lang as string] || 'Submission failed. Please try again'));
    }
    setSubmitting(false);
  };

  const downloadTemplate = () => {
    const canvas = document.createElement('canvas');
    // 縦型4コマ（上から下1列、右余白にキャプション）
    const PANEL_W = 480;
    const PANEL_H = 200;
    const GAP = 12;
    const TITLE_H = 56;
    const PAD_LEFT = 20;
    const PAD_TOP = 10;
    const CAPTION_W = 130;
    const PAD_BOTTOM = 16;

    canvas.width = PAD_LEFT + PANEL_W + 16 + CAPTION_W + 16;
    canvas.height = TITLE_H + PAD_TOP + 4 * PANEL_H + 3 * GAP + PAD_BOTTOM;
    const W = canvas.width;
    const H = canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 背景
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, W, H);

    // 外枠
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // タイトルバー
    ctx.fillStyle = '#eeeeee';
    ctx.fillRect(1, 1, W - 2, TITLE_H);
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(1, TITLE_H + 1); ctx.lineTo(W - 1, TITLE_H + 1); ctx.stroke();
    ctx.font = 'bold 22px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif';
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.fillText(selectedStory?.title || '4コマ漫画', W / 2, TITLE_H - 14);
    ctx.textAlign = 'left';

    // テキスト折り返しヘルパー
    function wrapText(text: string, maxW: number, fontSize: number): string[] {
      ctx!.font = `${fontSize}px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
      const lines: string[] = [];
      let line = '';
      for (const ch of text) {
        const test = line + ch;
        if (ctx!.measureText(test).width > maxW && line.length > 0) {
          lines.push(line); line = ch;
        } else { line = test; }
      }
      if (line) lines.push(line);
      return lines;
    }

    // 楕円吹き出し（セリフ折り返し対応）
    function drawBubble(cx2: number, cy2: number, bw: number, bh: number, text: string, spike: boolean) {
      const ctx2 = ctx!;
      ctx2.save();
      if (spike) {
        // ギザギザ
        const r1 = bh * 0.45, r2 = bh * 0.6, spikes = 14;
        ctx2.fillStyle = '#ffffff';
        ctx2.strokeStyle = '#333333';
        ctx2.lineWidth = 1.8;
        ctx2.beginPath();
        for (let s = 0; s < spikes * 2; s++) {
          const angle = (s / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const r = s % 2 === 0 ? r2 : r1;
          const px = cx2 + Math.cos(angle) * r * (bw / bh);
          const py = cy2 + Math.sin(angle) * r;
          s === 0 ? ctx2.moveTo(px, py) : ctx2.lineTo(px, py);
        }
        ctx2.closePath(); ctx2.fill(); ctx2.stroke();
      } else {
        // 楕円
        ctx2.fillStyle = '#ffffff';
        ctx2.strokeStyle = '#333333';
        ctx2.lineWidth = 1.8;
        ctx2.beginPath();
        ctx2.ellipse(cx2, cy2, bw / 2, bh / 2, 0, 0, Math.PI * 2);
        ctx2.fill(); ctx2.stroke();
        // しっぽ
        ctx2.fillStyle = '#ffffff';
        ctx2.beginPath();
        ctx2.moveTo(cx2 - bw * 0.2, cy2 + bh * 0.4);
        ctx2.lineTo(cx2 - bw * 0.35, cy2 + bh * 0.7);
        ctx2.lineTo(cx2 + bw * 0.05, cy2 + bh * 0.42);
        ctx2.fill();
        ctx2.strokeStyle = '#333333'; ctx2.lineWidth = 1.5;
        ctx2.beginPath();
        ctx2.moveTo(cx2 - bw * 0.2, cy2 + bh * 0.4);
        ctx2.lineTo(cx2 - bw * 0.35, cy2 + bh * 0.7);
        ctx2.lineTo(cx2 + bw * 0.05, cy2 + bh * 0.42);
        ctx2.stroke();
      }

      // セリフ（折り返し）
      const fontSize = 14;
      const maxTW = bw - 24;
      const lines = wrapText(text, maxTW, fontSize);
      const lineH = fontSize * 1.4;
      const totalH = lines.length * lineH;
      const startY = cy2 - totalH / 2 + fontSize * 0.5;
      ctx2.font = `bold ${fontSize}px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
      ctx2.fillStyle = '#111111';
      ctx2.textAlign = 'center';
      lines.forEach((line, li) => {
        ctx2.fillText(line, cx2, startY + li * lineH);
      });
      ctx2.textAlign = 'left';
      ctx2.restore();
    }

    // キャプション（右外側）
    function drawCaption(panelY: number, ph: number, text: string) {
      const cx2 = PAD_LEFT + PANEL_W + 16;
      const cw = CAPTION_W;
      ctx!.fillStyle = '#ffffff';
      ctx!.strokeStyle = '#aaaaaa';
      ctx!.lineWidth = 1;
      ctx!.fillRect(cx2, panelY + 4, cw, 26);
      ctx!.strokeRect(cx2, panelY + 4, cw, 26);
      const fontSize = 11;
      const lines = wrapText(text, cw - 10, fontSize);
      ctx!.font = `${fontSize}px "Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
      ctx!.fillStyle = '#555555';
      lines.slice(0, 3).forEach((line, li) => {
        ctx!.fillText(line, cx2 + 5, panelY + 18 + li * 14);
      });
    }

    // 各コマ描画
    const panelX = PAD_LEFT;
    for (let i = 0; i < 4; i++) {
      const panelY = TITLE_H + PAD_TOP + i * (PANEL_H + GAP);

      // コマ枠
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(panelX, panelY, PANEL_W, PANEL_H);
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX, panelY, PANEL_W, PANEL_H);

      // コマ番号（左上）
      ctx.fillStyle = '#333333';
      ctx.fillRect(panelX, panelY, 26, 22);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${i + 1}`, panelX + 7, panelY + 15);

      // セリフ吹き出し
      const p = selectedStory?.panels[i];
      const dialogue = p?.dialogue || (lang === 'ar' ? 'الحوار هنا' : lang === 'en' ? 'Dialogue here' : 'セリフ');
      const scene = p?.scene || (lang === 'ar' ? 'المشهد هنا' : lang === 'en' ? 'Scene here' : '場面');
      const isSpike = i === 2; // 3コマ目はギザギザ
      const bw = 200, bh = 80;
      const bx = panelX + PANEL_W - bw / 2 - 20;
      const by = panelY + (isSpike ? PANEL_H - bh / 2 - 20 : bh / 2 + 16);
      drawBubble(bx, by, bw, bh, dialogue, isSpike);

      // キャプション（右外側）
      drawCaption(panelY, PANEL_H, scene);
    }

    // クレジット
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#cccccc';
    ctx.textAlign = 'right';
    ctx.fillText('TERRAKOYA', W - 6, H - 5);
    ctx.textAlign = 'left';

    const link = document.createElement('a');
    link.download = '4koma_template.png';
    link.href = canvas.toDataURL('image/png');
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
                  {({'ar':'ارسم هنا!','en':'Draw here!','ja':'ここに描こう！','zh':'在这里画！','hi':'यहाँ बनाएं!','vi':'Vẽ ở đây!','es':'¡Dibuja aquí!'}[lang as string] || 'Draw here!')}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-3">💡 {t.tips}</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>・{({'ar':'ارسم تعبيرات واضحة','en':'Draw clear expressions','ja':'キャラクターの表情をしっかり描こう','zh':'画出清晰的表情','hi':'स्पष्ट भाव-भंगिमा बनाएं','vi':'Vẽ biểu cảm rõ ràng','es':'Dibuja expresiones claras'}[lang as string] || 'Draw clear expressions')}</li>
              <li>・{lang==='ar'?'اكتب الحوار في بالونات الكلام':lang==='en'?'Write dialogue in speech bubbles':'セリフは吹き出しの中に書こう'}</li>
              <li>・{({'ar':'ارسم خلفية بسيطة','en':'Add a simple background','ja':'背景も簡単でいいから描いてみよう','zh':'画个简单的背景','hi':'सरल पृष्ठभूमि जोड़ें','vi':'Thêm nền đơn giản','es':'Añade un fondo simple'}[lang as string] || 'Add a simple background')}</li>
              <li>・{lang==='ar'?'النهاية المضحكة مهمة!':lang==='en'?'The punchline in panel 4 matters!':'4コマ目のオチが大事！'}</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button onClick={downloadTemplate} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold transition flex-1">
              {t.download}
            </button>
            <label className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition flex-1 text-center cursor-pointer">
              📤 {tr('manga4.submit')}
              <input type="file" accept="image/*" className="hidden" onChange={handleMangaSubmit} />
            </label>
          </div>
          {submitMsg && (
            <div className={`mt-4 p-4 rounded-xl text-sm ${
              submitMsg.startsWith('✅__')
                ? 'bg-purple-900/50 border border-purple-700'
                : submitMsg.startsWith('❌')
                ? 'bg-red-900/50 border border-red-700 text-red-300'
                : 'bg-gray-800 border border-gray-700 text-gray-300'
            }`}>
              {submitMsg.startsWith('✅__') ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">AI</div>
                    <p className="text-purple-300 font-medium text-xs">AI講師のフィードバック</p>
                  </div>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{submitMsg.replace('✅__', '')}</p>
                  <p className="text-gray-500 text-xs mt-3">✅ 提出完了 · 採点はコースの課題ページから</p>
                </div>
              ) : (
                <p>{submitMsg}</p>
              )}
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
                  {({'ar':(th as any).labelAr,'en':(th as any).labelEn,'zh':(th as any).labelZh,'hi':(th as any).labelHi,'vi':(th as any).labelVi,'es':(th as any).labelEs} as Record<string,string>)[lang] || (th as any).labelJa}
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
              {({'ar':'٣ قصص مقترحة','en':'🎲 3 Story Ideas','ja':'🎲 3つのストーリー案','zh':'🎲 3个故事方案','hi':'🎲 3 कहानी विचार','vi':'🎲 3 ý tưởng câu chuyện','es':'🎲 3 ideas de historia'}[lang as string] || '🎲 3 Story Ideas')}
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