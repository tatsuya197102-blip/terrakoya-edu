'use client';
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// ---- 骨格定義 ----
interface Joint { x: number; y: number }
interface Skeleton {
  head: Joint;
  neck: Joint;
  shoulder_l: Joint; shoulder_r: Joint;
  elbow_l: Joint;    elbow_r: Joint;
  wrist_l: Joint;    wrist_r: Joint;
  hip_l: Joint;      hip_r: Joint;
  knee_l: Joint;     knee_r: Joint;
  ankle_l: Joint;    ankle_r: Joint;
}

// ---- アニメーション定義（各フレームのジョイント角度オフセット） ----
type AnimFrame = Partial<Record<keyof Skeleton, { dx: number; dy: number }>>;

const ANIM_PRESETS: Record<string, { label: string; labelAr: string; frames: AnimFrame[] }> = {
  walk: {
    label: '🚶 歩く', labelAr: '🚶 مشي',
    frames: [
      { shoulder_l:{dx:-15,dy:0}, shoulder_r:{dx:15,dy:0}, elbow_l:{dx:-20,dy:10}, elbow_r:{dx:20,dy:10}, wrist_l:{dx:-25,dy:20}, wrist_r:{dx:25,dy:20}, hip_l:{dx:-5,dy:0}, hip_r:{dx:5,dy:0}, knee_l:{dx:-15,dy:30}, knee_r:{dx:10,dy:15}, ankle_l:{dx:-20,dy:55}, ankle_r:{dx:15,dy:50} },
      { shoulder_l:{dx:-10,dy:0}, shoulder_r:{dx:10,dy:0}, elbow_l:{dx:-15,dy:12}, elbow_r:{dx:15,dy:12}, wrist_l:{dx:-18,dy:22}, wrist_r:{dx:18,dy:22}, hip_l:{dx:-5,dy:0}, hip_r:{dx:5,dy:0}, knee_l:{dx:-8,dy:20}, knee_r:{dx:15,dy:25}, ankle_l:{dx:-10,dy:48}, ankle_r:{dx:20,dy:52} },
      { shoulder_l:{dx:15,dy:0}, shoulder_r:{dx:-15,dy:0}, elbow_l:{dx:20,dy:10}, elbow_r:{dx:-20,dy:10}, wrist_l:{dx:25,dy:20}, wrist_r:{dx:-25,dy:20}, hip_l:{dx:5,dy:0}, hip_r:{dx:-5,dy:0}, knee_l:{dx:10,dy:15}, knee_r:{dx:-15,dy:30}, ankle_l:{dx:15,dy:50}, ankle_r:{dx:-20,dy:55} },
      { shoulder_l:{dx:10,dy:0}, shoulder_r:{dx:-10,dy:0}, elbow_l:{dx:15,dy:12}, elbow_r:{dx:-15,dy:12}, wrist_l:{dx:18,dy:22}, wrist_r:{dx:-18,dy:22}, hip_l:{dx:5,dy:0}, hip_r:{dx:-5,dy:0}, knee_l:{dx:15,dy:25}, knee_r:{dx:-8,dy:20}, ankle_l:{dx:20,dy:52}, ankle_r:{dx:-10,dy:48} },
    ],
  },
  run: {
    label: '🏃 走る', labelAr: '🏃 جري',
    frames: [
      { shoulder_l:{dx:-25,dy:-5}, shoulder_r:{dx:20,dy:5}, elbow_l:{dx:-35,dy:5}, elbow_r:{dx:30,dy:15}, wrist_l:{dx:-40,dy:15}, wrist_r:{dx:35,dy:25}, hip_l:{dx:-8,dy:-3}, hip_r:{dx:8,dy:3}, knee_l:{dx:-25,dy:20}, knee_r:{dx:20,dy:35}, ankle_l:{dx:-30,dy:45}, ankle_r:{dx:25,dy:55} },
      { shoulder_l:{dx:20,dy:5}, shoulder_r:{dx:-25,dy:-5}, elbow_l:{dx:30,dy:15}, elbow_r:{dx:-35,dy:5}, wrist_l:{dx:35,dy:25}, wrist_r:{dx:-40,dy:15}, hip_l:{dx:8,dy:3}, hip_r:{dx:-8,dy:-3}, knee_l:{dx:20,dy:35}, knee_r:{dx:-25,dy:20}, ankle_l:{dx:25,dy:55}, ankle_r:{dx:-30,dy:45} },
    ],
  },
  jump: {
    label: '🤸 ジャンプ', labelAr: '🤸 قفز',
    frames: [
      { knee_l:{dx:-5,dy:10}, knee_r:{dx:5,dy:10}, ankle_l:{dx:-8,dy:25}, ankle_r:{dx:8,dy:25}, shoulder_l:{dx:-10,dy:5}, shoulder_r:{dx:10,dy:5} },
      { knee_l:{dx:-15,dy:25}, knee_r:{dx:15,dy:25}, ankle_l:{dx:-20,dy:50}, ankle_r:{dx:20,dy:50}, shoulder_l:{dx:-20,dy:-10}, shoulder_r:{dx:20,dy:-10}, elbow_l:{dx:-30,dy:-20}, elbow_r:{dx:30,dy:-20} },
      { knee_l:{dx:-5,dy:-10}, knee_r:{dx:5,dy:-10}, ankle_l:{dx:-5,dy:-5}, ankle_r:{dx:5,dy:-5}, shoulder_l:{dx:-30,dy:-20}, shoulder_r:{dx:30,dy:-20}, elbow_l:{dx:-45,dy:-35}, elbow_r:{dx:45,dy:-35}, wrist_l:{dx:-55,dy:-50}, wrist_r:{dx:55,dy:-50} },
      { knee_l:{dx:-10,dy:20}, knee_r:{dx:10,dy:20}, ankle_l:{dx:-12,dy:40}, ankle_r:{dx:12,dy:40}, shoulder_l:{dx:-15,dy:5}, shoulder_r:{dx:15,dy:5} },
    ],
  },
  wave: {
    label: '👋 手を振る', labelAr: '👋 تلويح',
    frames: [
      { shoulder_r:{dx:30,dy:-20}, elbow_r:{dx:25,dy:-40}, wrist_r:{dx:20,dy:-60} },
      { shoulder_r:{dx:35,dy:-25}, elbow_r:{dx:20,dy:-45}, wrist_r:{dx:10,dy:-65} },
      { shoulder_r:{dx:30,dy:-20}, elbow_r:{dx:30,dy:-38}, wrist_r:{dx:30,dy:-55} },
      { shoulder_r:{dx:35,dy:-25}, elbow_r:{dx:20,dy:-45}, wrist_r:{dx:10,dy:-65} },
    ],
  },
  dance: {
    label: '💃 踊る', labelAr: '💃 رقص',
    frames: [
      { shoulder_l:{dx:-30,dy:-15}, shoulder_r:{dx:30,dy:-15}, elbow_l:{dx:-45,dy:-25}, elbow_r:{dx:45,dy:-25}, wrist_l:{dx:-55,dy:-15}, wrist_r:{dx:55,dy:-15}, knee_l:{dx:-10,dy:15}, hip_l:{dx:-8,dy:-5} },
      { shoulder_l:{dx:-20,dy:-25}, shoulder_r:{dx:35,dy:-10}, elbow_l:{dx:-30,dy:-40}, elbow_r:{dx:50,dy:-20}, wrist_l:{dx:-20,dy:-55}, wrist_r:{dx:60,dy:-10}, knee_r:{dx:15,dy:15}, hip_r:{dx:8,dy:-5} },
      { shoulder_l:{dx:-35,dy:-10}, shoulder_r:{dx:20,dy:-25}, elbow_l:{dx:-50,dy:-20}, elbow_r:{dx:30,dy:-40}, wrist_l:{dx:-60,dy:-10}, wrist_r:{dx:20,dy:-55}, knee_l:{dx:-10,dy:15}, hip_l:{dx:-8,dy:-5} },
      { shoulder_l:{dx:-25,dy:-20}, shoulder_r:{dx:25,dy:-20}, elbow_l:{dx:-40,dy:-30}, elbow_r:{dx:40,dy:-30}, wrist_l:{dx:-50,dy:-20}, wrist_r:{dx:50,dy:-20}, knee_r:{dx:15,dy:15}, hip_r:{dx:8,dy:-5} },
    ],
  },
};

