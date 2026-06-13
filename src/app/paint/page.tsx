"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

/*
 * 寺子屋ペイント (TERRAKOYA Paint) - Phase 1 / ClientWrapper継承版
 * 配置先: src/app/paint/page.tsx
 *
 * ■ ナビについて
 *   ルートの layout.tsx → <ClientWrapper> が全ページを包むため、上部ナビは自動で継承されます。
 *   よってこのページ自身はナビを描画しません（二重防止）。ペイント領域はナビ下の余白を自動計測して埋めます。
 *   「🎨 ペイント」メニュー項目は ClientWrapper 側のナビに追加が必要です（このページからは追加できません）。
 *   → client-wrapper.tsx とナビ本体を見せてもらえれば、メニュー追加も含めて仕上げます。
 *
 * ■ 言語: 暫定で右上にトグルを置いています。ClientWrapper の i18n を見せてもらい次第そちらへ連動。
 * ■ 投稿/いいね/スタンプ/定型コメント: 既存ギャラリー(Showcase)と認証を見せてもらってから配線。
 * ■ UTF-8のまま保存（PowerShellで貼り直さない）。
 */

import { useEffect, useRef, useState, useCallback } from "react";

type Lang = "ja" | "en" | "ar";
type Tool = "pen" | "pencil" | "air" | "eraser" | "fill";

const C = {
  bg: "#070B16", panel: "#0E1628", card: "#141C30", card2: "#1B2540",
  border: "#243048", blue: "#3B82F6", blueDark: "#2563EB",
  text: "#E7ECF5", muted: "#94A3B8",
};

const T: Record<Lang, Record<string, string>> = {
  ja: { title: "ペイント", trial: "試作 v0.4",
    pen: "ペン", pencil: "鉛筆", air: "エアブラシ", eraser: "消しゴム", fill: "塗りつぶし",
    undo: "戻す", redo: "やり直し", brush: "ブラシ", size: "太さ", opacity: "濃さ",
    stab: "手ブレ補正", color: "カラー", layers: "レイヤー", add: "＋追加", del: "削除",
    clear: "クリア", save: "PNG保存", publish: "投稿", layerOpacity: "不透明度", layer: "レイヤー",
    note: "ペン/鉛筆/エアブラシ・レイヤー・筆圧・手ブレ補正。スタイラスのペンでも描けます。",
    publishSoon: "投稿は既存ギャラリー（Showcase）に配線予定です。今はPNG保存をお使いください。" },
  en: { title: "Paint", trial: "preview v0.4",
    pen: "Pen", pencil: "Pencil", air: "Airbrush", eraser: "Eraser", fill: "Fill",
    undo: "Undo", redo: "Redo", brush: "Brush", size: "Size", opacity: "Opacity",
    stab: "Stabilizer", color: "Color", layers: "Layers", add: "+ Add", del: "Delete",
    clear: "Clear", save: "Save PNG", publish: "Post", layerOpacity: "Opacity", layer: "Layer",
    note: "Pen / Pencil / Airbrush, layers, pen pressure and stabilizer. Works with a stylus.",
    publishSoon: "Posting will be wired to the existing gallery (next step). Use Save PNG for now." },
  ar: { title: "الرسم", trial: "إصدار تجريبي 0.4",
    pen: "قلم", pencil: "رصاص", air: "رذاذ", eraser: "ممحاة", fill: "تعبئة",
    undo: "تراجع", redo: "إعادة", brush: "فرشاة", size: "الحجم", opacity: "الكثافة",
    stab: "مثبّت الخط", color: "اللون", layers: "الطبقات", add: "+ إضافة", del: "حذف",
    clear: "مسح", save: "حفظ PNG", publish: "نشر", layerOpacity: "الشفافية", layer: "طبقة",
    note: "قلم / رصاص / رذاذ، طبقات، ضغط القلم ومثبّت الخط. يعمل مع القلم الرقمي.",
    publishSoon: "سيتم ربط النشر بالمعرض الحالي (الخطوة التالية). استخدم حفظ PNG الآن." },
};

