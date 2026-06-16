"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

/**
 * まちがいさがし 20 — TERRAKOYA-edu 用プロトタイプ
 * ・全シーンを手続き的に自動生成（手描き素材ゼロ）＝ 費用ゼロ・無限拡張可
 * ・20段階：初級は差分3つ＆明確 → 達人は差分10・微差・大量デコイ・時間タイト
 * ・差分タイプ：色 / 大きさ / 追加 / 消去 / 移動 / 回転 / 反転 / 形 を段階解放
 * ・完全クライアント完結。"use client" を付ければ Next.js (/game-spot) に流用可
 */

// ---------- 生成ロジック（node で 20段階検証済み） ----------
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ASYM = new Set(["leaf", "fish", "moon", "arrow"]);
const PAIR = { circle: "hexagon", hexagon: "circle", square: "diamond", diamond: "square", heart: "drop", drop: "heart" };
const SPRITES = ["circle", "square", "triangle", "diamond", "star", "heart", "hexagon", "drop", "flower", "leaf", "fish", "moon", "balloon", "arrow"];
const DIFFS = [3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9, 9, 10];

function lvlParams(level) {
  const t = (level - 1) / 19;
  const nItems = Math.min(11 + level, 30);
  const nDiff = DIFFS[level - 1];
  const time = Math.round(50 + nItems * 1.4 + nDiff * 5);
  let types = ["color", "size", "remove", "add"];
  if (t >= 0.15) types = types.concat(["move", "rotate"]);
  if (t >= 0.45) types = types.concat(["flip", "shape"]);
  return { t, nItems, nDiff, time, types };
}

function makeLevel(level, attempt) {
  const { t, nItems, nDiff, time, types } = lvlParams(level);
  const rng = mulberry32(level * 9176 + attempt * 31 + 101);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const SIZ = 600;
  const cols = Math.max(3, Math.ceil(Math.sqrt(nItems * 1.8)));
  const cell = SIZ / cols;
  let cells = [];
  for (let r = 0; r < cols; r++) for (let c = 0; c < cols; c++) cells.push({ cx: c * cell + cell / 2, cy: r * cell + cell / 2 });
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[cells[i], cells[j]] = [cells[j], cells[i]]; }
  const used = cells.slice(0, nItems), empty = cells.slice(nItems);
  const disp = Math.max(46, Math.min(82, cell * 0.62));
  const pal = [8, 28, 45, 140, 170, 200, 260, 320, 350];
  const jit = cell * 0.18;
  const base = used.map((c) => ({
    type: pick(SPRITES), x: c.cx + (rng() - 0.5) * jit, y: c.cy + (rng() - 0.5) * jit,
    size: disp * (0.82 + rng() * 0.32), h: pick(pal) + Math.floor((rng() - 0.5) * 16), rot: 0, flip: false,
  }));
  const right = base.map((o) => ({ ...o }));
  const idxs = [...base.keys()];
  for (let i = idxs.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1));[idxs[i], idxs[j]] = [idxs[j], idxs[i]]; }
  const sC = lerp(150, 30, t), sS = lerp(1.7, 1.2, t), sM = lerp(46, 14, t), sR = lerp(75, 24, t);
  const diffs = []; let ai = 0, bi = 0;
  while (diffs.length < nDiff) {
    let type = pick(types);
    if (type === "add" && ai >= empty.length) type = "color";
    if (type === "add") {
      const c = empty[ai++];
      const it = { type: pick(SPRITES), x: c.cx + (rng() - 0.5) * jit, y: c.cy + (rng() - 0.5) * jit, size: disp * (0.82 + rng() * 0.32), h: pick(pal), rot: 0, flip: false };
      right.push(it); diffs.push({ x: it.x, y: it.y, r: it.size * 0.6 + 12, found: false }); continue;
    }
    if (bi >= idxs.length) break;
    const i = idxs[bi++]; const bt = base[i]; const it = right[i];
    let ty = type;
    if ((ty === "rotate" || ty === "flip") && bt.type === "circle") ty = "size";
    if (ty === "flip" && !ASYM.has(bt.type)) ty = "rotate";
    if (ty === "rotate" && bt.type === "circle") ty = "color";
    if (ty === "shape" && !PAIR[bt.type]) ty = "color";
    let center = { x: bt.x, y: bt.y };
    switch (ty) {
      case "color": it.h = bt.h + (rng() < 0.5 ? 1 : -1) * sC; break;
      case "size": it.size = rng() < 0.5 ? bt.size * sS : bt.size / sS; break;
      case "move": it.x = clamp(bt.x + (rng() < 0.5 ? 1 : -1) * sM, 30, SIZ - 30); it.y = clamp(bt.y + (rng() < 0.5 ? 1 : -1) * sM, 30, SIZ - 30); center = { x: (bt.x + it.x) / 2, y: (bt.y + it.y) / 2 }; break;
      case "rotate": it.rot = bt.rot + (rng() < 0.5 ? 1 : -1) * sR; break;
      case "flip": it.flip = !bt.flip; break;
      case "shape": it.type = PAIR[bt.type]; break;
      case "remove": right[i] = null; break;
      default: it.h = bt.h + sC;
    }
    diffs.push({ x: center.x, y: center.y, r: Math.max(bt.size, right[i] ? right[i].size : bt.size) * 0.6 + 14, found: false });
  }
  return { base, rightItems: right.filter(Boolean), diffs, time, nDiff, level };
}

