"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

/*
 * 寺子屋ペイント (TERRAKOYA Paint) - Phase 2 / v0.9
 * 配置先: src/app/paint/page.tsx
 *
 * ■ 追加: ぬりえテンプレ（線画下絵）。テンプレ選択で「下絵」レイヤー(上)＋「色ぬり」レイヤー(下/アクティブ)を生成。
 *   線画は常に上に残るので塗っても消えない。Firestore/ルール不要・ペイント単体で完結。
 * ■ 維持: 週替わりお題バナー / dev二重マウント対応 / Storage不使用投稿 / 多言語・RTL
 * ■ 追加(レイアウト v2): モバイル(幅<820px)はキャンバス主役の縦レイアウト。
 *   ツールは上部横1行。ぬりえ/ブラシ/カラー/レイヤーは下からの開閉式ドロワー(初期は閉)。
 *   キャンバスは ResizeObserver でエリアのサイズに自動フィット(幅・高さ両方)。ロジックは不変。
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

type Lang = "ja" | "en" | "ar";
type Tool = "pen" | "pencil" | "air" | "eraser" | "fill";

const C = {
  bg: "#070B16", panel: "#0E1628", card: "#141C30", card2: "#1B2540",
  border: "#243048", blue: "#3B82F6", blueDark: "#2563EB",
  text: "#E7ECF5", muted: "#94A3B8", amber: "#F59E0B",
};

const T: Record<Lang, Record<string, string>> = {
  ja: { title: "ペイント", trial: "試作 v0.9",
    pen: "ペン", pencil: "鉛筆", air: "エアブラシ", eraser: "消しゴム", fill: "塗りつぶし",
    undo: "戻す", redo: "やり直し", brush: "ブラシ", size: "太さ", opacity: "濃さ",
    stab: "手ブレ補正", color: "カラー", layers: "レイヤー", add: "＋追加", del: "削除",
    clear: "クリア", save: "PNG保存", publish: "投稿", layerOpacity: "不透明度", layer: "レイヤー",
    pubHeading: "🖼️ ギャラリーに投稿", titleLabel: "タイトル", titlePh: "作品のなまえ",
    confirm: "公開して投稿", cancel: "キャンセル", publishing: "投稿中…",
    loginNeeded: "投稿するにはログインが必要です", published: "ギャラリーに投稿しました！",
    pubFail: "投稿に失敗しました", timeout: "通信がタイムアウトしました（権限/接続を確認）",
    untitled: "むだいの作品", viewGallery: "ギャラリーを見る", themeLabel: "今週のお題",
    nurie: "ぬりえ", nurieConfirm: "今の絵は消えます。このぬりえを読みこみますか？",
    colorLayer: "色ぬり", outlineLayer: "下絵", sendAnimate: "アニメにする",
    timelapse: "タイムラプス", close: "とじる", noFrames: "先に絵を描いてね",
    saveGif: "GIF保存", savingGif: "作成中…", send4koma: "4コマに送る",
    tools: "どうぐ" },
  en: { title: "Paint", trial: "preview v0.9",
    pen: "Pen", pencil: "Pencil", air: "Airbrush", eraser: "Eraser", fill: "Fill",
    undo: "Undo", redo: "Redo", brush: "Brush", size: "Size", opacity: "Opacity",
    stab: "Stabilizer", color: "Color", layers: "Layers", add: "+ Add", del: "Delete",
    clear: "Clear", save: "Save PNG", publish: "Post", layerOpacity: "Opacity", layer: "Layer",
    pubHeading: "🖼️ Post to Gallery", titleLabel: "Title", titlePh: "Name your artwork",
    confirm: "Publish", cancel: "Cancel", publishing: "Posting…",
    loginNeeded: "Please log in to post", published: "Posted to the gallery!",
    pubFail: "Posting failed", timeout: "Request timed out (check rules/connection)",
    untitled: "Untitled", viewGallery: "View gallery", themeLabel: "This week's theme",
    nurie: "Coloring", nurieConfirm: "Your current drawing will be cleared. Load this template?",
    colorLayer: "Color", outlineLayer: "Outline", sendAnimate: "Animate",
    timelapse: "Timelapse", close: "Close", noFrames: "Draw something first",
    saveGif: "Save GIF", savingGif: "Creating…", send4koma: "To 4-Koma",
    tools: "Tools" },
  ar: { title: "الرسم", trial: "إصدار تجريبي 0.9",
    pen: "قلم", pencil: "رصاص", air: "رذاذ", eraser: "ممحاة", fill: "تعبئة",
    undo: "تراجع", redo: "إعادة", brush: "فرشاة", size: "الحجم", opacity: "الكثافة",
    stab: "مثبّت الخط", color: "اللون", layers: "الطبقات", add: "+ إضافة", del: "حذف",
    clear: "مسح", save: "حفظ PNG", publish: "نشر", layerOpacity: "الشفافية", layer: "طبقة",
    pubHeading: "🖼️ النشر في المعرض", titleLabel: "العنوان", titlePh: "سمِّ عملك",
    confirm: "نشر", cancel: "إلغاء", publishing: "جارٍ النشر…",
    loginNeeded: "يرجى تسجيل الدخول للنشر", published: "تم النشر في المعرض!",
    pubFail: "فشل النشر", timeout: "انتهت مهلة الاتصال (تحقق من الصلاحيات/الاتصال)",
    untitled: "بدون عنوان", viewGallery: "عرض المعرض", themeLabel: "موضوع الأسبوع",
    nurie: "تلوين", nurieConfirm: "سيتم مسح رسمك الحالي. هل تريد تحميل هذا القالب؟",
    colorLayer: "تلوين", outlineLayer: "الخطوط", sendAnimate: "حرّكها",
    timelapse: "تسريع", close: "إغلاق", noFrames: "ارسم شيئاً أولاً",
    saveGif: "حفظ GIF", savingGif: "جارٍ الإنشاء…", send4koma: "إلى الكوميك",
    tools: "أدوات" },
};

const W = 900, H = 1273, UNDO_LIMIT = 10; // H=W*297/210 ≒ A4縦比率
const PALETTE = ["#1a1a1a", "#ffffff", "#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa", "#6d4c41", "#FF6B1A"];

// ぬりえテンプレ（オリジナル線画。900x1200座標に描画）
type Tpl = { id: string; icon: string; label: Record<Lang, string>; draw: (o: CanvasRenderingContext2D) => void };
const TEMPLATES: Tpl[] = [
  {
    id: "cat", icon: "🐈", label: { ja: "ねこ", en: "Cat", ar: "قطة" },
    draw: (o) => {
      o.beginPath(); o.ellipse(450, 820, 200, 240, 0, 0, 6.283); o.stroke();
      o.beginPath(); o.ellipse(450, 440, 185, 160, 0, 0, 6.283); o.stroke();
      o.beginPath(); o.moveTo(335, 340); o.lineTo(300, 185); o.lineTo(450, 300); o.stroke();
      o.beginPath(); o.moveTo(565, 340); o.lineTo(600, 185); o.lineTo(450, 300); o.stroke();
      o.beginPath(); o.ellipse(390, 430, 22, 30, 0, 0, 6.283); o.stroke();
      o.beginPath(); o.ellipse(510, 430, 22, 30, 0, 0, 6.283); o.stroke();
      o.beginPath(); o.moveTo(450, 470); o.lineTo(432, 492); o.lineTo(468, 492); o.closePath(); o.stroke();
      o.beginPath(); o.moveTo(295, 470); o.lineTo(405, 478); o.moveTo(295, 505); o.lineTo(405, 500); o.stroke();
      o.beginPath(); o.moveTo(605, 470); o.lineTo(495, 478); o.moveTo(605, 505); o.lineTo(495, 500); o.stroke();
      o.beginPath(); o.moveTo(645, 940); o.quadraticCurveTo(780, 840, 700, 640); o.stroke();
    },
  },
  {
    id: "camel", icon: "🐪", label: { ja: "ラクダ", en: "Camel", ar: "جمل" },
    draw: (o) => {
      o.beginPath(); o.ellipse(440, 680, 240, 120, 0, 0, 6.283); o.stroke();
      o.beginPath(); o.moveTo(290, 600); o.quadraticCurveTo(350, 430, 440, 595); o.stroke();
      o.beginPath(); o.moveTo(440, 595); o.quadraticCurveTo(530, 430, 600, 600); o.stroke();
      o.beginPath(); o.moveTo(640, 640); o.quadraticCurveTo(730, 540, 720, 410); o.stroke();
      o.beginPath(); o.moveTo(690, 660); o.quadraticCurveTo(705, 560, 700, 440); o.stroke();
      o.beginPath(); o.ellipse(725, 400, 58, 42, -0.3, 0, 6.283); o.stroke();
      o.beginPath(); o.arc(745, 385, 8, 0, 6.283); o.stroke();
      [320, 420, 520, 600].forEach((x) => { o.beginPath(); o.moveTo(x, 780); o.lineTo(x, 960); o.stroke(); });
    },
  },
  {
    id: "fish", icon: "🐟", label: { ja: "さかな", en: "Fish", ar: "سمكة" },
    draw: (o) => {
      o.beginPath(); o.ellipse(420, 600, 250, 150, 0, 0, 6.283); o.stroke();
      o.beginPath(); o.moveTo(655, 600); o.lineTo(800, 470); o.lineTo(800, 730); o.closePath(); o.stroke();
      o.beginPath(); o.arc(285, 560, 26, 0, 6.283); o.stroke();
      o.beginPath(); o.moveTo(420, 455); o.quadraticCurveTo(470, 390, 540, 470); o.stroke();
      o.beginPath(); o.moveTo(400, 745); o.quadraticCurveTo(460, 810, 540, 735); o.stroke();
      o.beginPath(); o.moveTo(330, 495); o.quadraticCurveTo(365, 600, 330, 705); o.stroke();
    },
  },
  {
    id: "flower", icon: "🌸", label: { ja: "はな", en: "Flower", ar: "زهرة" },
    draw: (o) => {
      const cx = 450, cy = 440;
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; o.beginPath(); o.ellipse(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150, 75, 48, a, 0, 6.283); o.stroke(); }
      o.beginPath(); o.arc(cx, cy, 80, 0, 6.283); o.stroke();
      o.beginPath(); o.moveTo(cx, cy + 210); o.lineTo(cx, 1060); o.stroke();
      o.beginPath(); o.ellipse(cx - 95, 820, 95, 42, -0.5, 0, 6.283); o.stroke();
      o.beginPath(); o.ellipse(cx + 95, 940, 95, 42, 0.5, 0, 6.283); o.stroke();
    },
  },
  {
    id: "butterfly", icon: "🦋", label: { ja: "ちょう", en: "Butterfly", ar: "فراشة" },
    draw: (o) => {
      const cx = 450, cy = 580;
      o.beginPath(); o.ellipse(cx, cy, 20, 170, 0, 0, 6.283); o.stroke();
      o.beginPath(); o.moveTo(cx - 10, cy - 165); o.quadraticCurveTo(cx - 70, cy - 290, cx - 100, cy - 270);
      o.moveTo(cx + 10, cy - 165); o.quadraticCurveTo(cx + 70, cy - 290, cx + 100, cy - 270); o.stroke();
      o.beginPath(); o.ellipse(cx - 155, cy - 70, 145, 115, -0.3, 0, 6.283); o.stroke();
      o.beginPath(); o.ellipse(cx + 155, cy - 70, 145, 115, 0.3, 0, 6.283); o.stroke();
      o.beginPath(); o.ellipse(cx - 135, cy + 160, 115, 92, 0.3, 0, 6.283); o.stroke();
      o.beginPath(); o.ellipse(cx + 135, cy + 160, 115, 92, -0.3, 0, 6.283); o.stroke();
    },
  },
  {
    id: "house", icon: "🏠", label: { ja: "いえ", en: "House", ar: "منزل" },
    draw: (o) => {
      o.strokeRect(280, 560, 420, 420);
      o.beginPath(); o.moveTo(245, 560); o.lineTo(490, 350); o.lineTo(735, 560); o.closePath(); o.stroke();
      o.strokeRect(430, 780, 130, 200);
      o.strokeRect(320, 620, 120, 120);
      o.beginPath(); o.moveTo(380, 620); o.lineTo(380, 740); o.moveTo(320, 680); o.lineTo(440, 680); o.stroke();
    },
  },
  {
    id: "car", icon: "🚗", label: { ja: "くるま", en: "Car", ar: "سيارة" },
    draw: (o) => {
      o.strokeRect(175, 650, 560, 150);
      o.beginPath(); o.moveTo(295, 650); o.lineTo(360, 540); o.lineTo(600, 540); o.lineTo(650, 650); o.stroke();
      o.beginPath(); o.moveTo(480, 540); o.lineTo(480, 650); o.stroke();
      o.beginPath(); o.arc(300, 810, 62, 0, 6.283); o.stroke();
      o.beginPath(); o.arc(615, 810, 62, 0, 6.283); o.stroke();
    },
  },
];

interface Layer { id: number; name: string; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; visible: boolean; opacity: number; }
interface PanelLayer { id: number; name: string; visible: boolean; opacity: number; }
interface Theme { ja?: string; en?: string; ar?: string; active?: boolean; }

// 投稿用JPEG Blob（長辺1000pxに縮小）。base64をFirestoreに入れる方式は廃止し、Storageにアップする。
function toJpegBlob(src: HTMLCanvasElement): Promise<Blob> {
  const maxSide = 1000;
  const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
  const w = Math.round(src.width * scale), h = Math.round(src.height * scale);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.85));
}

export default function PaintPage() {
  const [lang, setLang] = useState<Lang>("ja");
  const t = T[lang];
  const rtl = lang === "ar";

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#1a1a1a");
  const [size, setSize] = useState(14);
  const [opacity, setOpacity] = useState(100);
  const [stab, setStab] = useState(40);
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<PanelLayer[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [msg, setMsg] = useState("");
  const [availH, setAvailH] = useState<number | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [savingGif, setSavingGif] = useState(false);

  const [showPublish, setShowPublish] = useState(false);
  const [title, setTitle] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [posted, setPosted] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const replayRef = useRef<HTMLCanvasElement | null>(null);
  const eng = useRef<any>({ layers: [] as Layer[], activeIndex: 0, seq: 0, drawing: false });
  const set = useRef<any>({ tool: "pen", color: "#1a1a1a", size: 14, opacity: 1, stab: 0.4 });

  useEffect(() => { set.current = { tool, color, size, opacity: opacity / 100, stab: stab / 100 }; }, [tool, color, size, opacity, stab]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "theme"));
        if (snap.exists()) setTheme(snap.data() as Theme);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const themeTitle = theme && theme.active ? (theme[lang] || theme.ja || "") : "";

  useEffect(() => {
    const measure = () => {
      const el = rootRef.current; if (!el) return;
      const top = el.getBoundingClientRect().top;
      setAvailH(Math.max(360, window.innerHeight - top));
      setIsNarrow(window.innerWidth < 820);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    const id = setTimeout(measure, 250);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("orientationchange", measure); clearTimeout(id); };
  }, []);

  // キャンバスを表示エリアに自動フィット（幅・高さ両方）。ResizeObserver でエリアのサイズ変化に追従。
  // → ドロワー開閉・回転・URLバー出入りでも常にエリア内に収まる。
  useEffect(() => {
    const wrap = canvasAreaRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      const narrow = window.innerWidth < 820;
      const z = narrow
        ? Math.min(1, (w - 12) / W)                  // モバイル: 横幅いっぱい優先（縦は必要ならスクロール）
        : Math.min(1, (w - 16) / W, (h - 16) / H);   // PC: 全体が収まる
      if (z > 0.02) setZoom(z);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const id = setTimeout(fit, 120);
    return () => { ro.disconnect(); clearTimeout(id); };
  }, []);

  const syncPanel = useCallback(() => {
    const e = eng.current;
    setPanel(e.layers.map((L: Layer) => ({ id: L.id, name: L.name, visible: L.visible, opacity: L.opacity })));
    setActiveIndex(e.activeIndex);
  }, []);

  const rebuildStage = useCallback(() => {
    const stage = stageRef.current; const e = eng.current;
    if (!stage || !e.overlay) return;
    stage.innerHTML = "";
    e.layers.forEach((L: Layer, i: number) => {
      L.canvas.style.zIndex = String(i);
      L.canvas.style.display = L.visible ? "block" : "none";
      L.canvas.style.opacity = String(L.opacity);
      stage.appendChild(L.canvas);
    });
    stage.appendChild(e.overlay);
  }, []);

  const makeLayer = useCallback((): Layer => {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    c.style.position = "absolute"; c.style.left = "0"; c.style.top = "0"; c.style.touchAction = "none";
    const ctx = c.getContext("2d")!;
    const id = ++eng.current.seq;
    return { id, name: `${T[lang].layer} ${id}`, canvas: c, ctx, visible: true, opacity: 1 };
  }, [lang]);

  // ぬりえ読み込み: [色ぬり(下/アクティブ), 下絵(上)]
  const loadTemplate = useCallback((tpl: Tpl) => {
    const e = eng.current;
    if (!e.overlay) return;
    if (!window.confirm(T[lang].nurieConfirm)) return;
    const colorLayer = makeLayer(); colorLayer.name = T[lang].colorLayer;
    const outline = makeLayer(); outline.name = T[lang].outlineLayer;
    const o = outline.ctx;
    o.strokeStyle = "#222"; o.lineWidth = 5; o.lineJoin = "round"; o.lineCap = "round";
    tpl.draw(o);
    e.layers = [colorLayer, outline];
    e.activeIndex = 0;
    e.undo = []; e.redo = []; e.frames = [];
    rebuildStage(); syncPanel();
    eng.current.api?.recordFrame?.();
    if (isNarrow) setPanelOpen(false); // ぬりえを選んだら閉じてキャンバスを広く
  }, [lang, makeLayer, rebuildStage, syncPanel, isNarrow]);

  useEffect(() => {
    const e = eng.current;

    if (!e.overlay) {
      const ov = document.createElement("canvas");
      ov.width = W; ov.height = H;
      ov.style.position = "absolute"; ov.style.left = "0"; ov.style.top = "0";
      ov.style.zIndex = "9999"; ov.style.touchAction = "none";
      e.overlay = ov; e.octx = ov.getContext("2d")!;
      e.layers = [makeLayer()]; e.activeIndex = 0; e.undo = []; e.redo = []; e.frames = [];
    }
    const overlay: HTMLCanvasElement = e.overlay;

    rebuildStage();
    syncPanel();

    const pt = (ev: PointerEvent) => {
      const r = overlay.getBoundingClientRect();
      return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H, p: ev.pressure && ev.pointerType !== "mouse" ? ev.pressure : 0.5 };
    };
    const active = (): Layer => e.layers[e.activeIndex];
    const strokeWidth = (p: number) => { const s = set.current; if (s.tool === "pencil") return Math.max(0.5, s.size * (0.15 + 0.85 * p)); return Math.max(0.5, s.size * (0.4 + 0.6 * p)); };
    const pushUndo = () => { const L = active(); e.undo.push({ i: e.activeIndex, data: L.ctx.getImageData(0, 0, W, H) }); if (e.undo.length > UNDO_LIMIT) e.undo.shift(); e.redo = []; };
    const hexToRgb = (h: string) => ({ r: parseInt(h.substr(1, 2), 16), g: parseInt(h.substr(3, 2), 16), b: parseInt(h.substr(5, 2), 16) });
    const floodFill = (sx0: number, sy0: number) => {
      pushUndo();
      const ctx = active().ctx; const img = ctx.getImageData(0, 0, W, H); const d = img.data;
      const sx = Math.round(sx0), sy = Math.round(sy0);
      const idx = (x: number, y: number) => (y * W + x) * 4;
      const s = idx(sx, sy); const tr = d[s], tg = d[s + 1], tb = d[s + 2], ta = d[s + 3];
      const col = hexToRgb(set.current.color); const tol = 40;
      const matchPx = (i: number) => Math.abs(d[i] - tr) <= tol && Math.abs(d[i + 1] - tg) <= tol && Math.abs(d[i + 2] - tb) <= tol && Math.abs(d[i + 3] - ta) <= tol;
      if (matchPx(s) && col.r === tr && col.g === tg && col.b === tb && ta === 255) return;
      const stack: number[][] = [[sx, sy]];
      while (stack.length) {
        const cur = stack.pop()!; const x = cur[0], y = cur[1];
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = idx(x, y); if (!matchPx(i)) continue;
        d[i] = col.r; d[i + 1] = col.g; d[i + 2] = col.b; d[i + 3] = 255;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      ctx.putImageData(img, 0, 0); recordFrame(); syncPanel();
    };

    const recordFrame = () => {
      const sc = 0.3, w = Math.round(W * sc), h = Math.round(H * sc);
      const tmp = document.createElement("canvas"); tmp.width = w; tmp.height = h;
      const tc = tmp.getContext("2d")!;
      tc.fillStyle = "#fff"; tc.fillRect(0, 0, w, h);
      e.layers.forEach((L: Layer) => { if (L.visible) { tc.globalAlpha = L.opacity; tc.drawImage(L.canvas, 0, 0, w, h); } });
      if (!e.frames) e.frames = [];
      e.frames.push(tmp.toDataURL("image/jpeg", 0.6));
      if (e.frames.length > 240) e.frames.shift();
    };

    e.api = {
      undo: () => { if (!e.undo.length) return; const sN = e.undo.pop(); const L = e.layers[sN.i]; e.redo.push({ i: sN.i, data: L.ctx.getImageData(0, 0, W, H) }); L.ctx.putImageData(sN.data, 0, 0); syncPanel(); },
      redo: () => { if (!e.redo.length) return; const sN = e.redo.pop(); const L = e.layers[sN.i]; e.undo.push({ i: sN.i, data: L.ctx.getImageData(0, 0, W, H) }); L.ctx.putImageData(sN.data, 0, 0); syncPanel(); },
      clearActive: () => { pushUndo(); active().ctx.clearRect(0, 0, W, H); recordFrame(); syncPanel(); },
      recordFrame: () => recordFrame(),
      resetFrames: () => { e.frames = []; },
      addLayer: () => { e.layers.splice(e.activeIndex + 1, 0, makeLayer()); e.activeIndex++; rebuildStage(); syncPanel(); },
      delLayer: () => { if (e.layers.length <= 1) return; e.layers.splice(e.activeIndex, 1); e.activeIndex = Math.max(0, e.activeIndex - 1); rebuildStage(); syncPanel(); },
      up: () => { if (e.activeIndex >= e.layers.length - 1) return; const a = e.layers; [a[e.activeIndex], a[e.activeIndex + 1]] = [a[e.activeIndex + 1], a[e.activeIndex]]; e.activeIndex++; rebuildStage(); syncPanel(); },
      down: () => { if (e.activeIndex <= 0) return; const a = e.layers; [a[e.activeIndex], a[e.activeIndex - 1]] = [a[e.activeIndex - 1], a[e.activeIndex]]; e.activeIndex--; rebuildStage(); syncPanel(); },
      selectLayer: (i: number) => { e.activeIndex = i; syncPanel(); },
      toggleVisible: (i: number) => { e.layers[i].visible = !e.layers[i].visible; rebuildStage(); syncPanel(); },
      setLayerOpacity: (v: number) => { active().opacity = v; rebuildStage(); },
      flatten: (): HTMLCanvasElement => {
        const out = document.createElement("canvas"); out.width = W; out.height = H;
        const o = out.getContext("2d")!; o.fillStyle = "#fff"; o.fillRect(0, 0, W, H);
        e.layers.forEach((L: Layer) => { if (L.visible) { o.globalAlpha = L.opacity; o.drawImage(L.canvas, 0, 0); } });
        return out;
      },
    };

    const onDown = (ev: PointerEvent) => {
      ev.preventDefault(); overlay.setPointerCapture(ev.pointerId);
      const c = pt(ev); const s = set.current;
      if (s.tool === "fill") { floodFill(c.x, c.y); return; }
      e.drawing = true; e.smx = c.x; e.smy = c.y; e.lastx = c.x; e.lasty = c.y; e.lastp = c.p;
      pushUndo();
      if (s.tool === "eraser") {
        const ctx = active().ctx; ctx.save(); ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath(); ctx.arc(c.x, c.y, strokeWidth(c.p) / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else {
        const o = e.octx as CanvasRenderingContext2D; o.clearRect(0, 0, W, H);
        o.lineCap = "round"; o.lineJoin = "round"; o.strokeStyle = s.color; o.fillStyle = s.color;
      }
    };
    const onMove = (ev: PointerEvent) => {
      if (!e.drawing) return; ev.preventDefault();
      const evs: PointerEvent[] = (ev as any).getCoalescedEvents ? (ev as any).getCoalescedEvents() : [ev];
      const s = set.current;
      for (const one of evs) {
        const c = pt(one); const k = 1 - s.stab * 0.92;
        e.smx += (c.x - e.smx) * k; e.smy += (c.y - e.smy) * k;
        const p = e.lastp + (c.p - e.lastp) * 0.5;
        if (s.tool === "eraser") {
          const ctx = active().ctx; ctx.save(); ctx.globalCompositeOperation = "destination-out";
          ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = strokeWidth(p);
          ctx.beginPath(); ctx.moveTo(e.lastx, e.lasty); ctx.lineTo(e.smx, e.smy); ctx.stroke(); ctx.restore();
        } else if (s.tool === "air") {
          const o = e.octx as CanvasRenderingContext2D; const r = s.size * 0.6, n = Math.round(s.size * 0.5) + 4;
          o.globalAlpha = 0.06;
          for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, dd = Math.random() * r; o.beginPath(); o.arc(e.smx + Math.cos(a) * dd, e.smy + Math.sin(a) * dd, s.size * 0.06 + 0.5, 0, 6.28); o.fill(); }
          o.globalAlpha = 1;
        } else {
          const o = e.octx as CanvasRenderingContext2D; o.lineWidth = strokeWidth(p);
          o.beginPath(); o.moveTo(e.lastx, e.lasty); o.lineTo(e.smx, e.smy); o.stroke();
        }
        e.lastx = e.smx; e.lasty = e.smy; e.lastp = p;
      }
    };
    const onUp = () => {
      if (!e.drawing) return; e.drawing = false; const s = set.current;
      if (s.tool !== "eraser") {
        const ctx = active().ctx; ctx.save(); ctx.globalAlpha = s.opacity; ctx.drawImage(e.overlay, 0, 0); ctx.restore();
        (e.octx as CanvasRenderingContext2D).clearRect(0, 0, W, H);
      }
      recordFrame();
      syncPanel();
    };

    overlay.addEventListener("pointerdown", onDown);
    overlay.addEventListener("pointermove", onMove);
    overlay.addEventListener("pointerup", onUp);
    overlay.addEventListener("pointercancel", onUp);
    overlay.addEventListener("pointerleave", onUp);

    return () => {
      overlay.removeEventListener("pointerdown", onDown);
      overlay.removeEventListener("pointermove", onMove);
      overlay.removeEventListener("pointerup", onUp);
      overlay.removeEventListener("pointercancel", onUp);
      overlay.removeEventListener("pointerleave", onUp);
    };
  }, []);

  const openReplay = () => {
    if (!eng.current.frames || eng.current.frames.length < 2) { showToast(t.noFrames); return; }
    setReplaying(false);
    setTimeout(() => setReplaying(true), 30);
  };

  const saveGif = async () => {
    const frames: string[] = eng.current.frames || [];
    if (frames.length < 2) { showToast(t.noFrames); return; }
    setSavingGif(true);
    try {
      const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
      const gw = 270, gh = 360;
      const cv = document.createElement("canvas"); cv.width = gw; cv.height = gh;
      const ctx = cv.getContext("2d")!;
      // フレームが多すぎる場合は最大150に間引き
      let list = frames;
      if (list.length > 150) {
        const step = list.length / 150;
        const picked: string[] = [];
        for (let i = 0; i < 150; i++) picked.push(list[Math.floor(i * step)]);
        picked.push(list[list.length - 1]);
        list = picked;
      }
      const enc = GIFEncoder();
      for (const src of list) {
        const img = await new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, gw, gh);
        ctx.drawImage(img, 0, 0, gw, gh);
        const { data } = ctx.getImageData(0, 0, gw, gh);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        enc.writeFrame(index, gw, gh, { palette, delay: 80 });
      }
      enc.finish();
      const blob = new Blob([enc.bytes()], { type: "image/gif" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "terrakoya-timelapse.gif";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (err: any) {
      console.error(err);
      showToast(`${t.pubFail}: ${err?.message || ""}`);
    } finally {
      setSavingGif(false);
    }
  };

  useEffect(() => {
    if (!replaying) return;
    const frames: string[] = eng.current.frames || [];
    const cv = replayRef.current; if (!cv || frames.length === 0) return;
    const ctx = cv.getContext("2d")!;
    const imgs = frames.map((src) => { const im = new Image(); im.src = src; return im; });
    let i = 0; let timer: any;
    const step = () => {
      const im = imgs[Math.min(i, imgs.length - 1)];
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
      if (im && im.complete) ctx.drawImage(im, 0, 0, cv.width, cv.height);
      if (i < imgs.length - 1) { i++; timer = setTimeout(step, 1000 / 18); }
    };
    const start = setTimeout(step, 250);
    return () => { clearTimeout(timer); clearTimeout(start); };
  }, [replaying]);

  const exportPng = () => {
    const out = eng.current.api.flatten() as HTMLCanvasElement;
    out.toBlob((b: Blob | null) => { if (!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "terrakoya-paint.png"; a.click(); });
  };

  const showToast = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 5000); };

  const openPublish = () => {
    if (!auth?.currentUser) { showToast(t.loginNeeded); return; }
    setPosted(false);
    setShowPublish(true);
  };

  const doPublish = async () => {
    const user = auth?.currentUser;
    if (!user) { showToast(t.loginNeeded); setShowPublish(false); return; }
    setPublishing(true);
    try {
      const out = eng.current.api.flatten() as HTMLCanvasElement;
      // Storageへアップロード → FirestoreにはURLのみ保存（読み取りコスト削減）
      const blob = await toJpegBlob(out);
      const path = `submissions/${user.uid}/${Date.now()}.jpg`;
      const sref = storageRef(storage, path);
      await Promise.race([
        uploadBytes(sref, blob, { contentType: "image/jpeg" }),
        new Promise((_, rej) => setTimeout(() => rej(new Error(t.timeout)), 30000)),
      ]);
      const imageUrl = await getDownloadURL(sref);
      const themeSnapshot = theme && theme.active
        ? { ja: theme.ja || "", en: theme.en || "", ar: theme.ar || "" }
        : null;
      const write = addDoc(collection(db, "submissions"), {
        title: title.trim() || t.untitled,
        imageUrl,
        storagePath: path,
        studentId: user.uid,
        studentName: user.displayName || "名無し",
        isPublic: true,
        likes: [],
        source: "paint",
        theme: themeSnapshot,
        createdAt: serverTimestamp(),
      });
      await Promise.race([
        write,
        new Promise((_, rej) => setTimeout(() => rej(new Error(t.timeout)), 20000)),
      ]);
      setPosted(true);
      setShowPublish(false);
      setTitle("");
      showToast(t.published);
    } catch (err: any) {
      console.error(err);
      showToast(`${t.pubFail}: ${err?.code || err?.message || ""}`);
    } finally {
      setPublishing(false);
    }
  };

  const tools: { k: Tool; icon: string }[] = [
    { k: "pen", icon: "✒️" }, { k: "pencil", icon: "✏️" }, { k: "air", icon: "🌫️" },
    { k: "eraser", icon: "🩹" }, { k: "fill", icon: "🪣" },
  ];

  return (
    <div ref={rootRef} dir={rtl ? "rtl" : "ltr"}
      style={{ height: availH ? `${availH}px` : "calc(100dvh - 56px)", boxSizing: "border-box", padding: 12, color: C.text, fontFamily: "-apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif" }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: C.panel, borderBottom: `1px solid ${C.border}`, flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 14 }}>🎨 <span style={{ color: C.blue }}>{t.title}</span></span>
          <span style={{ color: C.muted, fontSize: 11 }}>{t.trial}</span>
          <div style={{ flex: 1 }} />
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} style={pill}>
            <option value="ja">JP</option><option value="en">EN</option><option value="ar">AR</option>
          </select>
          <button style={btn} onClick={() => setZoom((z) => Math.max(0.05, z - 0.15))}>－</button>
          <button style={btn} onClick={() => setZoom((z) => Math.min(3, z + 0.15))}>＋</button>
          <button style={btn} title={t.timelapse} onClick={openReplay}>▶</button>
          <button style={btn} onClick={() => eng.current.api.clearActive()}>{t.clear}</button>
          <button style={btn} onClick={openPublish}>📤 {t.publish}</button>
          <button style={btnPrimary} onClick={exportPng}>⬇ {t.save}</button>
        </div>

        {themeTitle && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(245,158,11,.12)", borderBottom: `1px solid ${C.border}`, flexShrink: 0, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>🎯</span>
            <span style={{ color: C.amber, fontWeight: 700 }}>{t.themeLabel}：</span>
            <span style={{ color: C.text, fontWeight: 700 }}>{themeTitle}</span>
          </div>
        )}

        <main style={{ flex: 1, display: "flex", flexDirection: isNarrow ? "column" : "row", minHeight: 0, minWidth: 0 }}>
          {/* ツール（PC=左縦 / モバイル=上横1行） */}
          <div style={{
            flex: "0 0 auto",
            width: isNarrow ? "100%" : 70,
            boxSizing: "border-box",
            background: C.panel,
            borderInlineEnd: isNarrow ? "none" : `1px solid ${C.border}`,
            borderBottom: isNarrow ? `1px solid ${C.border}` : "none",
            display: "flex",
            flexDirection: isNarrow ? "row" : "column",
            alignItems: "center",
            gap: 8,
            padding: isNarrow ? "8px 10px" : "12px 0",
            overflowX: isNarrow ? "auto" : "visible",
          }}>
            {tools.map((tl) => (<div key={tl.k} title={t[tl.k]} onClick={() => setTool(tl.k)} style={toolStyle(tool === tl.k)}>{tl.icon}</div>))}
            <div style={{ flex: 1 }} />
            <div title={t.undo} onClick={() => eng.current.api.undo()} style={toolStyle(false)}>↩️</div>
            <div title={t.redo} onClick={() => eng.current.api.redo()} style={toolStyle(false)}>↪️</div>
          </div>

          {/* キャンバス（主役。flex:1 で残り全部を取る） */}
          <div ref={canvasAreaRef} style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", alignItems: isNarrow ? "flex-start" : "center", justifyContent: "center", overflow: "auto", background: C.bg, position: "relative", padding: isNarrow ? 6 : 8 }}>
            <div style={{ position: "relative", width: W * zoom, height: H * zoom, flexShrink: 0, background: "#fff", borderRadius: 4, boxShadow: "0 12px 48px rgba(0,0,0,.5)" }}>
              <div ref={stageRef} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, transform: `scale(${zoom})`, transformOrigin: "top left" }} />
            </div>
            {msg && <div style={{ position: "absolute", bottom: 18, background: C.blue, color: "#fff", padding: "10px 16px", borderRadius: 12, fontSize: 13, maxWidth: "80%", textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,.4)" }}>{msg}{posted && <a href="/gallery" style={{ color: "#fff", textDecoration: "underline", marginInlineStart: 8 }}>{t.viewGallery}</a>}</div>}
          </div>

          {/* 設定パネル（PC=右側固定 / モバイル=下からの開閉ドロワー、初期は閉） */}
          <div style={{
            flex: "0 0 auto",
            width: isNarrow ? "100%" : 240,
            boxSizing: "border-box",
            background: C.panel,
            borderInlineStart: isNarrow ? "none" : `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}>
            {isNarrow && (
              <button onClick={() => setPanelOpen((o) => !o)}
                style={{ ...btn, width: "100%", borderRadius: 0, border: "none", borderTop: `1px solid ${C.border}`, padding: "12px", fontWeight: 700, fontSize: 13, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {panelOpen ? `▼ ${t.close}` : `🎨 ${t.nurie}・${t.color}・${t.brush}・${t.layers} ▲`}
              </button>
            )}
            <div style={{
              overflow: "auto",
              padding: isNarrow && !panelOpen ? 0 : 12,
              maxHeight: isNarrow ? (panelOpen ? "52vh" : 0) : "none",
              flex: isNarrow ? "0 0 auto" : "1 1 auto",
              transition: "max-height .2s ease",
            }}>
              <div style={card}>
                <h4 style={h4}>🖌️ {t.brush}</h4>
                <Row label={t.size}><input type="range" min={1} max={120} value={size} onChange={(e) => setSize(+e.target.value)} style={range} /><span style={val}>{size}</span></Row>
                <Row label={t.opacity}><input type="range" min={5} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} style={range} /><span style={val}>{opacity}</span></Row>
                <Row label={t.stab}><input type="range" min={0} max={90} value={stab} onChange={(e) => setStab(+e.target.value)} style={range} /><span style={val}>{stab}</span></Row>
              </div>
              <div style={card}>
                <h4 style={h4}>🎨 {t.color}</h4>
                <Row label=""><input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 40, height: 32, border: `1px solid ${C.border}`, borderRadius: 8, background: "none" }} /><span style={{ color: C.text }}>{color}</span></Row>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {PALETTE.map((c) => <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: 7, border: "1px solid #0006", background: c, cursor: "pointer" }} />)}
                </div>
              </div>
              <div style={card}>
                <h4 style={h4}>🗂️ {t.layers}</h4>
                {[...panel.keys()].reverse().map((i) => {
                  const L = panel[i];
                  return (
                    <div key={L.id} onClick={() => eng.current.api.selectLayer(i)} style={{ display: "flex", alignItems: "center", gap: 8, background: C.card2, border: `1px solid ${i === activeIndex ? C.blue : C.border}`, borderRadius: 10, padding: "7px 9px", marginBottom: 6, fontSize: 12, cursor: "pointer" }}>
                      <span onClick={(ev) => { ev.stopPropagation(); eng.current.api.toggleVisible(i); }} style={{ cursor: "pointer" }}>{L.visible ? "👁️" : "🚫"}</span>
                      <span style={{ flex: 1 }}>{L.name}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button style={btnSm} onClick={() => eng.current.api.addLayer()}>{t.add}</button>
                  <button style={btnSm} onClick={() => eng.current.api.up()}>▲</button>
                  <button style={btnSm} onClick={() => eng.current.api.down()}>▼</button>
                  <button style={btnSm} onClick={() => eng.current.api.delLayer()}>{t.del}</button>
                </div>
                <Row label={t.layerOpacity}><input type="range" min={0} max={100} defaultValue={100} onChange={(e) => eng.current.api.setLayerOpacity(+e.target.value / 100)} style={range} /></Row>
              </div>
              {/* ぬりえ（最後に配置） */}
              <div style={card}>
                <h4 style={h4}>🖼️ {t.nurie}</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {TEMPLATES.map((tp) => (
                    <button key={tp.id} onClick={() => loadTemplate(tp)}
                      style={{ ...btn, flex: "0 0 calc(50% - 3px)", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 4px", fontSize: 12 }}>
                      <span style={{ fontSize: 16 }}>{tp.icon}</span><span>{tp.label[lang]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>

        {replaying && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 200, gap: 14 }}>
            <span style={{ color: C.amber, fontWeight: 800, fontSize: 14 }}>⏱️ {t.timelapse}</span>
            <canvas ref={replayRef} width={360} height={480} style={{ background: "#fff", borderRadius: 8, height: "62%", width: "auto", boxShadow: "0 12px 48px rgba(0,0,0,.6)" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btn} onClick={openReplay}>↻</button>
              <button style={btnPrimary} onClick={saveGif} disabled={savingGif}>{savingGif ? t.savingGif : `💾 ${t.saveGif}`}</button>
              <button style={btn} onClick={() => setReplaying(false)}>{t.close}</button>
            </div>
          </div>
        )}

        {showPublish && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
            <div style={{ width: 340, maxWidth: "90%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800 }}>{t.pubHeading}</h3>
              {themeTitle && (
                <p style={{ margin: "0 0 12px", fontSize: 12, color: C.amber }}>🎯 {t.themeLabel}：{themeTitle}</p>
              )}
              <label style={{ fontSize: 12, color: C.muted }}>{t.titleLabel}</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.titlePh} maxLength={40}
                style={{ width: "100%", boxSizing: "border-box", marginTop: 6, marginBottom: 16, padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card2, color: C.text, fontSize: 14 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowPublish(false)} disabled={publishing} style={{ ...btn, flex: 1 }}>{t.cancel}</button>
                <button onClick={doPublish} disabled={publishing} style={{ ...btnPrimary, flex: 1 }}>{publishing ? t.publishing : t.confirm}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0", fontSize: 12, color: C.muted }}><span style={{ minWidth: 64 }}>{label}</span>{children}</div>;
}

const btn: React.CSSProperties = { background: C.card2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: C.blue, borderColor: C.blue, color: "#fff", fontWeight: 700 };
const btnSm: React.CSSProperties = { ...btn, flex: 1, padding: 7, fontSize: 12 };
const pill: React.CSSProperties = { background: C.blueDark, color: "#fff", border: "none", borderRadius: 10, padding: "8px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer" };
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", marginBottom: 12 };
const h4: React.CSSProperties = { margin: "0 0 8px", fontSize: 12, color: C.muted, fontWeight: 700 };
const range: React.CSSProperties = { flex: 1, accentColor: C.blue };
const val: React.CSSProperties = { width: 38, textAlign: "end", color: C.text };
const toolStyle = (active: boolean): React.CSSProperties => ({ flex: "0 0 auto", width: 48, height: 48, borderRadius: 12, background: active ? C.blue : C.card2, border: `1px solid ${active ? C.blue : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", boxShadow: active ? "0 4px 12px rgba(59,130,246,.35)" : "none" });
