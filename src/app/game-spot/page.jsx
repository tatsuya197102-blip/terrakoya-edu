"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

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
const ASYM = new Set(["speechbubble", "sweat", "musicnote", "flame", "bolt"]);
const PAIR = { star: "sparkle", sparkle: "star", chibiface: "nekomimi", nekomimi: "chibiface", heart: "drop", drop: "heart" };
const SPRITES = ["chibiface", "nekomimi", "star", "sparkle", "heart", "speechbubble", "sweat", "musicnote", "flame", "onigiri", "drop", "ribbon", "bolt"];
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
    // 顔系（漫画キャラ風）
    case "chibiface": return (
      <g>
        <circle cx={0} cy={4} r={38} fill="#FCE0C2" />
        <path d="M-39,6 C-39,-40 39,-40 39,6 C39,-14 25,-22 0,-22 C-25,-22 -39,-14 -39,6 Z" fill={f} />
        <ellipse cx={-14} cy={8} rx={7.5} ry={10.5} fill="#3A2E2E" />
        <ellipse cx={14} cy={8} rx={7.5} ry={10.5} fill="#3A2E2E" />
        <circle cx={-11} cy={4} r={2.4} fill="#fff" />
        <circle cx={17} cy={4} r={2.4} fill="#fff" />
        <circle cx={-23} cy={20} r={5.5} fill="#FF9DB0" opacity={0.7} />
        <circle cx={23} cy={20} r={5.5} fill="#FF9DB0" opacity={0.7} />
        <path d="M-6,24 Q0,30 6,24" stroke="#B5746A" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </g>
    );
    case "nekomimi": return (
      <g>
        <path d="M-34,-12 L-46,-44 L-12,-26 Z" fill={f} />
        <path d="M34,-12 L46,-44 L12,-26 Z" fill={f} />
        <circle cx={0} cy={6} r={36} fill={f} />
        <ellipse cx={-13} cy={2} rx={5.5} ry={8.5} fill="#2A2A2A" />
        <ellipse cx={13} cy={2} rx={5.5} ry={8.5} fill="#2A2A2A" />
        <path d="M-4,14 L4,14 L0,20 Z" fill="#FF8FA0" />
        <g stroke="#3A3A3A" strokeWidth={2} strokeLinecap="round">
          <line x1={-12} y1={18} x2={-34} y2={14} />
          <line x1={-12} y1={22} x2={-34} y2={24} />
          <line x1={12} y1={18} x2={34} y2={14} />
          <line x1={12} y1={22} x2={34} y2={24} />
        </g>
      </g>
    );
    // エフェクト・記号系
    case "star": return (
      <g>
        <path d="M0,-46 L13,-15 L45,-14 L19,7 L29,40 L0,20 L-29,40 L-19,7 L-45,-14 L-13,-15 Z" fill={f} />
        <path d="M-7,-22 L1,-9 L-13,-11 Z" fill="#fff" opacity={0.55} />
      </g>
    );
    case "sparkle": return (
      <g>
        <path d="M0,-46 C4,-14 14,-4 46,0 C14,4 4,14 0,46 C-4,14 -14,4 -46,0 C-14,-4 -4,-14 0,-46 Z" fill={f} />
        <circle cx={30} cy={-28} r={5} fill={f} />
        <circle cx={-30} cy={26} r={3.5} fill={f} />
      </g>
    );
    case "heart": return (
      <g>
        <path d="M0,-22 C-8,-44 -46,-40 -46,-10 C-46,16 0,44 0,44 C0,44 46,16 46,-10 C46,-40 8,-44 0,-22 Z" fill={f} />
        <ellipse cx={-18} cy={-14} rx={7} ry={10} fill="#fff" opacity={0.5} transform="rotate(-25 -18 -14)" />
      </g>
    );
    case "speechbubble": return (
      <g>
        <rect x={-44} y={-36} width={88} height={56} rx={16} fill={f} stroke="#3A2E26" strokeWidth={3} />
        <path d="M-20,16 L-34,42 L0,18 Z" fill={f} stroke="#3A2E26" strokeWidth={3} strokeLinejoin="round" />
        <g fill="#3A2E26"><circle cx={-14} cy={-8} r={3.5} /><circle cx={0} cy={-8} r={3.5} /><circle cx={14} cy={-8} r={3.5} /></g>
      </g>
    );
    case "sweat": return (
      <g>
        <path d="M8,-42 C26,-10 32,8 25,23 A27,27 0 1 1 -17,8 C-12,-8 -2,-24 8,-42 Z" fill={f} />
        <ellipse cx={-2} cy={14} rx={5} ry={8} fill="#fff" opacity={0.45} />
      </g>
    );
    case "musicnote": return (
      <g>
        <rect x={20} y={-44} width={7} height={52} rx={3} fill={f} />
        <path d="M27,-44 C27,-44 48,-40 48,-22 C48,-22 36,-30 27,-26 Z" fill={f} />
        <ellipse cx={8} cy={18} rx={18} ry={13} fill={f} transform="rotate(-20 8 18)" />
      </g>
    );
    case "flame": return (
      <g>
        <path d="M0,-46 C18,-22 30,-10 30,10 A30,32 0 1 1 -30,10 C-30,-6 -14,-14 -6,-30 C-2,-22 2,-20 6,-26 C8,-34 4,-40 0,-46 Z" fill={f} />
        <path d="M0,4 C8,-8 12,-2 12,8 A12,13 0 1 1 -12,8 C-12,0 -6,-2 0,4 Z" fill="#FFE08A" opacity={0.8} />
      </g>
    );
    case "onigiri": return (
      <g>
        <path d="M0,-42 C12,-42 18,-34 40,32 C42,40 36,44 28,44 L-28,44 C-36,44 -42,40 -40,32 C-18,-34 -12,-42 0,-42 Z" fill={f} />
        <rect x={-20} y={20} width={40} height={22} rx={4} fill="#3A4A3A" />
        <circle cx={-10} cy={6} r={3} fill="#3A2E2E" /><circle cx={10} cy={6} r={3} fill="#3A2E2E" />
        <path d="M-5,14 Q0,18 5,14" stroke="#3A2E2E" strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
    );
    case "drop": return (
      <g>
        <path d="M0,-46 C22,-12 36,6 36,20 A36,36 0 1 1 -36,20 C-36,6 -22,-12 0,-46 Z" fill={f} />
        <ellipse cx={-12} cy={20} rx={6} ry={10} fill="#fff" opacity={0.5} />
      </g>
    );
    case "ribbon": return (
      <g>
        <path d="M-6,-4 L-44,-26 L-40,18 Z" fill={f} />
        <path d="M6,-4 L44,-26 L40,18 Z" fill={f} />
        <path d="M-8,4 L-22,42 L0,28 Z" fill={f} opacity={0.92} />
        <path d="M8,4 L22,42 L0,28 Z" fill={f} opacity={0.92} />
        <circle r={9} fill={f} />
      </g>
    );
    case "bolt": return <path d="M10,-46 L-22,8 L-2,8 L-10,46 L26,-12 L4,-12 Z" fill={f} />;
    default: return <circle r={42} fill={f} />;
  }
}
const Sprite = ({ it }) => (
  <g transform={`translate(${it.x} ${it.y}) rotate(${it.rot}) scale(${(it.flip ? -1 : 1) * it.size / 100} ${it.size / 100})`}>
    {shape(it.type, fill(it.h))}
  </g>
);