// ---------- スプライト描画 ----------
const fill = (h) => `hsl(${(((h % 360) + 360) % 360)}, 72%, 57%)`;
function shape(type, f) {
  switch (type) {
    case "circle": return <circle r={42} fill={f} />;
    case "square": return <rect x={-40} y={-40} width={80} height={80} rx={9} fill={f} />;
    case "triangle": return <path d="M0,-46 L42,40 L-42,40 Z" fill={f} />;
    case "diamond": return <path d="M0,-46 L40,0 L0,46 L-40,0 Z" fill={f} />;
    case "star": return <path d="M0,-46 L13,-15 L45,-14 L19,7 L29,40 L0,20 L-29,40 L-19,7 L-45,-14 L-13,-15 Z" fill={f} />;
    case "heart": return <path d="M0,-22 C-8,-44 -46,-40 -46,-10 C-46,16 0,44 0,44 C0,44 46,16 46,-10 C46,-40 8,-44 0,-22 Z" fill={f} />;
    case "hexagon": return <path d="M0,-46 L40,-23 L40,23 L0,46 L-40,23 L-40,-23 Z" fill={f} />;
    case "drop": return <path d="M0,-46 C22,-12 36,6 36,20 A36,36 0 1 1 -36,20 C-36,6 -22,-12 0,-46 Z" fill={f} />;
    case "leaf": return <path d="M-38,38 C-38,-20 0,-46 40,-44 C42,-4 16,38 -38,38 Z" fill={f} />;
    case "fish": return <path d="M-44,0 C-30,-26 18,-26 34,0 C18,26 -30,26 -44,0 Z M34,0 L48,-16 L48,16 Z" fill={f} />;
    case "balloon": return <path d="M0,-44 C24,-44 28,-12 6,28 L0,40 L-6,28 C-28,-12 -24,-44 0,-44 Z" fill={f} />;
    case "arrow": return <path d="M-44,-12 L18,-12 L18,-30 L46,0 L18,30 L18,12 L-44,12 Z" fill={f} />;
    case "moon": return <path d="M2,-42 A42,42 0 1 1 2,42 A34,34 0 1 0 2,-42 Z" fill={f} fillRule="evenodd" />;
    case "flower": return (
      <g>
        {[[0, -30], [28, -9], [17, 24], [-17, 24], [-28, -9]].map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={17} fill={f} />
        ))}
        <circle r={13} fill="#FFF3D6" />
      </g>
    );
    default: return <circle r={42} fill={f} />;
  }
}
const Sprite = ({ it }) => (
  <g transform={`translate(${it.x} ${it.y}) rotate(${it.rot}) scale(${(it.flip ? -1 : 1) * it.size / 100} ${it.size / 100})`}>
    {shape(it.type, fill(it.h))}
  </g>
);