const W = 900, H = 1200, UNDO_LIMIT = 10;
const PALETTE = ["#1a1a1a", "#ffffff", "#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa", "#6d4c41", "#FF6B1A"];

interface Layer { id: number; name: string; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; visible: boolean; opacity: number; }
interface PanelLayer { id: number; name: string; visible: boolean; opacity: number; }

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

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const eng = useRef<any>({ layers: [] as Layer[], activeIndex: 0, seq: 0, drawing: false });
  const set = useRef<any>({ tool: "pen", color: "#1a1a1a", size: 14, opacity: 1, stab: 0.4 });

  useEffect(() => { set.current = { tool, color, size, opacity: opacity / 100, stab: stab / 100 }; }, [tool, color, size, opacity, stab]);

  // ナビ下の余白を自動計測（ナビ高さをベタ書きしない）
  useEffect(() => {
    const measure = () => {
      const el = rootRef.current; if (!el) return;
      const top = el.getBoundingClientRect().top;
      setAvailH(Math.max(360, window.innerHeight - top));
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    const id = setTimeout(measure, 250);
    return () => { window.removeEventListener("resize", measure); window.removeEventListener("orientationchange", measure); clearTimeout(id); };
  }, []);

  const syncPanel = useCallback(() => {
    const e = eng.current;
    setPanel(e.layers.map((L: Layer) => ({ id: L.id, name: L.name, visible: L.visible, opacity: L.opacity })));
    setActiveIndex(e.activeIndex);
  }, []);

  const rebuildStage = useCallback(() => {
    const stage = stageRef.current; const e = eng.current;
    if (!stage) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const e = eng.current;
    if (e.initialized) return;
    e.initialized = true;

    const overlay = document.createElement("canvas");
    overlay.width = W; overlay.height = H;
    overlay.style.position = "absolute"; overlay.style.left = "0"; overlay.style.top = "0";
    overlay.style.zIndex = "9999"; overlay.style.touchAction = "none";
    e.overlay = overlay; e.octx = overlay.getContext("2d")!;
    e.layers = [makeLayer()]; e.activeIndex = 0; e.undo = []; e.redo = [];
    rebuildStage(); syncPanel();

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
      const match = (i: number) => Math.abs(d[i] - tr) <= tol && Math.abs(d[i + 1] - tg) <= tol && Math.abs(d[i + 2] - tb) <= tol && Math.abs(d[i + 3] - ta) <= tol;
      if (match(s) && col.r === tr && col.g === tg && col.b === tb && ta === 255) return;
      const stack: number[][] = [[sx, sy]];
      while (stack.length) {
        const cur = stack.pop()!; const x = cur[0], y = cur[1];
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        const i = idx(x, y); if (!match(i)) continue;
        d[i] = col.r; d[i + 1] = col.g; d[i + 2] = col.b; d[i + 3] = 255;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      ctx.putImageData(img, 0, 0); syncPanel();
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
      syncPanel();
    };

    overlay.addEventListener("pointerdown", onDown);
    overlay.addEventListener("pointermove", onMove);
    overlay.addEventListener("pointerup", onUp);
    overlay.addEventListener("pointercancel", onUp);
    overlay.addEventListener("pointerleave", onUp);

    e.api = {
      undo: () => { if (!e.undo.length) return; const sN = e.undo.pop(); const L = e.layers[sN.i]; e.redo.push({ i: sN.i, data: L.ctx.getImageData(0, 0, W, H) }); L.ctx.putImageData(sN.data, 0, 0); syncPanel(); },
      redo: () => { if (!e.redo.length) return; const sN = e.redo.pop(); const L = e.layers[sN.i]; e.undo.push({ i: sN.i, data: L.ctx.getImageData(0, 0, W, H) }); L.ctx.putImageData(sN.data, 0, 0); syncPanel(); },
      clearActive: () => { pushUndo(); active().ctx.clearRect(0, 0, W, H); syncPanel(); },
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

    const wrapH = stageRef.current?.parentElement?.clientHeight || 0;
    if (wrapH) setZoom(Math.min(1, (wrapH - 40) / H));

    return () => {
      overlay.removeEventListener("pointerdown", onDown);
      overlay.removeEventListener("pointermove", onMove);
      overlay.removeEventListener("pointerup", onUp);
      overlay.removeEventListener("pointercancel", onUp);
      overlay.removeEventListener("pointerleave", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportPng = () => {
    const out = eng.current.api.flatten() as HTMLCanvasElement;
    out.toBlob((b) => { if (!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "terrakoya-paint.png"; a.click(); });
  };
  const publishToShowcase = async () => {
    // TODO: 既存のShowcase投稿関数に配線。
    setMsg(t.publishSoon); setTimeout(() => setMsg(""), 4000);
  };

  const tools: { k: Tool; icon: string }[] = [
    { k: "pen", icon: "✒️" }, { k: "pencil", icon: "✏️" }, { k: "air", icon: "🌫️" },
    { k: "eraser", icon: "🩹" }, { k: "fill", icon: "🪣" },
  ];

  return (
    <div ref={rootRef} dir={rtl ? "rtl" : "ltr"}
      style={{ height: availH ? `${availH}px` : "calc(100dvh - 56px)", boxSizing: "border-box", padding: 12, color: C.text, fontFamily: "-apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif" }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        {/* ペイント専用ツールバー */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: C.panel, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 14 }}>🎨 <span style={{ color: C.blue }}>{t.title}</span></span>
          <span style={{ color: C.muted, fontSize: 11 }}>{t.trial}</span>
          <div style={{ flex: 1 }} />
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} style={pill}>
            <option value="ja">JP</option><option value="en">EN</option><option value="ar">AR</option>
          </select>
          <button style={btn} onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}>－</button>
          <button style={btn} onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>＋</button>
          <button style={btn} onClick={() => eng.current.api.clearActive()}>{t.clear}</button>
          <button style={btn} onClick={publishToShowcase}>📤 {t.publish}</button>
          <button style={btnPrimary} onClick={exportPng}>⬇ {t.save}</button>
        </div>

        <main style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{ flex: "0 0 70px", background: C.panel, borderInlineEnd: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 0" }}>
            {tools.map((tl) => (<div key={tl.k} title={t[tl.k]} onClick={() => setTool(tl.k)} style={toolStyle(tool === tl.k)}>{tl.icon}</div>))}
            <div style={{ flex: 1 }} />
            <div title={t.undo} onClick={() => eng.current.api.undo()} style={toolStyle(false)}>↩️</div>
            <div title={t.redo} onClick={() => eng.current.api.redo()} style={toolStyle(false)}>↪️</div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", background: C.bg, position: "relative" }}>
            <div ref={stageRef} style={{ position: "relative", width: W, height: H, background: "#fff", transform: `scale(${zoom})`, transformOrigin: "center center", borderRadius: 4, boxShadow: "0 12px 48px rgba(0,0,0,.5)" }} />
            {msg && <div style={{ position: "absolute", bottom: 18, background: C.blue, color: "#fff", padding: "10px 16px", borderRadius: 12, fontSize: 13, maxWidth: "80%", textAlign: "center", boxShadow: "0 6px 20px rgba(0,0,0,.4)" }}>{msg}</div>}
          </div>

          <div style={{ flex: "0 0 240px", background: C.panel, borderInlineStart: `1px solid ${C.border}`, overflow: "auto", padding: 12 }}>
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
          </div>
        </main>
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
const toolStyle = (active: boolean): React.CSSProperties => ({ width: 48, height: 48, borderRadius: 12, background: active ? C.blue : C.card2, border: `1px solid ${active ? C.blue : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", boxShadow: active ? "0 4px 12px rgba(59,130,246,.35)" : "none" });