const BAND = (L) => (L <= 3 ? { k: "beg", c: "#1FB07A" } : L <= 9 ? { k: "int", c: "#FF9F1A" } : L <= 15 ? { k: "adv", c: "#FF6B1A" } : { k: "mas", c: "#E23B5A" });
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ---------- 多言語（JA / EN / AR / VI） ----------
const STR = {
  ja: { level: "レベル", left: "ひだり", right: "みぎ", cleared: "クリア！", timeup: "じかんぎれ！", retry: "もう一度", next: "つぎへ ▶", allclear: "ぜんクリア！🏆", leftTime: "のこり", hintsN: (n) => `ヒント${n}回`, hint: "ヒント", hintCost: "(−12秒)", reset: "リセット", instr: "ちがうところを 2まいの えから さがして タップ！", modeLevels: "レベル", modeDaily: "デイリー", daily: "きょうのお題", dailyDone: "きょうはクリアずみ", toLevels: "レベルへ", rankingTitle: "きょうのランキング", rankEmpty: "まだ記録がありません", you: "あなた", player: "プレイヤー", best: "さいこう", band: { beg: "初級", int: "中級", adv: "上級", mas: "達人" } },
  en: { level: "LEVEL", left: "Left", right: "Right", cleared: "Cleared!", timeup: "Time's up!", retry: "Retry", next: "Next ▶", allclear: "All cleared! 🏆", leftTime: "Time left", hintsN: (n) => `${n} hint${n > 1 ? "s" : ""}`, hint: "Hint", hintCost: "(−12s)", reset: "Reset", instr: "Find the differences between the two pictures and tap!", modeLevels: "Levels", modeDaily: "Daily", daily: "Today's puzzle", dailyDone: "Done today!", toLevels: "Levels", rankingTitle: "Today's Ranking", rankEmpty: "No scores yet", you: "You", player: "Player", best: "Best", band: { beg: "Beginner", int: "Intermediate", adv: "Advanced", mas: "Master" } },
  ar: { level: "المستوى", left: "يسار", right: "يمين", cleared: "أحسنت!", timeup: "انتهى الوقت!", retry: "إعادة", next: "التالي", allclear: "أكملت الكل! 🏆", leftTime: "الوقت المتبقي", hintsN: (n) => `${n} تلميح`, hint: "تلميح", hintCost: "(−12 ث)", reset: "إعادة تعيين", instr: "ابحث عن الاختلافات بين الصورتين وانقر!", modeLevels: "المستويات", modeDaily: "اليومي", daily: "تحدي اليوم", dailyDone: "أُكمل اليوم!", toLevels: "المستويات", rankingTitle: "ترتيب اليوم", rankEmpty: "لا نتائج بعد", you: "أنت", player: "لاعب", best: "الأفضل", band: { beg: "مبتدئ", int: "متوسط", adv: "متقدم", mas: "محترف" } },
  vi: { level: "CẤP", left: "Trái", right: "Phải", cleared: "Hoàn thành!", timeup: "Hết giờ!", retry: "Chơi lại", next: "Tiếp ▶", allclear: "Hoàn tất! 🏆", leftTime: "Còn lại", hintsN: (n) => `${n} gợi ý`, hint: "Gợi ý", hintCost: "(−12 giây)", reset: "Đặt lại", instr: "Tìm điểm khác nhau giữa hai bức tranh và chạm!", modeLevels: "Cấp độ", modeDaily: "Hằng ngày", daily: "Thử thách hôm nay", dailyDone: "Đã xong hôm nay!", toLevels: "Cấp độ", rankingTitle: "Bảng xếp hạng hôm nay", rankEmpty: "Chưa có điểm", you: "Bạn", player: "Người chơi", best: "Tốt nhất", band: { beg: "Cơ bản", int: "Trung cấp", adv: "Nâng cao", mas: "Bậc thầy" } },
};
// ヘッダーの言語切替（i18next / <html lang> / ?lang=）に自動追従。未検出時は ja。
function detectLang() {
  if (typeof window === "undefined") return "ja";
  const ok = ["ja", "en", "ar", "vi"];
  try {
    const u = new URLSearchParams(window.location.search).get("lang");
    if (u && ok.includes(u.slice(0, 2).toLowerCase())) return u.slice(0, 2).toLowerCase();
    for (const key of ["i18nextLng", "lang", "language", "locale"]) {
      const v = localStorage.getItem(key);
      if (v && ok.includes(v.slice(0, 2).toLowerCase())) return v.slice(0, 2).toLowerCase();
    }
  } catch (e) { /* noop */ }
  const h = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
  return ok.includes(h) ? h : "ja";
}

