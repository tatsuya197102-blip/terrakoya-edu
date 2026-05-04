'use client';
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ANIMATIONS = [
  { id: 'walk', labelJa: '🚶 歩く', labelAr: '🚶 يمشي', frames: 8 },
  { id: 'jump', labelJa: '🤸 ジャンプ', labelAr: '🤸 يقفز', frames: 6 },
  { id: 'wave', labelJa: '👋 手を振る', labelAr: '👋 يلوح', frames: 6 },
  { id: 'dance', labelJa: '💃 踊る', labelAr: '💃 يرقص', frames: 8 },
  { id: 'bounce', labelJa: '⚽ はねる', labelAr: '⚽ يرتد', frames: 6 },
];

export default function AutoAnimatePage() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState('');
  const [animType, setAnimType] = useState('walk');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(100);
  const frameRef = useRef(0);
  const animRef = useRef<number>(0);

  const t = {
    title: lang === 'ar' ? 'صانع الرسوم المتحركة القصيرة' : 'ショートアニメメーカー',
    sub: lang === 'ar' ? 'حرّك رسمتك!' : 'きみの絵を動かそう！',
    upload: lang === 'ar' ? 'ارفع رسمتك' : 'キャラクターの絵をアップロード',
    selectAnim: lang === 'ar' ? 'اختر نوع الحركة' : 'アニメーションを選ぼう',
    play: lang === 'ar' ? '▶️ تشغيل' : '▶️ 再生',
    stop: lang === 'ar' ? '⏹️ إيقاف' : '⏹️ 停止',
    speed: lang === 'ar' ? 'السرعة' : 'スピード',
    slow: lang === 'ar' ? 'بطيء' : 'ゆっくり',
    fast: lang === 'ar' ? 'سريع' : 'はやい',
    download: lang === 'ar' ? '📥 تحميل' : '📥 ダウンロード',
    tip1: lang === 'ar' ? 'ارسم شخصيتك على ورق أبيض' : '白い紙にキャラクターを描こう',
    tip2: lang === 'ar' ? 'التقط صورة واضحة' : 'はっきり写真を撮ろう',
    tip3: lang === 'ar' ? 'اختر حركة وشاهد شخصيتك تتحرك!' : 'アニメーションを選んで動かそう！',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = ev.target?.result as string;
        setPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const anim = ANIMATIONS.find(a => a.id === animType);
    if (!anim) return;

    const frame = frameRef.current % anim.frames;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f0f4ff';
    ctx.fillRect(0, 0, w, h);

    const imgW = 150;
    const imgH = (image.height / image.width) * imgW;
    let x = w / 2 - imgW / 2;
    let y = h / 2 - imgH / 2;
    let scaleX = 1;
    let scaleY = 1;
    let rotation = 0;

    switch (animType) {
      case 'walk':
        x = (frame / anim.frames) * (w - imgW);
        y = h / 2 - imgH / 2 + Math.sin(frame * Math.PI / 2) * 10;
        scaleX = frame < anim.frames / 2 ? 1 : -1;
        break;
      case 'jump':
        const jumpHeight = Math.sin(frame / anim.frames * Math.PI) * 100;
        y = h / 2 - imgH / 2 - jumpHeight;
        scaleY = 1 + Math.sin(frame / anim.frames * Math.PI) * 0.1;
        break;
      case 'wave':
        rotation = Math.sin(frame * Math.PI / 3) * 0.15;
        break;
      case 'dance':
        x = w / 2 - imgW / 2 + Math.sin(frame * Math.PI / 2) * 30;
        rotation = Math.sin(frame * Math.PI / 2) * 0.1;
        scaleX = frame % 2 === 0 ? 1 : -1;
        break;
      case 'bounce':
        const bounceH = Math.abs(Math.sin(frame / anim.frames * Math.PI * 2)) * 80;
        y = h / 2 - imgH / 2 - bounceH;
        scaleY = 1 - Math.abs(Math.sin(frame / anim.frames * Math.PI * 2)) * 0.15;
        scaleX = 1 + Math.abs(Math.sin(frame / anim.frames * Math.PI * 2)) * 0.1;
        break;
    }

    ctx.save();
    ctx.translate(x + imgW / 2, y + imgH / 2);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(image, -imgW / 2, -imgH / 2, imgW, imgH);
    ctx.restore();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('TERRAKOYA Animation', 10, h - 10);

    frameRef.current++;
  };

  useEffect(() => {
    if (!playing || !image) return;
    const interval = setInterval(animate, speed);
    return () => clearInterval(interval);
  }, [playing, image, animType, speed]);

  const handlePlay = () => {
    frameRef.current = 0;
    setPlaying(true);
  };

  const handleStop = () => {
    setPlaying(false);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'terrakoya_animation.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-r from-green-900 via-teal-900 to-blue-900 py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-green-300 text-sm tracking-widest mb-4">TERRAKOYA ANIMATOR</p>
          <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-gray-300 text-lg">{t.sub}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">{t.upload}</h2>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white" />
              {preview && (
                <div className="mt-4">
                  <img src={preview} alt="Preview" className="max-h-48 rounded-lg border border-slate-700 mx-auto" />
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">{t.selectAnim}</h2>
              <div className="grid grid-cols-2 gap-3">
                {ANIMATIONS.map(anim => (
                  <button key={anim.id} onClick={() => setAnimType(anim.id)} className={`p-4 rounded-xl text-center transition ${animType === anim.id ? 'bg-blue-600 text-white border-2 border-blue-400' : 'bg-slate-800 text-gray-300 hover:bg-slate-700 border-2 border-transparent'}`}>
                    {lang === 'ar' ? anim.labelAr : anim.labelJa}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">{t.speed}</h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">{t.slow}</span>
                <input type="range" min="30" max="200" value={200 - speed + 30} onChange={(e) => setSpeed(200 - parseInt(e.target.value) + 30)} className="flex-1" />
                <span className="text-sm text-gray-400">{t.fast}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={playing ? handleStop : handlePlay} disabled={!image} className={`flex-1 px-6 py-3 rounded-xl font-bold transition ${playing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}>
                {playing ? t.stop : t.play}
              </button>
              <button onClick={handleDownload} disabled={!image} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-xl font-bold transition">
                {t.download}
              </button>
            </div>
          </div>

          <div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">{lang === 'ar' ? 'معاينة' : 'プレビュー'}</h2>
              <canvas ref={canvasRef} width={400} height={400} className="w-full rounded-xl border border-slate-700 bg-slate-100" />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">
              <h3 className="text-lg font-bold mb-3">💡 {lang === 'ar' ? 'نصائح' : 'やり方'}</h3>
              <div className="space-y-2 text-gray-300 text-sm">
                <p>1️⃣ {t.tip1}</p>
                <p>2️⃣ {t.tip2}</p>
                <p>3️⃣ {t.tip3}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}