const band = (L) => (L <= 3 ? { n: "初級", c: "#1FB07A" } : L <= 9 ? { n: "中級", c: "#FF9F1A" } : L <= 15 ? { n: "上級", c: "#FF6B1A" } : { n: "達人", c: "#E23B5A" });
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function Panel({ items, diffs, found, wrongs, hint, side, onTap, label }) {
  return (
    <div style={{ flex: "1 1 280px", minWidth: 260 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#9C8B7A", letterSpacing: 1, marginBottom: 4, textAlign: "center" }}>{label}</div>
      <svg viewBox="0 0 600 600" onPointerDown={(e) => onTap(e, side)}
        style={{ width: "100%", aspectRatio: "1/1", display: "block", touchAction: "manipulation", background: "#FFFDF8", borderRadius: 16, border: "1px solid #EFE6D6", cursor: "pointer" }}>
        <defs>
          <pattern id="dot" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.1" fill="#F0E9DB" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="600" height="600" fill="url(#dot)" rx="16" />
        {items.map((it, i) => <Sprite key={i} it={it} />)}
        {diffs.map((d, i) => found[i] && (
          <g key={"f" + i} style={{ transformOrigin: `${d.x}px ${d.y}px`, animation: "stdPop .3s ease-out" }}>
            <circle cx={d.x} cy={d.y} r={Math.min(d.r, 50)} fill="rgba(31,176,122,.14)" stroke="#1FB07A" strokeWidth={6} />
          </g>
        ))}
        {hint && <circle cx={hint.x} cy={hint.y} r={42} fill="none" stroke="#FFC400" strokeWidth={7} style={{ animation: "stdPulse 1s ease-in-out infinite" }} />}
        {wrongs.filter((w) => w.side === side).map((w) => (
          <g key={w.id} stroke="#E23B5A" strokeWidth={9} strokeLinecap="round" style={{ animation: "stdFade .65s forwards" }}>
            <line x1={w.x - 16} y1={w.y - 16} x2={w.x + 16} y2={w.y + 16} />
            <line x1={w.x + 16} y1={w.y - 16} x2={w.x - 16} y2={w.y + 16} />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function SpotTheDifference() {
  const [level, setLevel] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const scene = useMemo(() => makeLevel(level, attempt), [level, attempt]);

  const [found, setFound] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [wrongs, setWrongs] = useState([]);
  const [hint, setHint] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stars, setStars] = useState(0);
  const timeRef = useRef(0);

  // 新しいシーンで初期化
  useEffect(() => {
    setFound(new Array(scene.diffs.length).fill(false));
    setTimeLeft(scene.time); timeRef.current = scene.time;
    setStatus("playing"); setWrongs([]); setHint(null); setHintsUsed(0); setStars(0);
  }, [scene]);

  // カウントダウン
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => setTimeLeft((tl) => { const n = Math.max(0, tl - 1); timeRef.current = n; return n; }), 1000);
    return () => clearInterval(id);
  }, [status, scene]);

  useEffect(() => { if (status === "playing" && timeLeft <= 0 && scene.time > 0) setStatus("lost"); }, [timeLeft, status, scene]);

  const foundCount = found.filter(Boolean).length;
  const b = band(level);

  const onTap = (e, side) => {
    if (status !== "playing") return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 600;
    const y = ((e.clientY - r.top) / r.height) * 600;
    let best = -1, bd = Infinity;
    scene.diffs.forEach((d, i) => {
      if (found[i]) return;
      const dist = Math.hypot(x - d.x, y - d.y);
      if (dist < d.r && dist < bd) { bd = dist; best = i; }
    });
    if (best >= 0) {
      const nf = found.slice(); nf[best] = true; setFound(nf);
      if (nf.every(Boolean)) {
        const ratio = timeRef.current / scene.time;
        setStars(ratio >= 0.5 && hintsUsed === 0 ? 3 : ratio >= 0.25 ? 2 : 1);
        setStatus("won");
      }
    } else {
      setTimeLeft((tl) => Math.max(0, tl - 4));
      const id = Date.now() + Math.random();
      setWrongs((w) => [...w, { id, x, y, side }]);
      setTimeout(() => setWrongs((w) => w.filter((o) => o.id !== id)), 650);
    }
  };

  const useHint = () => {
    if (status !== "playing") return;
    const un = scene.diffs.map((_, i) => i).filter((i) => !found[i]);
    if (!un.length) return;
    const d = scene.diffs[un[Math.floor(Math.random() * un.length)]];
    setHint({ x: d.x, y: d.y }); setHintsUsed((h) => h + 1);
    setTimeLeft((tl) => Math.max(0, tl - 12));
    setTimeout(() => setHint(null), 1400);
  };

  const retry = () => setAttempt((a) => a + 1);
  const next = () => { if (level < 20) { setLevel(level + 1); setAttempt((a) => a + 1); } };
  const jump = (L) => { setLevel(L); setAttempt((a) => a + 1); };

  return (
    <div style={{ fontFamily: '"Hiragino Maru Gothic ProN","Yu Gothic UI","Zen Maru Gothic",system-ui,sans-serif', background: "#F3EFE6", borderRadius: 24, padding: 16, maxWidth: 780, margin: "0 auto" }}>
      <style>{`
        @keyframes stdPop{0%{transform:scale(.2);opacity:0}60%{transform:scale(1.18)}100%{transform:scale(1);opacity:1}}
        @keyframes stdPulse{0%,100%{opacity:.35}50%{opacity:1}}
        @keyframes stdFade{0%{opacity:1}100%{opacity:0}}
        @keyframes stdRise{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        .std-btn{font-family:inherit;border:none;cursor:pointer;font-weight:800;border-radius:14px;padding:11px 16px;font-size:15px;transition:transform .08s,filter .15s;-webkit-tap-highlight-color:transparent}
        .std-btn:active{transform:translateY(2px)}
        .std-lv{font-family:inherit;border:none;cursor:pointer;font-weight:800;font-size:13px;border-radius:10px;min-width:34px;height:34px;transition:transform .08s}
        .std-lv:active{transform:scale(.92)}
        @media (prefers-reduced-motion:reduce){*{animation:none!important}}
      `}</style>

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: b.c, color: "#fff", fontWeight: 900, fontSize: 13, padding: "4px 12px", borderRadius: 999 }}>{b.n}</span>
          <span style={{ fontWeight: 900, fontSize: 20, color: "#3A2E26" }}>LEVEL {level}</span>
        </div>
        <div style={{ flex: 1 }} />
        {/* 差分カウンター */}
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {Array.from({ length: scene.nDiff }).map((_, i) => (
            <span key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: i < foundCount ? "#1FB07A" : "#DCD2C2", transition: "background .2s" }} />
          ))}
          <span style={{ fontWeight: 800, color: "#6B5C4D", fontSize: 14, marginLeft: 4 }}>{foundCount}/{scene.nDiff}</span>
        </div>
        {/* タイマー */}
        <div style={{ fontWeight: 900, fontVariantNumeric: "tabular-nums", fontSize: 22, color: timeLeft <= 10 ? "#E23B5A" : "#3A2E26", minWidth: 64, textAlign: "right" }}>
          ⏱ {fmt(timeLeft)}
        </div>
      </div>

      {/* パネル */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Panel items={scene.base} diffs={scene.diffs} found={found} wrongs={wrongs} hint={hint} side="L" onTap={onTap} label="ひだり" />
          <Panel items={scene.rightItems} diffs={scene.diffs} found={found} wrongs={wrongs} hint={hint} side="R" onTap={onTap} label="みぎ" />
        </div>

        {/* 結果オーバーレイ */}
        {status !== "playing" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 22, padding: "26px 30px", textAlign: "center", boxShadow: "0 14px 40px rgba(80,60,30,.28)", animation: "stdRise .25s ease-out", maxWidth: 340 }}>
              {status === "won" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 6 }}>
                    {[0, 1, 2].map((i) => <span key={i} style={{ fontSize: 46, filter: i < stars ? "none" : "grayscale(1)", opacity: i < stars ? 1 : .25 }}>⭐</span>)}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 24, color: "#3A2E26" }}>クリア！</div>
                  <div style={{ color: "#6B5C4D", fontWeight: 700, fontSize: 14, margin: "4px 0 16px" }}>のこり {fmt(timeLeft)}{hintsUsed ? ` ・ ヒント${hintsUsed}回` : ""}</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="std-btn" style={{ background: "#FFEFE0", color: "#C8693A" }} onClick={retry}>もう一度</button>
                    {level < 20
                      ? <button className="std-btn" style={{ background: "#FF6B1A", color: "#fff", boxShadow: "0 4px 0 #D4540E" }} onClick={next}>つぎへ ▶</button>
                      : <span style={{ alignSelf: "center", fontWeight: 900, color: "#E23B5A" }}>全クリア！🏆</span>}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 44 }}>⏰</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "#3A2E26", margin: "2px 0 14px" }}>じかんぎれ！</div>
                  <button className="std-btn" style={{ background: "#FF6B1A", color: "#fff", boxShadow: "0 4px 0 #D4540E" }} onClick={retry}>もう一度</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* コントロール */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
        <button className="std-btn" style={{ background: "#FFF1C9", color: "#9A7B12", opacity: status === "playing" ? 1 : .5 }} onClick={useHint} disabled={status !== "playing"}>
          💡 ヒント <span style={{ fontSize: 12 }}>(−12秒)</span>
        </button>
        <button className="std-btn" style={{ background: "#EDE6D8", color: "#6B5C4D" }} onClick={retry}>↻ リセット</button>
      </div>

      {/* レベルレール */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 2px 2px", marginTop: 6 }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const L = i + 1; const bb = band(L); const on = L === level;
          return (
            <button key={L} className="std-lv" onClick={() => jump(L)}
              style={{ background: on ? bb.c : "#fff", color: on ? "#fff" : bb.c, border: `2px solid ${bb.c}`, flex: "0 0 auto" }}>
              {L}
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: "center", color: "#A99A88", fontSize: 11, fontWeight: 700, marginTop: 6 }}>
        ちがうところを 2まいの えから さがして タップ！
      </div>
    </div>
  );
}