// デイリー：UTC日付をシードに、全員同じ盤面・難易度を生成
function dateKeyUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function dailyConfig() {
  const key = dateKeyUTC();
  const n = parseInt(key.replace(/-/g, ""), 10);
  return { key, lvl: 6 + (n % 7), attempt: 50000 + (n % 90000) }; // 難易度6〜12、盤面は日替わり
}

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
  const [mode, setMode] = useState("levels"); // levels | daily
  const [level, setLevel] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const daily = useMemo(() => dailyConfig(), []);
  const [dailyTry, setDailyTry] = useState(0);
  const scene = useMemo(
    () => (mode === "daily" ? makeLevel(daily.lvl, daily.attempt + dailyTry) : makeLevel(level, attempt)),
    [mode, level, attempt, daily, dailyTry]
  );

  const [found, setFound] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [wrongs, setWrongs] = useState([]);
  const [hint, setHint] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stars, setStars] = useState(0);
  const [lang, setLang] = useState("ja");
  const [prog, setProg] = useState({ bestLevel: 0, stars: {}, daily: {} });
  const [board, setBoard] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const { user, userDoc } = useAuth();
  const timeRef = useRef(0);
  const t = STR[lang] || STR.ja;
  const displayName = userDoc?.displayName || user?.displayName || t.player;
  const dailyDoneStars = prog.daily?.[daily.key]?.stars || 0;

  // ヘッダーの言語切替に追従（同タブ反映のため軽くポーリング）
  useEffect(() => {
    const sync = () => setLang(detectLang());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("popstate", sync);
    const iv = setInterval(sync, 1500);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("popstate", sync); clearInterval(iv); };
  }, []);

  // ログインユーザーの進捗を読み込み（未ログインはスキップ）
  useEffect(() => {
    if (!user?.uid) { setProg({ bestLevel: 0, stars: {}, daily: {} }); return; }
    let cancel = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "games", "spotTheDifference"));
        if (!cancel && snap.exists()) {
          const d = snap.data();
          setProg({ bestLevel: d.bestLevel || 0, stars: d.stars || {}, daily: d.daily || {} });
        }
      } catch (e) { /* オフライン等は無視 */ }
    })();
    return () => { cancel = true; };
  }, [user]);

  // デイリーのランキングを読み込み
  useEffect(() => {
    if (mode === "daily") loadBoard();
  }, [mode, daily.key, user]);

  // 新しいシーンで初期化
  useEffect(() => {
    setFound(new Array(scene.diffs.length).fill(false));
    setTimeLeft(scene.time); timeRef.current = scene.time;
    setStatus("playing"); setWrongs([]); setHint(null); setHintsUsed(0); setStars(0);
  }, [scene]);

  // カウントダウン（0になった瞬間だけ「じかんぎれ」にする）
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      setTimeLeft((tl) => {
        if (tl <= 1) { clearInterval(id); timeRef.current = 0; setStatus("lost"); return 0; }
        timeRef.current = tl - 1;
        return tl - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status, scene]);

  const foundCount = found.filter(Boolean).length;
  const b = BAND(level);

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
        const s = ratio >= 0.5 && hintsUsed === 0 ? 3 : ratio >= 0.25 ? 2 : 1;
        setStars(s);
        setStatus("won");
        if (mode === "daily") saveDaily(s, timeRef.current); else saveProgress(level, s);
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

  const retry = () => (mode === "daily" ? setDailyTry((x) => x + 1) : setAttempt((a) => a + 1));
  const next = () => { if (level < 20) { setLevel(level + 1); setAttempt((a) => a + 1); } };
  const jump = (L) => { setLevel(L); setAttempt((a) => a + 1); };
  const switchMode = (m) => { setMode(m); if (m === "daily") setDailyTry((x) => x + 1); };

  // デイリーの結果を保存（ベストのみ更新。本人ドキュメント内＝既存ルールで許可済み）
  const saveDaily = async (s, secLeft) => {
    const prev = prog.daily?.[daily.key];
    const better = !prev || s > prev.stars || (s === prev.stars && secLeft > (prev.sec || 0));
    const rec = better ? { stars: s, sec: secLeft } : prev;
    setProg((p) => ({ ...p, daily: { ...p.daily, [daily.key]: rec } }));
    if (!user?.uid || !better) return;
    try {
      await setDoc(
        doc(db, "users", user.uid, "games", "spotTheDifference"),
        { daily: { [daily.key]: rec }, updatedAt: serverTimestamp() },
        { merge: true }
      );
      // ランキングへ反映（rank = 星*100000 + 残り秒 の単一フィールドで並べ替え＝複合インデックス不要）
      await setDoc(doc(db, "leaderboard_daily", daily.key, "scores", user.uid), {
        name: displayName, stars: s, sec: secLeft, rank: s * 100000 + secLeft, at: serverTimestamp(),
      });
      loadBoard();
    } catch (e) { /* 保存失敗してもプレイは継続 */ }
  };

  // きょうのランキング上位10件を読み込み
  async function loadBoard() {
    if (!daily?.key) return;
    setBoardLoading(true);
    try {
      const qy = query(collection(db, "leaderboard_daily", daily.key, "scores"), orderBy("rank", "desc"), limit(10));
      const snap = await getDocs(qy);
      setBoard(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    } catch (e) { setBoard([]); }
    setBoardLoading(false);
  }

  // ベスト星数＆到達最高レベルを保存（星は下げない／到達レベルは下げない）
  const saveProgress = async (lv, s) => {
    const newStars = Math.max(prog.stars?.[lv] || 0, s);
    const newBest = Math.max(prog.bestLevel || 0, lv);
    setProg((p) => ({ bestLevel: Math.max(p.bestLevel || 0, lv), stars: { ...p.stars, [lv]: Math.max(p.stars?.[lv] || 0, s) } }));
    if (!user?.uid) return;
    try {
      await setDoc(
        doc(db, "users", user.uid, "games", "spotTheDifference"),
        { bestLevel: newBest, stars: { [lv]: newStars }, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) { /* 保存失敗してもプレイは継続 */ }
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ fontFamily: '"Hiragino Maru Gothic ProN","Yu Gothic UI","Zen Maru Gothic","Noto Sans Arabic",system-ui,sans-serif', background: "#F3EFE6", borderRadius: 24, padding: 16, maxWidth: 780, margin: "0 auto" }}>
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

      {/* モード切替 */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
        {[["levels", t.modeLevels], ["daily", t.modeDaily + (dailyDoneStars ? " ✓" : "")]].map(([m, lbl]) => (
          <button key={m} className="std-btn" onClick={() => switchMode(m)}
            style={{ background: mode === m ? "#3A2E26" : "#EDE6D8", color: mode === m ? "#fff" : "#6B5C4D", padding: "8px 18px", fontSize: 14, borderRadius: 999 }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: b.c, color: "#fff", fontWeight: 900, fontSize: 13, padding: "4px 12px", borderRadius: 999 }}>{t.band[b.k]}</span>
          {mode === "daily"
            ? <span style={{ fontWeight: 900, fontSize: 18, color: "#3A2E26" }}>🗓 {t.daily} <span style={{ fontWeight: 700, fontSize: 13, color: "#9C8B7A" }}>{daily.key}</span></span>
            : <span style={{ fontWeight: 900, fontSize: 20, color: "#3A2E26" }}>{t.level} {level}</span>}
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
          <Panel items={scene.base} diffs={scene.diffs} found={found} wrongs={wrongs} hint={hint} side="L" onTap={onTap} label={t.left} />
          <Panel items={scene.rightItems} diffs={scene.diffs} found={found} wrongs={wrongs} hint={hint} side="R" onTap={onTap} label={t.right} />
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
                  <div style={{ fontWeight: 900, fontSize: 24, color: "#3A2E26" }}>{t.cleared}</div>
                  <div style={{ color: "#6B5C4D", fontWeight: 700, fontSize: 14, margin: "4px 0 16px" }}>{t.leftTime} {fmt(timeLeft)}{hintsUsed ? ` ・ ${t.hintsN(hintsUsed)}` : ""}</div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="std-btn" style={{ background: "#FFEFE0", color: "#C8693A" }} onClick={retry}>{t.retry}</button>
                    {mode === "daily"
                      ? <span style={{ alignSelf: "center", fontWeight: 900, color: "#1FB07A" }}>🗓 {t.dailyDone}</span>
                      : level < 20
                        ? <button className="std-btn" style={{ background: "#FF6B1A", color: "#fff", boxShadow: "0 4px 0 #D4540E" }} onClick={next}>{t.next}</button>
                        : <span style={{ alignSelf: "center", fontWeight: 900, color: "#E23B5A" }}>{t.allclear}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 44 }}>⏰</div>
                  <div style={{ fontWeight: 900, fontSize: 22, color: "#3A2E26", margin: "2px 0 14px" }}>{t.timeup}</div>
                  <button className="std-btn" style={{ background: "#FF6B1A", color: "#fff", boxShadow: "0 4px 0 #D4540E" }} onClick={retry}>{t.retry}</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* コントロール */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
        <button className="std-btn" style={{ background: "#FFF1C9", color: "#9A7B12", opacity: status === "playing" ? 1 : .5 }} onClick={useHint} disabled={status !== "playing"}>
          💡 {t.hint} <span style={{ fontSize: 12 }}>{t.hintCost}</span>
        </button>
        <button className="std-btn" style={{ background: "#EDE6D8", color: "#6B5C4D" }} onClick={retry}>↻ {t.reset}</button>
      </div>

      {/* レベルレール（レベルモードのみ） */}
      {mode === "levels" ? (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 2px 2px", marginTop: 6 }}>
          {Array.from({ length: 20 }).map((_, i) => {
            const L = i + 1; const bb = BAND(L); const on = L === level; const earned = prog.stars?.[L] || 0;
            return (
              <div key={L} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: "0 0 auto" }}>
                <button className="std-lv" onClick={() => jump(L)}
                  style={{ background: on ? bb.c : "#fff", color: on ? "#fff" : bb.c, border: `2px solid ${bb.c}` }}>
                  {L}
                </button>
                <div style={{ fontSize: 8, lineHeight: 1, height: 9, letterSpacing: -1 }}>{earned > 0 ? "⭐".repeat(earned) : ""}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ textAlign: "center", fontWeight: 800, color: dailyDoneStars ? "#1FB07A" : "#9C8B7A", fontSize: 13, marginBottom: 10 }}>
            {dailyDoneStars ? `🗓 ${t.dailyDone} ${"⭐".repeat(dailyDoneStars)}` : `🗓 ${t.daily} — ${daily.key}`}
          </div>
          <div style={{ fontWeight: 900, color: "#3A2E26", fontSize: 14, textAlign: "center", marginBottom: 8 }}>🏆 {t.rankingTitle}</div>
          {boardLoading
            ? <div style={{ textAlign: "center", color: "#9C8B7A", fontSize: 13 }}>…</div>
            : board.length === 0
              ? <div style={{ textAlign: "center", color: "#9C8B7A", fontSize: 13 }}>{t.rankEmpty}</div>
              : <div style={{ maxWidth: 420, margin: "0 auto" }}>
                  {board.map((r, i) => {
                    const me = user && r.uid === user.uid;
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                    return (
                      <div key={r.uid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 10, background: me ? "#FFF1C9" : "#FFFDF8", border: me ? "2px solid #FF9F1A" : "1px solid #EFE6D6", marginBottom: 4 }}>
                        <span style={{ width: 24, textAlign: "center", fontWeight: 900 }}>{medal}</span>
                        <span style={{ flex: 1, fontWeight: 800, color: "#3A2E26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name || t.player}{me ? ` (${t.you})` : ""}</span>
                        <span style={{ fontWeight: 800 }}>{"⭐".repeat(r.stars || 0)}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums", color: "#6B5C4D", fontWeight: 700, fontSize: 13 }}>{fmt(r.sec || 0)}</span>
                      </div>
                    );
                  })}
                </div>}
        </div>
      )}
      {user && prog.bestLevel > 0 && (
        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: "#9C8B7A", marginTop: 8 }}>
          {t.best}: {t.level} {prog.bestLevel} ・ ⭐{Object.values(prog.stars).reduce((a, b) => a + (b || 0), 0)}
        </div>
      )}
      <div style={{ textAlign: "center", color: "#A99A88", fontSize: 11, fontWeight: 700, marginTop: 6 }}>
        {t.instr}
      </div>
    </div>
  );
}