// ---- ベーススケルトン ----
function getBaseSkeleton(cx: number, cy: number): Skeleton {
  return {
    head:       { x: cx,      y: cy - 90 },
    neck:       { x: cx,      y: cy - 65 },
    shoulder_l: { x: cx - 35, y: cy - 55 },
    shoulder_r: { x: cx + 35, y: cy - 55 },
    elbow_l:    { x: cx - 45, y: cy - 20 },
    elbow_r:    { x: cx + 45, y: cy - 20 },
    wrist_l:    { x: cx - 50, y: cy + 15 },
    wrist_r:    { x: cx + 50, y: cy + 15 },
    hip_l:      { x: cx - 18, y: cy + 10 },
    hip_r:      { x: cx + 18, y: cy + 10 },
    knee_l:     { x: cx - 22, y: cy + 55 },
    knee_r:     { x: cx + 22, y: cy + 55 },
    ankle_l:    { x: cx - 22, y: cy + 100 },
    ankle_r:    { x: cx + 22, y: cy + 100 },
  };
}

function lerpSkeleton(base: Skeleton, frame: AnimFrame, t: number): Skeleton {
  const result = { ...base };
  for (const key of Object.keys(frame) as (keyof Skeleton)[]) {
    const offset = frame[key]!;
    result[key] = {
      x: base[key].x + offset.dx * t,
      y: base[key].y + offset.dy * t,
    };
  }
  return result;
}

function drawSkeleton(ctx: CanvasRenderingContext2D, sk: Skeleton, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const lines: [keyof Skeleton, keyof Skeleton][] = [
    ['head', 'neck'],
    ['neck', 'shoulder_l'], ['neck', 'shoulder_r'],
    ['shoulder_l', 'elbow_l'], ['elbow_l', 'wrist_l'],
    ['shoulder_r', 'elbow_r'], ['elbow_r', 'wrist_r'],
    ['neck', 'hip_l'], ['neck', 'hip_r'],
    ['hip_l', 'hip_r'],
    ['hip_l', 'knee_l'], ['knee_l', 'ankle_l'],
    ['hip_r', 'knee_r'], ['knee_r', 'ankle_r'],
  ];

  for (const [a, b] of lines) {
    ctx.beginPath();
    ctx.moveTo(sk[a].x, sk[a].y);
    ctx.lineTo(sk[b].x, sk[b].y);
    ctx.stroke();
  }

  // 頭（円）
  ctx.beginPath();
  ctx.arc(sk.head.x, sk.head.y, 18, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // 関節（丸）
  const joints: (keyof Skeleton)[] = ['shoulder_l','shoulder_r','elbow_l','elbow_r','hip_l','hip_r','knee_l','knee_r'];
  for (const j of joints) {
    ctx.beginPath();
    ctx.arc(sk[j].x, sk[j].y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export default function AutoAnimatePage() {
  const { i18n, t } = useTranslation();
  const lang = i18n.language;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animType, setAnimType] = useState('walk');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(120);
  const [color, setColor] = useState('#3b82f6');
  const [bgColor, setBgColor] = useState('#0f172a');
  const frameRef = useRef(0);
  const subFrameRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const COLORS = ['#3b82f6','#ef4444','#22c55e','#f59e0b','#a855f7','#ec4899','#000000'];
  const BG_COLORS = ['#0f172a','#ffffff','#fef3c7','#ecfdf5','#f0f9ff'];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2 + 20;

    // 背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // 地面
    ctx.strokeStyle = bgColor === '#ffffff' ? '#e2e8f0' : '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, cy + 108);
    ctx.lineTo(W - 20, cy + 108);
    ctx.stroke();

    const preset = ANIM_PRESETS[animType];
    const frames = preset.frames;
    const totalFrames = frames.length;
    const fi = frameRef.current % totalFrames;
    const nextFi = (fi + 1) % totalFrames;
    const t = subFrameRef.current / 8; // サブフレームで補間（0〜1）

    const base = getBaseSkeleton(cx, cy);
    const skA = lerpSkeleton(base, frames[fi], 1);
    const skB = lerpSkeleton(base, frames[nextFi], 1);

    // 2フレーム間の補間
    const sk: Skeleton = {} as Skeleton;
    for (const key of Object.keys(base) as (keyof Skeleton)[]) {
      sk[key] = {
        x: skA[key].x + (skB[key].x - skA[key].x) * t,
        y: skA[key].y + (skB[key].y - skA[key].y) * t,
      };
    }

    // 影
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 108, 35, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawSkeleton(ctx, sk, color);

    // ラベル
    ctx.fillStyle = bgColor === '#ffffff' ? '#94a3b8' : '#475569';
    ctx.font = '11px monospace';
    ctx.fillText('TERRAKOYA', 12, H - 12);

  }, [animType, color, bgColor]);

  useEffect(() => {
    draw();
  }, [animType, color, bgColor, draw]);

  useEffect(() => {
    if (!playing) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      subFrameRef.current++;
      if (subFrameRef.current >= 8) {
        subFrameRef.current = 0;
        frameRef.current++;
      }
      draw();
    }, speed / 8);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed, draw]);

  const handlePlay = () => { frameRef.current = 0; subFrameRef.current = 0; setPlaying(true); };
  const handleStop = () => setPlaying(false);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'terrakoya_stickfigure.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="bg-gradient-to-r from-green-900 via-teal-900 to-blue-900 py-10 px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto">
          <p className="text-green-400 text-xs tracking-widest mb-1">TERRAKOYA ANIMATOR</p>
          <h1 className="text-3xl font-bold">
            {t('animate.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t('animate.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* コントロールパネル */}
          <div className="lg:col-span-2 space-y-5">

            {/* アニメーション選択 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                {t('animate.selectAnim')}
              </h2>
              <div className="space-y-2">
                {Object.entries(ANIM_PRESETS).map(([id, anim]) => (
                  <button key={id} onClick={() => { setAnimType(id); frameRef.current = 0; subFrameRef.current = 0; }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      animType === id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}>
                    {lang === 'ar' ? anim.labelAr : anim.label}
                  </button>
                ))}
              </div>
            </div>

            {/* スピード */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                {t('animate.speed')}
              </h2>
              <input type="range" min="40" max="300" value={300 - speed + 40}
                onChange={e => setSpeed(300 - Number(e.target.value) + 40)}
                className="w-full accent-blue-500" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{t('animate.slow')}</span>
                <span>{t('animate.fast')}</span>
              </div>
            </div>

            {/* 色 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                {t('animate.color')}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ background: c }} />
                ))}
              </div>
              <h2 className="text-sm font-medium text-gray-400 mb-3 mt-4">
                {t('animate.bgColor')}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {BG_COLORS.map(c => (
                  <button key={c} onClick={() => setBgColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${bgColor === c ? 'border-blue-400 scale-110' : 'border-slate-600'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3">
              <button onClick={playing ? handleStop : handlePlay}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
                  playing ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}>
                {playing
                  ? (lang === 'ar' ? '⏹ إيقاف' : '⏹ 停止')
                  : (lang === 'ar' ? '▶ تشغيل' : '▶ 再生')}
              </button>
              <button onClick={handleDownload}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-3 rounded-xl text-sm transition-colors">
                📥
              </button>
            </div>
          </div>

          {/* キャンバス */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <canvas ref={canvasRef} width={480} height={400}
                className="w-full rounded-lg"
                style={{ background: bgColor }} />
            </div>

            {/* 説明 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mt-4">
              <p className="text-xs text-gray-400 font-medium mb-2">💡 {t('animate.howItWorks')}</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                {lang === 'ar'
                  ? 'يستخدم هيكل عظمي حقيقي مع 13 مفصلاً. كل حركة محسوبة رياضياً مع تنعيم بين الإطارات.'
                  : '13の関節をリグで接続した骨格システム。フレーム間を補間してなめらかに動かしています。アニメーションの12の原則（タイミング・スペーシング）を実装しています。'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
